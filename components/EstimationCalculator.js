import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { colors, darkColors, spacing, typography, radius, shadows } from '../styles/theme';

export default function EstimationCalculator({ onBack, initialCategory = 'menu', activeProjectName, onAutoSave, activeProject, materials, onAddToProject, activeProjectId }) {
  const { lang, isRTL } = useLanguage();
  const { isDark } = useTheme();
  const tc = isDark ? darkColors : colors;
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  // Input States
  const [length, setLength] = useState('');
  const [height, setHeight] = useState('');
  const [thickness, setThickness] = useState('');
  const [unitLength, setUnitLength] = useState('');
  const [unitHeight, setUnitHeight] = useState('');
  const [mortarThickness, setMortarThickness] = useState('');
  const [coverageRate, setCoverageRate] = useState(''); // m2 per liter

  // Rebar specific
  const [rebarDiameter, setRebarDiameter] = useState(''); // mm
  const [rebarLengthTotal, setRebarLengthTotal] = useState(''); // m
  const [rebarPieceLength, setRebarPieceLength] = useState(''); // m

  // Results State
  const [result, setResult] = useState(null);

  const resetInputs = () => {
    setLength('');
    setHeight('');
    setThickness('');
    setUnitLength('');
    setUnitHeight('');
    setMortarThickness('');
    setCoverageRate('');
    setRebarDiameter('');
    setRebarLengthTotal('');
    setRebarPieceLength('');
    setResult(null);
  };

  const calculateBlocksBricks = (isBrick = false) => {
    const wL = parseFloat(length);
    const wH = parseFloat(height);
    const uL = parseFloat(unitLength) / 100;
    const uH = parseFloat(unitHeight) / 100;
    const mT = parseFloat(mortarThickness) / 100;

    if (wL > 0 && wH > 0 && uL > 0 && uH > 0) {
      const wallArea = wL * wH;
      const singleUnitArea = (uL + mT) * (uH + mT);
      const numUnits = Math.ceil(wallArea / singleUnitArea);
      const wastageRate = isBrick ? 0.08 : 0.05;
      const wastage = Math.ceil(numUnits * wastageRate);
      const totalUnits = numUnits + wastage;

      const thicknessM = isBrick ? 0.12 : 0.20;
      const netWallVolume = wallArea * thicknessM;
      const unitVolume = (uL * uH * thicknessM) * numUnits;
      const mortarVolume = Math.max(0, netWallVolume - unitVolume) * 1.1;

      const cementBags = Math.ceil((mortarVolume * 400) / 50);
      const sandTonnes = (mortarVolume * 1500) / 1000;

      setResult({
        primaryLabel: isBrick ? copy.netBricks : copy.netBlocks,
        primaryValue: numUnits,
        totalLabel: isBrick ? copy.totalBricks : copy.totalBlocks,
        totalValue: totalUnits,
        wastage: wastage,
        area: wallArea.toFixed(2) + ' m²',
        cementBags,
        sandTonnes: sandTonnes.toFixed(2),
        infoText: isBrick ? copy.infoBrick : copy.infoBlock
      });
    }
  };

  const calculateConcrete = () => {
    const l = parseFloat(length);
    const w = parseFloat(height);
    const t = parseFloat(thickness) / 100;

    if (l > 0 && w > 0 && t > 0) {
      const area = l * w;
      const vol = area * t;
      const wastage = vol * 0.05;
      const totalVol = vol + wastage;

      const cementBags = Math.ceil(totalVol * 7);
      const sandTonnes = totalVol * 0.6;
      const gravelTonnes = totalVol * 1.2;

      setResult({
        primaryLabel: copy.netVolume,
        primaryValue: vol.toFixed(2) + ' m³',
        totalLabel: copy.totalVolume,
        totalValue: totalVol.toFixed(2) + ' m³',
        wastage: wastage.toFixed(2) + ' m³',
        area: area.toFixed(2) + ' m²',
        cementBags,
        sandTonnes: sandTonnes.toFixed(2),
        gravelTonnes: gravelTonnes.toFixed(2),
        infoText: copy.infoConcrete
      });
    }
  };

  const calculatePaint = () => {
    const l = parseFloat(length);
    const h = parseFloat(height);
    const rate = parseFloat(coverageRate);

    if (l > 0 && h > 0 && rate > 0) {
      const area = l * h;
      const totalArea = area * 2;
      const litersNeeded = totalArea / rate;
      const wastage = litersNeeded * 0.10;
      const totalLiters = litersNeeded + wastage;

      const bucketsSmall = Math.ceil(totalLiters / 4);
      const bucketsLarge = Math.ceil(totalLiters / 20);

      setResult({
        primaryLabel: copy.netPaint,
        primaryValue: litersNeeded.toFixed(1) + ' L',
        totalLabel: copy.totalPaint,
        totalValue: totalLiters.toFixed(1) + ' L',
        wastage: wastage.toFixed(1) + ' L',
        area: area.toFixed(2) + ' m²',
        bucketsSmall,
        bucketsLarge,
        infoText: copy.infoPaint
      });
    }
  };

  const calculateTile = () => {
    const l = parseFloat(length);
    const w = parseFloat(height); // use height as width input
    const uL = parseFloat(unitLength) / 100;
    const uH = parseFloat(unitHeight) / 100;

    if (l > 0 && w > 0 && uL > 0 && uH > 0) {
      const area = l * w;
      const tileArea = uL * uH;
      const numTiles = Math.ceil(area / tileArea);
      const wastageRate = 0.10; // 10% waste for tiles (cuts)
      const wastage = Math.ceil(numTiles * wastageRate);
      const totalTiles = numTiles + wastage;

      const jointSize = parseFloat(mortarThickness) / 1000; // mm to m
      const groutVol = (uL + uH) * jointSize * 0.005 * totalTiles; // approx 5mm depth
      const groutKg = Math.ceil(groutVol * 1600); // 1.6kg/m3
      const adhesiveKg = Math.ceil(area * 4); // 4kg per m2

      setResult({
        primaryLabel: copy.netTiles,
        primaryValue: numUnitsFormat(numTiles),
        totalLabel: copy.totalTiles,
        totalValue: numUnitsFormat(totalTiles),
        wastage: numUnitsFormat(wastage),
        area: area.toFixed(2) + ' m²',
        groutKg,
        adhesiveKg,
        boxes: Math.ceil(totalTiles / Math.floor(1 / tileArea)), // approx boxes if 1m2 per box
        infoText: copy.infoTile
      });
    }
  };

  const calculatePlaster = () => {
    const l = parseFloat(length);
    const h = parseFloat(height);
    const t = parseFloat(thickness) / 100; // cm to m

    if (l > 0 && h > 0 && t > 0) {
      const area = l * h;
      const vol = area * t;
      const totalVol = vol * 1.15; // 15% wastage for plaster

      const bags = Math.ceil(totalVol * 1250 / 30); // ~1250kg/m3, 30kg bag

      setResult({
        primaryLabel: copy.netPlasterArea,
        primaryValue: area.toFixed(2) + ' m²',
        totalLabel: copy.totalPlasterBags,
        totalValue: bags + ' ' + copy.bagsLabel,
        wastage: '15%',
        area: area.toFixed(2) + ' m²',
        plasterVol: totalVol.toFixed(2) + ' m³',
        infoText: copy.infoPlaster
      });
    }
  };

  const calculateIsogam = () => {
    const l = parseFloat(length);
    const w = parseFloat(height); // using height for width
    if (l > 0 && w > 0) {
      const area = l * w;
      // 15% overlap/waste for isogam
      const totalArea = area * 1.15;
      // 1 roll is 10 m2
      const rolls = Math.ceil(totalArea / 10);
      const primer = Math.ceil(area * 0.3); // 0.3L per sqm of primer

      setResult({
        primaryLabel: copy.wallArea,
        primaryValue: area.toFixed(2) + ' m²',
        totalLabel: copy.totalRolls,
        totalValue: rolls,
        wastage: '15%',
        area: '-',
        primerL: primer,
        infoText: copy.infoIsogam
      });
    }
  };

  const calculateGypsum = () => {
    const l = parseFloat(length);
    const w = parseFloat(height);
    if (l > 0 && w > 0) {
      const area = l * w;
      const totalArea = area * 1.1; // 10% waste
      // Panel size is usually 2.4 * 1.2 = 2.88m2
      const panels = Math.ceil(totalArea / 2.88);
      // Framing: C-channel roughly 3.2m per m2. Standard piece is 3m. 
      const framingMeters = area * 3.2;
      const framingPieces = Math.ceil(framingMeters / 3);

      setResult({
        primaryLabel: copy.wallArea,
        primaryValue: area.toFixed(2) + ' m²',
        totalLabel: copy.totalPanels,
        totalValue: panels,
        wastage: '10%',
        area: '-',
        cChannels: framingPieces,
        infoText: copy.infoGypsum
      });
    }
  };

  const calculateRebar = () => {
    const totalL = parseFloat(rebarLengthTotal);
    const d = parseFloat(rebarDiameter); // mm
    const pieceL = parseFloat(rebarPieceLength); // m

    if (totalL > 0 && d > 0 && pieceL > 0) {
      // Weight per meter formula: (D^2) / 162
      const weightPerMeter = (d * d) / 162;
      const totalWeightKg = totalL * weightPerMeter;
      const totalWeightTon = totalWeightKg / 1000;

      const pieces = Math.ceil(totalL / pieceL);

      setResult({
        primaryLabel: copy.totalRebarPieces,
        primaryValue: pieces + ' ' + copy.piecesLabel,
        totalLabel: copy.totalRebarWeight,
        totalValue: totalWeightTon.toFixed(3) + ' ' + copy.tonnesLabel,
        wastage: '-',
        area: '-',
        weightPerMeter: weightPerMeter.toFixed(2) + ' kg/m',
        totalKg: totalWeightKg.toFixed(1) + ' kg',
        infoText: copy.infoRebar
      });
    }
  };

  const numUnitsFormat = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const copy = useMemo(() => lang === 'ar' ? {
    title: 'حاسبة التقدير',
    chooseMaterial: 'اختار المادة للتقدير',
    materials: {
      block: { title: 'البلوك الخرساني', icon: '🧱', desc: 'جدران البلوك والمونة' },
      brick: { title: 'الطابوق الأحمر', icon: '🧱', desc: 'جدران الطابوق والمونة' },
      concrete: { title: 'الخرسانة', icon: '🏗️', desc: 'حجم السقف أو الأساس (م³)' },
      paint: { title: 'الصبغ', icon: '🎨', desc: 'مساحة الصبغ واللترات' },
      tile: { title: 'كاشي وسيراميك', icon: '🔲', desc: 'عدد الكاشي، لاصق وشربت' },
      plaster: { title: 'جص وبياض', icon: '🏠', desc: 'مساحة البياض وعدد الأكياس' },
      rebar: { title: 'حديد التسليح (الشيش)', icon: '⛓️', desc: 'وزن الحديد وطوله' },
      isogam: { title: 'إيزوكام (عازل)', icon: '💧', desc: 'رولات الإيزوكام والبرايمر' },
      gypsum: { title: 'سقف ثانوي (جبسم بورد)', icon: '☁️', desc: 'الواح الجبسوم بورد والهيكل' },
    },
    calculate: 'إحسب',
    length: 'الطول (متر)',
    height: 'الارتفاع (متر)',
    width: 'العرض (متر)',
    valThickness: 'السمك (سم)',
    blockDim: 'أبعاد القطعة (سم)',
    unitLength: 'الطول',
    unitHeight: 'الارتفاع',
    mortarJoint: 'سمك المونة (سم)',
    mortarJointMm: 'سمك الشربت (ملم)',
    coverage: 'التغطية (م² لكل لتر)',
    rebarLength: 'الطول الإجمالي (متر)',
    rebarDiam: 'قطر الشيش (ملم)',
    rebarPieceLengthInput: 'طول القطعة الواحدة (متر)',
    results: 'نتائج التقدير',
    wallArea: 'المساحة الإجمالية',
    netBlocks: 'الصافي من البلوك',
    totalBlocks: 'إجمالي البلوك المطلوب',
    netBricks: 'الصافي من الطابوق',
    totalBricks: 'إجمالي الطابوق المطلوب',
    netTiles: 'الصافي من الكاشي',
    totalTiles: 'إجمالي الكاشي (١٠٪ تالف)',
    netPlasterArea: 'مساحة البياض الصافية',
    totalPlasterBags: 'إجمالي أكياس الجص (٣٠ كغم)',
    totalRebarPieces: 'عدد قطع الشيش',
    totalRebarWeight: 'الوزن الإجمالي (طن)',
    wastageLabel: 'التالف (نسبة السماح)',
    cementRequired: 'كمية السمنت (كيس ٥٠ كغم)',
    sandRequired: 'كمية الرمل (طن)',
    gravelRequired: 'كمية الحصو (طن)',
    groutRequired: 'شربت الكاشي (تقريبي)',
    adhesiveRequired: 'لاصق الكاشي (تقريبي)',
    boxesApprox: 'عدد الكراتين (١م٢/كرتون)',
    netVolume: 'الحجم الصافي',
    totalVolume: 'إجمالي حجم الخرسانة',
    netPaint: 'كمية الصبغ الصافية (وجهين)',
    totalPaint: 'إجمالي الصبغ المطلوب',
    gallons: 'دبة كبيرة (٢٠ لتر)',
    quarts: 'دبة صغيرة (٤ لتر)',
    enterValues: 'يرجى إدخال الأبعاد',
    kgPerM: 'وزن المتر الواحد',
    totalKg: 'إجمالي الوزن كغم',
    bagsLabel: 'أكياس',
    piecesLabel: 'قطعة',
    tonnesLabel: 'طن',
    totalRolls: 'إجمالي رولات الايزوكام (١٠م²)',
    primerLiters: 'كمية الزفت (تقريبي/لتر)',
    totalPanels: 'إجمالي ألواح الجبسوم بورد',
    framingPieces: 'هيكل حديد C-Channel',
    infoBlock: 'ملاحظة: جدران البلوك تتضمن ٥٪ تالف. المونة مبنية على ٤٠٠ كغم سمنت لكل متر مكعب.',
    infoBrick: 'ملاحظة: جدران الطابوق تتضمن ٨٪ تالف. تم بناء سمك الجدار ١٢ سم لحساب المونة.',
    infoConcrete: 'ملاحظة: تتضمن ٥٪ تالف. الخلطة التقريبية C25 (٣٥٠ كغم سمنت/م³).',
    infoPaint: 'ملاحظة: تتضمن ١٠٪ تالف. النتائج تكفي لوجهين من الصبغ.',
    infoTile: 'ملاحظة: ١٠٪ تالف لقص الكاشي. اللاصق مقدر بـ ٤ كغم لكل م².',
    infoPlaster: 'ملاحظة: ١٥٪ نسبة تالف قياسية للبياض. الكثافة ~١٢٥٠ كغم/م³.',
    infoRebar: 'ملاحظة: تم الحساب حسب المعادلة الهندسية D²/162. بدون نسبة تالف.',
    infoIsogam: 'ملاحظة: تتضمن ١٥٪ للتقاطعات والحواف. الزفت (الأساس) مقدر بـ ٠.٣ لتر لكل م².',
    infoGypsum: 'ملاحظة: ١٠٪ تالف للالواح. هيكل الحديد مقدر بـ ٣.٢ متر لكل م².',
  } : lang === 'ku' ? {
    title: 'ژمێرەری خەمڵاندن - زە\u0631عە',
    chooseMaterial: 'مادەی خەمڵاندن هەڵبژێرە',
    materials: {
      block: { title: 'بلۆکی کۆنکریت', icon: '🧱', desc: 'دیواری بلۆک، ژمارە و چیمەنتۆ' },
      brick: { title: 'خشتی سوور', icon: '🧱', desc: 'دیواری خشت، ژمارە و چیمەنتۆ' },
      concrete: { title: 'کۆنکرێت', icon: '🏗️', desc: 'قەبارەی سەقف یان زەوی (م٣)' },
      paint: { title: 'بۆیەکردن', icon: '🎨', desc: 'ب\u0631ی بۆیەی پێویست بۆ دیوار' },
      tile: { title: 'سیرامیک و کاشی', icon: '🔲', desc: 'ژمارەی کاشی، مادەی لکێنەر' },
      plaster: { title: 'گێچ و لەبخ', icon: '🏠', desc: '\u0631ووبە\u0631ی گێچکاری و ژمارەی کیسە' },
      rebar: { title: 'شیشی ئاسن', icon: '⛓️', desc: 'کێشی شیش بە تۆن و ژمارەی دانە' },
      isogam: { title: 'ایزۆگام (بنبانی)', icon: '💧', desc: '\u0631ۆڵی ایزۆگام و قیر (زفت)' },
      gypsum: { title: 'سەقفی مەغریبی - گەچ بۆرد', icon: '☁️', desc: 'لێوار و پارچەی گەچ بۆرد' },
    },
    calculate: 'هەژمارکردن',
    length: 'درێژی (مەتر)',
    height: 'بەرزی (مەتر)',
    width: 'پانی (مەتر)',
    valThickness: 'ئەستووری (سم)',
    blockDim: 'پێوانەی یەکە (سم)',
    unitLength: 'درێژی',
    unitHeight: 'بەرزی',
    mortarJoint: 'ئەستووری چیمەنتۆ (سم)',
    mortarJointMm: 'بۆشایی نێوان (ملم)',
    coverage: '\u0631ێژەی داپۆشین (م٢ بۆ هەر لیتر)',
    rebarLength: 'کۆی درێژی شیشەکان (مەتر)',
    rebarDiam: 'تیرەی شیش (ملم)',
    rebarPieceLengthInput: 'درێژی یەک شیش (مەتر)',
    results: 'ئەنجامەکان',
    wallArea: '\u0631ووبەری گشتی',
    netBlocks: 'ژمارەی بلۆکی پێویست',
    totalBlocks: 'کۆی گشتی بلۆک (لەگەڵ بەفی\u0631ۆچوون)',
    netBricks: 'ژمارەی خشتی پێویست',
    totalBricks: 'کۆی گشتی خشت (لەگەڵ بەفی\u0631ۆچوون)',
    netTiles: 'ژمارەی کاشی پێویست',
    totalTiles: 'کۆی گشتی کاشی (١٠٪ زیاتر)',
    netPlasterArea: '\u0631ووبەری سوودبەخش',
    totalPlasterBags: 'کۆی کیسەکانی گێچ (٣٠کگم)',
    totalRebarPieces: 'ژمارەی شیش',
    totalRebarWeight: 'کۆی کێشی شیش (بە تۆن)',
    wastageLabel: 'ب\u0631ی بەفی\u0631ۆچوون',
    cementRequired: 'چیمەنتۆی پێویست (کیسە ٥٠کگم)',
    sandRequired: 'لمی پێویست (تۆن)',
    gravelRequired: 'چەوی پێویست (تۆن)',
    groutRequired: 'شەربەتی کاشی (گلوو)',
    adhesiveRequired: 'چیمەنتۆی لکێنەری کاشی (نێزیکەیی)',
    boxesApprox: 'ژمارەی کارتۆن (گەر ١م٢ بێت لە کارتۆنێک)',
    netVolume: 'قەبارەی خاوێن',
    totalVolume: 'قەبارەی گشتی کۆنکریت (لەگەڵ بەفی\u0631ۆچوون)',
    netPaint: 'بۆیەی پێویست (٢ قاتی خاوێن)',
    totalPaint: 'کۆی گشتی بۆیە (لەگەڵ بەفی\u0631ۆچوون)',
    gallons: 'تەنەکەی گەورە (٢٠ لیتر)',
    quarts: 'سەتڵی بچووک (٤ لیتر)',
    enterValues: 'تکایە بەهاکان داخڵ بکە',
    kgPerM: 'کێشی یەک مەتر',
    totalKg: 'کۆی کێش (کیلۆگرام)',
    bagsLabel: 'کیسە',
    piecesLabel: 'دانە',
    tonnesLabel: 'تۆن',
    totalRolls: 'کۆی \u0631ۆڵەکانی ایزۆگام (١٠م٢)',
    primerLiters: 'قیر (زفت) بۆ ژێرەوە (لیتر)',
    totalPanels: 'کۆی پارچەکانی گەچ بۆرد',
    framingPieces: 'شیشی ئاسنی C-Channel (نزیکەیی)',
    infoBlock: 'تێبینی: بۆ دیواری بلۆک ٥٪ و خشت ٨٪ بەفی\u0631ۆچوون دانراوە. چیمەنتۆ بە ٤٠٠کگم بۆ هەر مەتر سێجایەک مەزەندە کراوە.',
    infoBrick: 'تێبینی: \u0631ێژەی بەفی\u0631ۆچوون ٨٪ دانراوە. ئەستووری دیوارەکەت ١٢ سم هەژمار کراوە بۆ ب\u0631ی چیمەنتۆی پێویست.',
    infoConcrete: 'تێبینی: رێژەی ٥٪ بەفی\u0631ۆچوون دانراوە. گیراوەی کۆنکریتەکە بۆ هەر م٣ نزیکەی ٣٥٠کگم چیمەنتۆی بۆ هەژمار کراوە (C25).',
    infoPaint: 'تێبینی: بەفی\u0631ۆچوون ١٠٪. ب\u0631ەکە بۆ ٢ قاتی بۆیە هەژمار کراوە.',
    infoTile: 'تێبینی: بەفی\u0631ۆچوونی کاشی ١٠٪ دانراوە بەهۆی ب\u0631ینەوە. ب\u0631ی مادەی لکێنەر بۆ هەر م٢ نزیکەی ٤کگم مەزەندە کراوە.',
    infoPlaster: 'تێبینی: بەفی\u0631ۆچوونی گێچ ١٥٪ دانراوە کە باوە لە عێراق. کێشی گێچ بۆ هەر م٣ ١٢٥٠ کگم هەژمار کراوە.',
    infoRebar: 'تێبینی: کێش بە هاوکێشەی جیهانی ئەندازیاری D²/162 هەژمار کراوە بەبێ بەفی\u0631ۆچوون.',
    infoIsogam: 'تێبینی: ١٥٪ زیادە بۆ یەکترب\u0631ین و سەرکەوتن (Overlap) بۆ سەربان دانراوە. قیر (Primer) بە ٠.٣ لیتر بۆ م٢ هەژمار کراوە.',
    infoGypsum: 'تێبینی: ١٠٪ بەفی\u0631ۆچوون بۆ پارچەکان دانراوە. شیشی C-Channel بە نزیکەیی ٣.٢ مەتر بۆ هەر م٢ هەژمار کراوە.',
  } : {
    title: 'Engineering Calculator',
    chooseMaterial: 'Select Estimation Tool',
    materials: {
      block: { title: 'Concrete Block', icon: '🧱', desc: 'Block masonry walls, mortar.' },
      brick: { title: 'Red Brick', icon: '🧱', desc: 'Brick walls, units & mortar.' },
      concrete: { title: 'Concrete', icon: '🏗️', desc: 'Slab or footing volume (m³)' },
      paint: { title: 'Painting', icon: '🎨', desc: 'Wall painting area & liters' },
      tile: { title: 'Floor / Wall Tile', icon: '🔲', desc: 'Tiles count, adhesive & grout' },
      plaster: { title: 'Plaster / Juss', icon: '🏠', desc: 'Plastering area & bags needed' },
      rebar: { title: 'Steel Rebar', icon: '⛓️', desc: 'Rebar weight & length estimation' },
      isogam: { title: 'Isogam (Roofing)', icon: '💧', desc: 'Isogam rolls and primer litters' },
      gypsum: { title: 'False Ceiling (Gypsum)', icon: '☁️', desc: 'Gypsum boards and framing' },
    },
    calculate: 'Calculate',
    length: 'Length (m)',
    height: 'Height (m)',
    width: 'Width (m)',
    valThickness: 'Thickness (cm)',
    blockDim: 'Unit Dimensions (cm)',
    unitLength: 'Length',
    unitHeight: 'Height',
    mortarJoint: 'Mortar Joint (cm)',
    mortarJointMm: 'Grout Joint (mm)',
    coverage: 'Coverage (m² per Liter)',
    rebarLength: 'Total Running Length (m)',
    rebarDiam: 'Rebar Diameter (mm)',
    rebarPieceLengthInput: 'Single Piece Length (m)',
    results: 'Estimation Results',
    wallArea: 'Total Area',
    netBlocks: 'Net Blocks Needed',
    totalBlocks: 'Total Blocks Required',
    netBricks: 'Net Bricks Needed',
    totalBricks: 'Total Bricks Required',
    netTiles: 'Net Tiles Needed',
    totalTiles: 'Total Tiles Required (10% waste)',
    netPlasterArea: 'Net Plastering Area',
    totalPlasterBags: 'Total Plaster Bags (30kg)',
    totalRebarPieces: 'Total Rebar Pieces',
    totalRebarWeight: 'Total Weight (Tonnes)',
    wastageLabel: 'Wastage',
    cementRequired: 'Cement Required (50kg bags)',
    sandRequired: 'Sand Required (Tonnes)',
    gravelRequired: 'Gravel Required (Tonnes)',
    groutRequired: 'Grout Needed (Approx)',
    adhesiveRequired: 'Tile Adhesive (Approx)',
    boxesApprox: 'Approx Boxes (1m²/box)',
    netVolume: 'Net Volume',
    totalVolume: 'Total Concrete Volume',
    netPaint: 'Net Paint Needed (2 Coats)',
    totalPaint: 'Total Paint Required',
    gallons: 'Large Buckets (20L)',
    quarts: 'Small Buckets (4L)',
    enterValues: 'Please enter dimensions',
    kgPerM: 'Weight per meter',
    totalKg: 'Total Kg',
    bagsLabel: 'bags',
    piecesLabel: 'pieces',
    tonnesLabel: 'Tonnes',
    totalRolls: 'Total Isogam Rolls (10m²)',
    primerLiters: 'Primer / Qir Needed (Liters)',
    totalPanels: 'Total Gypsum Panels (2.4x1.2m)',
    framingPieces: 'C-Channel Framing (Approx)',
    infoBlock: 'Note: Block walls include 5% wastage. Mortar assumes 400kg cement per cubic meter.',
    infoBrick: 'Note: Brick walls include 8% wastage. Wall depth assumed 12cm for mortar estimation.',
    infoConcrete: 'Note: Assumes 5% wastage. Mix defaults to roughly C25 (350kg cement / m³).',
    infoPaint: 'Note: Assumes 10% wastage. Results cover exactly 2 coats of paint.',
    infoTile: 'Note: 10% wastage for tile cuts. Adhesive estimated at 4kg per m².',
    infoPlaster: 'Note: 15% standard wastage for plaster/juss application. Density ~1250kg/m³.',
    infoRebar: 'Note: Weight calculated using standard engineering formula D²/162. No wastage added.',
    infoIsogam: 'Note: Includes 15% extra for overlaps and edges. Primer estimated at 0.3L per m².',
    infoGypsum: 'Note: 10% panel wastage. Framing assumes ~3.2m of C-Channel per m².',
  }, [lang]);

  // Auto-save with ref to prevent infinite loops
  const savedResultRef = useRef(null);
  React.useEffect(() => {
    if (result && onAutoSave && activeCategory && activeCategory !== 'menu') {
      const title = copy.materials[activeCategory]?.title || activeCategory;
      const str = `${title}: ${result.primaryValue} | ${result.totalValue}`;
      if (savedResultRef.current !== str) {
        savedResultRef.current = str;
        onAutoSave(activeCategory, str);
      }
    }
  }, [result, onAutoSave, activeCategory, copy]);

  const availableKeys = useMemo(() => {
    const allKeys = ['block', 'brick', 'concrete', 'tile', 'plaster', 'paint', 'rebar', 'isogam', 'gypsum'];
    if (!activeProject || !activeProject.items || !materials) return allKeys;
    
    const keys = new Set();
    activeProject.items.forEach(it => {
      const mat = materials.find(m => m.id === it.id);
      if (!mat) return;
      
      const n = (mat.nameEN || '').toLowerCase();
      const c = (mat.categoryEN || '').toLowerCase();
      
      if (c.includes('masonry')) {
        if (n.includes('brick')) keys.add('brick');
        else keys.add('block');
      }
      if (c.includes('concrete') || c.includes('aggregate')) keys.add('concrete');
      if (c.includes('structural') || n.includes('rebar')) keys.add('rebar');
      if (n.includes('paint') || n.includes('coating')) keys.add('paint');
      if (c.includes('finishing')) {
         if (n.includes('tile') || n.includes('marble') || n.includes('granite')) keys.add('tile');
         if (n.includes('plaster') || n.includes('juss')) keys.add('plaster');
         if (n.includes('gypsum') || n.includes('drywall') || n.includes('board')) keys.add('gypsum');
      }
      if (c.includes('insulation') || c.includes('roofing') || n.includes('waterproofing') || n.includes('membrane')) keys.add('isogam');
    });

    if (keys.size === 0) return allKeys;
    return Array.from(keys);
  }, [activeProject, materials]);

  const handleOpenCategory = (cat) => {
    setActiveCategory(cat);
    resetInputs();
  };

  const renderMenu = () => (
    <Animated.View entering={FadeIn} leaving={FadeOut} style={styles.menuContainer}>
      <Text style={[styles.menuTitle, isRTL && styles.textRTL]}>{copy.chooseMaterial}</Text>
      <View style={styles.grid}>
        {availableKeys.map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.gridCard, { backgroundColor: tc.white, borderColor: tc.cardBorder }]}
            activeOpacity={0.8}
            onPress={() => handleOpenCategory(key)}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: tc.offWhite }]}>
              <Text style={styles.cardIcon}>{copy.materials[key].icon}</Text>
            </View>
            <Text style={[styles.cardTitle, isRTL && styles.textRTL, { color: tc.primary }]}>{copy.materials[key].title}</Text>
            <Text style={[styles.cardDesc, isRTL && styles.textRTL, { color: tc.mediumGray }]}>{copy.materials[key].desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderForm = () => {
    let inputs = null;
    let onCalc = null;

    if (activeCategory === 'block' || activeCategory === 'brick') {
      onCalc = () => calculateBlocksBricks(activeCategory === 'brick');
      inputs = (
        <>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.length}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={length} onChangeText={setLength} placeholder="e.g. 10" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.height}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={height} onChangeText={setHeight} placeholder="e.g. 3" />
          </View>
          <View style={styles.dimRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: isRTL ? 0 : spacing.md, marginLeft: isRTL ? spacing.md : 0 }]}>
              <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.unitLength} (cm)</Text>
              <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={unitLength} onChangeText={setUnitLength} placeholder={activeCategory === 'brick' ? "e.g. 24" : "e.g. 40"} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.unitHeight} (cm)</Text>
              <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={unitHeight} onChangeText={setUnitHeight} placeholder={activeCategory === 'brick' ? "e.g. 7" : "e.g. 20"} />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.mortarJoint}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={mortarThickness} onChangeText={setMortarThickness} placeholder="e.g. 1.5" />
          </View>
        </>
      );
    } else if (activeCategory === 'concrete') {
      onCalc = calculateConcrete;
      inputs = (
        <>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.length}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={length} onChangeText={setLength} placeholder="e.g. 10" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.width}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={height} onChangeText={setHeight} placeholder="e.g. 5" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.valThickness}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={thickness} onChangeText={setThickness} placeholder="e.g. 20" />
          </View>
        </>
      );
    } else if (activeCategory === 'paint') {
      onCalc = calculatePaint;
      inputs = (
        <>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.length}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={length} onChangeText={setLength} placeholder="e.g. 10" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.height}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={height} onChangeText={setHeight} placeholder="e.g. 3" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.coverage}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={coverageRate} onChangeText={setCoverageRate} placeholder="e.g. 10" />
          </View>
        </>
      );
    } else if (activeCategory === 'tile') {
      onCalc = calculateTile;
      inputs = (
        <>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.length}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={length} onChangeText={setLength} placeholder="e.g. 10" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.width}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={height} onChangeText={setHeight} placeholder="e.g. 5" />
          </View>
          <View style={styles.dimRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: isRTL ? 0 : spacing.md, marginLeft: isRTL ? spacing.md : 0 }]}>
              <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.unitLength} (cm)</Text>
              <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={unitLength} onChangeText={setUnitLength} placeholder="e.g. 60" />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.unitHeight} (cm)</Text>
              <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={unitHeight} onChangeText={setUnitHeight} placeholder="e.g. 60" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.mortarJointMm}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={mortarThickness} onChangeText={setMortarThickness} placeholder="e.g. 2" />
          </View>
        </>
      );
    } else if (activeCategory === 'plaster') {
      onCalc = calculatePlaster;
      inputs = (
        <>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.length}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={length} onChangeText={setLength} placeholder="e.g. 10" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.height}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={height} onChangeText={setHeight} placeholder="e.g. 3" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.valThickness}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={thickness} onChangeText={setThickness} placeholder="e.g. 2" />
          </View>
        </>
      );
    } else if (activeCategory === 'isogam') {
      onCalc = calculateIsogam;
      inputs = (
        <>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.length}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={length} onChangeText={setLength} placeholder="e.g. 10" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.width}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={height} onChangeText={setHeight} placeholder="e.g. 5" />
          </View>
        </>
      );
    } else if (activeCategory === 'gypsum') {
      onCalc = calculateGypsum;
      inputs = (
        <>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.length}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={length} onChangeText={setLength} placeholder="e.g. 8" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.width}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={height} onChangeText={setHeight} placeholder="e.g. 6" />
          </View>
        </>
      );
    } else if (activeCategory === 'rebar') {
      onCalc = calculateRebar;
      inputs = (
        <>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.rebarLength}</Text>
            <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={rebarLengthTotal} onChangeText={setRebarLengthTotal} placeholder="e.g. 1500" />
          </View>
          <View style={styles.dimRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: isRTL ? 0 : spacing.md, marginLeft: isRTL ? spacing.md : 0 }]}>
              <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.rebarDiam}</Text>
              <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={rebarDiameter} onChangeText={setRebarDiameter} placeholder="e.g. 12" />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.rebarPieceLengthInput}</Text>
              <TextInput style={[styles.input, isRTL && styles.textRTL, { borderColor: tc.cardBorder, backgroundColor: tc.offWhite, color: tc.primary }]} keyboardType="numeric" value={rebarPieceLength} onChangeText={setRebarPieceLength} placeholder="e.g. 12" />
            </View>
          </View>
        </>
      );
    }

    return (
      <Animated.View entering={FadeIn.duration(300)} leaving={FadeOut.duration(300)} style={[styles.formContainer, { backgroundColor: tc.white }]}>
        <View style={[styles.formHeader, isRTL && styles.rowRTL]}>
          <Text style={[styles.formTitle, isRTL && styles.textRTL, { color: tc.primary }]}>{copy.materials[activeCategory].title}</Text>
          <Text style={styles.formIcon}>{copy.materials[activeCategory].icon}</Text>
        </View>

        {inputs}

        <TouchableOpacity style={[styles.calculateBtn, { backgroundColor: tc.accent }]} onPress={onCalc} activeOpacity={0.8}>
          <Text style={[styles.calculateBtnText, { color: tc.white }]}>{copy.calculate}</Text>
        </TouchableOpacity>

        {result && (
          <Animated.View entering={FadeIn} style={[styles.resultContainer, { backgroundColor: tc.resultBackground, borderColor: tc.resultBorder }]}>
            <Text style={[styles.resultTitle, isRTL && styles.textRTL, { color: tc.primary, borderBottomColor: tc.resultBorder }]}>{copy.results}</Text>

            {result.area !== '-' && (
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.wallArea}</Text>
                <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.area}</Text>
              </View>
            )}

            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{result.primaryLabel}</Text>
              <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.primaryValue}</Text>
            </View>

            {result.wastage !== '-' && (
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.wastageLabel}</Text>
                <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.wastage}</Text>
              </View>
            )}

            <View style={[styles.resultRow, styles.totalRow, { borderTopColor: tc.resultBorder }]}>
              <Text style={[styles.resultLabelTotal, isRTL && styles.textRTL, { color: tc.primary }]}>{result.totalLabel}</Text>
              <Text style={[styles.resultValueTotal, { color: tc.primary }]}>{result.totalValue}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: tc.resultBorder }]} />

            {result.cementBags !== undefined && (
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.cementRequired}</Text>
                <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.cementBags}</Text>
              </View>
            )}
            {result.sandTonnes !== undefined && (
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.sandRequired}</Text>
                <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.sandTonnes}</Text>
              </View>
            )}
            {result.gravelTonnes !== undefined && (
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.gravelRequired}</Text>
                <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.gravelTonnes}</Text>
              </View>
            )}
            {result.groutKg !== undefined && (
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.groutRequired}</Text>
                <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.groutKg} kg</Text>
              </View>
            )}
            {result.adhesiveKg !== undefined && (
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.adhesiveRequired}</Text>
                <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.adhesiveKg} kg</Text>
              </View>
            )}
            {result.boxes !== undefined && (
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.boxesApprox}</Text>
                <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.boxes}</Text>
              </View>
            )}
            {result.bucketsLarge !== undefined && (
              <>
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.gallons}</Text>
                  <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.bucketsLarge}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.quarts}</Text>
                  <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.bucketsSmall}</Text>
                </View>
              </>
            )}
            {result.plasterVol !== undefined && (
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.netVolume}</Text>
                <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.plasterVol}</Text>
              </View>
            )}
            {result.weightPerMeter !== undefined && (
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.kgPerM}</Text>
                <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.weightPerMeter}</Text>
              </View>
            )}
            {result.primerL !== undefined && (
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.primerLiters}</Text>
                <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.primerL} L</Text>
              </View>
            )}
            {result.cChannels !== undefined && (
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.framingPieces}</Text>
                <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.cChannels}</Text>
              </View>
            )}
            {result.totalKg !== undefined && (
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, isRTL && styles.textRTL, { color: tc.charcoal }]}>{copy.totalKg}</Text>
                <Text style={[styles.resultValue, { color: tc.accentDark }]}>{result.totalKg}</Text>
              </View>
            )}
            {result.infoText && (
              <View style={[styles.infoWrapper, { backgroundColor: tc.infoBackground, borderColor: tc.infoBorder }]}>
                <Text style={[styles.infoTextValue, isRTL && styles.textRTL, { color: tc.infoText }]}>{result.infoText}</Text>
              </View>
            )}

            {/* Add to Project button */}
            {activeProjectId && onAddToProject && (
              <TouchableOpacity
                style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: spacing.md, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 20 }}
                onPress={() => {
                  const title = copy.materials[activeCategory]?.title || activeCategory;
                  const estText = `${title}: ${result.primaryValue} | ${result.totalValue}`;
                  onAddToProject([], lang === 'ku' ? 'ژمێرەری خەمڵاندن' : 'Estimation Calculator', null, estText);
                }}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 18 }}>📁</Text>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{lang === 'ku' ? 'زیادکردن بۆ پ\u0631ۆژە' : 'Add to Project'}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: tc.offWhite }]}
      entering={FadeIn}
      leaving={FadeOut}
      layout={LinearTransition.springify()}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, isRTL && styles.rowRTL, { backgroundColor: tc.primary }]}>
          <TouchableOpacity onPress={() => {
            if (activeCategory !== 'menu') setActiveCategory('menu');
            else onBack();
          }} style={styles.backButton}>
            <Text style={styles.backButtonText}>{isRTL ? ">" : "<"}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{copy.title}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeProjectName && (
            <View style={{ backgroundColor: "#EBF5FF", paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20, borderRadius: 12, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#BFDBFE' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#1E3A8A", fontWeight: '700', fontSize: 13, textAlign: isRTL ? 'right' : 'left', marginBottom: 2 }}>
                  {lang === "ku" ? `پ\u0631ۆژەی چالاک: ${activeProjectName}` : `Active Project: ${activeProjectName}`}
                </Text>
                <Text style={{ color: "#3B82F6", fontWeight: '600', fontSize: 11, textAlign: isRTL ? 'right' : 'left' }}>
                  {lang === "ku" ? "گۆ\u0631انکارییەکان خۆکارانە پاشەکەوت دەکرێن کاتێک دەگە\u0631ێیتەوە" : "Changes are saved automatically when you go back"}
                </Text>
              </View>
            </View>
          )}
          {activeCategory === 'menu' ? renderMenu() : renderForm()}
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  safeArea: { flex: 1 },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: 50,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    zIndex: 10,
  },
  rowRTL: { flexDirection: 'row-reverse' },
  textRTL: { textAlign: 'right' },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  backButtonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  headerTitle: { ...typography.hero, fontSize: 22, color: colors.white, flex: 1 },
  scrollContent: { padding: spacing.xl },

  menuContainer: { flex: 1 },
  menuTitle: { ...typography.subtitle, color: colors.charcoal, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridCard: {
    width: '47%',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radius.xl,
    alignItems: 'center',
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardIconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.offWhite,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md
  },
  cardIcon: { fontSize: 24 },
  cardTitle: { ...typography.subtitle, color: colors.primary, marginBottom: spacing.xs, textAlign: 'center' },
  cardDesc: { ...typography.caption, color: colors.mediumGray, textAlign: 'center', lineHeight: 18 },

  formContainer: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl, ...shadows.cardLifted },
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  formTitle: { ...typography.hero, fontSize: 20, color: colors.primary },
  formIcon: { fontSize: 28 },
  inputGroup: { marginBottom: spacing.lg },
  label: { ...typography.caption, color: colors.charcoal, marginBottom: spacing.xs, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    backgroundColor: colors.offWhite,
    color: colors.primary,
  },
  dimRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calculateBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.button,
  },
  calculateBtnText: { ...typography.subtitle, color: colors.white, fontSize: 16 },

  resultContainer: {
    marginTop: spacing.xxxl,
    padding: spacing.xl,
    backgroundColor: '#F7FAFC',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultTitle: { ...typography.title, color: colors.primary, marginBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#CBD5E0', paddingBottom: spacing.sm },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, alignItems: 'center' },
  resultLabel: { ...typography.body, color: colors.charcoal, flex: 1 },
  resultValue: { ...typography.subtitle, color: colors.accentDark, marginLeft: spacing.md, textAlign: 'right' },
  totalRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#CBD5E0' },
  resultLabelTotal: { ...typography.subtitle, color: colors.primary, flex: 1 },
  resultValueTotal: { ...typography.hero, color: colors.primary, fontSize: 22, marginLeft: spacing.md, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#CBD5E0', marginVertical: spacing.md },
  infoWrapper: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: '#EBF4FF', borderRadius: radius.md, borderWidth: 1, borderColor: '#BEE3F8' },
  infoTextValue: { ...typography.caption, color: '#2B6CB0', lineHeight: 20 },
});
