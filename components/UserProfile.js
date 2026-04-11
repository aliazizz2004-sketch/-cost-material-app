import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Switch,
  Platform,
  Linking,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { colors, darkColors, spacing, typography, radius, shadows } from '../styles/theme';
import AppIcon from './AppIcon';

const PROFILE_KEY = 'costMaterialUserProfile';

function SubpageWrapper({ title, onBack, isDark, tc, isRTL, children }) {
  const c = isDark ? darkColors : colors;
  return (
    <Animated.View style={[sp.container, { backgroundColor: tc.offWhite }]} entering={FadeIn.duration(280)}>
      <StatusBar barStyle="light-content" backgroundColor={tc.primary} />
      <View style={[sp.header, { backgroundColor: tc.primary }]}>
        <SafeAreaView>
          <View style={[sp.headerRow, isRTL && sp.rowRTL]}>
            <TouchableOpacity onPress={onBack} style={sp.backBtn} activeOpacity={0.75}>
              <Text style={sp.backSymbol}>{isRTL ? '›' : '‹'}</Text>
            </TouchableOpacity>
            <Text style={[sp.headerTitle, isRTL && sp.textRTL]}>{title}</Text>
          </View>
        </SafeAreaView>
      </View>
      <ScrollView contentContainerStyle={sp.scrollContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </Animated.View>
  );
}

export default function UserProfile({ onBack, projects }) {
  const { lang, setLang, isRTL } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const tc = isDark ? darkColors : colors;

  const [page, setPage] = useState('main');

  // stored profile state
  const [profileName, setProfileName] = useState('Eng. Ahmed Al-Rashid');
  const [profileRole, setProfileRole] = useState('Civil Engineer');
  const [profileLocation, setProfileLocation] = useState('Erbil, Kurdistan Region');
  const [profilePhone, setProfilePhone] = useState('+964 750 000 0000');
  const [profileSaved, setProfileSaved] = useState(false);

  // notification toggles
  const [notifPriceAlerts, setNotifPriceAlerts] = useState(true);
  const [notifProjectUpdates, setNotifProjectUpdates] = useState(true);
  const [notifNewMaterials, setNotifNewMaterials] = useState(false);
  const [notifCommunity, setNotifCommunity] = useState(true);

  // Help center state
  const [openFaq, setOpenFaq] = useState(null);

  // Load profile from storage once
  useState(() => {
    AsyncStorage.getItem(PROFILE_KEY).then(v => {
      if (v) {
        try {
          const p = JSON.parse(v);
          if (p.name) setProfileName(p.name);
          if (p.role) setProfileRole(p.role);
          if (p.location) setProfileLocation(p.location);
          if (p.phone) setProfilePhone(p.phone);
        } catch (e) {}
      }
    });
  });

  const saveProfile = async () => {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({
      name: profileName, role: profileRole, location: profileLocation, phone: profilePhone,
    }));
    setProfileSaved(true);
    setTimeout(() => { setProfileSaved(false); setPage('main'); }, 1200);
  };

  const totalProjects = projects?.length || 0;
  const totalEstimatesCost = useMemo(() =>
    projects?.reduce((sum, p) => sum + (p.totalCostUSD || 0), 0) || 0,
  [projects]);

  const ku = lang === 'ku';
  const ar = lang === 'ar';

  const copy = {
    title: ar ? 'الملف الشخصي والحساب' : ku ? 'هەژمار و پرۆفایل' : 'Profile & Account',
    editProfile: ar ? 'تعديل الملف الشخصي' : ku ? 'دەستکاریکردنی پرۆفایل' : 'Edit Profile',
    notifications: ar ? 'الإشعارات' : ku ? 'ئاگادارکردنەوەکان' : 'Notifications',
    security: ar ? 'الأمان والخصوصية' : ku ? 'پاراستن و نهێنی' : 'Security & Privacy',
    subscription: ar ? 'الاشتراك' : ku ? 'بەشداریکردن' : 'Subscription',
    helpCenter: ar ? 'مركز المساعدة' : ku ? 'سەنتەری یارمەتی' : 'Help Center',
    aboutUs: ar ? 'معلومات عنا' : ku ? 'دەربارەی ئێمە' : 'About Us',
    language: ar ? 'اللغة' : ku ? 'زمان' : 'Language',
    logout: ar ? 'تسجيل الخروج' : ku ? 'چوونە دەرەوە' : 'Log Out',
    version: ar ? 'إصدار التطبيق ١.٠.٠' : ku ? 'وەشانی ئەپ ١.٠.٠' : 'App Version 1.0.0',
    memberSince: ar ? 'عضو منذ: ٢٠٢٤' : ku ? 'ئەندام لە: ٢٠٢٤' : 'Member since: 2024',
    projects: ar ? 'المشاريع' : ku ? 'پ\u0631ۆژەکان' : 'Projects',
    totalEst: ar ? 'إجمالي التقديرات' : ku ? 'کۆی خەمڵاندن' : 'Total Estimates',
    preferences: ar ? 'الإعدادات' : ku ? '\u0631ێکخستنەکان' : 'Settings',
    save: ar ? 'حفظ التغييرات' : ku ? 'پاشەکەوتکردن' : 'Save Changes',
    saved: ar ? '✓ تم الحفظ' : ku ? '✓ پاشەکەوت کرا' : '✓ Saved!',
    name: ar ? 'الاسم الكامل' : ku ? 'ناو' : 'Full Name',
    role: ar ? 'المهنة' : ku ? 'پیشە' : 'Profession',
    location: ar ? 'الموقع' : ku ? 'شوێن' : 'Location',
    phone: ar ? 'رقم الهاتف' : ku ? 'ژمارەی تەلەفۆن' : 'Phone Number',
    back: ar ? 'رجوع' : ku ? 'گە\u0631انەوە' : 'Back',
  };

  // ─── SUB PAGES ─────────────────────────────────────────────────────────────

  if (page === 'edit') {
    return (
      <SubpageWrapper title={copy.editProfile} onBack={() => setPage('main')} isDark={isDark} tc={tc} isRTL={isRTL}>
        <Animated.View entering={FadeInUp.duration(350).delay(100)} style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          {[
            { label: copy.name, value: profileName, set: setProfileName, placeholder: 'Your full name' },
            { label: copy.role, value: profileRole, set: setProfileRole, placeholder: 'e.g. Civil Engineer' },
            { label: copy.location, value: profileLocation, set: setProfileLocation, placeholder: 'e.g. Erbil, Kurdistan' },
            { label: copy.phone, value: profilePhone, set: setProfilePhone, placeholder: '+964 ...' },
          ].map((field, i) => (
            <View key={field.label} style={[s.fieldGroup, i > 0 && { borderTopWidth: 1, borderTopColor: tc.cardBorder }]}>
              <Text style={[s.fieldLabel, isRTL && s.textRTL, { color: tc.mediumGray }]}>{field.label}</Text>
              <TextInput
                style={[s.fieldInput, isRTL && s.textRTL, { color: tc.charcoal }]}
                value={field.value}
                onChangeText={field.set}
                placeholder={field.placeholder}
                placeholderTextColor={tc.mediumGray}
              />
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(350).delay(200)} style={s.btnSection}>
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: profileSaved ? '#10B981' : colors.accent }]}
            onPress={saveProfile}
            activeOpacity={0.85}
          >
            <Text style={s.saveBtnTxt}>{profileSaved ? copy.saved : copy.save}</Text>
          </TouchableOpacity>
        </Animated.View>
      </SubpageWrapper>
    );
  }

  if (page === 'notifications') {
    const rows = [
      { label: ar ? 'تنبيهات الأسعار' : ku ? 'ئاگادارکردنەوەی نرخ' : 'Price Alerts', sub: ar ? 'إشعار عند تغير أسعار المواد' : ku ? 'دەقی گۆ\u0631انی نرخی مادەکان' : 'Get notified when material prices change', val: notifPriceAlerts, set: setNotifPriceAlerts, color: '#F59E0B' },
      { label: ar ? 'تحديثات المشاريع' : ku ? 'نوێکردنەوەی پ\u0631ۆژە' : 'Project Updates', sub: ar ? 'تحديثات حول مشاريعك المحفوظة' : ku ? 'ئاگادارکردنەوەی پ\u0631ۆژەکانت' : 'Updates about your saved projects', val: notifProjectUpdates, set: setNotifProjectUpdates, color: '#3B82F6' },
      { label: ar ? 'مواد جديدة' : ku ? 'مادەی نوێ' : 'New Materials', sub: ar ? 'عند إضافة مواد جديدة للكتالوج' : ku ? 'کاتێک مادەی نوێ زیاد دەکرێت' : 'When new materials are added to catalog', val: notifNewMaterials, set: setNotifNewMaterials, color: '#10B981' },
      { label: ar ? 'المجتمع' : ku ? 'کۆمەڵگا' : 'Community', sub: ar ? 'الردود على أسئلتك' : ku ? 'وەڵامی پرسیارەکانت' : 'Replies to your Q&A posts', val: notifCommunity, set: setNotifCommunity, color: '#8B5CF6' },
    ];
    return (
      <SubpageWrapper title={copy.notifications} onBack={() => setPage('main')} isDark={isDark} tc={tc} isRTL={isRTL}>
        <Animated.View entering={FadeInUp.duration(350).delay(100)} style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder, paddingVertical: 0 }]}>
          {rows.map((r, i) => (
            <View key={r.label} style={[s.toggleRow, isRTL && s.rowRTL, i > 0 && { borderTopWidth: 1, borderTopColor: tc.cardBorder }]}>
              <View style={[s.toggleIconWrap, { backgroundColor: r.color + '18' }]}>
                <View style={[s.toggleDot, { backgroundColor: r.color }]} />
              </View>
              <View style={[s.toggleText, isRTL && { alignItems: 'flex-end' }]}>
                <Text style={[s.toggleLabel, isRTL && s.textRTL, { color: tc.charcoal }]}>{r.label}</Text>
                <Text style={[s.toggleSub, isRTL && s.textRTL, { color: tc.mediumGray }]}>{r.sub}</Text>
              </View>
              <Switch
                value={r.val}
                onValueChange={r.set}
                trackColor={{ false: '#E2E8F0', true: r.color + '60' }}
                thumbColor={r.val ? r.color : '#CBD5E1'}
              />
            </View>
          ))}
        </Animated.View>
      </SubpageWrapper>
    );
  }

  if (page === 'security') {
    const items = [
      { icon: '🔑', title: ar ? 'تغيير كلمة المرور' : ku ? 'گۆ\u0631ینی وشەی نهێنی' : 'Change Password', sub: ar ? 'أنشئ كلمة مرور قوية' : ku ? 'وشەی نهێنی بەهێزت دروست بکە' : 'Create a strong, unique password' },
      { icon: '📱', title: ar ? 'المصادقة الثنائية' : ku ? 'دوو-جۆر پشت\u0631استکردنەوە' : 'Two-Factor Auth', sub: ar ? 'أمان إضافي لحسابك' : ku ? 'پاراستنی زیاتری هەژمارت' : 'Extra security for your account' },
      { icon: '🔒', title: ar ? 'تشفير البيانات' : ku ? 'داتای ناوە' : 'Data Encryption', sub: ar ? 'جميع بياناتك مشفرة' : ku ? 'هەمووی داتاکانت شیفرەکراوە' : 'All your data is encrypted at rest', active: true },
      { icon: '🗑️', title: ar ? 'حذف الحساب' : ku ? 'س\u0631ینەوەی هەژمار' : 'Delete Account', sub: ar ? 'حذف جميع بياناتك نهائياً' : ku ? 'هەمووی داتاکانت بس\u0631ەوە' : 'Permanently delete all your data', danger: true },
    ];
    return (
      <SubpageWrapper title={copy.security} onBack={() => setPage('main')} isDark={isDark} tc={tc} isRTL={isRTL}>
        <Animated.View entering={FadeInUp.duration(350).delay(100)} style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder, paddingVertical: 0 }]}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={item.title}
              activeOpacity={0.75}
              style={[s.secRow, isRTL && s.rowRTL, i > 0 && { borderTopWidth: 1, borderTopColor: tc.cardBorder }]}
            >
              <View style={[s.secIconWrap, { backgroundColor: item.danger ? '#FEE2E2' : tc.offWhite }]}>
                <Text style={s.secIcon}>{item.icon}</Text>
              </View>
              <View style={[s.secText, isRTL && { alignItems: 'flex-end' }]}>
                <Text style={[s.secTitle, isRTL && s.textRTL, { color: item.danger ? '#DC2626' : tc.charcoal }]}>{item.title}</Text>
                <Text style={[s.secSub, isRTL && s.textRTL, { color: tc.mediumGray }]}>{item.sub}</Text>
              </View>
              {item.active && <View style={s.activeBadge}><Text style={s.activeBadgeText}>{ku ? 'چالاک' : 'Active'}</Text></View>}
              {!item.active && !item.danger && <Text style={{ color: tc.mediumGray }}>{isRTL ? '◀' : '▶'}</Text>}
            </TouchableOpacity>
          ))}
        </Animated.View>
      </SubpageWrapper>
    );
  }

  if (page === 'subscription') {
    return (
      <SubpageWrapper title={copy.subscription} onBack={() => setPage('main')} isDark={isDark} tc={tc} isRTL={isRTL}>
        <Animated.View entering={FadeInUp.duration(350).delay(100)}>
          {/* Current Plan */}
          <View style={[s.premiumCard]}>
            <Text style={s.premiumIcon}>⭐</Text>
            <Text style={s.premiumTitle}>{ar ? 'الخطة المميزة' : ku ? 'پلانی سەرتر' : 'Premium Plan'}</Text>
            <Text style={s.premiumSub}>{ar ? 'جميع الميزات مفتوحة' : ku ? 'هەمووی تایبەتمەندییەکان بەردەستن' : 'All features unlocked'}</Text>
            <View style={s.premiumBadge}><Text style={s.premiumBadgeText}>{ar ? 'نشط' : ku ? 'چالاک' : 'ACTIVE'}</Text></View>
          </View>

          <View style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder, marginTop: spacing.lg }]}>
            {[
              { emoji: '🤖', text: ar ? 'استخدام غير محدود لمهندس الذكاء الاصطناعي' : ku ? 'AI ئەندازیاری ب\u0631ی نامحدود' : 'Unlimited AI Architect usage' },
              { emoji: '📐', text: ar ? 'جميع حاسبات التقدير المهنية' : ku ? 'هەمووی ژمێرەرەکانی پیشەیی' : 'All professional estimators' },
              { emoji: '🥽', text: ar ? 'عارض الواقع المعزز' : ku ? 'بینەری AR' : 'AR Visualizer' },
              { emoji: '💬', text: ar ? 'الوصول لمجتمع الخبراء' : ku ? 'کۆمەڵگای پسپۆ\u0631' : 'Expert community access' },
              { emoji: '📁', text: ar ? 'إدارة مشاريع غير محدودة' : ku ? 'بە\u0631ێوەبردنی پ\u0631ۆژەی بێ سنوور' : 'Unlimited project management' },
            ].map((f, i) => (
              <View key={i} style={[s.fRow, isRTL && s.rowRTL, i > 0 && { borderTopWidth: 1, borderTopColor: tc.cardBorder }]}>
                <Text style={s.fEmoji}>{f.emoji}</Text>
                <Text style={[s.fText, isRTL && s.textRTL, { color: tc.charcoal }]}>{f.text}</Text>
                <Text style={{ color: '#10B981', fontSize: 18 }}>✓</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </SubpageWrapper>
    );
  }

  if (page === 'help') {
    const faqs = [
      { q: ar ? 'كيف أضيف مادة لجدولي؟' : ku ? 'چۆن مادەیەک زیاد بکم بۆ لیستم؟' : 'How do I add a material to my list?', a: ar ? 'اذهب لكتالوج المواد وأضف المادة المطلوبة.' : ku ? 'ب\u0631ۆ بۆ کاتەلۆگ، کارتی مادەکە بکردەوە، ژمارەی پێویست داخل بکە.' : 'Go to the Material Catalog, open a material card and set the quantity. It will appear in your cost bar at the bottom.' },
      { q: ar ? 'كيف يعمل مهندس الذكاء الاصطناعي؟' : ku ? 'AI ئەندازیار چۆن کاردەکات؟' : 'How does AI Architect work?', a: ar ? 'صف مشروعك وسيقوم النظام بتطبيق معايير الكود العراقي و ACI 318 لحساب المواد.' : ku ? 'پ\u0631ۆژەکەت وەسف بکە، AI بەپێی ستانداردی IBC و ACI 318 لیستی مادە دروست دەکات.' : 'Describe your project in text. The AI uses Iraqi Building Code + ACI 318 standards to calculate all material quantities automatically.' },
      { q: ar ? 'من أين يأتي سعر الصرف الحقيقي؟' : ku ? '\u0631ێژەی دراو لە کوێ دێت؟' : 'Where does the exchange rate come from?', a: ar ? 'يتم جلبه تلقائياً من API ويتحدث كل عشر دقائق.' : ku ? 'بە شێوەی خۆکار لە open.er-api.com نوێدەکرێتەوە هەر ١٠ خولەک.' : 'It is fetched automatically from open.er-api.com and refreshed every 10 minutes.' },
      { q: ar ? 'هل بياناتي محفوظة بشكل آمن؟' : ku ? 'ئایا داتاکانم پاشەکەوت دەکرێن؟' : 'Is my data saved?', a: ar ? 'نعم، يتم تخزين كافة التقديرات على جهازك بشكل مباشر ولن تتأثر بإغلاق التطبيق.' : ku ? 'بەڵێ، هەمووی لیستەکان و پ\u0631ۆژەکان لە ئامێرەکەت پاشەکەوت دەکرێن.' : 'Yes, all your lists and projects are saved locally on your device using secure storage.' },
    ];

    return (
      <SubpageWrapper title={copy.helpCenter} onBack={() => setPage('main')} isDark={isDark} tc={tc} isRTL={isRTL}>
        <Animated.View entering={FadeInUp.duration(350).delay(80)}>
          <View style={[s.helpBanner, { backgroundColor: colors.primary }]}>
            <Text style={s.helpBannerIcon}>💬</Text>
            <Text style={[s.helpBannerTitle, isRTL && s.textRTL]}>{ar ? 'كيف يمكننا مساعدتك؟' : ku ? 'چۆن دەتوانین یارمەتیت بدەین؟' : 'How can we help you?'}</Text>
            <Text style={[s.helpBannerSub, isRTL && s.textRTL]}>{ar ? 'تصفح الأسئلة الشائعة في الأسفل' : ku ? 'پرسیارە باوەکان لەخوارەوە ببینە' : 'Browse frequently asked questions below'}</Text>
          </View>

          <View style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder, paddingVertical: 0, marginTop: spacing.lg }]}>
            {faqs.map((faq, i) => (
              <View key={i} style={i > 0 && { borderTopWidth: 1, borderTopColor: tc.cardBorder }}>
                <TouchableOpacity
                  style={[s.faqRow, isRTL && s.rowRTL]}
                  onPress={() => setOpenFaq(openFaq === i ? null : i)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.faqQ, isRTL && s.textRTL, { color: tc.charcoal, flex: 1 }]}>{faq.q}</Text>
                  <Text style={{ color: tc.mediumGray, fontWeight: '700', fontSize: 18 }}>{openFaq === i ? '−' : '+'}</Text>
                </TouchableOpacity>
                {openFaq === i && (
                  <Animated.View entering={FadeIn.duration(200)} style={[s.faqAWrap, { borderTopColor: tc.cardBorder }]}>
                    <Text style={[s.faqA, isRTL && s.textRTL, { color: tc.mediumGray }]}>{faq.a}</Text>
                  </Animated.View>
                )}
              </View>
            ))}
          </View>

          <View style={[s.contactCard, { backgroundColor: tc.card, borderColor: tc.cardBorder, paddingTop: spacing.xl }]}>
            <Text style={[s.contactTitle, isRTL && s.textRTL, { color: tc.charcoal, marginBottom: spacing.sm }]}>
              {ar ? 'تواصل معنا' : ku ? 'پەیوەندی کردن' : 'Contact Us'}
            </Text>
            {[
              { label: 'Instagram', value: 'archi_4li', icon: 'instagram', color: '#E1306C', url: 'https://www.instagram.com/archi_4li' },
              { label: 'Telegram', value: '@Ali010101010109', icon: 'telegram', color: '#0088cc', url: 'https://t.me/Ali010101010109' },
              { label: 'Facebook', value: 'Ali Aziz', icon: 'facebook', color: '#1877F2', url: 'https://www.facebook.com/ali.aziz.hamed' },
              { label: 'Email', value: 'ali.aziz.hamed2005@gmail.com', icon: 'mail', color: '#EA4335', url: 'mailto:ali.aziz.hamed2005@gmail.com' },
            ].map(link => (
              <TouchableOpacity key={link.label} style={[s.socialLink, isRTL && s.rowRTL]} onPress={() => Linking.openURL(link.url).catch(err => console.warn('Cannot open URL:', err))}>
                <View style={[s.socialIconBg, { backgroundColor: link.color + '18' }]}>
                  <AppIcon name={link.icon} size={20} color={link.color} />
                </View>
                <Text style={[s.socialLinkLabel, isRTL && s.textRTL, { color: tc.charcoal, flex: 1 }]} selectable={true}>
                  {link.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </SubpageWrapper>
    );
  }

  if (page === 'about') {
    return (
      <SubpageWrapper title={copy.aboutUs} onBack={() => setPage('main')} isDark={isDark} tc={tc} isRTL={isRTL}>
        <Animated.View entering={FadeInUp.duration(350).delay(80)}>
          <View style={[s.contactCard, { backgroundColor: tc.card, borderColor: tc.cardBorder, paddingTop: spacing.xl }]}>
            <View style={{alignItems: 'center', marginBottom: spacing.md}}>
               <Text style={[s.contactTitle, { color: tc.charcoal }]}>{ar ? 'المالك والمطور' : ku ? 'خاوەن و دروستکەر' : 'Creator & Developer'}</Text>
               <Text style={[s.contactSub, { color: tc.mediumGray, marginTop: 4, fontWeight: '600' }]}>Ali Aziz Hamed</Text>
            </View>
            <View style={{width: '100%', height: 1, backgroundColor: tc.cardBorder, marginBottom: spacing.md}} />
            {[
              { label: 'Instagram', value: 'archi_4li', icon: 'instagram', color: '#E1306C', url: 'https://www.instagram.com/archi_4li' },
              { label: 'Telegram', value: '@Ali010101010109', icon: 'telegram', color: '#0088cc', url: 'https://t.me/Ali010101010109' },
              { label: 'Facebook', value: 'Ali Aziz', icon: 'facebook', color: '#1877F2', url: 'https://www.facebook.com/ali.aziz.hamed' },
              { label: 'Email', value: 'ali.aziz.hamed2005@gmail.com', icon: 'mail', color: '#EA4335', url: 'mailto:ali.aziz.hamed2005@gmail.com' },
            ].map(link => (
              <TouchableOpacity key={link.label} style={[s.socialLink, isRTL && s.rowRTL]} onPress={() => Linking.openURL(link.url).catch(err => console.warn('Cannot open URL:', err))}>
                <View style={[s.socialIconBg, { backgroundColor: link.color + '18' }]}>
                  <AppIcon name={link.icon} size={20} color={link.color} />
                </View>
                <Text style={[s.socialLinkLabel, isRTL && s.textRTL, { color: tc.charcoal, flex: 1 }]} selectable={true}>
                  {link.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </SubpageWrapper>
    );
  }

  if (page === 'language') {
    return (
      <SubpageWrapper title={copy.language} onBack={() => setPage('main')} isDark={isDark} tc={tc} isRTL={isRTL}>
        <Animated.View entering={FadeInUp.duration(350).delay(80)}>
          <View style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            {[
              { id: 'en', label: 'English', sub: 'US/UK', icon: '🇺🇸' },
              { id: 'ku', label: 'کوردی', sub: 'Sorani', icon: '☀️' },
              { id: 'ar', label: 'عربي', sub: 'Iraqi', icon: '🇮🇶' }
            ].map((lng, idx) => (
              <TouchableOpacity
                key={lng.id}
                style={[s.optRow, isRTL && s.rowRTL, idx < 2 && { borderBottomWidth: 1, borderBottomColor: tc.cardBorder }, { paddingVertical: spacing.md }]}
                onPress={() => setLang(lng.id)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 24, marginHorizontal: spacing.sm }}>{lng.icon}</Text>
                <View style={{ flex: 1, marginHorizontal: spacing.md, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <Text style={[{ fontSize: 16, fontWeight: '700', color: tc.charcoal }, isRTL && s.textRTL]}>{lng.label}</Text>
                  <Text style={[{ fontSize: 13, color: tc.mediumGray }, isRTL && s.textRTL]}>{lng.sub}</Text>
                </View>
                {lang === lng.id && <AppIcon name="checklist" size={24} color={colors.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </SubpageWrapper>
    );
  }

  // ─── MAIN PROFILE PAGE ──────────────────────────────────────────────────────
  const settingsOptions = [
    { id: 'edit',          icon: '👤', label: copy.editProfile,    color: '#3B82F6' },
    { id: 'language',      icon: '🌐', label: copy.language,       color: '#14B8A6' },
    { id: 'notifications', icon: '🔔', label: copy.notifications,  color: '#F59E0B' },
    { id: 'security',      icon: '🔒', label: copy.security,       color: '#10B981' },
    { id: 'subscription',  icon: '⭐', label: copy.subscription,   color: '#8B5CF6', badge: ar ? 'مميز' : ku ? 'سەرتر' : 'Premium' },
    { id: 'help',          icon: '💬', label: copy.helpCenter,     color: '#6366F1' },
    { id: 'about',         icon: 'ℹ️', label: copy.aboutUs,        color: '#06b6d4' },
  ];

  return (
    <Animated.View style={[s.container, { backgroundColor: tc.offWhite }]} entering={FadeIn.duration(380)}>
      <StatusBar barStyle="light-content" backgroundColor={tc.primary} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: tc.primary }]}>
        <SafeAreaView>
          <View style={[s.headerRow, isRTL && s.rowRTL]}>
            <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
              <Text style={s.backSymbol}>{isRTL ? '›' : '‹'}</Text>
            </TouchableOpacity>
            <Text style={[s.headerTitle, isRTL && s.textRTL]}>{copy.title}</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Avatar & Identity Card ── */}
        <Animated.View entering={FadeInDown.duration(420).delay(80)} style={s.profileCardWrap}>
          <View style={[s.profileCard, { backgroundColor: tc.primary }]}>
            {/* Background pattern dots */}
            <View style={s.patternDot1} />
            <View style={s.patternDot2} />

            <View style={s.avatarRing}>
              <View style={[s.avatarInner, { backgroundColor: tc.primary + '22' }]}>
                <Text style={s.avatarLetter}>
                  {profileName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={[s.pcName, isRTL && s.textRTL]}>{profileName}</Text>
            <Text style={[s.pcRole, isRTL && s.textRTL]}>{profileRole}</Text>
            <View style={[s.pcLocation, isRTL && { flexDirection: 'row-reverse' }]}>
              <Text style={s.pcLocationIcon}>📍</Text>
              <Text style={[s.pcLocationText, isRTL && s.textRTL]}>{profileLocation}</Text>
            </View>

            <View style={s.pcDivider} />

            <View style={[s.pcStats, isRTL && s.rowRTL]}>
              <View style={s.pcStat}>
                <Text style={s.pcStatNum}>{totalProjects}</Text>
                <Text style={s.pcStatLabel}>{copy.projects}</Text>
              </View>
              <View style={s.pcStatDivider} />
              <View style={s.pcStat}>
                <Text style={s.pcStatNum}>${Math.round(totalEstimatesCost / 1000)}K</Text>
                <Text style={s.pcStatLabel}>{copy.totalEst}</Text>
              </View>
              <View style={s.pcStatDivider} />
              <View style={s.pcStat}>
                <Text style={s.pcStatNum}>2024</Text>
                <Text style={s.pcStatLabel}>{ku ? 'ئەندام لە' : 'Member'}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Settings List ── */}
        <Animated.View entering={FadeInUp.duration(400).delay(160)} style={s.section}>
          <Text style={[s.sectionTitle, isRTL && s.textRTL, { color: tc.charcoal }]}>{copy.preferences}</Text>
          <View style={[s.optGroup, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            {settingsOptions.map((opt, idx) => (
              <TouchableOpacity
                key={opt.id}
                style={[s.optRow, isRTL && s.rowRTL, idx < settingsOptions.length - 1 && { borderBottomWidth: 1, borderBottomColor: tc.cardBorder }]}
                onPress={() => setPage(opt.id)}
                activeOpacity={0.72}
              >
                <View style={[s.optIcon, { backgroundColor: opt.color + '18' }]}>
                  <Text style={s.optIconEmoji}>{opt.icon}</Text>
                </View>
                <Text style={[s.optLabel, isRTL && s.textRTL, { color: tc.charcoal, flex: 1, marginHorizontal: spacing.md }]}>{opt.label}</Text>
                {opt.badge && (
                  <View style={[s.optBadge, { backgroundColor: opt.color + '20', borderColor: opt.color + '40' }]}>
                    <Text style={[s.optBadgeText, { color: opt.color }]}>{opt.badge}</Text>
                  </View>
                )}
                <Text style={[s.optChevron, { color: tc.mediumGray }]}>{isRTL ? '◀' : '▶'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── Logout ── */}
        <Animated.View entering={FadeInUp.duration(400).delay(220)} style={[s.section, { marginBottom: spacing.xl }]}>
          <TouchableOpacity style={s.logoutBtn} activeOpacity={0.8} onPress={onBack}>
            <Text style={s.logoutIcon}>  </Text>
            <Text style={s.logoutText}>{copy.logout}</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={s.footer}>
          <Text style={[s.footerText, { color: tc.mediumGray }]}>{copy.version}</Text>
          <Text style={[s.footerText, { color: tc.mediumGray }]}>{copy.memberSince}</Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

// ─── SubpageWrapper Styles ─────────────────────────────────────────────────────
const sp = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 40 : 0,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  rowRTL: { flexDirection: 'row-reverse' },
  backBtn: { padding: spacing.sm },
  backSymbol: { fontSize: 28, color: '#FFF', fontWeight: '300', lineHeight: 32 },
  headerTitle: { ...typography.hero, color: '#FFF', fontSize: 20 },
  textRTL: { textAlign: 'right' },
  scrollContent: { padding: spacing.xl, paddingBottom: 80 },
});

// ─── Main Styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 40 : 0,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  rowRTL: { flexDirection: 'row-reverse' },
  backBtn: { padding: spacing.sm },
  backSymbol: { fontSize: 28, color: '#FFF', fontWeight: '300', lineHeight: 32 },
  headerTitle: { ...typography.hero, color: '#FFF', fontSize: 20 },
  textRTL: { textAlign: 'right' },
  scrollContent: { paddingBottom: 80 },

  // Profile card
  profileCardWrap: { paddingHorizontal: spacing.xl, marginTop: spacing.xl },
  profileCard: {
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    ...shadows.cardLifted,
  },
  patternDot1: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)' },
  patternDot2: { position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)' },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  avatarInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  avatarLetter: { fontSize: 40, color: '#FFF', fontWeight: '800' },
  pcName: { ...typography.hero, color: '#FFF', fontSize: 22, fontWeight: '800' },
  pcRole: { ...typography.subtitle, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  pcLocation: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: 4 },
  pcLocationIcon: { fontSize: 14 },
  pcLocationText: { ...typography.caption, color: 'rgba(255,255,255,0.65)' },
  pcDivider: { width: '85%', height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: spacing.lg },
  pcStats: { flexDirection: 'row', width: '100%', justifyContent: 'space-evenly' },
  pcStat: { alignItems: 'center', flex: 1 },
  pcStatNum: { ...typography.title, color: '#FFF', fontWeight: '800', fontSize: 18 },
  pcStatLabel: { ...typography.tiny, color: 'rgba(255,255,255,0.6)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  pcStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Settings
  section: { paddingHorizontal: spacing.xl, marginTop: spacing.xl },
  sectionTitle: { ...typography.subtitle, fontSize: 16, marginBottom: spacing.md, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  optGroup: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', ...shadows.card },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
  },
  optIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  optIconEmoji: { fontSize: 20 },
  optLabel: { ...typography.body, fontWeight: '600', fontSize: 15 },
  optBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, marginRight: spacing.sm },
  optBadgeText: { ...typography.tiny, fontWeight: '700' },
  optChevron: { fontSize: 13, fontWeight: '700' },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#FFF1F1',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutIcon: { fontSize: 18, marginRight: spacing.sm },
  logoutText: { ...typography.subtitle, color: '#DC2626', fontWeight: '700' },

  footer: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: 4 },
  footerText: { ...typography.tiny },

  // Shared card
  card: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    ...shadows.card,
  },
  btnSection: { paddingHorizontal: spacing.xl, marginTop: spacing.xl },
  saveBtn: { borderRadius: 50, paddingVertical: 16, alignItems: 'center', ...shadows.cardLifted },
  saveBtnTxt: { ...typography.subtitle, color: '#FFF', fontWeight: '700', fontSize: 16 },

  // Edit profile fields
  fieldGroup: { paddingVertical: spacing.md },
  fieldLabel: { ...typography.tiny, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: '700', marginBottom: spacing.xs },
  fieldInput: { ...typography.body, borderBottomWidth: 1.5, borderBottomColor: colors.accent + '60', paddingVertical: spacing.sm, fontSize: 16 },

  // Notifications
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: spacing.lg, gap: spacing.md },
  toggleIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleDot: { width: 14, height: 14, borderRadius: 7 },
  toggleText: { flex: 1 },
  toggleLabel: { ...typography.body, fontWeight: '600' },
  toggleSub: { ...typography.tiny, marginTop: 2 },

  // Security
  secRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: spacing.lg, gap: spacing.md },
  secIconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  secIcon: { fontSize: 22 },
  secText: { flex: 1 },
  secTitle: { ...typography.body, fontWeight: '600' },
  secSub: { ...typography.tiny, marginTop: 2 },
  activeBadge: { backgroundColor: '#D1FAE5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText: { ...typography.tiny, color: '#065F46', fontWeight: '700' },

  // Subscription
  premiumCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    ...shadows.cardLifted,
  },
  premiumIcon: { fontSize: 48, marginBottom: spacing.sm },
  premiumTitle: { ...typography.hero, color: '#FFF', fontSize: 24, fontWeight: '800' },
  premiumSub: { ...typography.body, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  premiumBadge: { marginTop: spacing.md, backgroundColor: '#4F46E5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  premiumBadgeText: { ...typography.caption, color: '#FFF', fontWeight: '800', letterSpacing: 1 },
  fRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.lg, gap: spacing.md },
  fEmoji: { fontSize: 20 },
  fText: { ...typography.body, fontWeight: '500', flex: 1 },

  // Help
  helpBanner: { marginHorizontal: spacing.xl, borderRadius: 20, padding: spacing.xl, alignItems: 'center' },
  helpBannerIcon: { fontSize: 40, marginBottom: spacing.sm },
  helpBannerTitle: { ...typography.title, color: '#FFF', textAlign: 'center', fontSize: 18 },
  helpBannerSub: { ...typography.body, color: 'rgba(255,255,255,0.7)', marginTop: 4, textAlign: 'center' },
  faqRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.sm },
  faqQ: { ...typography.subtitle, fontWeight: '600', fontSize: 14 },
  faqAWrap: { backgroundColor: 'rgba(0,0,0,0.03)', borderTopWidth: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  faqA: { ...typography.body, lineHeight: 22, marginTop: spacing.sm },
  contactCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.card,
  },
  contactEmoji: { fontSize: 36, marginBottom: spacing.sm },
  contactTitle: { ...typography.title, fontWeight: '700' },
  contactSub: { ...typography.body, marginTop: 4 },
  socialLink: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  socialIconBg: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing.md },
  socialLinkLabel: { ...typography.body, fontWeight: '600', fontSize: 15 },
});
