import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  TextInput,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { colors, darkColors, spacing, radius, typography, shadows } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { useExchangeRate } from "../contexts/ExchangeRateContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  CITIES,
  getDistance,
  calculateDeliveryCost,
} from "../data/deliveryData";

export default function DeliveryCostEstimator({ onBack, activeProjectName, onAutoSave, storeQuantities, storeMaterials, onAddToProject, activeProjectId }) {
  const { t, lang, isRTL } = useLanguage();
  const { rate } = useExchangeRate();
  const { isDark } = useTheme();
  const tc = isDark ? darkColors : colors;
  const savedDeliveryRef = React.useRef(null);

  const [fromCity, setFromCity] = useState(null);
  const [toCity, setToCity] = useState(null);
  const [tons, setTons] = useState("1");
  const [weightCategory, setWeightCategory] = useState("standard");
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const copy = useMemo(
    () =>
      lang === "ar"
        ? {
          title: "حاسبة تكلفة التوصيل",
          subtitle: "تقدير تكاليف النقل بين مدن العراق وكردستان",
          from: "من مدينة",
          to: "إلى مدينة",
          selectCity: "اختر المدينة",
          weight: "الوزن (طن)",
          materialType: "نوع المادة",
          calculate: "تخمين التكلفة",
          result: "النتيجة",
          distance: "المسافة",
          km: "كم",
          costPerTon: "التكلفة لكل طن",
          totalCost: "إجمالي تكلفة التوصيل",
          routeType: "نوع الطريق",
          noRoute: "عذراً، لا تتوفر معلومات مسار بين هاتين المدينتين",
          light: "خفيف (عوازل، فوم)",
          standard: "قياسي (سمنت، بلوك)",
          heavy: "ثقيل (حديد، شيش)",
          liquid: "سائل (صبغ، خرسانة)",
          fragile: "قابل للكسر (زجاج، كاشي)",
          searchCity: "ابحث عن مدينة...",
          back: "رجوع",
          kurdistanCities: "مدن إقليم كردستان",
          iraqCities: "مدن العراق",
          sameCity: "لا يمكن أن تكون مدينة الانطلاق مطابقة لمدينة الوصول",
          weightMultiplier: "نوع المادة",
          info: "هذه الأسعار تقديرات مبنية على أسعار النقل في السوق العراقي. الأسعار الفعلية قد تختلف.",
        }
        : lang === "ku"
        ? {
          title: "خەمڵاندنی تێچووی گەیاندن",
          subtitle: "تێچووی گەیاندنی مادەکان لە نێوان شارەکانی کوردستان و عێراق",
          from: "لە شار",
          to: "بۆ شار",
          selectCity: "شار هەڵبژێرە",
          weight: "کێش (تۆن)",
          materialType: "جۆری مادە",
          calculate: "خەمڵاندن",
          result: "ئەنجام",
          distance: "مەودا",
          km: "کم",
          costPerTon: "تێچوو بۆ هەر تۆنێک",
          totalCost: "کۆی تێچووی گەیاندن",
          routeType: "جۆری \u0631ێگا",
          noRoute: "ببوورە، \u0631ێگایەکی ئاماژەکراو نییە لە نێوان ئەم دوو شارەدا",
          light: "سووک (ئینسولاسیۆن، فۆم)",
          standard: "ئاسایی (سمێنت/چیمەنتۆ، بلۆک)",
          heavy: "قورس (ئاسن، میلە)",
          liquid: "شلە (بۆیە، کۆنکریت)",
          fragile: "شکێنراو (شووشە، کاشی)",
          searchCity: "گە\u0631ان بۆ شار...",
          back: "گە\u0631انەوە",
          kurdistanCities: "شارەکانی کوردستان",
          iraqCities: "شارەکانی عێراق",
          sameCity: "شاری مەبەست و سەرچاوە ناتوانن هاوشێوە بن",
          weightMultiplier: "جۆری مادە",
          info: "ئەم نرخانە خەمڵاندنن بەپێی نرخی بازا\u0631ی گەیاندن لە عێراق و کوردستان. نرخی \u0631استەقینە دەکرێت جیاواز بێت.",
        }
        : {
          title: "Delivery Cost Estimator",
          subtitle: "Estimate material transport costs between Kurdistan & Iraq cities",
          from: "From City",
          to: "To City",
          selectCity: "Select City",
          weight: "Weight (tons)",
          materialType: "Material Type",
          calculate: "Calculate",
          result: "Result",
          distance: "Distance",
          km: "km",
          costPerTon: "Cost per Ton",
          totalCost: "Total Delivery Cost",
          routeType: "Route Type",
          noRoute: "Sorry, no route data available between these two cities",
          light: "Light (Insulation, Foam)",
          standard: "Standard (Cement, Blocks)",
          heavy: "Heavy (Steel, Rebar)",
          liquid: "Liquid (Paint, Concrete)",
          fragile: "Fragile (Glass, Tiles)",
          searchCity: "Search city...",
          back: "Back",
          kurdistanCities: "Kurdistan Cities",
          iraqCities: "Iraq Cities",
          sameCity: "Origin and destination cannot be the same",
          weightMultiplier: "Material Type",
          info: "These rates are estimates based on Iraq & Kurdistan market delivery rates. Actual rates may vary.",
        },
    [lang]
  );

  const weightCategories = [
    { id: "light", label: copy.light, icon: "📦" },
    { id: "standard", label: copy.standard, icon: "🧱" },
    { id: "heavy", label: copy.heavy, icon: "⚙️" },
    { id: "liquid", label: copy.liquid, icon: "🎨" },
    { id: "fragile", label: copy.fragile, icon: "🪟" },
  ];

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const result = useMemo(() => {
    if (!fromCity || !toCity) return null;
    if (fromCity === toCity) return { error: copy.sameCity };

    const dist = getDistance(fromCity, toCity);
    if (!dist) return { error: copy.noRoute };

    const tonsNum = parseFloat(tons) || 1;
    return calculateDeliveryCost(dist, tonsNum, weightCategory, rate || 1310);
  }, [fromCity, toCity, tons, weightCategory, rate, copy]);

  const getCityName = useCallback(
    (cityId) => {
      const city = CITIES.find((c) => c.id === cityId);
      if (!city) return "";
      return lang === "ar" ? city.nameAR : lang === "ku" ? city.nameKU : city.nameEN;
    },
    [lang]
  );

  React.useEffect(() => {
    if (result && !result.error && onAutoSave) {
      const fromStr = getCityName(fromCity);
      const toStr = getCityName(toCity);
      const str = `${fromStr} ➜ ${toStr} | ${formatNumber(result.costIQD)} IQD`;
      if (savedDeliveryRef.current !== str) {
        savedDeliveryRef.current = str;
        onAutoSave(str, result.costUSD);
      }
    }
  }, [result, onAutoSave, fromCity, toCity, getCityName]);

  // Compute store items summary for import
  const storeItemCount = useMemo(() => {
    if (!storeQuantities) return 0;
    return Object.values(storeQuantities).filter(v => v > 0).length;
  }, [storeQuantities]);

  const importStoreWeight = useCallback(() => {
    if (!storeQuantities || !storeMaterials) return;
    let totalKg = 0;
    storeMaterials.forEach(m => {
      const qty = storeQuantities[m.id] || 0;
      if (qty > 0) {
        totalKg += (m.weight || 0) * qty;
      }
    });
    const totalTons = Math.max(0.5, totalKg / 1000);
    setTons(totalTons.toFixed(1));
    setWeightCategory('standard');
  }, [storeQuantities, storeMaterials]);

  const filteredCities = useMemo(() => {
    const q = citySearch.toLowerCase().trim();
    if (!q) return CITIES;
    return CITIES.filter(
      (c) =>
        c.nameEN.toLowerCase().includes(q) ||
        (c.nameKU && c.nameKU.includes(q)) ||
        (c.nameAR && c.nameAR.includes(q)) ||
        c.id.includes(q)
    );
  }, [citySearch]);

  const kurdistanCities = filteredCities.filter((c) => c.region === "kurdistan");
  const iraqCities = filteredCities.filter((c) => c.region === "iraq");

  const renderCityPicker = (isFrom) => (
    <Modal
      visible={isFrom ? showFromPicker : showToPicker}
      transparent
      animationType="slide"
      onRequestClose={() =>
        isFrom ? setShowFromPicker(false) : setShowToPicker(false)
      }
    >
      <View style={s.modalOverlay}>
        <TouchableOpacity
          style={s.modalBackdrop}
          activeOpacity={1}
          onPress={() => {
            isFrom ? setShowFromPicker(false) : setShowToPicker(false);
            setCitySearch("");
          }}
        />
        <View style={s.pickerContent}>
          <View style={s.grabber} />
          <View style={[s.pickerHeader, isRTL && s.rowRTL]}>
            <Text style={[s.pickerTitle, isRTL && s.textRTL]}>
              {isFrom ? copy.from : copy.to}
            </Text>
            <TouchableOpacity
              onPress={() => {
                isFrom ? setShowFromPicker(false) : setShowToPicker(false);
                setCitySearch("");
              }}
              style={s.closeBtn}
            >
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[s.searchInput, isRTL && s.textRTL]}
            placeholder={copy.searchCity}
            placeholderTextColor={colors.mediumGray}
            value={citySearch}
            onChangeText={setCitySearch}
          />

          <ScrollView
            style={s.cityList}
            showsVerticalScrollIndicator={false}
          >
            {kurdistanCities.length > 0 && (
              <>
                <Text style={[s.regionLabel, isRTL && s.textRTL]}>
                  🏔️ {copy.kurdistanCities}
                </Text>
                {kurdistanCities.map((city) => {
                  const isSelected =
                    (isFrom ? fromCity : toCity) === city.id;
                  return (
                    <TouchableOpacity
                      key={city.id}
                      style={[
                        s.cityItem,
                        isSelected && s.cityItemActive,
                        isRTL && s.rowRTL,
                      ]}
                      onPress={() => {
                        if (isFrom) setFromCity(city.id);
                        else setToCity(city.id);
                        isFrom
                          ? setShowFromPicker(false)
                          : setShowToPicker(false);
                        setCitySearch("");
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          s.cityItemText,
                          isSelected && s.cityItemTextActive,
                          isRTL && s.textRTL,
                        ]}
                      >
                        {lang === "ku" ? city.nameKU : city.nameEN}
                      </Text>
                      {city.isCapital && (
                        <View style={s.capitalBadge}>
                          <Text style={s.capitalBadgeText}>
                            {lang === "ku" ? "پایتەخت" : "Capital"}
                          </Text>
                        </View>
                      )}
                      {isSelected && (
                        <Text style={s.checkMark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {iraqCities.length > 0 && (
              <>
                <Text style={[s.regionLabel, isRTL && s.textRTL, { marginTop: spacing.lg }]}>
                  🇮🇶 {copy.iraqCities}
                </Text>
                {iraqCities.map((city) => {
                  const isSelected =
                    (isFrom ? fromCity : toCity) === city.id;
                  return (
                    <TouchableOpacity
                      key={city.id}
                      style={[
                        s.cityItem,
                        isSelected && s.cityItemActive,
                        isRTL && s.rowRTL,
                      ]}
                      onPress={() => {
                        if (isFrom) setFromCity(city.id);
                        else setToCity(city.id);
                        isFrom
                          ? setShowFromPicker(false)
                          : setShowToPicker(false);
                        setCitySearch("");
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          s.cityItemText,
                          isSelected && s.cityItemTextActive,
                          isRTL && s.textRTL,
                        ]}
                      >
                        {lang === "ku" ? city.nameKU : city.nameEN}
                      </Text>
                      {city.isCapital && (
                        <View style={s.capitalBadge}>
                          <Text style={s.capitalBadgeText}>
                            {lang === "ku" ? "پایتەخت" : "Capital"}
                          </Text>
                        </View>
                      )}
                      {isSelected && (
                        <Text style={s.checkMark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <Animated.View
      style={[s.container, { backgroundColor: tc.offWhite }]}
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(300)}
    >
      <View style={[s.header, { backgroundColor: tc.primary }]}>
        <View style={[s.headerRow, isRTL && s.rowRTL]}>
          <TouchableOpacity
            onPress={onBack}
            style={s.backBtn}
            activeOpacity={0.7}
          >
            <Text style={s.backBtnText}>{isRTL ? ">" : "<"}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, isRTL && s.textRTL]}>
              🚛 {copy.title}
            </Text>
            <Text style={[s.headerSubtitle, isRTL && s.textRTL]}>
              {copy.subtitle}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={s.scrollBody}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeProjectName && (
          <View style={{ backgroundColor: isDark ? '#1A2535' : '#EBF5FF', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20, borderRadius: 12, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', borderWidth: 1, borderColor: isDark ? '#2A3A4F' : '#BFDBFE' }}>
             <View style={{ flex: 1 }}>
               <Text style={{ color: isDark ? '#93C5FD' : '#1E3A8A', fontWeight: '700', fontSize: 13, textAlign: isRTL ? 'right' : 'left', marginBottom: 2 }}>
                  {lang === "ar" ? `المشروع النشط: ${activeProjectName}` : lang === "ku" ? `پ\u0631ۆژەی چالاک: ${activeProjectName}` : `Active Project: ${activeProjectName}`}
               </Text>
               <Text style={{ color: isDark ? '#60A5FA' : '#3B82F6', fontWeight: '600', fontSize: 11, textAlign: isRTL ? 'right' : 'left' }}>
                  {lang === "ar" ? "تُحفظ التغييرات تلقائيًا" : lang === "ku" ? "گۆ\u0631انکارییەکان خۆکارانە پاشەکەوت دەکرێن" : "Changes are saved automatically"}
               </Text>
             </View>
          </View>
        )}

        {/* Import from Store Button */}
        {storeItemCount > 0 && (
          <TouchableOpacity
            style={{ backgroundColor: isDark ? '#1B3A5C' : '#EFF6FF', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20, borderRadius: 12, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', borderWidth: 1, borderColor: isDark ? '#2563EB' : '#93C5FD' }}
            onPress={importStoreWeight}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 22, marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }}>📦</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: isDark ? '#93C5FD' : '#1E40AF', fontWeight: '700', fontSize: 13, textAlign: isRTL ? 'right' : 'left' }}>
                {lang === "ar" ? `استيراد من المخزن (${storeItemCount} عناصر)` : lang === "ku" ? `هێنانەوە لە فرۆشگا (${storeItemCount} ب\u0631گە)` : `Import from Store (${storeItemCount} items)`}
              </Text>
              <Text style={{ color: isDark ? '#60A5FA' : '#3B82F6', fontWeight: '500', fontSize: 11, textAlign: isRTL ? 'right' : 'left', marginTop: 2 }}>
                {lang === "ar" ? "ملء الوزن تلقائياً من اختياراتك" : lang === "ku" ? "کێشی ب\u0631گەکانی فرۆشگا بۆ تۆن دابنێ" : "Auto-fill weight from your store selections"}
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: isDark ? '#60A5FA' : '#2563EB' }}>→</Text>
          </TouchableOpacity>
        )}

        {/* From City */}
        <Text style={[s.label, isRTL && s.textRTL, { color: tc.darkGray }]}>{copy.from}</Text>
        <TouchableOpacity
          style={[s.selectBtn, isRTL && s.rowRTL, { backgroundColor: tc.white, borderColor: tc.cardBorder }]}
          onPress={() => setShowFromPicker(true)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              s.selectBtnText,
              !fromCity && s.selectBtnPlaceholder,
              isRTL && s.textRTL,
            ]}
          >
            {fromCity ? getCityName(fromCity) : copy.selectCity}
          </Text>
          <Text style={s.selectArrow}>▼</Text>
        </TouchableOpacity>

        {/* To City */}
        <Text style={[s.label, isRTL && s.textRTL, { marginTop: spacing.lg }]}>
          {copy.to}
        </Text>
        <TouchableOpacity
          style={[s.selectBtn, isRTL && s.rowRTL]}
          onPress={() => setShowToPicker(true)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              s.selectBtnText,
              !toCity && s.selectBtnPlaceholder,
              isRTL && s.textRTL,
            ]}
          >
            {toCity ? getCityName(toCity) : copy.selectCity}
          </Text>
          <Text style={s.selectArrow}>▼</Text>
        </TouchableOpacity>

        {/* Swap Button */}
        {fromCity && toCity && (
          <TouchableOpacity
            style={s.swapBtn}
            onPress={() => {
              const temp = fromCity;
              setFromCity(toCity);
              setToCity(temp);
            }}
            activeOpacity={0.7}
          >
            <Text style={s.swapIcon}>⇅</Text>
            <Text style={s.swapText}>
              {lang === "ar" ? "تبديل" : lang === "ku" ? "گۆ\u0631ینەوە" : "Swap"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Weight */}
        <Text style={[s.label, isRTL && s.textRTL, { marginTop: spacing.lg }]}>
          {copy.weight}
        </Text>
        <View style={[s.tonsRow, isRTL && s.rowRTL]}>
          <TouchableOpacity
            style={s.tonsBtn}
            onPress={() =>
              setTons(String(Math.max(0.5, (parseFloat(tons) || 1) - 0.5)))
            }
          >
            <Text style={s.tonsBtnText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={[s.tonsInput, isRTL && s.textRTL]}
            value={tons}
            onChangeText={setTons}
            keyboardType="numeric"
            selectTextOnFocus
          />
          <TouchableOpacity
            style={[s.tonsBtn, s.tonsBtnPlus]}
            onPress={() =>
              setTons(String((parseFloat(tons) || 1) + 0.5))
            }
          >
            <Text style={[s.tonsBtnText, s.tonsBtnPlusText]}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Material Type */}
        <Text style={[s.label, isRTL && s.textRTL, { marginTop: spacing.lg }]}>
          {copy.materialType}
        </Text>
        <View style={[s.catRow, isRTL && s.rowRTL]}>
          {weightCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                s.catChip,
                weightCategory === cat.id && s.catChipActive,
              ]}
              onPress={() => setWeightCategory(cat.id)}
              activeOpacity={0.7}
            >
              <Text style={s.catIcon}>{cat.icon}</Text>
              <Text
                style={[
                  s.catText,
                  weightCategory === cat.id && s.catTextActive,
                ]}
                numberOfLines={1}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Result */}
        {result && !result.error && (
          <Animated.View entering={FadeIn.duration(300)} style={s.resultCard}>
            <View style={[s.resultHeader, isRTL && s.rowRTL]}>
              <Text style={[s.resultTitle, isRTL && s.textRTL]}>
                📊 {copy.result}
              </Text>
              <View style={s.routeBadge}>
                <Text style={s.routeBadgeText}>
                  {lang === "ar" ? result.tier?.ar : lang === "ku" ? result.tier?.ku : result.tier?.en}
                </Text>
              </View>
            </View>

            {/* Route visualization */}
            <View style={s.routeVisual}>
              <View style={s.routeCity}>
                <View style={s.routeDot} />
                <Text style={[s.routeCityText, isRTL && s.textRTL]} numberOfLines={1}>
                  {getCityName(fromCity)}
                </Text>
              </View>
              <View style={s.routeLine}>
                <Text style={s.routeDistText}>
                  {result.distanceKm} {copy.km}
                </Text>
              </View>
              <View style={s.routeCity}>
                <View style={[s.routeDot, s.routeDotEnd]} />
                <Text style={[s.routeCityText, isRTL && s.textRTL]} numberOfLines={1}>
                  {getCityName(toCity)}
                </Text>
              </View>
            </View>

            {/* Cost breakdown */}
            <View style={s.costBreakdown}>
              <View style={[s.costRow, isRTL && s.rowRTL]}>
                <Text style={[s.costLabel, isRTL && s.textRTL]}>
                  {copy.distance}
                </Text>
                <Text style={s.costValue}>
                  {formatNumber(result.distanceKm)} {copy.km}
                </Text>
              </View>
              <View style={[s.costRow, isRTL && s.rowRTL]}>
                <Text style={[s.costLabel, isRTL && s.textRTL]}>
                  {copy.weightMultiplier}
                </Text>
                <Text style={s.costValue}>
                  ×{result.weightMultiplier}
                </Text>
              </View>
              <View style={[s.costRow, isRTL && s.rowRTL]}>
                <Text style={[s.costLabel, isRTL && s.textRTL]}>
                  {copy.costPerTon}
                </Text>
                <Text style={s.costValue}>
                  ${result.ratePerTon}
                </Text>
              </View>
              <View style={s.costDivider} />
              <View style={[s.costRow, isRTL && s.rowRTL]}>
                <Text style={[s.totalLabel, isRTL && s.textRTL]}>
                  {copy.totalCost}
                </Text>
                <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
                  <Text style={s.totalValueIQD}>
                    {formatNumber(result.costIQD)} IQD
                  </Text>
                  <Text style={s.totalValueUSD}>
                    ${result.costUSD} USD
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {result && result.error && (
          <View style={s.errorCard}>
            <Text style={[s.errorText, isRTL && s.textRTL]}>
              ⚠️ {result.error}
            </Text>
          </View>
        )}

        {/* Info Banner */}
        <View style={s.infoBanner}>
          <Text style={[s.infoText, isRTL && s.textRTL]}>
            ℹ️ {copy.info}
          </Text>
        </View>

        {/* Add to Project Button */}
        {result && !result.error && activeProjectId && onAddToProject && (
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: spacing.md, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 20 }}
            onPress={() => {
              const fromStr = getCityName(fromCity);
              const toStr = getCityName(toCity);
              const label = `${fromStr} ➜ ${toStr}`;
              onAddToProject([], lang === 'ar' ? 'تكلفة التوصيل' : lang === 'ku' ? 'تێچووی گەیاندن' : 'Delivery Cost', { label, costUSD: result.costUSD });
            }}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 18 }}>📁</Text>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{lang === 'ar' ? 'إضافة إلى المشروع' : lang === 'ku' ? 'زیادکردن بۆ پ\u0631ۆژە' : 'Add to Project'}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {renderCityPicker(true)}
      {renderCityPicker(false)}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === "android" ? 40 : 0,
    paddingBottom: spacing.xl,
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
  backBtn: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  backBtnText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: "700",
  },
  headerTitle: {
    ...typography.title,
    color: colors.white,
    fontSize: 22,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.accentLight,
    marginTop: 4,
  },
  scrollBody: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  label: {
    ...typography.caption,
    color: colors.darkGray,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  selectBtnText: {
    ...typography.subtitle,
    color: colors.charcoal,
    flex: 1,
  },
  selectBtnPlaceholder: {
    color: colors.mediumGray,
  },
  selectArrow: {
    fontSize: 12,
    color: colors.mediumGray,
    marginLeft: spacing.sm,
  },
  swapBtn: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  swapIcon: {
    fontSize: 18,
    color: colors.accent,
  },
  swapText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
  },
  tonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tonsBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.offWhite,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tonsBtnPlus: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tonsBtnText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.darkGray,
  },
  tonsBtnPlusText: {
    color: colors.white,
  },
  tonsInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    height: 44,
    textAlign: "center",
    ...typography.subtitle,
    color: colors.charcoal,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  catChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  catIcon: { fontSize: 16 },
  catText: {
    ...typography.caption,
    color: colors.darkGray,
    fontWeight: "600",
  },
  catTextActive: {
    color: colors.white,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.cardLifted,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  resultTitle: {
    ...typography.title,
    color: colors.charcoal,
  },
  routeBadge: {
    backgroundColor: "#EBF5FF",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  routeBadgeText: {
    ...typography.tiny,
    color: colors.info,
    fontWeight: "700",
  },
  routeVisual: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  routeCity: {
    alignItems: "center",
    flex: 1,
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    marginBottom: spacing.xs,
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.card,
  },
  routeDotEnd: {
    backgroundColor: colors.error,
  },
  routeCityText: {
    ...typography.tiny,
    color: colors.darkGray,
    fontWeight: "700",
    textAlign: "center",
  },
  routeLine: {
    flex: 2,
    height: 2,
    backgroundColor: colors.lightGray,
    marginHorizontal: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 14,
  },
  routeDistText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "800",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    position: "absolute",
    top: -8,
  },
  costBreakdown: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  costLabel: {
    ...typography.body,
    color: colors.darkGray,
  },
  costValue: {
    ...typography.subtitle,
    color: colors.charcoal,
    fontWeight: "700",
  },
  costDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    ...typography.subtitle,
    color: colors.charcoal,
    fontWeight: "800",
  },
  totalValueIQD: {
    ...typography.title,
    color: colors.accent,
    fontWeight: "800",
  },
  totalValueUSD: {
    ...typography.caption,
    color: colors.mediumGray,
    marginTop: 2,
  },
  errorCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  infoBanner: {
    backgroundColor: "#EBF5FF",
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoText: {
    ...typography.caption,
    color: colors.info,
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pickerContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl * 1.5,
    borderTopRightRadius: radius.xl * 1.5,
    maxHeight: "80%",
    paddingTop: spacing.md,
    ...shadows.bottomBar,
  },
  grabber: {
    width: 40,
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  pickerTitle: {
    ...typography.title,
    color: colors.charcoal,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.offWhite,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 16,
    color: colors.darkGray,
    fontWeight: "bold",
  },
  searchInput: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.charcoal,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cityList: {
    paddingHorizontal: spacing.xl,
  },
  regionLabel: {
    ...typography.caption,
    color: colors.mediumGray,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cityItemActive: {
    backgroundColor: "#FFF9EB",
    borderColor: colors.accentLight,
  },
  cityItemText: {
    ...typography.body,
    color: colors.charcoal,
    fontWeight: "500",
    flex: 1,
  },
  cityItemTextActive: {
    color: colors.accentDark,
    fontWeight: "700",
  },
  capitalBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginHorizontal: spacing.xs,
  },
  capitalBadgeText: {
    ...typography.tiny,
    color: colors.white,
    fontWeight: "700",
  },
  checkMark: {
    color: colors.accentDark,
    fontSize: 14,
    fontWeight: "bold",
  },
});
