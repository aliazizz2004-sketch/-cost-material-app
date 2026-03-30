import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight, LinearTransition } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { useExchangeRate } from "../contexts/ExchangeRateContext";
import { colors, darkColors, spacing, typography, radius, shadows } from "../styles/theme";
import materialsData from "../data/materials";
import { getApiKey } from "../services/aiRecognition";

const GEMINI_MODELS = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash", "gemini-1.5-flash"];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(prompt) {
  let lastError = null;
  const apiKey = await getApiKey();

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) await delay(2500);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (response.status === 429) {
          console.warn(`[AIArchitect] ${model} returned 429, retrying...`);
          lastError = new Error(`Rate limited (${model})`);
          await delay(3000);
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} from ${model}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!text) throw new Error("Empty response from AI");

        const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        let parsed;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          const objectMatch = cleaned.match(/\{[\s\S]*\}/);
          if (objectMatch) {
            parsed = JSON.parse(objectMatch[0]);
          } else {
            throw new Error("Could not parse response");
          }
        }

        return parsed;
      } catch (err) {
        console.warn(`[AIArchitect] ${model} attempt ${attempt + 1} failed:`, err.message);
        lastError = err;
      }
    }
  }
  throw lastError || new Error("All AI models failed");
}

const PRESET_PROJECTS = {
  en: [
    { id: "house_small", icon: "🏠", label: "Small House (100m²)", prompt: "A small single-story house, 100m² total area, 3 bedrooms, 1 bathroom, kitchen, living room. Standard construction in Erbil, Kurdistan." },
    { id: "house_medium", icon: "🏡", label: "Two-Story House (200m²)", prompt: "A two-story house, 200m² total area (100m² per floor), 4 bedrooms, 2 bathrooms, kitchen, 2 living rooms, balcony. Modern construction in Sulaimani." },
    { id: "house_large", icon: "🏰", label: "Villa with Basement (350m²)", prompt: "A luxury villa with basement, 350m² total area, 5 bedrooms, 3 bathrooms, 2 kitchens, large living room, garage, garden walls. High-end finishes in Erbil." },
    { id: "apartment", icon: "🏢", label: "Apartment (120m²)", prompt: "An apartment unit renovation, 120m² area, 3 bedrooms, 2 bathrooms, open kitchen and living. Modern finishing only (no structural work)." },
    { id: "commercial", icon: "🏪", label: "Small Shop/Office (80m²)", prompt: "A small commercial shop or office space, 80m² area, open floor plan, 1 bathroom, front glass facade, ceiling work, electrical and lighting setup." },
    { id: "wall_fence", icon: "🧱", label: "Boundary Wall (50m)", prompt: "A concrete boundary wall/fence, 50 meters long, 2.5 meters height, with foundation, block wall, plaster and paint finishing." },
  ],
  ku: [
    { id: "house_small", icon: "🏠", label: "خانووی بچووک (١٠٠م²)", prompt: "خانووی بچووکی یەک نهۆم، ١٠٠م² \u0631ووبەری گشتی، ٣ ژووری نوستن، ١ حەمام، چێشتخانە، ژووری دانیشتن. بیناسازی ئاسایی لە هەولێر." },
    { id: "house_medium", icon: "🏡", label: "خانووی دوو نهۆم (٢٠٠م²)", prompt: "خانووی دوو نهۆم، ٢٠٠م² \u0631ووبەری گشتی، ٤ ژووری نوستن، ٢ حەمام، چێشتخانە، ٢ ژووری دانیشتن، بەلکۆنە. بیناسازی مۆدێرن لە سلێمانی." },
    { id: "house_large", icon: "🏰", label: "ڤیلا لەگەڵ ژێرزەوی (٣٥٠م²)", prompt: "ڤیلای لوکس لەگەڵ ژێرزەوی، ٣٥٠م² \u0631ووبەری گشتی، ٥ ژووری نوستن، ٣ حەمام، ٢ چێشتخانە، ژووری دانیشتنی گەورە، گاراج. کۆتاییکاری سەرتر لە هەولێر." },
    { id: "apartment", icon: "🏢", label: "شوقە (١٢٠م²)", prompt: "نوێکردنەوەی شوقە، ١٢٠م² \u0631ووبەر، ٣ ژووری نوستن، ٢ حەمام، چێشتخانە و ژووری دانیشتنی کراوە. کۆتاییکاری مۆدێرن تەنها (بێ کاری سازەیی)." },
    { id: "commercial", icon: "🏪", label: "دوکان/ئۆفیس (٨٠م²)", prompt: "دوکانێکی بچووک یان ئۆفیس، ٨٠م² \u0631ووبەر، پلانی کراوە، ١ حەمام، \u0631ووی شووشەیی، کاری بەرزایی، دامەزراندنی کارەبا و \u0631وناکی." },
    { id: "wall_fence", icon: "🧱", label: "دیواری دەوروبەر (٥٠م)", prompt: "دیواری کۆنکریتی دەوروبەر، ٥٠ مەتر درێژی، ٢.٥ مەتر بەرزی، لەگەڵ بنە\u0631ەت، دیواری بلۆک، \u0631از و بۆیە." },
  ],
};

function buildMaterialCatalog() {
  return materialsData
    .map(
      (m) =>
        `ID:${m.id} | ${m.nameEN} | ${m.nameKU} | Cat:${m.categoryEN} | $${m.basePrice}/${m.unit}`
    )
    .join("\n");
}

function buildAIPrompt(userDescription, lang, qualityTier) {
  const catalog = buildMaterialCatalog();
  const tierDesc = {
    budget: "BUDGET / LOWEST COST: Use the cheapest acceptable materials. Minimize quantities where safe. No luxury finishes. Basic doors/windows. Standard paint only. Minimum tile coverage.",
    standard: "STANDARD / BALANCED: Good quality materials at fair prices. Standard finishes. Moderate tile/marble. Balance between quality and cost.",
    premium: "PREMIUM / BEST QUALITY: Use premium materials everywhere. Maximum marble/granite. High-end finishes. Best-quality doors, windows, insulation, plumbing. Premium paint brands.",
  };

  return `You are an EXPERT civil engineer and architect specialized in Kurdistan Region, Iraq construction.
You follow the Iraqi Building Code (IBC), ACI 318 for reinforced concrete design, and Kurdistan Regional Government (KRG) MOCAH standards.

The user describes a building project. Create a COMPLETE material estimate list.

QUALITY TIER: ${tierDesc[qualityTier] || tierDesc.standard}

═══════════════════════════════════════════════════════
USER PROJECT:
═══════════════════════════════════════════════════════
${userDescription}

═══════════════════════════════════════════════════════
MATERIAL CATALOG (use ONLY these IDs):
═══════════════════════════════════════════════════════
${catalog}

═══════════════════════════════════════════════════════
STANDARDS & METHODOLOGY (Iraqi Building Code + ACI 318 + KRSO):
═══════════════════════════════════════════════════════
Foundation:
- Strip foundation: 0.8m deep × 0.5m wide (IBC min for 1-story), 1.0m deep for 2+ story
- Raft foundation for soft soil: 0.3m thick min
- Concrete grade: C25 min (ACI 318: fc' ≥ 25 MPa)

Structural Concrete (per ACI 318):
- Slab thickness: 0.12-0.15m (one-way), 0.15-0.20m (two-way)
- Beam: 0.25×0.50m typical, 0.30×0.60m for spans >5m
- Column: 0.30×0.30m min residential
- Concrete volume = slab area × thickness + beams + columns + foundation
- Mix: 350 kg cement + 0.5m³ sand + 0.8m³ gravel per m³ concrete (C25)

Reinforcement (ACI 318):
- Slab: min 0.0018×b×h, typical 8-12mm bars @200mm → ~25-35 kg/m² slab
- Beams: 80-120 kg rebar per m³ of beam concrete
- Columns: 1-2% of cross section area
- Foundation: 60-80 kg/m³

Masonry (IBC / ISO):
- 20cm hollow concrete blocks: 12.5 blocks/m² wall
- Wall height: 3.0m floor-to-floor (Kurdistan standard)
- Perimeter walls = 2×(length + width) per floor × 3m height - openings (~20%)
- Internal walls: ~60% of external wall area

Finishes (KRSO common practice):
- Plaster: 15mm internal (cement:sand 1:4), 20mm external → 20 kg/m²
- Tiles: floor area + 15% waste; wall tiles in wet areas (bathroom/kitchen) h=2.2m
- Paint: 0.2 L/m² (2 coats), add 10% waste
- Doors: count from rooms (90cm internal, 100cm external)
- Windows: 2 per bedroom, 1 kitchen, 2 living room, 1 bathroom (60×60cm)

MEP:
- Electrical: ~35m cable per room + main panel + breakers
- Plumbing: ~20m pipe per wet room (bathroom/kitchen)
- PVC drainage: ~8m per wet room

DURATION CALCULATION:
- Foundation: 15-20 days (small) to 30-40 days (large)
- Structure per floor: 25-35 days
- Masonry: 15-25 days per floor
- MEP rough-in: 15-20 days
- Plastering: 15-25 days
- Finishing (tiles, paint, doors): 20-30 days
- Total = sum all phases. Small house ~90-120 days. Two-story ~150-200 days. Villa ~200-280 days.

IMPORTANT: estimatedDurationDays MUST be realistic based on the above.
Return ONLY valid JSON, no extra text. Kurdish text in Sorani.

JSON shape:
{
  "projectSummary": {
    "titleEN": "Short title",
    "titleKU": "ناونیشانی پ\u0631ۆژە",
    "descriptionEN": "Brief scope summary",
    "descriptionKU": "کورتەی پ\u0631ۆژەکە",
    "totalAreaM2": 200,
    "estimatedDurationDays": 150,
    "qualityTierEN": "Standard",
    "qualityTierKU": "ئاسایی"
  },
  "phases": [
    {
      "phaseEN": "Foundation & Structure",
      "phaseKU": "بنە\u0631ەت و سازە",
      "order": 1,
      "durationDays": 40,
      "items": [
        {
          "materialId": 1,
          "quantity": 15,
          "noteEN": "15 tons OPC cement for foundation and structural concrete (C25 grade, ACI 318)",
          "noteKU": "۱۵ تۆن سمێنت بۆ بنە\u0631ەت و کۆنکریتی سازەیی"
        }
      ]
    }
  ],
  "totalEstimateUSD": 45000,
  "notesEN": ["Based on Iraqi Building Code + ACI 318 standards", "10-15% contingency recommended"],
  "notesKU": ["بەپێی ستانداردی یاسای بینای عێراق و ACI 318", "۱۰-۱۵% بۆ گۆ\u0631انکاری پێشنیار دەکرێت"],
  "tipsEN": ["Buy cement in bulk for 10-15% savings"],
  "tipsKU": ["سمێنت بە کۆمەڵ بک\u0631ە بۆ ۱۰-۱۵% پاشەکەوت"]
}`;
}


export default function AIArchitect({ onBack, onAddToStore, onViewStore, onAddToProject, activeProjectId }) {
  const { t, lang, isRTL } = useLanguage();
  const { isDark } = useTheme();
  const { rate } = useExchangeRate();
  const tc = isDark ? darkColors : colors;
  const scrollRef = useRef(null);

  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedPhases, setExpandedPhases] = useState({});
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showResultDetail, setShowResultDetail] = useState(false);
  const [qualityTier, setQualityTier] = useState(null);
  const [addedToList, setAddedToList] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const [addedItems, setAddedItems] = useState([]);
  const [addedListName, setAddedListName] = useState('');

  const copy = useMemo(
    () =>
      lang === "ar"
        ? {
          title: "معمار الذكاء الاصطناعي",
          subtitle: "صف مشروعك، سيقوم الذكاء بإنشاء قائمة المواد الكاملة",
          inputPlaceholder: "صف مشروعك... مثال: بيت 200م² ثنائي الطوابق في أربيل...",
          generate: "إنشاء قائمة المواد",
          generating: "تحليل وحساب...",
          presets: "مشاريع جاهزة",
          presetsSubtitle: "اختر أحدها للبدء فوراً",
          totalCost: "إجمالي التكلفة التقديرية",
          duration: "المدة التقديرية",
          days: "يوم",
          phases: "مراحل البناء",
          notes: "ملاحظات مهنية",
          tips: "نصائح لتوفير المال",
          addAllToStore: "إضافة جميع المواد إلى المخزن",
          addPhaseToStore: "إضافة هذه المرحلة",
          tryAgain: "حاول مجدداً",
          errorMsg: "حدث خطأ. يرجى المحاولة مجدداً.",
          or: "أو",
          typingHint: "اكتب مشروعك أو اختر مشروعاً جاهزاً",
          area: "المساحة",
          items: "عناصر",
          back: "رجوع",
          quantity: "الكمية",
          materialAdded: "تمت إضافة المواد إلى قائمتك!",
          chooseTier: "اختر مستوى الجودة",
          budget: "اقتصادي",
          budgetDesc: "أقل تكلفة",
          standard: "قياسي",
          standardDesc: "جودة جيدة بسعر معقول",
          premium: "فاخر",
          premiumDesc: "أفضل جودة",
          viewStore: "عرض قائمة المخزن",
          durationLabel: "مدة البناء",
        }
        : lang === "ku"
        ? {
          title: "AI ئەندازیار",
          subtitle: "پ\u0631ۆژەکەت وەسف بکە، AI لیستی تەواوی مادەکان دروست دەکات",
          inputPlaceholder: "پ\u0631ۆژەکەت وەسف بکە... بۆ نموونە: خانووی ۲۰۰م² دوو نهۆم لە هەولێر...",
          generate: "لیستی مادەکان دروست بکە",
          generating: "شیکردنەوە و ژمارەکردن...",
          presets: "پ\u0631ۆژە ئامادەکراوەکان",
          presetsSubtitle: "یەکێک هەڵبژێرە بۆ دەست پێکردنی خێرا",
          totalCost: "کۆی تێچووی خەمڵاندراو",
          duration: "ماوەی خەمڵاندراو",
          days: "\u0631ۆژ",
          phases: "قۆناغەکان",
          notes: "تێبینییەکان",
          tips: "ئامۆژگارییەکان",
          addAllToStore: "هەموو مادەکان زیاد بکە",
          addPhaseToStore: "زیادکردنی ئەم قۆناغە",
          tryAgain: "دووبارە هەوڵبدەوە",
          errorMsg: "هەڵە \u0631وویدا. تکایە دووبارە هەوڵبدەوە.",
          or: "یان",
          typingHint: "پ\u0631ۆژەکەت بنووسە یان لە پ\u0631ۆژە ئامادەکراوەکان هەڵبژێرە",
          area: "\u0631ووبەر",
          items: "مادە",
          back: "گە\u0631انەوە",
          quantity: "ب\u0631",
          materialAdded: "مادەکان زیادکران بۆ لیست",
          chooseTier: "ئاستی کوالیتی هەڵبژێرە",
          budget: "ئابووری",
          budgetDesc: "کەمترین تێچوو",
          standard: "ئاسایی",
          standardDesc: "کوالیتی باش بە نرخی مامناوەند",
          premium: "سەرتر",
          premiumDesc: "باشترین کوالیتی",
          viewStore: "بینینی لیست",
          durationLabel: "ماوەی بیناسازی",
        }
        : {
          title: "AI Architect",
          subtitle: "Describe your project, AI generates the complete material list",
          inputPlaceholder: "Describe your project... e.g. 200m² two-story house in Erbil with 4 bedrooms...",
          generate: "Generate Material List",
          generating: "Analyzing & Calculating...",
          presets: "Quick Start Projects",
          presetsSubtitle: "Choose one to get started instantly",
          totalCost: "Estimated Total Cost",
          duration: "Estimated Duration",
          days: "days",
          phases: "Construction Phases",
          notes: "Professional Notes",
          tips: "Money-Saving Tips",
          addAllToStore: "Add All Materials to Store",
          addPhaseToStore: "Add this Phase",
          tryAgain: "Try Again",
          errorMsg: "An error occurred. Please try again.",
          or: "or",
          typingHint: "Type your project or choose a preset",
          area: "Area",
          items: "items",
          back: "Back",
          quantity: "Qty",
          materialAdded: "Materials added to your list!",
          chooseTier: "Choose Quality Tier",
          budget: "Budget",
          budgetDesc: "Lowest cost",
          standard: "Standard",
          standardDesc: "Good quality, fair price",
          premium: "Premium",
          premiumDesc: "Best quality",
          viewStore: "View Store List",
          durationLabel: "Construction Duration",
        },
    [lang]
  );

  const presets = useMemo(() => PRESET_PROJECTS[lang] || PRESET_PROJECTS.en, [lang]);

  const handlePresetSelect = useCallback((preset) => {
    setUserInput(preset.prompt);
    setShowPresetsModal(false);
    setQualityTier(null); // reset tier when choosing new preset
  }, []);

  const togglePhase = useCallback((idx) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!userInput.trim() || !qualityTier) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setExpandedPhases({});
    setAddedToList(false);

    try {
      const prompt = buildAIPrompt(userInput, lang, qualityTier);
      const parsed = await callGeminiWithRetry(prompt);
      setResult(parsed);
      setShowResultDetail(true);
      setExpandedPhases({ 0: true });
    } catch (err) {
      console.error("AI Architect error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, lang, qualityTier]);

  const handleAddPhaseToStore = useCallback(
    async (phase) => {
      if (!phase?.items) return;
      try {
        const existing = await AsyncStorage.getItem('costMaterialSavedLists');
        const lists = existing ? JSON.parse(existing) : [];

        const validItems = [];
        let totalCost = 0;

        phase.items.forEach((item) => {
          const mat = materialsData.find((m) => m.id == item.materialId);
          if (mat) {
            const qty = Math.ceil(item.quantity);
            validItems.push({ id: mat.id, qty, nameEN: mat.nameEN, nameKU: mat.nameKU, basePrice: mat.basePrice });
            totalCost += mat.basePrice * qty;
          }
        });

        if (validItems.length === 0) return;

        const phaseName = lang === "ku" ? phase.phaseKU : phase.phaseEN;
        const projectBase = lang === "ku" ? result?.projectSummary?.titleKU : result?.projectSummary?.titleEN;

        lists.unshift({
          id: Date.now().toString(),
          name: projectBase ? `${projectBase} - ${phaseName}` : phaseName,
          date: new Date().toISOString(),
          items: validItems,
          totalCost: totalCost,
        });

        await AsyncStorage.setItem('costMaterialSavedLists', JSON.stringify(lists));
        const listName = projectBase ? `${projectBase} - ${phaseName}` : phaseName;
        setAddedCount(validItems.length);
        setAddedItems(validItems);
        setAddedListName(listName);
        setAddedToList(true);
      } catch (e) { console.error('Error saving phase', e); }
    },
    [result, lang]
  );

  const handleAddAllToStore = useCallback(async () => {
    if (!result?.phases) return;
    try {
      const existing = await AsyncStorage.getItem('costMaterialSavedLists');
      const lists = existing ? JSON.parse(existing) : [];

      const validItems = [];
      let totalCost = 0;

      result.phases.forEach((phase) => {
        (phase.items || []).forEach((item) => {
          const mat = materialsData.find((m) => m.id == item.materialId);
          if (mat) {
            const qty = Math.ceil(item.quantity);
            validItems.push({ id: mat.id, qty, nameEN: mat.nameEN, nameKU: mat.nameKU, basePrice: mat.basePrice });
            totalCost += mat.basePrice * qty;
          }
        });
      });

      if (validItems.length === 0) return;

      const projectName = lang === "ku" ? result?.projectSummary?.titleKU : result?.projectSummary?.titleEN;

      lists.unshift({
        id: Date.now().toString(),
        name: projectName || (lang === "ku" ? "لێکدانەوەی AI" : "AI Estimate"),
        date: new Date().toISOString(),
        items: validItems,
        totalCost: totalCost,
      });

      await AsyncStorage.setItem('costMaterialSavedLists', JSON.stringify(lists));
      const pName = projectName || (lang === "ku" ? "لێکدانەوەی AI" : "AI Estimate");
      setAddedCount(validItems.length);
      setAddedItems(validItems);
      setAddedListName(pName);
      setAddedToList(true);
    } catch (e) { console.error('Error saving all', e); }
  }, [result, lang]);

  const getMaterialById = useCallback((id) => {
    return materialsData.find((m) => m.id == id);
  }, []);

  const totalCostDisplay = useMemo(() => {
    if (!result) return "";
    const usd = result.totalEstimateUSD || 0;
    const iqd = rate ? Math.round(usd * rate) : null;
    return iqd
      ? `$${usd.toLocaleString()} ≈ ${iqd.toLocaleString()} ${lang === "ku" ? "د.ع" : "IQD"}`
      : `$${usd.toLocaleString()}`;
  }, [result, rate, lang]);

  const phaseCostCalculation = useCallback(
    (phase) => {
      if (!phase?.items) return 0;
      let total = 0;
      phase.items.forEach((item) => {
        const mat = getMaterialById(item.materialId);
        if (mat) {
          total += mat.basePrice * item.quantity;
        }
      });
      return total;
    },
    [getMaterialById]
  );

  // ─── RENDER ─────────────────────────────────────────────
  return (
    <Animated.View
      style={[s.container, { backgroundColor: tc.offWhite }]}
      entering={FadeIn.duration(350)}
    >
      <StatusBar barStyle="light-content" backgroundColor={tc.primary} />

      {/* ─── Header ─── */}
      <View style={[s.header, { backgroundColor: tc.primary }]}>
        <SafeAreaView>
          <View style={[s.headerRow, isRTL && s.headerRowRTL]}>
            <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
              <Text style={s.backBtnText}>{isRTL ? ">" : "<"}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[s.headerTitle, isRTL && s.textRTL]}>{copy.title}</Text>
              <Text style={[s.headerSubtitle, isRTL && s.textRTL]}>{copy.subtitle}</Text>
            </View>
            <View style={s.headerIcon}>
              <Text style={s.headerIconText}>🤖</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Input Section ─── */}
        {!showResultDetail && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            {/* Presets */}
            <View style={s.section}>
              <Text style={[s.sectionTitle, isRTL && s.textRTL, { color: tc.charcoal }]}>
                {copy.presets}
              </Text>
              <Text style={[s.sectionSubtitle, isRTL && s.textRTL, { color: tc.mediumGray }]}>
                {copy.presetsSubtitle}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.presetsRow}
                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
              >
                {presets.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[s.presetCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
                    onPress={() => handlePresetSelect(preset)}
                    activeOpacity={0.85}
                  >
                    <Text style={s.presetIcon}>{preset.icon}</Text>
                    <Text
                      style={[s.presetLabel, isRTL && s.textRTL, { color: tc.charcoal }]}
                      numberOfLines={2}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Text Input */}
            <View style={s.section}>
              <View style={[s.inputContainer, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <TextInput
                  style={[
                    s.textInput,
                    isRTL && s.textRTL,
                    { color: tc.charcoal },
                  ]}
                  placeholder={copy.inputPlaceholder}
                  placeholderTextColor={tc.mediumGray}
                  value={userInput}
                  onChangeText={setUserInput}
                  multiline
                  textAlignVertical="top"
                  textAlign={isRTL ? "right" : "left"}
                />
                <View style={[s.inputFooter, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Text style={[s.charCount, { color: tc.mediumGray }]}>
                    {userInput.length} / 500
                  </Text>
                  {userInput.length > 0 && (
                    <TouchableOpacity onPress={() => setUserInput("")} activeOpacity={0.7}>
                      <Text style={[s.clearInput, { color: tc.mediumGray }]}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Quality Tier Selector */}
            {userInput.trim().length > 0 && (
              <Animated.View entering={FadeInDown.duration(300)} style={s.section}>
                <Text style={[s.sectionTitle, isRTL && s.textRTL, { color: tc.charcoal, fontSize: 16 }]}>
                  {copy.chooseTier}
                </Text>
                <View style={[s.tierRow, isRTL && { flexDirection: "row-reverse" }]}>
                  {[
                    { key: "budget", icon: "💰", label: copy.budget, desc: copy.budgetDesc, color: "#22C55E" },
                    { key: "standard", icon: "⚖️", label: copy.standard, desc: copy.standardDesc, color: colors.accent },
                    { key: "premium", icon: "👑", label: copy.premium, desc: copy.premiumDesc, color: "#8B5CF6" },
                  ].map((tier) => (
                    <TouchableOpacity
                      key={tier.key}
                      style={[
                        s.tierCard,
                        { backgroundColor: tc.card, borderColor: qualityTier === tier.key ? tier.color : tc.cardBorder },
                        qualityTier === tier.key && { borderWidth: 2.5 },
                      ]}
                      onPress={() => setQualityTier(tier.key)}
                      activeOpacity={0.85}
                    >
                      <Text style={s.tierIcon}>{tier.icon}</Text>
                      <Text style={[s.tierLabel, { color: qualityTier === tier.key ? tier.color : tc.charcoal }]}>
                        {tier.label}
                      </Text>
                      <Text style={[s.tierDesc, { color: tc.mediumGray }]} numberOfLines={1}>
                        {tier.desc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Generate Button */}
            <View style={[s.section, { alignItems: "center" }]}>
              <TouchableOpacity
                style={[
                  s.generateBtn,
                  (!userInput.trim() || !qualityTier || isLoading) && s.generateBtnDisabled,
                ]}
                onPress={handleGenerate}
                disabled={!userInput.trim() || !qualityTier || isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <View style={s.loadingRow}>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={s.generateBtnText}>{copy.generating}</Text>
                  </View>
                ) : (
                  <View style={s.loadingRow}>
                    <Text style={s.generateBtnIcon}>⚡</Text>
                    <Text style={s.generateBtnText}>{copy.generate}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Error */}
            {error && (
              <Animated.View entering={FadeIn.duration(300)} style={s.errorBox}>
                <Text style={s.errorText}>❌ {copy.errorMsg}</Text>
                <Text style={[s.errorDetail, { color: "#C53030" }]}>{error}</Text>
                <TouchableOpacity style={s.retryBtn} onPress={handleGenerate} activeOpacity={0.85}>
                  <Text style={s.retryBtnText}>{copy.tryAgain}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Loading Animation */}
            {isLoading && (
              <Animated.View entering={FadeIn.duration(400)} style={s.loadingContainer}>
                <View style={s.loadingPulse}>
                  <Text style={s.loadingEmoji}>🏗️</Text>
                </View>
                <Text style={[s.loadingLabel, { color: tc.charcoal }]}>{copy.generating}</Text>
                <View style={s.loadingDots}>
                  {[0, 1, 2].map((i) => (
                    <Animated.View
                      key={i}
                      entering={FadeIn.duration(400).delay(i * 200)}
                      style={[s.loadingDot, { backgroundColor: colors.accent }]}
                    />
                  ))}
                </View>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* ─── Results Section ─── */}
        {showResultDetail && result && (
          <Animated.View entering={FadeInUp.duration(500)}>
            {/* Project Summary Card */}
            <View style={[s.summaryCard, { backgroundColor: tc.primary }]}>
              <View style={[s.summaryHeader, isRTL && { flexDirection: "row-reverse" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.summaryTitle, isRTL && s.textRTL]}>
                    {lang === "ku"
                      ? result.projectSummary?.titleKU
                      : result.projectSummary?.titleEN}
                  </Text>
                  <Text style={[s.summaryDesc, isRTL && s.textRTL]}>
                    {lang === "ku"
                      ? result.projectSummary?.descriptionKU
                      : result.projectSummary?.descriptionEN}
                  </Text>
                  {result.projectSummary?.qualityTierEN && (
                    <View style={[s.tierBadge, { alignSelf: isRTL ? "flex-end" : "flex-start" }]}>
                      <Text style={s.tierBadgeText}>
                        {qualityTier === "budget" ? "💰" : qualityTier === "premium" ? "👑" : "⚖️"}{" "}
                        {lang === "ku" ? result.projectSummary.qualityTierKU : result.projectSummary.qualityTierEN}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={s.summaryIconWrap}>
                  <Text style={s.summaryIconText}>📐</Text>
                </View>
              </View>

              {/* Stats Row */}
              <View style={[s.statsRow, isRTL && { flexDirection: "row-reverse" }]}>
                <View style={s.statItem}>
                  <Text style={s.statValue}>
                    {result.projectSummary?.totalAreaM2 || "—"}m²
                  </Text>
                  <Text style={[s.statLabel, isRTL && s.textRTL]}>{copy.area}</Text>
                </View>
                <View style={[s.statDivider]} />
                <View style={s.statItem}>
                  <Text style={s.statValue}>
                    {result.projectSummary?.estimatedDurationDays || "—"}
                  </Text>
                  <Text style={[s.statLabel, isRTL && s.textRTL]}>{copy.durationLabel || copy.days}</Text>
                </View>
                <View style={[s.statDivider]} />
                <View style={s.statItem}>
                  <Text style={s.statValue}>
                    {result.phases
                      ? result.phases.reduce(
                        (sum, p) => sum + (p.items?.length || 0),
                        0
                      )
                      : 0}
                  </Text>
                  <Text style={[s.statLabel, isRTL && s.textRTL]}>{copy.items}</Text>
                </View>
              </View>
            </View>

            {/* Total Cost Banner */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(200)}
              style={[s.costBanner, { borderColor: tc.cardBorder }]}
            >
              <Text style={[s.costLabel, isRTL && s.textRTL, { color: tc.mediumGray }]}>
                {copy.totalCost}
              </Text>
              <Text style={[s.costValue, isRTL && s.textRTL]}>
                {totalCostDisplay}
              </Text>
            </Animated.View>

            {/* Timeline / Cash Flow Chart */}
            <Animated.View entering={FadeInDown.duration(300).delay(250)} style={s.section}>
              <Text style={[s.sectionTitle, isRTL && s.textRTL, { color: tc.charcoal }]}>
                {lang === "ku" ? "\u0631ۆژژمێر و تێچووی دارایی (Cash Flow)" : "Timeline & Cash Flow Forecast"}
              </Text>
              <View style={[s.timelineCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                {(result.phases || []).map((phase, idx) => {
                  const phaseCost = phaseCostCalculation(phase);
                  return (
                    <View key={idx} style={[s.timelineRow, isRTL && { flexDirection: "row-reverse" }]}>
                      <View style={s.timelineLineContainer}>
                        <View style={[s.timelineDot, { backgroundColor: colors.accent }]} />
                        {idx !== (result.phases || []).length - 1 && <View style={[s.timelineLine, { backgroundColor: tc.cardBorder, flex: 1 }]} />}
                      </View>
                      <View style={[s.timelineContent, isRTL && s.timelineContentRTL]}>
                        <Text style={[s.timelinePhaseName, isRTL && s.textRTL, { color: tc.charcoal }]}>
                          {lang === "ku" ? phase.phaseKU : phase.phaseEN}
                        </Text>
                        <Text style={[s.timelineDuration, isRTL && s.textRTL, { color: tc.mediumGray }]}>
                          ⏱️ ~ {phase.durationDays || 30} {copy.days}
                        </Text>
                        <Text style={[s.timelineCost, isRTL && s.textRTL, { color: colors.accent }]}>
                          💰 ${Math.round(phaseCost).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {/* Phases */}
            <View style={s.section}>
              <Text style={[s.sectionTitle, isRTL && s.textRTL, { color: tc.charcoal }]}>
                {copy.phases}
              </Text>

              {(result.phases || []).map((phase, idx) => {
                const isExpanded = expandedPhases[idx];
                const phaseCost = phaseCostCalculation(phase);
                return (
                  <Animated.View
                    key={idx}
                    entering={FadeInDown.duration(300).delay(idx * 80)}
                    style={[s.phaseCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
                  >
                    <TouchableOpacity
                      style={[s.phaseHeader, isRTL && { flexDirection: "row-reverse" }]}
                      onPress={() => togglePhase(idx)}
                      activeOpacity={0.8}
                    >
                      <View style={s.phaseNum}>
                        <Text style={s.phaseNumText}>{phase.order || idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1, marginHorizontal: spacing.sm }}>
                        <Text
                          style={[s.phaseName, isRTL && s.textRTL, { color: tc.charcoal }]}
                        >
                          {lang === "ku" ? phase.phaseKU : phase.phaseEN}
                        </Text>
                        <Text
                          style={[s.phaseItemCount, isRTL && s.textRTL, { color: tc.mediumGray }]}
                        >
                          {phase.items?.length || 0} {copy.items} • ${Math.round(phaseCost).toLocaleString()}
                        </Text>
                      </View>
                      <Text style={[s.phaseChevron, { color: tc.mediumGray }]}>
                        {isExpanded ? "▼" : isRTL ? "◀" : "▶"}
                      </Text>
                    </TouchableOpacity>

                    {isExpanded && (
                      <Animated.View entering={FadeIn.duration(250)}>
                        {(phase.items || []).map((item, itemIdx) => {
                          const mat = getMaterialById(item.materialId);
                          if (!mat) return null;
                          const itemCost = mat.basePrice * item.quantity;
                          return (
                            <View
                              key={itemIdx}
                              style={[
                                s.materialRow,
                                isRTL && { flexDirection: "row-reverse" },
                                { borderTopColor: tc.cardBorder },
                              ]}
                            >
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[s.materialName, isRTL && s.textRTL, { color: tc.charcoal }]}
                                >
                                  {lang === "ku" ? mat.nameKU : mat.nameEN}
                                </Text>
                                <Text
                                  style={[s.materialNote, isRTL && s.textRTL, { color: tc.mediumGray }]}
                                  numberOfLines={2}
                                >
                                  {lang === "ku" ? item.noteKU : item.noteEN}
                                </Text>
                              </View>
                              <View
                                style={[s.materialQtyCol, isRTL && { alignItems: "flex-start" }]}
                              >
                                <Text style={[s.materialQty, { color: colors.accent }]}>
                                  ×{Math.ceil(item.quantity)}
                                </Text>
                                <Text style={[s.materialUnit, { color: tc.mediumGray }]}>
                                  {lang === "ku" ? mat.unitKU : mat.unitEN}
                                </Text>
                                <Text style={[s.materialCost, { color: tc.charcoal }]}>
                                  ${Math.round(itemCost).toLocaleString()}
                                </Text>
                              </View>
                            </View>
                          );
                        })}

                        {/* Phase add button */}
                        {onAddToProject && (
                          <TouchableOpacity
                            style={[s.addPhaseBtn, { backgroundColor: colors.primary }]}
                            onPress={() => {
                              const items = [];
                              (phase.items || []).forEach(item => {
                                const mat = getMaterialById(item.materialId);
                                if (mat) {
                                  items.push({ id: mat.id, name: mat.nameEN, nameKU: mat.nameKU, qty: Math.ceil(item.quantity), unitPrice: mat.basePrice, unit: mat.unit });
                                }
                              });
                              const src = lang === 'ku' ? `ئەندازیاری AI - ${phase.phaseKU}` : `AI Architect - ${phase.phaseEN}`;
                              onAddToProject(items, src);
                            }}
                            activeOpacity={0.85}
                          >
                            <Text style={[s.addPhaseBtnText, { color: '#fff' }]}>{lang === 'ku' ? 'زیادکردن بۆ پ\u0631ۆژە' : 'Add to Project'}</Text>
                          </TouchableOpacity>
                        )}
                      </Animated.View>
                    )}
                  </Animated.View>
                );
              })}
            </View>

            {/* Notes */}
            {result.notesEN?.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(400)}
                style={s.section}
              >
                <Text style={[s.sectionTitle, isRTL && s.textRTL, { color: tc.charcoal }]}>
                  📋 {copy.notes}
                </Text>
                <View style={[s.notesCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                  {(lang === "ku" ? result.notesKU : result.notesEN || []).map(
                    (note, idx) => (
                      <View key={idx} style={[s.noteRow, isRTL && { flexDirection: "row-reverse" }]}>
                        <View style={s.noteBullet} />
                        <Text
                          style={[s.noteText, isRTL && s.textRTL, { color: tc.darkGray }]}
                        >
                          {note}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              </Animated.View>
            )}

            {/* Tips */}
            {result.tipsEN?.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(500)}
                style={s.section}
              >
                <Text style={[s.sectionTitle, isRTL && s.textRTL, { color: tc.charcoal }]}>
                  💡 {copy.tips}
                </Text>
                <View style={[s.tipsCard, { borderColor: "#FBBF24" }]}>
                  {(lang === "ku" ? result.tipsKU : result.tipsEN || []).map(
                    (tip, idx) => (
                      <View key={idx} style={[s.noteRow, isRTL && { flexDirection: "row-reverse" }]}>
                        <Text style={s.tipBullet}>💰</Text>
                        <Text
                          style={[s.noteText, isRTL && s.textRTL, { color: "#92400E" }]}
                        >
                          {tip}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              </Animated.View>
            )}

            {/* Action Buttons */}
            <View style={[s.section, { gap: spacing.md }]}>
              {onAddToProject && (
                <TouchableOpacity
                  style={[s.addAllBtn, { backgroundColor: colors.accent }]}
                  onPress={() => {
                    const items = [];
                    (result.phases || []).forEach(phase => {
                      (phase.items || []).forEach(item => {
                        const mat = getMaterialById(item.materialId);
                        if (mat) {
                          const qty = Math.ceil(item.quantity);
                          const existing = items.find(i => i.id === mat.id);
                          if (existing) {
                            existing.qty += qty;
                          } else {
                            items.push({ id: mat.id, name: mat.nameEN, nameKU: mat.nameKU, qty, unitPrice: mat.basePrice, unit: mat.unit });
                          }
                        }
                      });
                    });
                    const src = lang === 'ku' ? 'ئەندازیاری AI' : 'AI Architect';
                    onAddToProject(items, src);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={s.addAllBtnIcon}>📁</Text>
                  <Text style={s.addAllBtnText}>{lang === 'ku' ? 'زیادکردن بۆ پ\u0631ۆژە' : 'Add to Project'}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[s.newEstimateBtn, { borderColor: tc.cardBorder }]}
                onPress={() => {
                  setShowResultDetail(false);
                  setResult(null);
                  setUserInput("");
                  setQualityTier(null);
                  setAddedToList(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={[s.newEstimateBtnText, { color: tc.charcoal }]}>
                  ✨ {copy.tryAgain}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* ─── Added to List Modal ─── */}
      {addedToList && addedItems.length > 0 && (
        <Modal
          visible={addedToList}
          transparent
          animationType="slide"
          onRequestClose={() => setAddedToList(false)}
        >
          <View style={aiS.modalOverlay}>
            <TouchableOpacity style={aiS.modalBackdrop} activeOpacity={1} onPress={() => setAddedToList(false)} />
            <Animated.View entering={FadeInDown.duration(300)} style={[aiS.addedModal, { backgroundColor: tc.card }]}>
              {/* Header */}
              <View style={[aiS.addedHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={aiS.checkCircle}>
                  <Text style={{ fontSize: 22 }}>✅</Text>
                </View>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={[aiS.addedTitle, isRTL && { textAlign: 'right' }, { color: tc.charcoal }]}>
                    {lang === 'ku' ? 'زیادکرا بۆ لیست' : 'Added to List'}
                  </Text>
                  <Text style={[aiS.addedSub, isRTL && { textAlign: 'right' }, { color: tc.mediumGray }]} numberOfLines={1}>
                    {addedListName}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setAddedToList(false)} style={aiS.closeBtn}>
                  <Text style={[aiS.closeBtnText, { color: tc.mediumGray }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Items List */}
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {addedItems.map((item, idx) => (
                  <View key={item.id + idx} style={[aiS.listItem, isRTL && { flexDirection: 'row-reverse' }, { borderBottomColor: tc.cardBorder }]}>
                    <View style={[aiS.itemNum, { backgroundColor: colors.accent }]}>
                      <Text style={aiS.itemNumText}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <Text style={[aiS.itemName, isRTL && { textAlign: 'right' }, { color: tc.charcoal }]} numberOfLines={2}>
                        {lang === 'ku' ? (item.nameKU || item.nameEN) : item.nameEN}
                      </Text>
                    </View>
                    <View style={[aiS.itemRight, isRTL && { alignItems: 'flex-start' }]}>
                      <Text style={[aiS.itemQty, { color: colors.accent }]}>×{item.qty}</Text>
                      <Text style={[aiS.itemCost, { color: tc.mediumGray }]}>${Math.round(item.basePrice * item.qty).toLocaleString()}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Divider + Go to Store */}
              <TouchableOpacity
                style={[aiS.goToStoreBtn, { borderTopColor: tc.cardBorder }]}
                onPress={() => { setAddedToList(false); onViewStore?.(); }}
                activeOpacity={0.85}
              >
                <Text style={aiS.goToStoreBtnIcon}>🛒</Text>
                <Text style={[aiS.goToStoreBtnText, isRTL && { marginRight: 8, marginLeft: 0 }]}>
                  {lang === 'ku' ? 'بۜۆ بۆ کۆگا و لیست' : 'Go to Store & List'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      )}
    </Animated.View>
  );
}

const { width: SCREEN_W } = Dimensions.get("window");

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 40 : 0,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl * 1.5,
    borderBottomRightRadius: radius.xl * 1.5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  headerRowRTL: { flexDirection: "row-reverse" },
  backBtn: { padding: spacing.sm },
  backBtnText: { fontSize: 24, color: "#FFF", fontWeight: "700" },
  headerTitle: {
    ...typography.hero,
    color: "#FFF",
    fontSize: 22,
  },
  headerSubtitle: {
    ...typography.caption,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconText: { fontSize: 24 },
  textRTL: { textAlign: "right" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxxl * 2 },
  section: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.body,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  presetsRow: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
  },
  presetCard: {
    width: 130,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.card,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  presetIcon: { fontSize: 32, marginBottom: spacing.sm },
  presetLabel: {
    ...typography.caption,
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "600",
  },
  inputContainer: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.card,
    minHeight: 140,
  },
  textInput: {
    ...typography.body,
    minHeight: 100,
    lineHeight: 22,
    paddingTop: 0,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: spacing.sm,
  },
  charCount: { ...typography.tiny },
  clearInput: { fontSize: 16, padding: spacing.xs },
  generateBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radius.full,
    ...shadows.cardLifted,
    width: "100%",
    alignItems: "center",
  },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnText: {
    ...typography.subtitle,
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  generateBtnIcon: { fontSize: 18, marginRight: spacing.sm },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  errorBox: {
    backgroundColor: "#FFF5F5",
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: "#FEB2B2",
  },
  errorText: { ...typography.subtitle, color: "#C53030", marginBottom: spacing.sm },
  errorDetail: { ...typography.caption, marginBottom: spacing.md },
  retryBtn: {
    backgroundColor: "#C53030",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  retryBtnText: { ...typography.caption, color: "#FFF", fontWeight: "700" },
  loadingContainer: {
    alignItems: "center",
    marginTop: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  loadingPulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(212,168,67,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  loadingEmoji: { fontSize: 40 },
  loadingLabel: {
    ...typography.subtitle,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  loadingDots: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // ── Results ──
  summaryCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    borderRadius: radius.xl * 1.2,
    padding: spacing.xl,
    ...shadows.cardLifted,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  summaryTitle: {
    ...typography.hero,
    color: "#FFF",
    fontSize: 20,
    lineHeight: 26,
  },
  summaryDesc: {
    ...typography.body,
    color: "rgba(255,255,255,0.7)",
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  summaryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.md,
  },
  summaryIconText: { fontSize: 28 },
  statsRow: {
    flexDirection: "row",
    marginTop: spacing.xl,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  statItem: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  statValue: {
    ...typography.title,
    color: "#FFF",
    fontWeight: "800",
    fontSize: 17,
  },
  statLabel: {
    ...typography.tiny,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: spacing.sm,
  },
  costBanner: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FBBF24",
    alignItems: "center",
  },
  costLabel: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  costValue: {
    ...typography.hero,
    color: "#92400E",
    fontSize: 22,
  },
  phaseCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadows.card,
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
  },
  phaseNum: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseNumText: {
    ...typography.caption,
    color: "#FFF",
    fontWeight: "800",
  },
  phaseName: {
    ...typography.subtitle,
    fontWeight: "700",
  },
  phaseItemCount: {
    ...typography.tiny,
    marginTop: 2,
  },
  phaseChevron: {
    fontSize: 12,
    fontWeight: "600",
  },
  materialRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    alignItems: "center",
  },
  materialName: {
    ...typography.caption,
    fontWeight: "700",
    marginBottom: 2,
  },
  materialNote: {
    ...typography.tiny,
    lineHeight: 15,
  },
  materialQtyCol: {
    alignItems: "flex-end",
    minWidth: 70,
    marginLeft: spacing.sm,
  },
  materialQty: {
    ...typography.subtitle,
    fontWeight: "800",
  },
  materialUnit: {
    ...typography.tiny,
    marginTop: 1,
  },
  materialCost: {
    ...typography.caption,
    fontWeight: "700",
    marginTop: 2,
  },
  addPhaseBtn: {
    backgroundColor: "rgba(212,168,67,0.12)",
    margin: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  addPhaseBtnText: {
    ...typography.caption,
    color: colors.accentDark,
    fontWeight: "700",
  },
  notesCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    ...shadows.card,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  noteBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 6,
  },
  noteText: {
    ...typography.body,
    flex: 1,
    lineHeight: 20,
  },
  tipsCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
  },
  tipBullet: {
    fontSize: 14,
    marginTop: 1,
  },
  addAllBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: radius.full,
    ...shadows.cardLifted,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  addAllBtnIcon: { fontSize: 18 },
  addAllBtnText: {
    ...typography.subtitle,
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  newEstimateBtn: {
    paddingVertical: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
  },
  newEstimateBtnText: {
    ...typography.subtitle,
    fontWeight: "700",
  },
  // ── Quality Tier ──
  tierRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tierCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: "center",
    gap: 4,
  },
  tierIcon: { fontSize: 22 },
  tierLabel: {
    ...typography.subtitle,
    fontWeight: "700",
    fontSize: 13,
  },
  tierDesc: {
    ...typography.tiny,
    fontSize: 10,
  },
  tierBadge: {
    marginTop: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  tierBadgeText: {
    ...typography.caption,
    color: "#FFF",
    fontWeight: "700",
    fontSize: 11,
  },
  // ── Bottom Success Card ──
  bottomSuccessCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderTopWidth: 1,
    ...shadows.bottomBar,
  },
  bottomSuccessRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bottomSuccessCheck: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(34,197,94,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSuccessTitle: {
    ...typography.subtitle,
    fontWeight: "700",
  },
  bottomSuccessSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  bottomSuccessBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
  },
  bottomSuccessBtnText: {
    ...typography.caption,
    color: "#FFF",
    fontWeight: "700",
  },
  // ── Timeline Cash Flow ──
  timelineCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    ...shadows.card,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 60,
  },
  timelineLineContainer: {
    width: 20,
    alignItems: "center",
    marginRight: spacing.md,
    marginLeft: spacing.xs,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  timelineLine: {
    width: 2,
    marginTop: 4,
    marginBottom: -6,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  timelineContentRTL: {
    marginRight: spacing.md,
    marginLeft: 0,
    alignItems: "flex-end",
  },
  timelinePhaseName: {
    ...typography.subtitle,
    fontWeight: "700",
    marginBottom: 4,
  },
  timelineDuration: {
    ...typography.tiny,
    marginBottom: 2,
  },
  timelineCost: {
    ...typography.caption,
    fontWeight: "800",
  },
});

// Modal styles for Added Items
const aiS = StyleSheet.create({
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  addedModal: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 24, paddingHorizontal: 20, paddingBottom: 40,
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20,
    maxHeight: '85%',
  },
  addedHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
  },
  checkCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(34,197,94,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  addedTitle: { fontSize: 17, fontWeight: '700' },
  addedSub: { fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 8 },
  closeBtnText: { fontSize: 18, fontWeight: '700' },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemNum: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  itemNumText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  itemName: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  itemRight: { alignItems: 'flex-end', minWidth: 60 },
  itemQty: { fontSize: 14, fontWeight: '700' },
  itemCost: { fontSize: 12, marginTop: 2 },
  goToStoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingTop: 16, marginTop: 8, borderTopWidth: 1, gap: 10,
  },
  goToStoreBtnIcon: { fontSize: 22 },
  goToStoreBtnText: { fontSize: 16, fontWeight: '700', color: colors.accent, marginLeft: 8 },
});
