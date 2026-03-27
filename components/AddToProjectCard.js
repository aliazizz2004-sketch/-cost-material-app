import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { colors, darkColors, spacing, radius, typography, shadows } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { useExchangeRate } from "../contexts/ExchangeRateContext";
import AppIcon from "./AppIcon";

/**
 * AddToProjectCard — A unified modal that shows collected items and lets the user
 * add them to the active project. Used across all 6 tool areas.
 *
 * Props:
 *   visible        - boolean
 *   onClose        - () => void
 *   items          - [{ id, name, nameKU, qty, unitPrice, source }]
 *   onConfirm      - (items) => void — saves items to the active project
 *   source         - string label for where items came from
 *   deliveryCost   - optional { label, costUSD } for delivery entries
 *   estimationText - optional string for estimation entries
 */
export default function AddToProjectCard({
  visible,
  onClose,
  items = [],
  onConfirm,
  source = "",
  deliveryCost,
  estimationText,
}) {
  const { lang, isRTL } = useLanguage();
  const { isDark } = useTheme();
  const { rate } = useExchangeRate();
  const tc = isDark ? darkColors : colors;

  const copy = useMemo(
    () =>
      lang === "ar"
        ? {
            title: "إضافة إلى المشروع",
            subtitle: "مراجعة وإضافة المواد إلى المشروع النشط",
            itemsLabel: "العناصر",
            totalCost: "التكلفة الإجمالية",
            addToProject: "إضافة إلى المشروع",
            close: "إغلاق",
            noItems: "لا توجد عناصر للإضافة",
            qty: "الكمية",
            source: "المصدر",
            delivery: "تكلفة التوصيل",
            estimation: "تقدير",
          }
        : lang === "ku"
        ? {
            title: "زیادکردن بۆ پ\u0631ۆژە",
            subtitle: "بابەتەکانت بپشکنن و زیاد بکە بۆ پ\u0631ۆژەی چالاک",
            itemsLabel: "بابەتەکان",
            totalCost: "کۆی تێچوو",
            addToProject: "زیادکردن بۆ پ\u0631ۆژە",
            close: "داخستن",
            noItems: "هیچ بابەتێک نییە",
            qty: "ب\u0631",
            source: "سەرچاوە",
            delivery: "تێچووی گەیاندن",
            estimation: "خەمڵاندن",
          }
        : {
            title: "Add to Project",
            subtitle: "Review and add items to your active project",
            itemsLabel: "Items",
            totalCost: "Total Cost",
            addToProject: "Add to Project",
            close: "Close",
            noItems: "No items to add",
            qty: "Qty",
            source: "Source",
            delivery: "Delivery Cost",
            estimation: "Estimation",
          },
    [lang]
  );

  const formatNumber = (num) =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const totalUSD = useMemo(() => {
    let t = 0;
    items.forEach((item) => {
      t += (item.unitPrice || 0) * (item.qty || 1);
    });
    if (deliveryCost) t += deliveryCost.costUSD || 0;
    return t;
  }, [items, deliveryCost]);

  const totalIQD = rate ? Math.round(totalUSD * rate) : null;

  if (!visible) return null;

  const content = (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[s.overlay]}
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        entering={FadeInDown.duration(380).springify().damping(22).stiffness(180)}
        style={[s.card, { backgroundColor: tc.card || "#fff" }]}
      >
        {/* Header */}
        <View style={[s.header, isRTL && s.rowRTL]}>
          <View style={s.headerIconWrap}>
            <AppIcon name="plus-circle" size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[s.title, isRTL && s.textRTL, { color: tc.charcoal }]}
            >
              {copy.title}
            </Text>
            <Text
              style={[s.subtitle, isRTL && s.textRTL, { color: tc.mediumGray }]}
            >
              {copy.subtitle}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={[s.closeBtnText, { color: tc.mediumGray }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Source badge */}
        {source ? (
          <View
            style={[
              s.sourceBadge,
              isRTL && { alignSelf: "flex-end" },
            ]}
          >
            <Text style={s.sourceBadgeText}>
              {copy.source}: {source}
            </Text>
          </View>
        ) : null}

        {/* Items list */}
        <ScrollView
          style={s.listScroll}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 && !deliveryCost && !estimationText ? (
            <View style={s.emptyWrap}>
              <Text style={[s.emptyText, { color: tc.mediumGray }]}>
                {copy.noItems}
              </Text>
            </View>
          ) : (
            <>
              {items.map((item, idx) => {
                const name =
                  lang === "ar" && item.nameKU ? item.name || item.nameEN || `#${item.id}` :
                  lang === "ku" && item.nameKU ? item.nameKU : item.name || item.nameEN || `Item #${item.id}`;
                const cost = (item.unitPrice || 0) * (item.qty || 1);
                const costIQD = rate ? Math.round(cost * rate) : null;
                return (
                  <View
                    key={`${item.id}-${idx}`}
                    style={[s.itemRow, isRTL && s.rowRTL, { borderBottomColor: tc.cardBorder || "#eee" }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          s.itemName,
                          isRTL && s.textRTL,
                          { color: tc.charcoal },
                        ]}
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                      <Text
                        style={[
                          s.itemMeta,
                          isRTL && s.textRTL,
                          { color: tc.mediumGray },
                        ]}
                      >
                        {copy.qty}: {item.qty || 1}
                        {item.unit ? ` ${item.unit}` : ""}
                      </Text>
                    </View>
                    <View
                      style={{
                        alignItems: isRTL ? "flex-start" : "flex-end",
                      }}
                    >
                      <Text style={[s.itemPrice, { color: colors.accent }]}>
                        ${cost.toFixed(0)}
                      </Text>
                      {costIQD ? (
                        <Text
                          style={[s.itemPriceIQD, { color: tc.mediumGray }]}
                        >
                          {formatNumber(costIQD)} IQD
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}

              {/* Delivery row */}
              {deliveryCost ? (
                <View
                  style={[s.itemRow, isRTL && s.rowRTL, { borderBottomColor: tc.cardBorder || "#eee", backgroundColor: "#EFF6FF" }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        s.itemName,
                        isRTL && s.textRTL,
                        { color: "#1E3A8A" },
                      ]}
                    >
                      🚛 {copy.delivery}
                    </Text>
                    {deliveryCost.label ? (
                      <Text
                        style={[
                          s.itemMeta,
                          isRTL && s.textRTL,
                          { color: "#3B82F6" },
                        ]}
                      >
                        {deliveryCost.label}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[s.itemPrice, { color: "#1E3A8A" }]}>
                    ${(deliveryCost.costUSD || 0).toFixed(0)}
                  </Text>
                </View>
              ) : null}

              {/* Estimation row */}
              {estimationText ? (
                <View
                  style={[s.itemRow, isRTL && s.rowRTL, { borderBottomColor: tc.cardBorder || "#eee", backgroundColor: "#FFF7ED" }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        s.itemName,
                        isRTL && s.textRTL,
                        { color: "#92400E" },
                      ]}
                    >
                      📐 {copy.estimation}
                    </Text>
                    <Text
                      style={[
                        s.itemMeta,
                        isRTL && s.textRTL,
                        { color: "#D97706" },
                      ]}
                    >
                      {estimationText}
                    </Text>
                  </View>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>

        {/* Total cost */}
        <View
          style={[s.totalRow, isRTL && s.rowRTL, { borderTopColor: tc.cardBorder || "#eee" }]}
        >
          <Text
            style={[
              s.totalLabel,
              isRTL && s.textRTL,
              { color: tc.charcoal },
            ]}
          >
            {copy.totalCost}
          </Text>
          <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
            <Text style={[s.totalValue, { color: colors.primary }]}>
              ${formatNumber(Math.round(totalUSD))}
            </Text>
            {totalIQD ? (
              <Text style={[s.totalValueIQD, { color: colors.accent }]}>
                {formatNumber(totalIQD)} IQD
              </Text>
            ) : null}
          </View>
        </View>

        {/* Add to project button */}
        <TouchableOpacity
          style={[
            s.confirmBtn,
            (items.length === 0 && !deliveryCost && !estimationText) && s.confirmBtnDisabled,
          ]}
          onPress={() => onConfirm && onConfirm(items)}
          disabled={items.length === 0 && !deliveryCost && !estimationText}
          activeOpacity={0.85}
        >
          <View style={[{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }]}>
            <AppIcon name="plus-circle" size={20} color="#fff" />
            <Text style={s.confirmBtnText}>{copy.addToProject}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  if (Platform.OS === "web") {
    return visible ? content : null;
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

/**
 * AddToProjectButton — A consistent floating "Add to List" button
 * that can be placed inside any tool screen.
 * 
 * Props:
 *   onPress  - () => void
 *   count    - number of items (shows badge)
 *   label    - optional custom label override
 */
export function AddToProjectButton({ onPress, count = 0, label }) {
  const { lang, isRTL } = useLanguage();
  const { isDark } = useTheme();
  const tc = isDark ? darkColors : colors;

  const defaultLabel = lang === "ar" ? "إضافة إلى المشروع" : lang === "ku" ? "زیادکردن بۆ پ\u0631ۆژە" : "Add to Project";

  return (
    <TouchableOpacity
      style={[s.floatingBtn, isRTL && { flexDirection: "row-reverse" }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <AppIcon name="plus-circle" size={18} color="#fff" />
      <Text style={s.floatingBtnText}>{label || defaultLabel}</Text>
      {count > 0 && (
        <View style={s.floatingBadge}>
          <Text style={s.floatingBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}


const s = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
    zIndex: 9999,
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    ...shadows.cardLifted,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: 10,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(212,168,67,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 20,
  },
  rowRTL: { flexDirection: "row-reverse" },
  textRTL: { textAlign: "right" },
  sourceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(212,168,67,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accent,
  },
  listScroll: {
    maxHeight: 280,
  },
  listContent: {
    paddingBottom: spacing.sm,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 12,
    marginRight: 12,
  },
  itemPriceIQD: {
    fontSize: 11,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 2,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  totalValueIQD: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 12,
    ...shadows.cardLifted,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  // Floating button styles
  floatingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
    gap: 8,
    ...shadows.cardLifted,
  },
  floatingBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  floatingBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 4,
  },
  floatingBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
});
