import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Linking,
  TextInput,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { colors, spacing, radius, typography, shadows } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";
import BRAND_LINKS from "../data/brandLinks";

export default function SupplierDirectory({ onBack }) {
  const { t, lang, isRTL } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const copy = useMemo(
    () =>
      lang === "ku"
        ? {
            title: "ناونیشانی دابینکاران",
            subtitle: "بەستنەوە بە دابینکارانی خۆماڵی و جیهانی",
            search: "گە\u0631ان بۆ دابینکار...",
            all: "هەموو",
            cement: "سمێنت (چیمەنتۆ)",
            steel: "ئاسن",
            paint: "بۆیە",
            stone: "بەرد",
            blocks: "بلۆک",
            pipe: "بۆری",
            insulation: "ئینسولاسیۆن",
            glass: "شووشە",
            call: "پەیوەندیکردن",
            whatsapp: "واتسئاپ",
            website: "ماڵپە\u0631",
            map: "نەخشە",
            founded: "دامەزراو",
            hq: "بنکە",
            back: "گە\u0631انەوە",
            noResults: "هیچ دابینکارێک نەدۆزرایەوە",
          }
        : {
            title: "Supplier Directory",
            subtitle: "Connect with local & international suppliers",
            search: "Search suppliers...",
            all: "All",
            cement: "Cement",
            steel: "Steel",
            paint: "Paints",
            stone: "Stone",
            blocks: "Blocks",
            pipe: "Pipes",
            insulation: "Insulation",
            glass: "Glass",
            call: "Call",
            whatsapp: "WhatsApp",
            website: "Website",
            map: "Map",
            founded: "Founded",
            hq: "HQ",
            back: "Back",
            noResults: "No suppliers found",
          },
    [lang]
  );

  const categories = [
    { id: "all", label: copy.all, icon: "🏗️" },
    { id: "cement", label: copy.cement, icon: "🏭" },
    { id: "steel", label: copy.steel, icon: "⚙️" },
    { id: "paint", label: copy.paint, icon: "🎨" },
    { id: "stone", label: copy.stone, icon: "💎" },
    { id: "blocks", label: copy.blocks, icon: "🧱" },
    { id: "pipe", label: copy.pipe, icon: "🔵" },
    { id: "insulation", label: copy.insulation, icon: "🟧" },
    { id: "glass", label: copy.glass, icon: "🔷" },
  ];

  const suppliers = useMemo(() => {
    const all = Object.keys(BRAND_LINKS).map((name) => ({
      name,
      ...BRAND_LINKS[name],
    }));

    let filtered = all;

    if (selectedCategory !== "all") {
      const catMap = {
        cement: ["cement", "binding"],
        steel: ["steel", "iron"],
        paint: ["paint", "coating"],
        stone: ["marble", "granite", "stone"],
        blocks: ["block", "brick", "masonry", "aac"],
        pipe: ["pipe", "ppr", "pvc", "plumbing"],
        insulation: ["insulation", "waterproof", "membrane"],
        glass: ["glass"],
      };
      const keywords = catMap[selectedCategory] || [];
      filtered = all.filter((s) => {
        const cat = (s.category || "").toLowerCase();
        return keywords.some((kw) => cat.includes(kw));
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.category || "").toLowerCase().includes(q) ||
          (s.descEN || "").toLowerCase().includes(q) ||
          (s.descKU || "").includes(q) ||
          (s.headquarters || "").toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [selectedCategory, search]);

  const openURL = (url) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <Animated.View
      style={s.container}
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(300)}
    >
      <View style={s.header}>
        <View style={[s.headerRow, isRTL && s.rowRTL]}>
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backBtnText}>{isRTL ? ">" : "<"}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, isRTL && s.textRTL]}>
              📒 {copy.title}
            </Text>
            <Text style={[s.headerSubtitle, isRTL && s.textRTL]}>
              {copy.subtitle}
            </Text>
          </View>
        </View>

        {/* Search */}
        <TextInput
          style={[s.searchInput, isRTL && s.textRTL]}
          placeholder={copy.search}
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.catRow}
        style={s.catScroll}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[s.catChip, selectedCategory === cat.id && s.catChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
            activeOpacity={0.7}
          >
            <Text style={s.catIcon}>{cat.icon}</Text>
            <Text
              style={[
                s.catText,
                selectedCategory === cat.id && s.catTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Supplier Count */}
      <View style={[s.countRow, isRTL && s.rowRTL]}>
        <Text style={[s.countText, isRTL && s.textRTL]}>
          {suppliers.length} {lang === "ku" ? "دابینکار" : "Suppliers"}
        </Text>
      </View>

      {/* Supplier List */}
      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        {suppliers.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>🔍 {copy.noResults}</Text>
          </View>
        ) : (
          suppliers.map((supplier, idx) => (
            <View key={supplier.name + idx} style={s.card}>
              {/* Card Header */}
              <View style={[s.cardHeader, isRTL && s.rowRTL]}>
                <View style={s.logoCircle}>
                  <Text style={s.logoEmoji}>
                    {supplier.logoEmoji || "🏢"}
                  </Text>
                </View>
                <View style={[s.cardInfo, isRTL && { alignItems: "flex-end" }]}>
                  <Text
                    style={[s.cardName, isRTL && s.textRTL]}
                    numberOfLines={1}
                  >
                    {supplier.name}
                  </Text>
                  <Text
                    style={[s.cardCategory, isRTL && s.textRTL]}
                    numberOfLines={1}
                  >
                    {supplier.category || ""}
                  </Text>
                  {supplier.tagline && (
                    <Text
                      style={[s.cardTagline, isRTL && s.textRTL]}
                      numberOfLines={1}
                    >
                      "{supplier.tagline}"
                    </Text>
                  )}
                </View>
              </View>

              {/* Description */}
              <Text
                style={[s.cardDesc, isRTL && s.textRTL]}
                numberOfLines={3}
              >
                {lang === "ku"
                  ? supplier.descKU || supplier.descEN
                  : supplier.descEN || ""}
              </Text>

              {/* Meta row */}
              <View style={[s.metaRow, isRTL && s.rowRTL]}>
                {supplier.founded && (
                  <View style={s.metaItem}>
                    <Text style={s.metaLabel}>{copy.founded}</Text>
                    <Text style={s.metaValue}>{supplier.founded}</Text>
                  </View>
                )}
                {supplier.headquarters && (
                  <View style={[s.metaItem, { flex: 2 }]}>
                    <Text style={s.metaLabel}>{copy.hq}</Text>
                    <Text style={s.metaValue} numberOfLines={1}>
                      {supplier.headquarters}
                    </Text>
                  </View>
                )}
              </View>

              {/* Key Facts */}
              {(lang === "ku" ? supplier.keyFactsKU : supplier.keyFacts) && (
                <View style={s.factsWrap}>
                  {(lang === "ku"
                    ? supplier.keyFactsKU
                    : supplier.keyFacts
                  )
                    .slice(0, 3)
                    .map((fact, i) => (
                      <View key={i} style={[s.factRow, isRTL && s.rowRTL]}>
                        <Text style={s.factDot}>•</Text>
                        <Text
                          style={[s.factText, isRTL && s.textRTL]}
                          numberOfLines={1}
                        >
                          {fact}
                        </Text>
                      </View>
                    ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={[s.actionRow, isRTL && s.rowRTL]}>
                {supplier.website && (
                  <TouchableOpacity
                    style={[s.actionBtn, s.actionBtnWeb]}
                    onPress={() => openURL(supplier.website)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.actionBtnWebText}>🌐 {copy.website}</Text>
                  </TouchableOpacity>
                )}
                {supplier.mapUrl && (
                  <TouchableOpacity
                    style={[s.actionBtn, s.actionBtnMap]}
                    onPress={() => openURL(supplier.mapUrl)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.actionBtnMapText}>📍 {copy.map}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === "android" ? 40 : 0,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.md,
  },
  rowRTL: { flexDirection: "row-reverse" },
  textRTL: { textAlign: "right" },
  backBtn: { padding: spacing.sm, marginRight: spacing.sm },
  backBtnText: { fontSize: 24, color: colors.white, fontWeight: "700" },
  headerTitle: { ...typography.title, color: colors.white, fontSize: 22 },
  headerSubtitle: { ...typography.caption, color: colors.accentLight, marginTop: 4 },
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    ...typography.body,
    color: colors.white,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  catScroll: { maxHeight: 52, marginTop: spacing.md },
  catRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  catChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  catIcon: { fontSize: 14 },
  catText: { ...typography.caption, color: colors.darkGray, fontWeight: "600" },
  catTextActive: { color: colors.white },
  countRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  countText: { ...typography.caption, color: colors.mediumGray, fontWeight: "600" },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  emptyBox: {
    paddingVertical: spacing.xxxl * 2,
    alignItems: "center",
  },
  emptyText: { ...typography.body, color: colors.mediumGray },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.offWhite,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  logoEmoji: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardName: {
    ...typography.subtitle,
    color: colors.charcoal,
    fontWeight: "700",
  },
  cardCategory: {
    ...typography.tiny,
    color: colors.accent,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardTagline: {
    ...typography.tiny,
    color: colors.mediumGray,
    fontStyle: "italic",
    marginTop: 2,
  },
  cardDesc: {
    ...typography.body,
    color: colors.darkGray,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  metaItem: { flex: 1 },
  metaLabel: {
    ...typography.tiny,
    color: colors.mediumGray,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  metaValue: {
    ...typography.caption,
    color: colors.charcoal,
    fontWeight: "600",
    marginTop: 2,
  },
  factsWrap: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  factRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: 4,
  },
  factDot: { color: colors.accent, fontSize: 14, fontWeight: "bold" },
  factText: {
    ...typography.caption,
    color: colors.darkGray,
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 1,
  },
  actionBtnWeb: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionBtnWebText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
  },
  actionBtnMap: {
    backgroundColor: colors.offWhite,
    borderColor: colors.cardBorder,
  },
  actionBtnMapText: {
    ...typography.caption,
    color: colors.darkGray,
    fontWeight: "700",
  },
});
