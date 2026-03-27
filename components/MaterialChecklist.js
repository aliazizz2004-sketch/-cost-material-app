import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { colors, spacing, radius, typography, shadows } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { useExchangeRate } from "../contexts/ExchangeRateContext";
import { getSuggestions, CONSTRUCTION_PHASES } from "../data/checklistData";
import AppIcon from "./AppIcon";

export default function MaterialChecklist({ quantities, materials, onAddMaterial, onSelectPhase }) {
  const { lang, isRTL } = useLanguage();
  const { rate } = useExchangeRate();

  const suggestions = useMemo(
    () => getSuggestions(quantities, materials),
    [quantities, materials]
  );

  const copy = useMemo(
    () =>
      lang === "ku"
        ? {
            suggestTitle: "📋 مادەی پێشنیارکراو",
            suggestSubtitle: "ئەم مادانە لەگەڵ هەڵبژاردنەکانتدا بەکاردەهێنرێن",
            phaseTitle: "🏗️ قۆناغەکانی بیناسازی",
            phaseSubtitle: "شوێنپێوات بکە بۆ تەواوبوونی پ\u0631ۆژە",
            add: "زیادکردن",
            reason: "بۆچی؟",
            noSuggestions: "هیچ پێشنیارێک نییە — دەستبکە بە هەڵبژاردنی مادە!",
            materialsCount: "مادە",
          }
        : {
            suggestTitle: "📋 Suggested Materials",
            suggestSubtitle: "These materials complement your current selection",
            phaseTitle: "🏗️ Construction Phases",
            phaseSubtitle: "Follow a checklist for complete project coverage",
            add: "Add",
            reason: "Why?",
            noSuggestions: "No suggestions yet — start by selecting materials!",
            materialsCount: "materials",
          },
    [lang]
  );

  const selectedCount = Object.values(quantities).filter((v) => v > 0).length;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.container}
    >
      {/* Suggestions Section */}
      <View style={s.section}>
        <Text style={[s.sectionTitle, isRTL && s.textRTL]}>
          {copy.suggestTitle}
        </Text>
        <Text style={[s.sectionSubtitle, isRTL && s.textRTL]}>
          {copy.suggestSubtitle}
        </Text>

        {suggestions.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>🧰</Text>
            <Text style={[s.emptyText, isRTL && s.textRTL]}>
              {copy.noSuggestions}
            </Text>
          </View>
        ) : (
          suggestions.map(({ material, reasons }, idx) => {
            const priceIQD = rate ? Math.round(material.basePrice * rate) : 0;
            return (
              <Animated.View
                key={material.id}
                entering={FadeIn.delay(idx * 80).duration(300)}
                style={s.suggestionCard}
              >
                <View style={[s.suggestionHeader, isRTL && s.rowRTL]}>
                  {material.image && (
                    <Image
                      source={
                        typeof material.image === "string"
                          ? { uri: material.image }
                          : material.image
                      }
                      style={[
                        s.suggestionImage,
                        isRTL ? { marginLeft: spacing.md } : { marginRight: spacing.md },
                      ]}
                    />
                  )}
                  <View style={[s.suggestionInfo, isRTL && { alignItems: "flex-end" }]}>
                    <Text
                      style={[s.suggestionName, isRTL && s.textRTL]}
                      numberOfLines={1}
                    >
                      {lang === "ku" ? material.nameKU : material.nameEN}
                    </Text>
                    <Text style={[s.suggestionPrice, isRTL && s.textRTL]}>
                      {priceIQD.toLocaleString()} IQD /{" "}
                      {lang === "ku" ? material.unitKU : material.unitEN}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={s.addBtn}
                    onPress={() => onAddMaterial && onAddMaterial(material.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.addBtnText}>+ {copy.add}</Text>
                  </TouchableOpacity>
                </View>

                {/* Reasons */}
                <View style={s.reasonsWrap}>
                  {reasons.slice(0, 2).map((r, i) => {
                    const fromMaterial = materials.find(
                      (m) => m.id === r.fromId
                    );
                    return (
                      <View key={i} style={[s.reasonRow, isRTL && s.rowRTL]}>
                        <Text style={s.reasonDot}>→</Text>
                        <Text
                          style={[s.reasonText, isRTL && s.textRTL]}
                          numberOfLines={2}
                        >
                          {lang === "ku" ? r.reasonKU : r.reasonEN}
                          {fromMaterial && (
                            <Text style={s.reasonFrom}>
                              {" "}
                              (
                              {lang === "ku"
                                ? fromMaterial.nameKU
                                : fromMaterial.nameEN}
                              )
                            </Text>
                          )}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            );
          })
        )}
      </View>

      {/* Construction Phases Section */}
      <View style={[s.section, { marginTop: spacing.xl }]}>
        <Text style={[s.sectionTitle, isRTL && s.textRTL]}>
          {copy.phaseTitle}
        </Text>
        <Text style={[s.sectionSubtitle, isRTL && s.textRTL]}>
          {copy.phaseSubtitle}
        </Text>

        {CONSTRUCTION_PHASES.map((phase, idx) => {
          // Count how many materials in this phase are already selected
          const phaseSelectedCount = phase.materialIds.filter(
            (id) => (quantities[id] || 0) > 0
          ).length;
          const progress = phase.materialIds.length > 0
            ? (phaseSelectedCount / phase.materialIds.length) * 100
            : 0;

          const getPhaseIcon = (id) => {
              if (id.includes('foundation')) return 'layers';
              if (id.includes('wall')) return 'category'; // wait, what icon? let's use 'layers', 'home', etc.
              if (id.includes('roof')) return 'home';
              if (id.includes('plumb')) return 'settings';
              return 'checklist';
          };
          
          return (
            <Animated.View
              key={phase.id}
              entering={FadeIn.delay(idx * 60).duration(300)}
            >
              <TouchableOpacity
                style={[s.phaseCard, isRTL && s.rowRTL]}
                activeOpacity={0.8}
                onPress={() => onSelectPhase && onSelectPhase(phase)}
              >
                <View style={[s.phaseIconWrap, { backgroundColor: colors.primary + '11' }]}>
                  <AppIcon name={getPhaseIcon(phase.id)} size={22} color={colors.primary} />
                </View>
                <View style={[s.phaseInfo, isRTL && { alignItems: "flex-end", marginRight: spacing.md }]}>
                  <Text
                    style={[s.phaseName, isRTL && s.textRTL]}
                    numberOfLines={1}
                  >
                    {lang === "ku" ? phase.nameKU : phase.nameEN}
                  </Text>
                  <Text
                    style={[s.phaseDesc, isRTL && s.textRTL]}
                    numberOfLines={1}
                  >
                    {lang === "ku" ? phase.descKU : phase.descEN}
                  </Text>
                  <View style={[s.progressBarWrap, isRTL && s.rowRTL]}>
                    <View style={s.progressBarBg}>
                      <View
                        style={[
                          s.progressBarFill,
                          { width: `${progress}%` },
                          progress === 100 && s.progressBarComplete,
                          isRTL && { right: 0, position: 'absolute' }
                        ]}
                      />
                    </View>
                    <Text style={s.progressText}>
                      {phaseSelectedCount}/{phase.materialIds.length} {copy.materialsCount}
                    </Text>
                  </View>
                </View>
                <AppIcon name="back" size={16} color={colors.mediumGray} style={!isRTL && { transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  section: {},
  sectionTitle: {
    ...typography.title,
    color: colors.charcoal,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.darkGray,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  textRTL: { textAlign: "right" },
  rowRTL: { flexDirection: "row-reverse" },
  emptyBox: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.md },
  emptyText: {
    ...typography.body,
    color: colors.mediumGray,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  suggestionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  suggestionImage: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
  },
  suggestionInfo: { flex: 1 },
  suggestionName: {
    ...typography.subtitle,
    color: colors.charcoal,
    fontWeight: "700",
  },
  suggestionPrice: {
    ...typography.tiny,
    color: colors.accent,
    fontWeight: "600",
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    ...shadows.card,
  },
  addBtnText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
  },
  reasonsWrap: {
    marginTop: spacing.md,
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: spacing.xs,
  },
  reasonDot: {
    color: colors.accent,
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 1,
  },
  reasonText: {
    ...typography.caption,
    color: colors.darkGray,
    flex: 1,
    lineHeight: 18,
  },
  reasonFrom: {
    color: colors.mediumGray,
    fontStyle: "italic",
  },
  phaseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  phaseIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.offWhite,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  phaseIcon: { fontSize: 24 },
  phaseInfo: { flex: 1 },
  phaseName: {
    ...typography.subtitle,
    color: colors.charcoal,
    fontWeight: "700",
    marginBottom: 2,
  },
  phaseDesc: {
    ...typography.tiny,
    color: colors.mediumGray,
    marginBottom: spacing.sm,
  },
  progressBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  progressBarComplete: {
    backgroundColor: colors.success,
  },
  progressText: {
    ...typography.tiny,
    color: colors.mediumGray,
    fontWeight: "600",
    minWidth: 70,
  },
  phaseArrow: {
    fontSize: 16,
    color: colors.mediumGray,
    fontWeight: "bold",
    marginLeft: spacing.sm,
  },
});
