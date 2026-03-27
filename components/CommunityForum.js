import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { colors, spacing, radius, typography, shadows } from "../styles/theme";
import { useLanguage } from "../contexts/LanguageContext";

const STORAGE_KEY = "costMaterialCommunityPosts";

// Sample seed posts for first-time users
const SEED_POSTS = [
  {
    id: "seed1",
    author: "Ahmad K.",
    authorEmoji: "👷",
    date: "2025-03-15T10:00:00Z",
    questionEN: "Which brand of Isogam is best for flat roofs in Basra's heat?",
    questionKU: "کام براندی ئیسۆگام باشترە بۆ سەربانی تەخت لە گەرمای بەسرە؟",
    answersEN: [
      { author: "Supplier Ali", text: "Try Iranian Isogam Premium — 4mm thickness handles extreme heat well.", emoji: "🏪" },
      { author: "Eng. Saman", text: "Sika SikaLastic-560 is more expensive but guaranteed for 10+ years.", emoji: "🔧" },
    ],
    answersKU: [
      { author: "دابینکار عەلی", text: "ئیسۆگامی ئێرانی پریمیۆم تاقی بکەرەوە - ٤مم ئەستووری بەرگری دەکات لە گەرمی زۆر.", emoji: "🏪" },
      { author: "ئ. سامان", text: "سیکا SikaLastic-560 گرانترە بەڵام ضەمانەتی ١٠+ ساڵی هەیە.", emoji: "🔧" },
    ],
    likes: 12,
    category: "insulation",
  },
  {
    id: "seed2",
    author: "Rawa S.",
    authorEmoji: "🏠",
    date: "2025-03-10T14:30:00Z",
    questionEN: "Is AAC (Ytong) block worth the extra cost compared to regular concrete blocks in Erbil?",
    questionKU: "ئایا بلۆکی AAC (یتۆنگ) تێچووی زیادەکەی بەرزانە بەراورد بە بلۆکی کۆنکریتی ئاسایی لە هەولێر؟",
    answersEN: [
      { author: "Contractor Bakh", text: "Yes, energy savings on AC alone pay for the difference in 2-3 years. Plus faster construction.", emoji: "📐" },
    ],
    answersKU: [
      { author: "پەیمانکار باخ", text: "بەڵێ، پاشەکەوتکردنی وزە لەسەر فرێزەر بەتەنها تێچووی جیاوازییەکە لە ٢-٣ ساڵدا دەداتەوە. لەگەڵ بیناکردنی خێراتر.", emoji: "📐" },
    ],
    likes: 8,
    category: "masonry",
  },
  {
    id: "seed3",
    author: "Sara M.",
    authorEmoji: "👩‍🔧",
    date: "2025-02-28T09:15:00Z",
    questionEN: "What's the current price of steel rebar in Sulaymaniyah? Mass Iron or Med Steel — which is better quality?",
    questionKU: "نرخی ئێستای میلە ئاسن لە سلێمانی چەندە؟ ماس ئایرۆن یان مێد ستیل — کامیان کوالیتی باشترە؟",
    answersEN: [
      { author: "Steel Expert", text: "Currently around 620-680 USD/ton for B500B grade. Mass Iron has more consistent quality control since they have ISO certification.", emoji: "⚙️" },
      { author: "Builder Karim", text: "Both are good. Mass is slightly more expensive but delivery to Suli is faster since the factory is nearby.", emoji: "🏗️" },
    ],
    answersKU: [
      { author: "پسپۆ\u0631ی ئاسن", text: "ئێستا دەوری ٦٢٠-٦٨٠ دۆلار/تۆن بۆ پلەی B500B. ماس ئایرۆن کۆنترۆڵی کوالیتییەکی یەکگرتووتری هەیە چونکی ب\u0631وانامەی ISO ی هەیە.", emoji: "⚙️" },
      { author: "بیناکەر کەریم", text: "هەردووکیان باشن. ماس کەمێک گرانترە بەڵام گەیاندن بۆ سلێمانی خێراترە چونکی کارگەکە نزیکە.", emoji: "🏗️" },
    ],
    likes: 15,
    category: "steel",
  },
];

export default function CommunityForum({ onBack }) {
  const { lang, isRTL } = useLanguage();
  const [posts, setPosts] = useState(SEED_POSTS);
  const [showAsk, setShowAsk] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v) {
        try {
          const saved = JSON.parse(v);
          setPosts([...saved, ...SEED_POSTS]);
        } catch (e) {}
      }
    });
  }, []);

  const copy = useMemo(
    () =>
      lang === "ku"
        ? {
            title: "کۆمەڵگا و پرسیار",
            subtitle: "پرسیار بکە و وەڵامی دابینکاران و ئەندازیاران وەربگرە",
            ask: "پرسیارێکی نوێ بکە",
            placeholder: "پرسیارەکەت بنووسە دەربارەی مادەکانی بیناسازی...",
            submit: "ناردن",
            cancel: "هەڵوەشاندنەوە",
            likes: "پەسەند",
            answers: "وەڵام",
            all: "هەموو",
            noResults: "هیچ پرسیارێک نییە لەم بەشەدا",
            back: "گە\u0631انەوە",
            posted: "پرسیارەکەت ناردرا!",
          }
        : {
            title: "Community Q&A",
            subtitle: "Ask questions and get answers from suppliers & engineers",
            ask: "Ask a Question",
            placeholder: "Write your question about construction materials...",
            submit: "Submit",
            cancel: "Cancel",
            likes: "Likes",
            answers: "Answers",
            all: "All",
            noResults: "No posts in this category",
            back: "Back",
            posted: "Your question has been posted!",
          },
    [lang]
  );

  const categories = [
    { id: "all", label: copy.all, icon: "🏗️" },
    { id: "cement", label: lang === "ku" ? "سمێنت (چیمەنتۆ)" : "Cement", icon: "🏭" },
    { id: "steel", label: lang === "ku" ? "ئاسن" : "Steel", icon: "⚙️" },
    { id: "masonry", label: lang === "ku" ? "بلۆک" : "Blocks", icon: "🧱" },
    { id: "insulation", label: lang === "ku" ? "ئینسولاسیۆن" : "Insulation", icon: "🟧" },
  ];

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "all") return posts;
    return posts.filter((p) => p.category === selectedCategory);
  }, [posts, selectedCategory]);

  const submitQuestion = useCallback(async () => {
    if (!newQuestion.trim()) return;

    const newPost = {
      id: Date.now().toString(),
      author: lang === "ku" ? "بەکارهێنەر نوێ" : "New User",
      authorEmoji: "👤",
      date: new Date().toISOString(),
      questionEN: lang === "ku" ? "" : newQuestion.trim(),
      questionKU: lang === "ku" ? newQuestion.trim() : "",
      answersEN: [],
      answersKU: [],
      likes: 0,
      category: "general",
    };

    const updated = [newPost, ...posts.filter((p) => !p.id.startsWith("seed"))];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPosts([newPost, ...posts]);
    setNewQuestion("");
    setShowAsk(false);
    Alert.alert("✅", copy.posted);
  }, [newQuestion, posts, lang, copy]);

  const likePost = useCallback(
    (postId) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
        )
      );
    },
    []
  );

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
              💬 {copy.title}
            </Text>
            <Text style={[s.headerSubtitle, isRTL && s.textRTL]}>
              {copy.subtitle}
            </Text>
          </View>
        </View>
      </View>

      {/* Ask Button */}
      <TouchableOpacity
        style={s.askBtn}
        onPress={() => setShowAsk(true)}
        activeOpacity={0.85}
      >
        <Text style={s.askBtnText}>❓ {copy.ask}</Text>
      </TouchableOpacity>

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

      {/* Posts */}
      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredPosts.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>💬 {copy.noResults}</Text>
          </View>
        ) : (
          filteredPosts.map((post, idx) => {
            const question =
              lang === "ku"
                ? post.questionKU || post.questionEN
                : post.questionEN || post.questionKU;
            const answers =
              lang === "ku"
                ? post.answersKU?.length > 0
                  ? post.answersKU
                  : post.answersEN
                : post.answersEN?.length > 0
                ? post.answersEN
                : post.answersKU;
            const dateStr = new Date(post.date).toLocaleDateString(
              lang === "ku" ? "en-GB" : undefined
            );

            return (
              <Animated.View
                key={post.id}
                entering={FadeIn.delay(idx * 60).duration(300)}
                style={s.postCard}
              >
                {/* Author */}
                <View style={[s.postAuthor, isRTL && s.rowRTL]}>
                  <View style={s.authorAvatar}>
                    <Text style={s.authorEmoji}>{post.authorEmoji}</Text>
                  </View>
                  <View>
                    <Text style={[s.authorName, isRTL && s.textRTL]}>
                      {post.author}
                    </Text>
                    <Text style={[s.postDate, isRTL && s.textRTL]}>
                      {dateStr}
                    </Text>
                  </View>
                </View>

                {/* Question */}
                <Text style={[s.questionText, isRTL && s.textRTL]}>
                  {question}
                </Text>

                {/* Answers */}
                {answers && answers.length > 0 && (
                  <View style={s.answersWrap}>
                    {answers.map((ans, i) => (
                      <View key={i} style={[s.answerRow, isRTL && s.rowRTL]}>
                        <View style={s.answerAvatar}>
                          <Text style={s.answerAvatarEmoji}>
                            {ans.emoji || "💬"}
                          </Text>
                        </View>
                        <View style={[s.answerContent, isRTL && { alignItems: "flex-end" }]}>
                          <Text
                            style={[s.answerAuthor, isRTL && s.textRTL]}
                          >
                            {ans.author}
                          </Text>
                          <Text
                            style={[s.answerText, isRTL && s.textRTL]}
                          >
                            {ans.text}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Footer */}
                <View style={[s.postFooter, isRTL && s.rowRTL]}>
                  <TouchableOpacity
                    style={[s.likeBtn, isRTL && s.rowRTL]}
                    onPress={() => likePost(post.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.likeIcon}>👍</Text>
                    <Text style={s.likeCount}>{post.likes || 0}</Text>
                  </TouchableOpacity>
                  <View style={[s.answerCount, isRTL && s.rowRTL]}>
                    <Text style={s.answerCountIcon}>💬</Text>
                    <Text style={s.answerCountText}>
                      {(answers || []).length} {copy.answers}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Ask Question Modal */}
      {showAsk && (
        <View style={s.askOverlay}>
          <TouchableOpacity
            style={s.askBackdrop}
            activeOpacity={1}
            onPress={() => setShowAsk(false)}
          />
          <View style={s.askCard}>
            <Text style={[s.askTitle, isRTL && s.textRTL]}>
              ❓ {copy.ask}
            </Text>
            <TextInput
              style={[s.askInput, isRTL && s.textRTL]}
              placeholder={copy.placeholder}
              placeholderTextColor={colors.mediumGray}
              value={newQuestion}
              onChangeText={setNewQuestion}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={[s.askActions, isRTL && s.rowRTL]}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setShowAsk(false)}
                activeOpacity={0.7}
              >
                <Text style={s.cancelBtnText}>{copy.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.submitBtn,
                  !newQuestion.trim() && s.submitBtnDisabled,
                ]}
                onPress={submitQuestion}
                disabled={!newQuestion.trim()}
                activeOpacity={0.85}
              >
                <Text style={s.submitBtnText}>{copy.submit}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === "android" ? 40 : 0,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: spacing.md },
  rowRTL: { flexDirection: "row-reverse" },
  textRTL: { textAlign: "right" },
  backBtn: { padding: spacing.sm, marginRight: spacing.sm },
  backBtnText: { fontSize: 24, color: colors.white, fontWeight: "700" },
  headerTitle: { ...typography.title, color: colors.white, fontSize: 22 },
  headerSubtitle: { ...typography.caption, color: colors.accentLight, marginTop: 4 },
  askBtn: {
    backgroundColor: colors.accent,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    alignItems: "center",
    ...shadows.cardLifted,
  },
  askBtnText: { ...typography.subtitle, color: colors.white, fontWeight: "800" },
  catScroll: { maxHeight: 48, marginTop: spacing.md },
  catRow: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingVertical: spacing.xs },
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
  catChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  catIcon: { fontSize: 14 },
  catText: { ...typography.caption, color: colors.darkGray, fontWeight: "600" },
  catTextActive: { color: colors.white },
  list: { flex: 1, marginTop: spacing.md },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  emptyBox: { paddingVertical: spacing.xxxl * 2, alignItems: "center" },
  emptyText: { ...typography.body, color: colors.mediumGray },
  postCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  postAuthor: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.offWhite,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  authorEmoji: { fontSize: 20 },
  authorName: { ...typography.subtitle, color: colors.charcoal, fontWeight: "700" },
  postDate: { ...typography.tiny, color: colors.mediumGray, marginTop: 1 },
  questionText: {
    ...typography.body,
    color: colors.charcoal,
    lineHeight: 22,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  answersWrap: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  answerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  answerAvatarEmoji: { fontSize: 14 },
  answerContent: { flex: 1 },
  answerAuthor: {
    ...typography.tiny,
    color: colors.accent,
    fontWeight: "700",
    marginBottom: 2,
  },
  answerText: {
    ...typography.caption,
    color: colors.darkGray,
    lineHeight: 18,
  },
  postFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.md,
  },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  likeIcon: { fontSize: 16 },
  likeCount: { ...typography.caption, color: colors.darkGray, fontWeight: "700" },
  answerCount: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  answerCountIcon: { fontSize: 14 },
  answerCountText: { ...typography.tiny, color: colors.mediumGray },
  // Ask modal
  askOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  askBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  askCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.cardLifted,
  },
  askTitle: { ...typography.title, color: colors.charcoal, marginBottom: spacing.lg },
  askInput: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 120,
    ...typography.body,
    color: colors.charcoal,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    lineHeight: 22,
  },
  askActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.offWhite,
    alignItems: "center",
  },
  cancelBtnText: { ...typography.subtitle, color: colors.darkGray, fontWeight: "600" },
  submitBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    ...shadows.card,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { ...typography.subtitle, color: colors.white, fontWeight: "700" },
});
