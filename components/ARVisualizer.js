import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideInLeft,
  Layout,
} from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { useExchangeRate } from "../contexts/ExchangeRateContext";
import { colors, darkColors, spacing, typography, radius, shadows } from "../styles/theme";
import materialsData from "../data/materials";

const GEMINI_API_KEY = "AIzaSyBgyFGItAFQga77pHUgfmsB843IkL8lnDc";
const GEMINI_MODELS = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

function arDelay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════
// Material palette for AR visualization
// ═══════════════════════════════════════════════════════════════════
const MATERIAL_PALETTES = [
  {
    id: "tiles_ceramic",
    materialIds: [19],
    icon: "🔲",
    nameEN: "Ceramic Tiles",
    nameKU: "کاشی سرامیکی",
    categoryEN: "Floor",
    categoryKU: "زەوی",
    previewColors: ["#E8D5B7", "#C4A882", "#F5F0E8", "#8B7355"],
    patterns: ["grid", "herringbone", "diagonal"],
  },
  {
    id: "tiles_porcelain",
    materialIds: [20],
    icon: "✨",
    nameEN: "Porcelain Tiles",
    nameKU: "کاشی پۆرسلین",
    categoryEN: "Floor",
    categoryKU: "زەوی",
    previewColors: ["#F0EDE8", "#D4CBC0", "#FFFFFF", "#B8AFA6"],
    patterns: ["grid", "large-format"],
  },
  {
    id: "marble",
    materialIds: [21],
    icon: "💎",
    nameEN: "Marble",
    nameKU: "مەڕمەڕ",
    categoryEN: "Floor / Wall",
    categoryKU: "زەوی / دیوار",
    previewColors: ["#F5F2EE", "#E8E0D4", "#DDD8D0", "#C8BFB4"],
    patterns: ["veined", "polished"],
  },
  {
    id: "granite",
    materialIds: [22],
    icon: "🪨",
    nameEN: "Granite",
    nameKU: "گرانیت",
    categoryEN: "Counter / Floor",
    categoryKU: "ئمەیدە / زەوی",
    previewColors: ["#2C2C2C", "#444444", "#1A1A1A", "#555555"],
    patterns: ["speckled", "polished"],
  },
  {
    id: "travertine",
    materialIds: [23],
    icon: "🏛️",
    nameEN: "Travertine",
    nameKU: "تراڤەرتین",
    categoryEN: "Wall / Floor",
    categoryKU: "دیوار / زەوی",
    previewColors: ["#E8DCC8", "#D4C8B0", "#F0E8D8", "#C4B898"],
    patterns: ["natural", "filled"],
  },
  {
    id: "paint_warm",
    materialIds: [25],
    icon: "🎨",
    nameEN: "Warm Paint",
    nameKU: "بۆیەی گەرم",
    categoryEN: "Wall",
    categoryKU: "دیوار",
    previewColors: ["#FFF8DC", "#F5E6C8", "#FAEBD7", "#FFE4B5"],
    patterns: ["solid", "textured"],
  },
  {
    id: "paint_cool",
    materialIds: [25],
    icon: "🖌️",
    nameEN: "Cool Paint",
    nameKU: "بۆیەی سارد",
    categoryEN: "Wall",
    categoryKU: "دیوار",
    previewColors: ["#E8F4FD", "#D0E8F8", "#B8D4F0", "#A0C8E8"],
    patterns: ["solid", "textured"],
  },
  {
    id: "paint_neutral",
    materialIds: [25],
    icon: "🏠",
    nameEN: "Neutral Paint",
    nameKU: "بۆیەی ئاسایی",
    categoryEN: "Wall",
    categoryKU: "دیوار",
    previewColors: ["#F5F5F0", "#E8E4DC", "#DDD8CE", "#C8C0B4"],
    patterns: ["solid", "textured"],
  },
  {
    id: "gypsum_board",
    materialIds: [24],
    icon: "📐",
    nameEN: "Gypsum Board",
    nameKU: "تەختەی جەبس",
    categoryEN: "Ceiling",
    categoryKU: "بەرزایی",
    previewColors: ["#FAFAFA", "#F0F0F0", "#FFFFFF", "#E8E8E8"],
    patterns: ["flat", "coffered"],
  },
  {
    id: "red_brick",
    materialIds: [11],
    icon: "🧱",
    nameEN: "Red Brick",
    nameKU: "خشتی سوور",
    categoryEN: "Wall",
    categoryKU: "دیوار",
    previewColors: ["#B5462A", "#C25634", "#9E3B22", "#D46840"],
    patterns: ["running-bond", "stack-bond"],
  },
];

export default function ARVisualizer({ onBack, onAddToStore }) {
  const { t, lang, isRTL } = useLanguage();
  const { isDark } = useTheme();
  const { rate } = useExchangeRate();
  const tc = isDark ? darkColors : colors;

  // States
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [roomAnalysis, setRoomAnalysis] = useState(null);
  const [selectedPalette, setSelectedPalette] = useState(null);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState(0);
  const [overlayOpacity, setOverlayOpacity] = useState(0.55);
  const [showMaterialInfo, setShowMaterialInfo] = useState(false);
  const [estimatedArea, setEstimatedArea] = useState(null);
  const [showSourcePicker, setShowSourcePicker] = useState(true);
  const [showAddedModal, setShowAddedModal] = useState(false);
  const [addedItem, setAddedItem] = useState(null);
  const webVideoRef = useRef(null);
  const webStreamRef = useRef(null);
  const [webCameraActive, setWebCameraActive] = useState(false);

  const copy = useMemo(
    () =>
      lang === "ku"
        ? {
          title: "بینەری AR",
          subtitle: "مادەکان لەسەر ژوورەکەت ببینە پێش کڕین",
          takePhoto: "وێنە بگرە",
          fromGallery: "لە گالێری",
          camera: "کامێرا",
          analyzing: "شیکردنەوەی ژوور...",
          chooseMatLabel: "مادەیەک هەڵبژێرە",
          chooseColor: "ڕەنگ هەڵبژێرە",
          pattern: "شێواز",
          opacity: "شەفافیەت",
          roomInfo: "زانیاری ژوور",
          wallArea: "ڕووبەری دیوار",
          floorArea: "ڕووبەری زەوی",
          ceilingHeight: "بەرزایی بەرزایی",
          estimated: "خەمڵاندراو",
          costEstimate: "خەمڵاندنی تێچوو",
          materialNeeded: "مادەی پێویست",
          totalCost: "کۆی تێچوو",
          addToStore: "زیادکردن بۆ لیست",
          retake: "وێنەی نوێ",
          materialDetails: "وردەکاری مادە",
          permissionTitle: "ڕێگەپێدان پێویستە",
          permissionBody: "تکایە ڕێگە بدە بە کامێرا",
          surfaceType: "جۆری ڕوو",
          wall: "دیوار",
          floor: "زەوی",
          ceiling: "بەرزایی",
          select: "هەڵبژێرە",
          close: "داخستن",
          tip: "ئامۆژگاری: وێنەی ڕووەکانی ژوورەکەت بگرە بۆ بینەرێکی باشتر",
        }
        : {
          title: "AR Visualizer",
          subtitle: "See materials on YOUR room before buying",
          takePhoto: "Take Photo",
          fromGallery: "From Gallery",
          camera: "Camera",
          analyzing: "Analyzing room...",
          chooseMatLabel: "Choose Material",
          chooseColor: "Choose Color",
          pattern: "Pattern",
          opacity: "Opacity",
          roomInfo: "Room Info",
          wallArea: "Wall Area",
          floorArea: "Floor Area",
          ceilingHeight: "Ceiling Height",
          estimated: "Estimated",
          costEstimate: "Cost Estimate",
          materialNeeded: "Material Needed",
          totalCost: "Total Cost",
          addToStore: "Add to List",
          retake: "New Photo",
          materialDetails: "Material Details",
          permissionTitle: "Permission Required",
          permissionBody: "Please allow camera access",
          surfaceType: "Surface",
          wall: "Wall",
          floor: "Floor",
          ceiling: "Ceiling",
          select: "Select",
          close: "Close",
          tip: "Tip: Take a photo of your room surfaces for best visualization",
        },
    [lang]
  );

  // ─── Web Camera Handling ───
  const startWebCamera = useCallback(async () => {
    if (Platform.OS !== "web") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      webStreamRef.current = stream;
      setWebCameraActive(true);
      setShowSourcePicker(false);
      setTimeout(() => {
        if (webVideoRef.current) {
          webVideoRef.current.srcObject = stream;
          webVideoRef.current.play?.().catch(() => { });
        }
      }, 100);
    } catch (err) {
      console.error("Web camera error:", err);
      Alert.alert(copy.permissionTitle, copy.permissionBody);
    }
  }, [copy]);

  const stopWebCamera = useCallback(() => {
    if (webStreamRef.current) {
      webStreamRef.current.getTracks().forEach((tr) => tr.stop());
      webStreamRef.current = null;
    }
    if (webVideoRef.current) {
      webVideoRef.current.srcObject = null;
    }
    setWebCameraActive(false);
  }, []);

  const captureWebFrame = useCallback(async () => {
    if (Platform.OS !== "web" || !webVideoRef.current) return;
    const video = webVideoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopWebCamera();
    setCapturedImage(dataUrl);
    setCapturedImageBase64(dataUrl.split(",")[1] || "");
    analyzeRoom(dataUrl.split(",")[1] || "");
  }, [stopWebCamera]);

  const pickWebImage = useCallback((source) => {
    if (Platform.OS !== "web") return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      if (typeof document === "undefined") {
        reject(new Error("No document"));
        return;
      }
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      if (source === "camera") input.setAttribute("capture", "environment");
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result || "");
          const parts = dataUrl.split(",");
          resolve({ uri: URL.createObjectURL(file), base64: parts[1] || "" });
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }, []);

  // ─── Camera / Gallery for Native ───
  const openCamera = useCallback(async () => {
    try {
      setShowSourcePicker(false);
      if (Platform.OS === "web") {
        if (navigator?.mediaDevices?.getUserMedia) {
          await startWebCamera();
        } else {
          const asset = await pickWebImage("camera");
          if (asset) {
            setCapturedImage(asset.uri);
            setCapturedImageBase64(asset.base64);
            analyzeRoom(asset.base64);
          }
        }
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(copy.permissionTitle, copy.permissionBody);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setCapturedImage(asset.uri);
        setCapturedImageBase64(asset.base64);
        analyzeRoom(asset.base64);
      }
    } catch (err) {
      console.error("Camera error:", err);
      Alert.alert("Error", err.message);
    }
  }, [copy, startWebCamera, pickWebImage]);

  const openGallery = useCallback(async () => {
    try {
      setShowSourcePicker(false);
      if (Platform.OS === "web") {
        const asset = await pickWebImage("file");
        if (asset) {
          setCapturedImage(asset.uri);
          setCapturedImageBase64(asset.base64);
          analyzeRoom(asset.base64);
        }
        return;
      }

      const libStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (libStatus.status !== "granted") {
        Alert.alert(copy.permissionTitle, copy.permissionBody);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setCapturedImage(asset.uri);
        setCapturedImageBase64(asset.base64);
        analyzeRoom(asset.base64);
      }
    } catch (err) {
      console.error("Gallery error:", err);
      Alert.alert("Error", err.message);
    }
  }, [copy, pickWebImage]);

  // ─── AI Room Analysis ───
  const analyzeRoom = useCallback(async (base64) => {
    setIsAnalyzing(true);
    setRoomAnalysis(null);

    const promptText = `You are an expert interior designer and construction estimator. Analyze this room photo.

TASK: Identify the room's surfaces (walls, floor, ceiling) and estimate their approximate areas.

Return ONLY valid JSON:
{
  "roomType": "living room",
  "roomTypeKU": "ژووری دانیشتن",
  "estimatedWallAreaM2": 45,
  "estimatedFloorAreaM2": 20,
  "estimatedCeilingHeightM": 2.8,
  "dominantSurface": "wall",
  "currentWallColor": "#E8E0D0",
  "currentFloorType": "tiles",
  "lightingCondition": "well-lit",
  "suggestionsEN": ["Marble flooring would add elegance", "Warm paint tones suit this room's light"],
  "suggestionsKU": ["کاشی مەڕمەڕ جوانی زیاد دەکات", "بۆیەی گەرم گونجاوە بۆ ڕووناکی ئەم ژوورە"],
  "surfaceBreakdown": {
    "wallPercentage": 55,
    "floorPercentage": 30,
    "ceilingPercentage": 15
  }
}`;

    let lastError = null;
    for (const model of GEMINI_MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) await arDelay(2500);
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }, { inlineData: { mimeType: "image/jpeg", data: base64 } }] }],
                generationConfig: { temperature: 0.15, maxOutputTokens: 600, responseMimeType: "application/json" },
              }),
            }
          );
          if (response.status === 429) {
            lastError = new Error("Rate limited");
            await arDelay(3000);
            continue;
          }
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (!text) throw new Error("Empty response");
          const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
          let parsed;
          try { parsed = JSON.parse(cleaned); } catch {
            const match = cleaned.match(/\{[\s\S]*\}/);
            if (match) parsed = JSON.parse(match[0]);
            else throw new Error("Parse failed");
          }
          setRoomAnalysis(parsed);
          setEstimatedArea(parsed.estimatedWallAreaM2 || 20);
          setIsAnalyzing(false);
          return;
        } catch (err) {
          lastError = err;
          console.warn(`[ARVisualizer] ${model} attempt ${attempt + 1} failed:`, err.message);
        }
      }
    }

    // Fallback values if all models fail
    console.error("Room analysis all models failed:", lastError);
    setRoomAnalysis({
      roomType: "room", roomTypeKU: "ژوور",
      estimatedWallAreaM2: 30, estimatedFloorAreaM2: 15, estimatedCeilingHeightM: 2.7,
      dominantSurface: "wall", currentWallColor: "#E8E0D0", currentFloorType: "unknown",
      lightingCondition: "normal",
      suggestionsEN: ["Try different materials to see what suits your space"],
      suggestionsKU: ["مادە جیاوازەکان تاقی بکەرەوە بۆ بینینی گونجاوترین"],
      surfaceBreakdown: { wallPercentage: 55, floorPercentage: 30, ceilingPercentage: 15 },
    });
    setEstimatedArea(30);
    setIsAnalyzing(false);
  }, []);

  // ─── Cost Calculations ───
  const costEstimate = useMemo(() => {
    if (!selectedPalette || !estimatedArea) return null;
    const matId = selectedPalette.materialIds[0];
    const mat = materialsData.find((m) => m.id === matId);
    if (!mat) return null;

    const wasteFactor = 1.1;
    const quantity = Math.ceil(estimatedArea * wasteFactor);
    const costUSD = mat.basePrice * quantity;
    const costIQD = rate ? Math.round(costUSD * rate) : null;

    return { mat, quantity, costUSD, costIQD, unit: mat.unit };
  }, [selectedPalette, estimatedArea, rate]);

  const handleAddToStore = useCallback(async () => {
    if (!selectedPalette || !costEstimate) return;
    try {
      const existing = await AsyncStorage.getItem('costMaterialSavedLists');
      const lists = existing ? JSON.parse(existing) : [];
      const mat = costEstimate.mat;
      const qty = costEstimate.quantity;
      const listItem = { id: mat.id, qty, nameEN: mat.nameEN, nameKU: mat.nameKU, basePrice: mat.basePrice };
      lists.unshift({
        id: Date.now().toString(),
        name: lang === "ku" ? (selectedPalette.nameKU || selectedPalette.nameEN) : selectedPalette.nameEN,
        date: new Date().toISOString(),
        items: [listItem],
        totalCost: mat.basePrice * qty,
      });
      await AsyncStorage.setItem('costMaterialSavedLists', JSON.stringify(lists));
    } catch (e) { console.error('AR add to list error', e); }
    setAddedItem(costEstimate);
    setShowAddedModal(true);
    onAddToStore?.({ [costEstimate.mat.id]: costEstimate.quantity });
  }, [selectedPalette, costEstimate, onAddToStore, lang]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setCapturedImageBase64(null);
    setRoomAnalysis(null);
    setSelectedPalette(null);
    setSelectedColorIdx(0);
    setSelectedPattern(0);
    setShowSourcePicker(true);
    stopWebCamera();
  }, [stopWebCamera]);

  // ─── Pattern Renderer (CSS-based overlay with real patterns) ───
  const renderOverlay = useMemo(() => {
    if (!selectedPalette) return null;

    const color = selectedPalette.previewColors[selectedColorIdx] || selectedPalette.previewColors[0];
    const color2 = selectedPalette.previewColors[(selectedColorIdx + 1) % selectedPalette.previewColors.length];
    const patterns = selectedPalette.patterns || ["solid"];
    const pattern = patterns[selectedPattern % patterns.length];
    const id = selectedPalette.id;

    const baseStyle = {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: overlayOpacity,
      ...(Platform.OS === 'web' && { mixBlendMode: 'multiply' })
    };

    // For web: use CSS background patterns for realistic material look
    if (Platform.OS === "web") {
      let backgroundCSS = "";
      const grout = "rgba(120,110,100,0.6)";

      if (id.startsWith("tiles_") || id === "travertine") {
        // Tile grid pattern
        const size = pattern === "large-format" ? 80 : pattern === "diagonal" ? 50 : 40;
        backgroundCSS = `
          linear-gradient(${grout} 2px, transparent 2px),
          linear-gradient(90deg, ${grout} 2px, transparent 2px),
          linear-gradient(${color} 0%, ${color2} 100%)
        `;
        return (
          <View style={baseStyle}>
            <div style={{
              width: "100%", height: "100%",
              background: backgroundCSS,
              backgroundSize: `${size}px ${size}px, ${size}px ${size}px, 100% 100%`,
              transform: pattern === "diagonal" ? "rotate(45deg) scale(1.5)" : pattern === "herringbone" ? "skewY(-5deg)" : "none",
            }} />
          </View>
        );
      }

      if (id === "marble") {
        backgroundCSS = `
          repeating-linear-gradient(${pattern === "veined" ? "135deg" : "160deg"},
            transparent, transparent 30px,
            rgba(180,170,160,0.25) 30px, rgba(180,170,160,0.25) 32px,
            transparent 32px, transparent 60px,
            rgba(160,150,140,0.18) 60px, rgba(160,150,140,0.18) 61px
          ),
          repeating-linear-gradient(${pattern === "veined" ? "70deg" : "40deg"},
            transparent, transparent 80px,
            rgba(170,160,150,0.15) 80px, rgba(170,160,150,0.15) 82px
          ),
          linear-gradient(180deg, ${color} 0%, ${color2} 100%)
        `;
        return (
          <View style={baseStyle}>
            <div style={{ width: "100%", height: "100%", background: backgroundCSS, backgroundSize: "100% 100%" }} />
          </View>
        );
      }

      if (id === "granite") {
        backgroundCSS = `
          radial-gradient(circle 2px, rgba(255,255,255,0.2) 1px, transparent 1px),
          radial-gradient(circle 1px, rgba(200,200,200,0.15) 1px, transparent 1px),
          radial-gradient(circle 3px, rgba(100,100,100,0.1) 1px, transparent 2px),
          linear-gradient(${color} 0%, ${color2} 100%)
        `;
        return (
          <View style={baseStyle}>
            <div style={{
              width: "100%", height: "100%", background: backgroundCSS,
              backgroundSize: "12px 12px, 8px 8px, 20px 20px, 100% 100%",
              backgroundPosition: "0 0, 4px 4px, 6px 6px, 0 0",
            }} />
          </View>
        );
      }

      if (id === "red_brick") {
        const brickW = 60, brickH = 25;
        const mortar = "rgba(180,170,155,0.8)";
        backgroundCSS = `
          linear-gradient(${mortar} 3px, transparent 3px),
          linear-gradient(90deg, ${mortar} 3px, transparent 3px),
          linear-gradient(${color} 0%, ${color2} 50%, ${color} 100%)
        `;
        const offset = pattern === "stack-bond" ? "0px" : `${brickW / 2}px`;
        return (
          <View style={baseStyle}>
            <div style={{
              width: "100%", height: "100%",
              background: backgroundCSS,
              backgroundSize: `${brickW}px ${brickH}px, ${brickW}px ${brickH}px, ${brickW}px ${brickH}px`,
            }} />
          </View>
        );
      }

      if (id === "gypsum_board") {
        backgroundCSS = `
          linear-gradient(rgba(200,200,200,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200,200,200,0.1) 1px, transparent 1px),
          linear-gradient(180deg, ${color} 0%, ${color2} 100%)
        `;
        return (
          <View style={baseStyle}>
            <div style={{
              width: "100%", height: "100%", background: backgroundCSS,
              backgroundSize: "120px 120px, 120px 120px, 100% 100%",
            }} />
          </View>
        );
      }

      // Paint (solid / textured)
      if (pattern === "textured") {
        backgroundCSS = `
          repeating-linear-gradient(45deg,
            transparent, transparent 4px,
            rgba(0,0,0,0.02) 4px, rgba(0,0,0,0.02) 5px
          ),
          repeating-linear-gradient(-45deg,
            transparent, transparent 6px,
            rgba(255,255,255,0.03) 6px, rgba(255,255,255,0.03) 7px
          ),
          linear-gradient(180deg, ${color} 0%, ${color2} 100%)
        `;
        return (
          <View style={baseStyle}>
            <div style={{ width: "100%", height: "100%", background: backgroundCSS, backgroundSize: "100% 100%" }} />
          </View>
        );
      }

      // Default solid paint
      return <View style={{ ...baseStyle, backgroundColor: color }} />;
    }

    // For native: simple color overlay (best we can do without canvas)
    return <View style={{ ...baseStyle, backgroundColor: color }} />;
  }, [selectedPalette, selectedColorIdx, selectedPattern, overlayOpacity]);

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  // ─── Source Picker Screen ───
  if (showSourcePicker && !capturedImage) {
    return (
      <Animated.View
        style={[s.container, { backgroundColor: tc.offWhite }]}
        entering={FadeIn.duration(350)}
      >
        <StatusBar barStyle="light-content" backgroundColor={tc.primary} />
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
                <Text style={s.headerIconText}>🥽</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>

        <ScrollView contentContainerStyle={s.sourcePickerContent} showsVerticalScrollIndicator={false}>
          {/* Camera illustration */}
          <Animated.View entering={FadeInDown.duration(500).delay(100)} style={s.illustrationWrap}>
            <View style={s.illustrationCircle}>
              <Text style={s.illustrationEmoji}>📸</Text>
            </View>
            <Text style={[s.sourceTitle, isRTL && s.textRTL, { color: tc.charcoal }]}>
              {copy.title}
            </Text>
            <Text style={[s.sourceSubtitle, isRTL && s.textRTL, { color: tc.mediumGray }]}>
              {copy.subtitle}
            </Text>
          </Animated.View>

          {/* Source Buttons */}
          <Animated.View entering={FadeInDown.duration(500).delay(250)}>
            <TouchableOpacity
              style={[s.sourceBtn, s.sourceBtnPrimary]}
              onPress={openCamera}
              activeOpacity={0.85}
            >
              <Text style={s.sourceBtnPrimaryIcon}>📷</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.sourceBtnPrimaryText, isRTL && s.textRTL]}>{copy.camera}</Text>
                <Text style={[s.sourceBtnPrimarySub, isRTL && s.textRTL]}>
                  {lang === "ku" ? "وێنەی ژوورەکەت بگرە" : "Capture your room"}
                </Text>
              </View>
              <Text style={s.sourceBtnArrow}>{isRTL ? "◀" : "▶"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.sourceBtn, s.sourceBtnSecondary, { borderColor: tc.cardBorder }]}
              onPress={openGallery}
              activeOpacity={0.85}
            >
              <Text style={s.sourceBtnSecondaryIcon}>🖼️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.sourceBtnSecondaryText, isRTL && s.textRTL, { color: tc.charcoal }]}>
                  {copy.fromGallery}
                </Text>
                <Text style={[s.sourceBtnSecondarySub, isRTL && s.textRTL, { color: tc.mediumGray }]}>
                  {lang === "ku" ? "وێنەیەکی ئامادەکراو هەڵبژێرە" : "Choose an existing photo"}
                </Text>
              </View>
              <Text style={[s.sourceBtnArrow, { color: tc.mediumGray }]}>{isRTL ? "◀" : "▶"}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Tip */}
          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={s.tipBox}>
            <Text style={s.tipIcon}>💡</Text>
            <Text style={[s.tipText, isRTL && s.textRTL]}>{copy.tip}</Text>
          </Animated.View>

          {/* Material Preview Grid */}
          <Animated.View entering={FadeInDown.duration(500).delay(500)} style={s.previewSection}>
            <Text style={[s.previewSectionTitle, isRTL && s.textRTL, { color: tc.charcoal }]}>
              {lang === "ku" ? "مادە بەردەستەکان" : "Available Materials"}
            </Text>
            <View style={s.previewGrid}>
              {MATERIAL_PALETTES.slice(0, 6).map((pal) => (
                <View key={pal.id} style={s.previewItem}>
                  <View style={[s.previewSwatchWrap, { borderColor: tc.cardBorder }]}>
                    {pal.previewColors.map((c, i) => (
                      <View
                        key={i}
                        style={[s.previewSwatchQuad, { backgroundColor: c }]}
                      />
                    ))}
                  </View>
                  <Text style={[s.previewItemLabel, { color: tc.darkGray }]} numberOfLines={1}>
                    {lang === "ku" ? pal.nameKU : pal.nameEN}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    );
  }

  // ─── Web Camera Viewfinder ───
  if (webCameraActive) {
    return (
      <Animated.View style={[s.container, { backgroundColor: "#000" }]} entering={FadeIn.duration(300)}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={s.webCameraContainer}>
          <video
            ref={webVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <View style={s.webCameraOverlay}>
            <View style={s.webCameraFrame}>
              <View style={[s.webCameraCorner, s.webCameraCornerTL]} />
              <View style={[s.webCameraCorner, s.webCameraCornerTR]} />
              <View style={[s.webCameraCorner, s.webCameraCornerBL]} />
              <View style={[s.webCameraCorner, s.webCameraCornerBR]} />
            </View>
            <Text style={s.webCameraHint}>
              {lang === "ku" ? "ژوورەکەت ببینەرە و وێنەی بگرە" : "Frame your room and capture"}
            </Text>
          </View>
          <View style={s.webCameraActions}>
            <TouchableOpacity
              style={s.webCameraCancelBtn}
              onPress={() => { stopWebCamera(); setShowSourcePicker(true); }}
              activeOpacity={0.85}
            >
              <Text style={s.webCameraCancelText}>{copy.close}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.webCameraCaptureBtn}
              onPress={captureWebFrame}
              activeOpacity={0.85}
            >
              <View style={s.webCameraCaptureDot} />
            </TouchableOpacity>
            <View style={{ width: 60 }} />
          </View>
        </View>
      </Animated.View>
    );
  }

  // ─── AR Editor Screen ───
  return (
    <Animated.View
      style={[s.container, { backgroundColor: tc.offWhite }]}
      entering={FadeIn.duration(350)}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Image with Overlay */}
      <View style={s.arViewport}>
        {capturedImage && (
          <Image
            source={{ uri: capturedImage }}
            style={s.arImage}
            resizeMode="cover"
          />
        )}

        {/* Material Overlay */}
        {selectedPalette && renderOverlay}

        {/* Loading overlay */}
        {isAnalyzing && (
          <View style={s.analyzingOverlay}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={s.analyzingText}>{copy.analyzing}</Text>
          </View>
        )}

        {/* Top bar */}
        <SafeAreaView style={s.arTopBar}>
          <View style={[s.arTopBarInner, isRTL && { flexDirection: "row-reverse" }]}>
            <TouchableOpacity
              style={s.arTopBtn}
              onPress={onBack}
              activeOpacity={0.85}
            >
              <Text style={s.arTopBtnText}>{isRTL ? ">" : "<"}</Text>
            </TouchableOpacity>
            <Text style={s.arTopTitle}>{copy.title}</Text>
            <TouchableOpacity
              style={s.arTopBtn}
              onPress={handleRetake}
              activeOpacity={0.85}
            >
              <Text style={s.arTopBtnIcon}>🔄</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Room Info Badge */}
        {roomAnalysis && !isAnalyzing && (
          <Animated.View entering={FadeInDown.duration(300)} style={s.roomInfoBadge}>
            <Text style={s.roomInfoText}>
              {lang === "ku" ? roomAnalysis.roomTypeKU : roomAnalysis.roomType} •{" "}
              {roomAnalysis.estimatedFloorAreaM2}m²
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Bottom Panel */}
      <Animated.View
        entering={FadeInUp.duration(400)}
        style={[s.bottomPanel, { backgroundColor: tc.card }]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.bottomPanelContent}
          nestedScrollEnabled
        >
          {/* Material Selector */}
          <Text style={[s.panelLabel, isRTL && s.textRTL, { color: tc.charcoal }]}>
            {copy.chooseMatLabel}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ direction: isRTL ? "rtl" : "ltr" }}
            contentContainerStyle={s.materialPaletteRow}
          >
            {MATERIAL_PALETTES.map((pal) => {
              const isSelected = selectedPalette?.id === pal.id;
              return (
                <TouchableOpacity
                  key={pal.id}
                  style={[
                    s.palChip,
                    { borderColor: isSelected ? colors.accent : tc.cardBorder },
                    isSelected && s.palChipActive,
                  ]}
                  onPress={() => {
                    setSelectedPalette(pal);
                    setSelectedColorIdx(0);
                    setSelectedPattern(0);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={s.palChipIcon}>{pal.icon}</Text>
                  <Text
                    style={[
                      s.palChipText,
                      { color: isSelected ? colors.accentDark : tc.darkGray },
                    ]}
                    numberOfLines={1}
                  >
                    {lang === "ku" ? pal.nameKU : pal.nameEN}
                  </Text>
                  <Text style={[s.palChipCat, { color: tc.mediumGray }]}>
                    {lang === "ku" ? pal.categoryKU : pal.categoryEN}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Color Swatches */}
          {selectedPalette && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={[s.panelLabel, isRTL && s.textRTL, { color: tc.charcoal, marginTop: spacing.md }]}>
                {copy.chooseColor}
              </Text>
              <View style={s.swatchRow}>
                {selectedPalette.previewColors.map((color, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      s.swatch,
                      { backgroundColor: color },
                      selectedColorIdx === idx && s.swatchActive,
                    ]}
                    onPress={() => setSelectedColorIdx(idx)}
                    activeOpacity={0.85}
                  />
                ))}

                {/* Pattern Toggle */}
                {selectedPalette.patterns?.length > 1 && (
                  <TouchableOpacity
                    style={[s.patternBtn, { borderColor: tc.cardBorder }]}
                    onPress={() =>
                      setSelectedPattern((prev) => (prev + 1) % selectedPalette.patterns.length)
                    }
                    activeOpacity={0.85}
                  >
                    <Text style={[s.patternBtnText, { color: tc.darkGray }]}>
                      {copy.pattern} {selectedPattern + 1}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Opacity slider */}
              <View style={[s.opacityRow, isRTL && { flexDirection: "row-reverse" }]}>
                <Text style={[s.opacityLabel, { color: tc.mediumGray }]}>{copy.opacity}</Text>
                <View style={s.opacityBtns}>
                  {[0.3, 0.45, 0.55, 0.7, 0.85].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        s.opacityDot,
                        {
                          backgroundColor:
                            Math.abs(overlayOpacity - val) < 0.05
                              ? colors.accent
                              : tc.lightGray,
                          opacity: val,
                        },
                      ]}
                      onPress={() => setOverlayOpacity(val)}
                      activeOpacity={0.7}
                    />
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* Cost Estimate */}
          {costEstimate && (
            <Animated.View entering={FadeInDown.duration(300)} style={[s.costCard, { borderColor: tc.cardBorder }]}>
              <View style={[s.costRow, isRTL && { flexDirection: "row-reverse" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.costCardLabel, isRTL && s.textRTL, { color: tc.mediumGray }]}>
                    {copy.materialNeeded}
                  </Text>
                  <Text style={[s.costCardValue, isRTL && s.textRTL, { color: tc.charcoal }]}>
                    {costEstimate.quantity} {lang === "ku" ? costEstimate.mat.unitKU : costEstimate.mat.unitEN}
                  </Text>
                </View>
                <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
                  <Text style={[s.costCardLabel, { color: tc.mediumGray }]}>{copy.totalCost}</Text>
                  <Text style={s.costCardPrice}>
                    ${costEstimate.costUSD.toLocaleString()}
                  </Text>
                  {costEstimate.costIQD && (
                    <Text style={[s.costCardIqd, { color: tc.mediumGray }]}>
                      ≈ {costEstimate.costIQD.toLocaleString()} {lang === "ku" ? "د.ع" : "IQD"}
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={s.addToStoreBtn}
                onPress={handleAddToStore}
                activeOpacity={0.85}
              >
                <Text style={s.addToStoreBtnText}>🛒 {copy.addToStore}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* AI Suggestions */}
          {roomAnalysis?.suggestionsEN && (
            <Animated.View entering={FadeInDown.duration(300).delay(200)}>
              <Text style={[s.panelLabel, isRTL && s.textRTL, { color: tc.charcoal, marginTop: spacing.md }]}>
                💡 {lang === "ku" ? "پێشنیارەکان" : "AI Suggestions"}
              </Text>
              {(lang === "ku" ? roomAnalysis.suggestionsKU : roomAnalysis.suggestionsEN || []).map(
                (sug, idx) => (
                  <View key={idx} style={[s.suggestionRow, isRTL && { flexDirection: "row-reverse" }]}>
                    <Text style={s.suggestionBullet}>✦</Text>
                    <Text style={[s.suggestionText, isRTL && s.textRTL, { color: tc.darkGray }]}>
                      {sug}
                    </Text>
                  </View>
                )
              )}
            </Animated.View>
          )}
        </ScrollView>
      </Animated.View>

      {/* ─── Added to List Modal ─── */}
      {showAddedModal && addedItem && (
        <Modal
          visible={showAddedModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddedModal(false)}
        >
          <View style={arS.modalOverlay}>
            <TouchableOpacity style={arS.modalBackdrop} activeOpacity={1} onPress={() => setShowAddedModal(false)} />
            <Animated.View entering={FadeInDown.duration(300)} style={[arS.addedModal, { backgroundColor: tc.card }]}>
              {/* Header */}
              <View style={[arS.addedModalHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={arS.checkCircle}>
                  <Text style={{ fontSize: 22 }}>✅</Text>
                </View>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={[arS.addedModalTitle, isRTL && { textAlign: 'right' }, { color: tc.charcoal }]}>
                    {lang === 'ku' ? 'زیادکرا بۆ لیست' : 'Added to List'}
                  </Text>
                  <Text style={[arS.addedModalSub, isRTL && { textAlign: 'right' }, { color: tc.mediumGray }]}>
                    {lang === 'ku' ? 'مادەکە پاشەکەوت کرا' : 'Item saved successfully'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddedModal(false)} style={arS.closeBtn}>
                  <Text style={[arS.closeBtnText, { color: tc.mediumGray }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Item Row */}
              <View style={[arS.itemRow, { backgroundColor: tc.offWhite, borderColor: tc.cardBorder }, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={[arS.itemIcon, { backgroundColor: 'rgba(212,168,67,0.15)' }]}>
                  <Text style={{ fontSize: 24 }}>{selectedPalette?.icon || '🧱'}</Text>
                </View>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={[arS.itemName, isRTL && { textAlign: 'right' }, { color: tc.charcoal }]}>
                    {lang === 'ku' ? (addedItem.mat.nameKU || addedItem.mat.nameEN) : addedItem.mat.nameEN}
                  </Text>
                  <Text style={[arS.itemMeta, isRTL && { textAlign: 'right' }, { color: tc.mediumGray }]}>
                    {addedItem.quantity} {lang === 'ku' ? addedItem.mat.unitKU : addedItem.mat.unitEN}
                  </Text>
                </View>
                <View style={[arS.itemCostWrap, isRTL && { alignItems: 'flex-start' }]}>
                  <Text style={[arS.itemCost, { color: colors.accent }]}>${addedItem.costUSD.toLocaleString()}</Text>
                  {addedItem.costIQD && <Text style={[arS.itemCostSub, { color: tc.mediumGray }]}>≈ {addedItem.costIQD.toLocaleString()} {lang === 'ku' ? 'د.ع' : 'IQD'}</Text>}
                </View>
              </View>

              {/* Bottom: Go to Store icon button */}
              <TouchableOpacity
                style={[arS.goToStoreBtn, { borderTopColor: tc.cardBorder }]}
                onPress={() => { setShowAddedModal(false); onAddToStore?.({ [addedItem.mat.id]: addedItem.quantity }); }}
                activeOpacity={0.85}
              >
                <Text style={arS.goToStoreBtnIcon}>🛒</Text>
                <Text style={[arS.goToStoreBtnText, isRTL && { marginRight: 8, marginLeft: 0 }]}>
                  {lang === 'ku' ? 'بڕۆ بۆ کۆگا' : 'Go to Store'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      )}
    </Animated.View>
  );
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

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
  headerTitle: { ...typography.hero, color: "#FFF", fontSize: 22 },
  headerSubtitle: { ...typography.caption, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  headerIcon: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center",
  },
  headerIconText: { fontSize: 24 },
  textRTL: { textAlign: "right" },

  // ── Source Picker ──
  sourcePickerContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
  },
  illustrationWrap: { alignItems: "center", marginTop: spacing.xxxl, marginBottom: spacing.xl },
  illustrationCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(212,168,67,0.12)", alignItems: "center", justifyContent: "center",
    marginBottom: spacing.lg,
  },
  illustrationEmoji: { fontSize: 48 },
  sourceTitle: { ...typography.title, fontSize: 22, marginBottom: spacing.sm },
  sourceSubtitle: { ...typography.body, textAlign: "center", lineHeight: 22, maxWidth: 280 },
  sourceBtn: {
    flexDirection: "row", alignItems: "center", padding: spacing.xl,
    borderRadius: radius.xl, marginBottom: spacing.md, gap: spacing.md,
  },
  sourceBtnPrimary: { backgroundColor: colors.accent, ...shadows.cardLifted },
  sourceBtnPrimaryIcon: { fontSize: 28 },
  sourceBtnPrimaryText: { ...typography.subtitle, color: "#FFF", fontWeight: "700", fontSize: 16 },
  sourceBtnPrimarySub: { ...typography.tiny, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  sourceBtnSecondary: { backgroundColor: "transparent", borderWidth: 1 },
  sourceBtnSecondaryIcon: { fontSize: 28 },
  sourceBtnSecondaryText: { ...typography.subtitle, fontWeight: "700", fontSize: 16 },
  sourceBtnSecondarySub: { ...typography.tiny, marginTop: 2 },
  sourceBtnArrow: { fontSize: 16, color: "rgba(255,255,255,0.7)" },
  tipBox: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: "#FFFBEB", padding: spacing.lg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: "#FBBF24", marginTop: spacing.md,
  },
  tipIcon: { fontSize: 18 },
  tipText: { ...typography.caption, color: "#92400E", flex: 1, lineHeight: 18 },
  previewSection: { marginTop: spacing.xl },
  previewSectionTitle: { ...typography.subtitle, fontWeight: "700", marginBottom: spacing.md },
  previewGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  previewItem: { width: "30%", alignItems: "center", marginBottom: spacing.sm },
  previewSwatchWrap: {
    width: 60, height: 60, borderRadius: radius.md, overflow: "hidden",
    flexDirection: "row", flexWrap: "wrap", borderWidth: 1,
  },
  previewSwatchQuad: { width: "50%", height: "50%" },
  previewItemLabel: { ...typography.tiny, marginTop: spacing.xs, textAlign: "center" },

  // ── Web Camera ──
  webCameraContainer: { flex: 1, position: "relative" },
  webCameraOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  webCameraFrame: {
    width: SCREEN_W * 0.8, height: SCREEN_W * 0.6,
    position: "relative",
  },
  webCameraCorner: {
    position: "absolute", width: 30, height: 30,
    borderColor: colors.accent, borderWidth: 3,
  },
  webCameraCornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  webCameraCornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  webCameraCornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  webCameraCornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  webCameraHint: {
    ...typography.caption, color: "#FFF", marginTop: spacing.xl,
    backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, borderRadius: radius.full,
  },
  webCameraActions: {
    position: "absolute", bottom: 40, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    paddingHorizontal: spacing.xl,
  },
  webCameraCancelBtn: {
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md, borderRadius: radius.full, width: 60,
    alignItems: "center",
  },
  webCameraCancelText: { ...typography.caption, color: "#FFF", fontWeight: "700" },
  webCameraCaptureBtn: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 4,
    borderColor: "#FFF", alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  webCameraCaptureDot: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent,
  },

  // ── AR Viewport ──
  arViewport: {
    height: SCREEN_H * 0.45,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#111",
  },
  arImage: { width: "100%", height: "100%" },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center",
  },
  analyzingText: { ...typography.caption, color: "#FFF", marginTop: spacing.md, fontWeight: "600" },
  arTopBar: { position: "absolute", top: 0, left: 0, right: 0 },
  arTopBarInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 30) + spacing.sm : spacing.md,
  },
  arTopBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center",
  },
  arTopBtnText: { fontSize: 20, color: "#FFF", fontWeight: "700" },
  arTopBtnIcon: { fontSize: 18 },
  arTopTitle: { ...typography.subtitle, color: "#FFF", fontWeight: "700" },
  roomInfoBadge: {
    position: "absolute", bottom: spacing.md, alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, borderRadius: radius.full,
  },
  roomInfoText: { ...typography.caption, color: "#FFF", fontWeight: "600" },

  // ── Bottom Panel ──
  bottomPanel: {
    flex: 1,
    borderTopLeftRadius: radius.xl * 1.5,
    borderTopRightRadius: radius.xl * 1.5,
    marginTop: -spacing.xl,
    ...shadows.bottomBar,
  },
  bottomPanelContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
  },
  panelLabel: {
    ...typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  materialPaletteRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
  },
  palChip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: "center",
    minWidth: 85,
    backgroundColor: "transparent",
  },
  palChipActive: { backgroundColor: "rgba(212,168,67,0.08)" },
  palChipIcon: { fontSize: 24, marginBottom: spacing.xs },
  palChipText: { ...typography.tiny, fontWeight: "700", textAlign: "center" },
  palChipCat: { ...typography.tiny, fontSize: 9, marginTop: 2, textAlign: "center" },

  // ── Swatches ──
  swatchRow: {
    flexDirection: "row", gap: spacing.md, alignItems: "center",
    flexWrap: "wrap",
  },
  swatch: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "transparent",
  },
  swatchActive: { borderColor: colors.accent, borderWidth: 3 },
  patternBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1, marginLeft: spacing.sm,
  },
  patternBtnText: { ...typography.tiny, fontWeight: "700" },

  // ── Opacity ──
  opacityRow: {
    flexDirection: "row", alignItems: "center", marginTop: spacing.md,
    gap: spacing.md,
  },
  opacityLabel: { ...typography.tiny, fontWeight: "600" },
  opacityBtns: { flexDirection: "row", gap: spacing.sm },
  opacityDot: { width: 24, height: 24, borderRadius: 12 },

  // ── Cost Card ──
  costCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: "#FFFBEB",
  },
  costRow: { flexDirection: "row", marginBottom: spacing.md },
  costCardLabel: { ...typography.tiny, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  costCardValue: { ...typography.subtitle, fontWeight: "700", marginTop: 2 },
  costCardPrice: { ...typography.title, color: colors.accent, fontWeight: "800", fontSize: 18 },
  costCardIqd: { ...typography.tiny, marginTop: 2 },
  addToStoreBtn: {
    backgroundColor: colors.accent, paddingVertical: spacing.md,
    borderRadius: radius.full, alignItems: "center", ...shadows.card,
  },
  addToStoreBtnText: { ...typography.subtitle, color: "#FFF", fontWeight: "700" },

  // ── Suggestions ──
  suggestionRow: {
    flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm,
    alignItems: "flex-start",
  },
  suggestionBullet: { color: colors.accent, fontSize: 12, marginTop: 2 },
  suggestionText: { ...typography.body, flex: 1, lineHeight: 20 },
});

// Added List Modal styles (separate from main StyleSheet to avoid conflicts)
const arS = StyleSheet.create({
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  addedModal: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 24, paddingHorizontal: 20, paddingBottom: 40,
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20,
  },
  addedModalHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 20,
  },
  checkCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(34,197,94,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  addedModalTitle: { fontSize: 17, fontWeight: '700' },
  addedModalSub: { fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 8 },
  closeBtnText: { fontSize: 18, fontWeight: '700' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16,
    padding: 16, borderWidth: 1, marginBottom: 20,
  },
  itemIcon: {
    width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  itemName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  itemMeta: { fontSize: 13 },
  itemCostWrap: { alignItems: 'flex-end' },
  itemCost: { fontSize: 16, fontWeight: '800' },
  itemCostSub: { fontSize: 12, marginTop: 2 },
  goToStoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingTop: 16, borderTopWidth: 1, gap: 10,
  },
  goToStoreBtnIcon: { fontSize: 22 },
  goToStoreBtnText: { fontSize: 16, fontWeight: '700', color: colors.accent, marginLeft: 8 },
});
