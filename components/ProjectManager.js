import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { colors, darkColors, spacing, radius, typography, shadows } from "../styles/theme";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useExchangeRate } from "../contexts/ExchangeRateContext";

const STORAGE_KEY = "costMaterialProjects";

export default function ProjectManager({
  onBack,
  onLoadProject,
  onGoToStore,
  onGoToDelivery,
  onGoToEstimation,
  currentQuantities,
  materials,
  projects,
  setProjects,
}) {
  const { t, lang, isRTL } = useLanguage();
  const { isDark } = useTheme();
  const tc = isDark ? darkColors : colors;
  const { rate } = useExchangeRate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectNote, setProjectNote] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null); // For update/resave

  const copy = useMemo(
    () =>
      lang === "ku"
        ? {
            title: "بەڕێوەبردنی پڕۆژەکان",
            subtitle: "پڕۆژەکانت بپارێزە و بەڕێوەببە",
            create: "پڕۆژەیەکی نوێ دروست بکە",
            name: "ناوی پڕۆژە",
            note: "تێبینی (دلخوازانە)",
            save: "پاشەکەوتکردن",
            update: "نوێکردنەوە",
            cancel: "هەڵوەشاندنەوە",
            delete: "سڕینەوە",
            load: "کردنەوە",
            saveUpdate: "پاشەکەوتی نوێ",
            noProjects: "هیچ پڕۆژەیەکت نییە. دەستبکە بە دروستکردنی یەکێک!",
            date: "بەروار",
            items: "بڕگە",
            totalCost: "کۆی تێچوو",
            namePlaceholder: "ناوی پڕۆژەکەت بنووسە...",
            notePlaceholder: "تێبینی...",
            projectCreated: "پڕۆژە پاشەکەوت کرا!",
            projectUpdated: "پڕۆژە نوێ کرایەوە!",
            projectDeleted: "پڕۆژە سڕایەوە",
            confirmDelete: "دڵنیایت لە سڕینەوەی ئەم پڕۆژەیە؟",
            yes: "بەڵێ",
            no: "نەخێر",
            saveCurrent: "هەڵبژاردنی ئێستا پاشەکەوت بکە",
            back: "گەڕانەوە",
            quickLinks: "ئامرازەکان",
            goStore: "فرۆشگا",
            goDelivery: "گەیاندن",
            goEstimation: "خەمڵاندن",
            noItems: "هیچ بابەتێکت هەڵنەبژاردووە. سەرەتا بابەت هەڵبژێرە!",
            goToStore: "بڕۆ بۆ فرۆشگا",
            exportPdf: "دەرهێنانی PDF",
          }
        : {
            title: "Project Manager",
            subtitle: "Save and manage your construction projects",
            create: "Create New Project",
            name: "Project Name",
            note: "Note (optional)",
            save: "Save",
            update: "Update",
            cancel: "Cancel",
            delete: "Delete",
            load: "Load",
            saveUpdate: "Save Update",
            noProjects: "No projects yet. Start by creating one!",
            date: "Date",
            items: "items",
            totalCost: "Total Cost",
            namePlaceholder: "Enter project name...",
            notePlaceholder: "Add a note...",
            projectCreated: "Project saved!",
            projectUpdated: "Project updated!",
            projectDeleted: "Project deleted",
            confirmDelete: "Are you sure you want to delete this project?",
            yes: "Yes",
            no: "No",
            saveCurrent: "Save current selection",
            back: "Back",
            quickLinks: "Quick Tools",
            goStore: "Store",
            goDelivery: "Delivery",
            goEstimation: "Estimation",
            noItems: "No items selected yet. Select items first!",
            goToStore: "Go to Store",
            exportPdf: "Export PDF",
          },
    [lang]
  );

  const formatNumber = (num) =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const currentItemCount = Object.values(currentQuantities).filter((v) => v > 0).length;

  const saveProjects = useCallback(
    async (newProjects) => {
      setProjects(newProjects);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
    },
    [setProjects]
  );

  const createProject = useCallback(async () => {
    if (!projectName.trim()) return;
    if (currentItemCount === 0) {
      Alert.alert("⚠️", copy.noItems);
      return;
    }

    // Gather selected items
    const selectedItems = [];
    let totalCost = 0;
    materials.forEach((m) => {
      const qty = currentQuantities[m.id] || 0;
      if (qty > 0) {
        selectedItems.push({ id: m.id, qty });
        totalCost += m.basePrice * qty;
      }
    });

    const newProject = {
      id: Date.now().toString(),
      name: projectName.trim(),
      note: projectNote.trim(),
      date: new Date().toISOString(),
      items: selectedItems,
      totalCostUSD: totalCost,
    };

    const updated = [newProject, ...projects];
    await saveProjects(updated);
    setProjectName("");
    setProjectNote("");
    setShowCreateModal(false);
    Alert.alert("✅", copy.projectCreated);
  }, [projectName, projectNote, currentQuantities, materials, projects, saveProjects, copy, currentItemCount]);

  // Update existing project with current selections
  const updateProject = useCallback(
    async (projectId) => {
      if (currentItemCount === 0) {
        Alert.alert("⚠️", copy.noItems);
        return;
      }

      const selectedItems = [];
      let totalCost = 0;
      materials.forEach((m) => {
        const qty = currentQuantities[m.id] || 0;
        if (qty > 0) {
          selectedItems.push({ id: m.id, qty });
          totalCost += m.basePrice * qty;
        }
      });

      const updated = projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              items: selectedItems,
              totalCostUSD: totalCost,
              date: new Date().toISOString(),
            }
          : p
      );
      await saveProjects(updated);
      Alert.alert("✅", copy.projectUpdated);
    },
    [currentQuantities, materials, projects, saveProjects, copy, currentItemCount]
  );

  const deleteProject = useCallback(
    (id) => {
      Alert.alert("🗑️", copy.confirmDelete, [
        { text: copy.no, style: "cancel" },
        {
          text: copy.yes,
          style: "destructive",
          onPress: async () => {
            const updated = projects.filter((p) => p.id !== id);
            await saveProjects(updated);
            if (expandedId === id) setExpandedId(null);
          },
        },
      ]);
    },
    [projects, saveProjects, copy, expandedId]
  );

  const loadProject = useCallback(
    (project) => {
      if (onLoadProject) {
        const quantities = {};
        project.items.forEach((item) => {
          quantities[item.id] = item.qty;
        });
        onLoadProject(quantities);
      }
    },
    [onLoadProject]
  );

  const exportPDF = async (project) => {
    try {
      const dateStr = new Date(project.date).toLocaleDateString();
      const totalIQD = rate ? formatNumber(Math.round(project.totalCostUSD * rate)) : "0";
      
      const html = `
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; direction: ${isRTL ? 'rtl' : 'ltr'}; }
            .header { border-bottom: 2px solid #0a3d62; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { color: #0a3d62; margin: 0 0 10px 0; }
            .meta { color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: ${isRTL ? 'right' : 'left'}; padding: 12px; border-bottom: 2px solid #ddd; color: #0a3d62; }
            td { padding: 12px; border-bottom: 1px solid #eee; text-align: ${isRTL ? 'right' : 'left'}; }
            .total { font-weight: bold; font-size: 18px; color: #0a3d62; padding-top: 20px; text-align: ${isRTL ? 'left' : 'right'}; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Cost Material - Project Estimate</h1>
            <div class="meta">
              <strong>Project:</strong> ${project.name}<br>
              <strong>Date:</strong> ${dateStr}<br>
              ${project.note ? `<strong>Note:</strong> ${project.note}<br>` : ''}
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Cost (est)</th>
              </tr>
            </thead>
            <tbody>
              ${project.items.map(item => {
                const mat = materials.find(m => m.id === item.id);
                const matName = lang === "ku" && mat && mat.nameKU ? mat.nameKU : (mat ? mat.nameEN : "Unknown Item");
                const cost = mat ? Math.round((mat.basePrice * item.qty) * (rate || 1)) : 0;
                return `
                  <tr>
                    <td>${matName}</td>
                    <td>${item.qty}</td>
                    <td>${formatNumber(cost)} IQD</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="total">
            Total Estimated Cost: ${totalIQD} IQD
          </div>
          
          <div style="margin-top: 50px; font-size: 12px; color: #999; text-align: center;">
            Generated by Cost Material App
          </div>
        </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === 'web') {
        // Fallback for web, mostly Print web creates an iframe print prompt automatically, 
        // but if we want to ensure it works, we can just use printAsync
        await Print.printAsync({ html });
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert("PDF Saved", `File saved to: ${uri}`);
        }
      }
    } catch (e) {
      console.warn(e);
      Alert.alert("Error", "Could not generate PDF");
    }
  };

  return (
    <Animated.View
      style={[s.container, { backgroundColor: tc.offWhite }]}
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(300)}
    >
      <View style={[s.header, { backgroundColor: tc.primary }]}>
        <View style={[s.headerRow, isRTL && s.rowRTL]}>
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backBtnText}>{isRTL ? ">" : "<"}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, isRTL && s.textRTL]}>
              📁 {copy.title}
            </Text>
            <Text style={[s.headerSubtitle, isRTL && s.textRTL]}>
              {copy.subtitle}
            </Text>
          </View>
        </View>
      </View>

      {/* ═══ Create / Save Button ═══ */}
      <TouchableOpacity
        style={s.createBtn}
        onPress={() => {
          setEditingId(null);
          setShowCreateModal(true);
        }}
        activeOpacity={0.85}
      >
        <View style={[s.createBtnInner, isRTL && s.rowRTL]}>
          <Text style={s.createBtnIcon}>💾</Text>
          <Text style={s.createBtnText}>{copy.create}</Text>
        </View>
        {currentItemCount > 0 && (
          <View style={s.itemCountBadge}>
            <Text style={s.itemCountBadgeText}>
              {currentItemCount} {copy.items}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ═══ Projects List ═══ */}
      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        {projects.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📂</Text>
            <Text style={[s.emptyText, isRTL && s.textRTL]}>
              {copy.noProjects}
            </Text>
            {currentItemCount === 0 && (
              <TouchableOpacity
                style={s.goStoreBtn}
                onPress={() => onGoToStore && onGoToStore()}
                activeOpacity={0.8}
              >
                <Text style={s.goStoreBtnText}>🏪 {copy.goToStore}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          projects.map((project, idx) => {
            const isExpanded = expandedId === project.id;
            const dateStr = new Date(project.date).toLocaleDateString(
              lang === "ku" ? "en-GB" : undefined
            );
            const itemCount = project.items.length;
            const totalIQD = rate
              ? formatNumber(Math.round(project.totalCostUSD * rate))
              : "";

            return (
              <Animated.View
                key={project.id}
                entering={FadeIn.delay(idx * 60).duration(300)}
              >
                <TouchableOpacity
                  style={[s.projectCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }, isExpanded && s.projectCardExpanded]}
                  onPress={() =>
                    setExpandedId(isExpanded ? null : project.id)
                  }
                  activeOpacity={0.8}
                >
                  <View style={[s.projectHeader, isRTL && s.rowRTL]}>
                    <View style={s.projectIconWrap}>
                      <Text style={s.projectIcon}>🏗️</Text>
                    </View>
                    <View
                      style={[
                        s.projectInfo,
                        isRTL && { alignItems: "flex-end" },
                      ]}
                    >
                      <Text
                        style={[s.projectName, isRTL && s.textRTL]}
                        numberOfLines={1}
                      >
                        {project.name}
                      </Text>
                      <Text style={[s.projectMeta, isRTL && s.textRTL]}>
                        {dateStr} • {itemCount} {copy.items}
                      </Text>
                      {totalIQD ? (
                        <Text style={[s.projectCost, isRTL && s.textRTL]}>
                          {totalIQD} IQD
                        </Text>
                      ) : null}
                      {project.note ? (
                        <Text
                          style={[s.projectNote, isRTL && s.textRTL]}
                          numberOfLines={1}
                        >
                          📝 {project.note}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={s.expandIcon}>
                      {isExpanded ? "▲" : "▼"}
                    </Text>
                  </View>

                  {isExpanded && (
                    <View style={s.expandedContent}>
                      {/* ═══ Quick Navigation Icons ═══ */}
                      <View style={s.projectQuickLinksWrap}>
                        <Text style={[s.quickLinksLabel, isRTL && s.textRTL]}>
                          {copy.quickLinks}
                        </Text>
                        <View style={[s.quickLinksRow, isRTL && s.rowRTL]}>
                          <TouchableOpacity
                            style={s.quickLinkBtn}
                            onPress={() => onGoToStore && onGoToStore(project.id)}
                            activeOpacity={0.8}
                          >
                            <View style={[s.quickLinkIcon, { backgroundColor: "#EBF5FF" }]}>
                              <Text style={s.quickLinkEmoji}>🏪</Text>
                            </View>
                            <Text style={s.quickLinkText}>{copy.goStore}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={s.quickLinkBtn}
                            onPress={() => onGoToDelivery && onGoToDelivery(project.id)}
                            activeOpacity={0.8}
                          >
                            <View style={[s.quickLinkIcon, { backgroundColor: "#ECFDF5" }]}>
                              <Text style={s.quickLinkEmoji}>🚛</Text>
                            </View>
                            <Text style={s.quickLinkText}>{copy.goDelivery}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={s.quickLinkBtn}
                            onPress={() => onGoToEstimation && onGoToEstimation(project.id)}
                            activeOpacity={0.8}
                          >
                            <View style={[s.quickLinkIcon, { backgroundColor: "#FFF7ED" }]}>
                              <Text style={s.quickLinkEmoji}>📐</Text>
                            </View>
                            <Text style={s.quickLinkText}>{copy.goEstimation}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {project.deliveryStr && (
                        <View style={s.itemsList}>
                          <Text style={[s.itemName, isRTL && s.textRTL, {fontWeight: 'bold', marginBottom: 4}]}>
                            {lang === "ku" ? "گەیاندن (خەمڵێندراو):" : "Delivery (Est):"}
                          </Text>
                          <Text style={[s.itemQty, isRTL && s.textRTL, {marginLeft: 0, fontWeight: 'normal', color: colors.darkGray}]}>{project.deliveryStr}</Text>
                        </View>
                      )}
                      
                      {project.estimations && Object.keys(project.estimations).length > 0 && (
                        <View style={s.itemsList}>
                          <Text style={[s.itemName, isRTL && s.textRTL, {fontWeight: 'bold', marginBottom: 6}]}>
                            {lang === "ku" ? "کەرەستە خەمڵێندراوەکان:" : "Estimations:"}
                          </Text>
                          {Object.values(project.estimations).map((estStr, i) => (
                             <Text key={i} style={[s.itemQty, isRTL && s.textRTL, {marginLeft: 0, fontWeight: '500', color: colors.darkGray, marginBottom: 4}]}>• {estStr}</Text>
                          ))}
                        </View>
                      )}

                      {/* Items summary */}
                      <View style={s.itemsList}>
                        {project.items.slice(0, 8).map((item) => {
                          const mat = materials.find(
                            (m) => m.id === item.id
                          );
                          if (!mat) return null;
                          return (
                            <View
                              key={item.id}
                              style={[s.itemRow, isRTL && s.rowRTL]}
                            >
                              <Text
                                style={[s.itemName, isRTL && s.textRTL]}
                                numberOfLines={1}
                              >
                                {lang === "ku" ? mat.nameKU : mat.nameEN}
                              </Text>
                              <Text style={s.itemQty}>×{item.qty}</Text>
                            </View>
                          );
                        })}
                        {project.items.length > 8 && (
                          <Text style={s.moreItems}>
                            +{project.items.length - 8} {lang === "ku" ? "زیاتر" : "more"}
                          </Text>
                        )}
                      </View>

                      {/* Actions */}
                      <View style={[s.actionRow, isRTL && s.rowRTL]}>
                        <TouchableOpacity
                          style={s.loadBtn}
                          onPress={() => loadProject(project)}
                          activeOpacity={0.7}
                        >
                          <Text style={s.loadBtnText}>
                            📂 {copy.load}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={s.updateBtn}
                          onPress={() => updateProject(project.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={s.updateBtnText}>
                            💾 {copy.saveUpdate}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={s.exportBtn}
                          onPress={() => exportPDF(project)}
                          activeOpacity={0.7}
                        >
                          <Text style={s.exportBtnText}>
                            📄 {copy.exportPdf}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={s.deleteBtn}
                          onPress={() => deleteProject(project.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={s.deleteBtnText}>
                            🗑
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ═══ Create Modal ═══ */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        >
          <TouchableOpacity style={s.modalCard} activeOpacity={1}>
            <Text style={[s.modalTitle, isRTL && s.textRTL]}>
              💾 {copy.create}
            </Text>

            <Text style={[s.inputLabel, isRTL && s.textRTL]}>
              {copy.name}
            </Text>
            <TextInput
              style={[s.input, isRTL && s.textRTL]}
              placeholder={copy.namePlaceholder}
              placeholderTextColor={colors.mediumGray}
              value={projectName}
              onChangeText={setProjectName}
            />

            <Text style={[s.inputLabel, isRTL && s.textRTL]}>
              {copy.note}
            </Text>
            <TextInput
              style={[s.input, s.inputMulti, isRTL && s.textRTL]}
              placeholder={copy.notePlaceholder}
              placeholderTextColor={colors.mediumGray}
              value={projectNote}
              onChangeText={setProjectNote}
              multiline
              numberOfLines={3}
            />

            <View style={[s.selectedSummary, currentItemCount === 0 && s.selectedSummaryWarning]}>
              <Text style={[s.selectedText, isRTL && s.textRTL, currentItemCount === 0 && s.selectedTextWarning]}>
                {currentItemCount > 0
                  ? `${copy.saveCurrent}: ${currentItemCount} ${copy.items}`
                  : `⚠️ ${copy.noItems}`}
              </Text>
              {currentItemCount === 0 && (
                <TouchableOpacity
                  style={s.goStoreSmallBtn}
                  onPress={() => {
                    setShowCreateModal(false);
                    onGoToStore && onGoToStore();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={s.goStoreSmallBtnText}>🏪 {copy.goToStore}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[s.modalActions, isRTL && s.rowRTL]}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setShowCreateModal(false)}
                activeOpacity={0.7}
              >
                <Text style={s.cancelBtnText}>{copy.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.saveBtn,
                  (!projectName.trim() || currentItemCount === 0) && s.saveBtnDisabled,
                ]}
                onPress={createProject}
                disabled={!projectName.trim() || currentItemCount === 0}
                activeOpacity={0.85}
              >
                <Text style={s.saveBtnText}>💾 {copy.save}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  headerSubtitle: {
    ...typography.caption,
    color: colors.accentLight,
    marginTop: 4,
  },
  // Quick navigation links
  projectQuickLinksWrap: {
    marginBottom: spacing.md,
  },
  quickLinksLabel: {
    ...typography.caption,
    color: colors.darkGray,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  quickLinksRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  quickLinkBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  quickLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  quickLinkEmoji: { fontSize: 22 },
  quickLinkText: {
    ...typography.tiny,
    color: colors.darkGray,
    fontWeight: "700",
    textAlign: "center",
  },
  // Create button
  createBtn: {
    backgroundColor: colors.accent,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    ...shadows.cardLifted,
  },
  createBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  createBtnIcon: { fontSize: 20 },
  createBtnText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: "800",
  },
  itemCountBadge: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  itemCountBadgeText: {
    ...typography.tiny,
    color: colors.white,
    fontWeight: "700",
  },
  // List
  list: { flex: 1, marginTop: spacing.md },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: spacing.xxxl * 2,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.body, color: colors.mediumGray, textAlign: "center", marginBottom: spacing.lg },
  goStoreBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  goStoreBtnText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: "700",
  },
  // Project cards
  projectCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  projectCardExpanded: {
    borderColor: colors.accent,
    ...shadows.cardLifted,
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  projectIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.offWhite,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  projectIcon: { fontSize: 22 },
  projectInfo: { flex: 1 },
  projectName: {
    ...typography.subtitle,
    color: colors.charcoal,
    fontWeight: "700",
  },
  projectMeta: {
    ...typography.tiny,
    color: colors.mediumGray,
    marginTop: 2,
  },
  projectCost: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "700",
    marginTop: 2,
  },
  projectNote: {
    ...typography.tiny,
    color: colors.darkGray,
    marginTop: 2,
    fontStyle: "italic",
  },
  expandIcon: {
    fontSize: 12,
    color: colors.mediumGray,
    marginLeft: spacing.sm,
  },
  expandedContent: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.lg,
  },
  itemsList: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemName: {
    ...typography.caption,
    color: colors.darkGray,
    flex: 1,
  },
  itemQty: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  moreItems: {
    ...typography.tiny,
    color: colors.mediumGray,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  loadBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  loadBtnText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
  },
  updateBtn: {
    flex: 1,
    backgroundColor: "#ECFDF5",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  updateBtnText: {
    ...typography.caption,
    color: "#059669",
    fontWeight: "700",
  },
  exportBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  exportBtnText: {
    ...typography.caption,
    color: "#4B5563",
    fontWeight: "700",
  },
  deleteBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    fontSize: 16,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.cardLifted,
  },
  modalTitle: {
    ...typography.title,
    color: colors.charcoal,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.darkGray,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.charcoal,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  selectedSummary: {
    backgroundColor: "#EBF5FF",
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  selectedSummaryWarning: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
  },
  selectedText: {
    ...typography.caption,
    color: colors.info,
    fontWeight: "600",
  },
  selectedTextWarning: {
    color: "#D97706",
  },
  goStoreSmallBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
  },
  goStoreSmallBtnText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.offWhite,
    alignItems: "center",
  },
  cancelBtnText: {
    ...typography.subtitle,
    color: colors.darkGray,
    fontWeight: "600",
  },
  saveBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    ...shadows.card,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: "700",
  },
});
