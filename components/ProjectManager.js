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
import Animated, { FadeIn, FadeOut, FadeInDown, FadeInUp, SlideInRight, ZoomIn } from "react-native-reanimated";
import { ModalEnter, CardEnter, HeroEnter, SmoothLayout } from "./animations";
import { colors, darkColors, spacing, radius, typography, shadows } from "../styles/theme";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useExchangeRate } from "../contexts/ExchangeRateContext";
import AppIcon from "./AppIcon";

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
  onOpenAiCamera,
  setGlobalQuantities,
  onNavigate,
  setActiveProjectId,
  pendingProjectName = "",
  setPendingProjectName,
  pendingProjectNote = "",
  setPendingProjectNote,
}) {
  const { t, lang, isRTL } = useLanguage();
  const { isDark } = useTheme();
  const tc = isDark ? darkColors : colors;
  const { rate } = useExchangeRate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Use lifted state from App.js so name persists across navigation
  const projectName = pendingProjectName;
  const setProjectName = setPendingProjectName || (() => {});
  const projectNote = pendingProjectNote;
  const setProjectNote = setPendingProjectNote || (() => {});
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewProject, setViewProject] = useState(null); // for the open/detail modal

  const copy = useMemo(
    () =>
      lang === "ar"
        ? {
          title: "إدارة المشاريع",
          subtitle: "احفظ وأدر مشاريعك الهندسية",
          create: "إنشاء مشروع جديد",
          name: "اسم المشروع",
          note: "ملاحظة (اختياري)",
          save: "حفظ",
          update: "تحديث",
          cancel: "إلغاء",
          delete: "حذف",
          load: "فتح",
          saveUpdate: "حفظ التحديث",
          noProjects: "لا توجد مشاريع بعد. ابدأ بإنشاء مشروعك الأول!",
          date: "التاريخ",
          items: "عناصر",
          totalCost: "التكلفة الإجمالية",
          namePlaceholder: "أدخل اسم المشروع...",
          notePlaceholder: "تلميحات أو ملاحظات...",
          projectCreated: "تم حفظ المشروع!",
          projectUpdated: "تم تحديث المشروع!",
          projectDeleted: "تم حذف المشروع",
          confirmDelete: "هل أنت متأكد أنك تريد حذف هذا المشروع؟",
          yes: "نعم",
          no: "لا",
          saveCurrent: "حفظ الاختيار الحالي",
          back: "رجوع",
          quickLinks: "الأدوات",
          goStore: "المخزن",
          goDelivery: "التوصيل",
          goEstimation: "الحسابات",
          noItems: "لم يتم اختيار أي مواد. حدد المواد أولاً!",
          goToStore: "الذهاب للمخزن",
          exportPdf: "تصدير PDF",
        }
        : lang === "ku"
        ? {
          title: "بە\u0631ێوەبردنی پ\u0631ۆژەکان",
          subtitle: "پ\u0631ۆژەکانت بپارێزە و بە\u0631ێوەببە",
          create: "پ\u0631ۆژەیەکی نوێ دروست بکە",
          name: "ناوی پ\u0631ۆژە",
          note: "تێبینی (دلخوازانە)",
          save: "پاشەکەوتکردن",
          update: "نوێکردنەوە",
          cancel: "هەڵوەشاندنەوە",
          delete: "س\u0631ینەوە",
          load: "کردنەوە",
          saveUpdate: "پاشەکەوتی نوێ",
          noProjects: "هیچ پ\u0631ۆژەیەکت نییە. دەستبکە بە دروستکردنی یەکێک!",
          date: "بەروار",
          items: "ب\u0631گە",
          totalCost: "کۆی تێچوو",
          namePlaceholder: "ناوی پ\u0631ۆژەکەت بنووسە...",
          notePlaceholder: "تێبینی...",
          projectCreated: "پ\u0631ۆژە پاشەکەوت کرا!",
          projectUpdated: "پ\u0631ۆژە نوێ کرایەوە!",
          projectDeleted: "پ\u0631ۆژە س\u0631ایەوە",
          confirmDelete: "دڵنیایت لە س\u0631ینەوەی ئەم پ\u0631ۆژەیە؟",
          yes: "بەڵێ",
          no: "نەخێر",
          saveCurrent: "هەڵبژاردنی ئێستا پاشەکەوت بکە",
          back: "گە\u0631انەوە",
          quickLinks: "ئامرازەکان",
          goStore: "فرۆشگا",
          goDelivery: "گەیاندن",
          goEstimation: "خەمڵاندن",
          noItems: "هیچ بابەتێکت هەڵنەبژاردووە. سەرەتا بابەت هەڵبژێرە!",
          goToStore: "ب\u0631ۆ بۆ فرۆشگا",
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
    if (setActiveProjectId) setActiveProjectId(newProject.id);
    setProjectName("");
    setProjectNote("");
    setShowCreateModal(false);
    Alert.alert("✅", copy.projectCreated);
  }, [projectName, projectNote, currentQuantities, materials, projects, saveProjects, copy, currentItemCount, setActiveProjectId]);

  // Update existing project with current selections
  const updateProject = useCallback(
    async (projectId) => {
      // No item check needed

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
            totalCostUSD: totalCost + (p.deliveryCostUSD || 0),
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
      const execDelete = async () => {
        const updated = projects.filter((p) => p.id !== id);
        await saveProjects(updated);
        if (expandedId === id) setExpandedId(null);
      };

      if (Platform.OS === 'web') {
        if (window.confirm(copy.confirmDelete)) {
          execDelete();
        }
      } else {
        Alert.alert("🗑️", copy.confirmDelete, [
          { text: copy.no, style: "cancel" },
          {
            text: copy.yes,
            style: "destructive",
            onPress: execDelete,
          },
        ]);
      }
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
            h1 { color: #0a3d62; margin: 0 0 10px 0; font-size: 24px; }
            .meta { color: #666; font-size: 14px; line-height: 1.5; }
            .section-title { color: #0a3d62; font-size: 18px; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { text-align: ${isRTL ? 'right' : 'left'}; padding: 12px; background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; color: #0f172a; font-weight: bold; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: ${isRTL ? 'right' : 'left'}; color: #334155; }
            .total-row { font-weight: bold; background-color: #f1f5f9; }
            .total-row td { color: #0f172a; font-size: 16px; border-top: 2px solid #cbd5e1; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; background: #e2e8f0; font-size: 12px; color: #475569; margin-bottom: 4px; }
            ul { margin-top: 10px; padding-left: 20px; }
            li { color: #475569; margin-bottom: 5px; line-height: 1.4; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${lang === 'ku' ? 'خەمڵاندنی پ\u0631ۆژە' : 'Project Estimate'}</h1>
            <div class="meta">
              <strong>${lang === 'ku' ? 'ناوی پ\u0631ۆژە:' : 'Project:'}</strong> ${project.name}<br>
              <strong>${lang === 'ku' ? 'بەروار:' : 'Date:'}</strong> ${dateStr}<br>
              ${project.note ? `<strong>${lang === 'ku' ? 'تێبینی:' : 'Note:'}</strong> ${project.note}<br>` : ''}
            </div>
          </div>

          <div class="section-title">${lang === 'ku' ? 'لیستی کەرەستەکان' : 'Bill of Materials (BOQ)'}</div>
          <table>
            <thead>
              <tr>
                <th>${lang === 'ku' ? 'ب\u0631گە' : 'Item'}</th>
                <th>${lang === 'ku' ? 'ب\u0631' : 'Qty'}</th>
                <th>${lang === 'ku' ? 'نرخی دانە' : 'Unit Price'}</th>
                <th>${lang === 'ku' ? 'تێک\u0631ای تێچوو' : 'Total Cost'}</th>
              </tr>
            </thead>
            <tbody>
              ${project.items.map(item => {
        const mat = materials.find(m => m.id === item.id);
        const matName = lang === "ku" && mat && mat.nameKU ? mat.nameKU : (mat ? mat.nameEN : "Unknown Item");
        const unitPrice = mat ? Math.round(mat.basePrice * (rate || 1)) : 0;
        const totalCost = mat ? Math.round((mat.basePrice * item.qty) * (rate || 1)) : 0;
        return `
                  <tr>
                    <td>${matName}</td>
                    <td>${item.qty}</td>
                    <td>${formatNumber(unitPrice)} IQD</td>
                    <td>${formatNumber(totalCost)} IQD</td>
                  </tr>
                `;
      }).join('')}
              ${project.deliveryCostUSD ? `
                  <tr>
                    <td><em>${lang === 'ku' ? 'تێچووی گەیاندن' : 'Delivery Cost'}</em></td>
                    <td>-</td>
                    <td>-</td>
                    <td>${formatNumber(Math.round(project.deliveryCostUSD * (rate || 1)))} IQD</td>
                  </tr>
              ` : ''}
              <tr class="total-row">
                <td colspan="3" style="text-align: ${isRTL ? 'left' : 'right'}">${lang === 'ku' ? 'کۆی گشتی تێچوو:' : 'Total Estimated Cost:'}</td>
                <td>${totalIQD} IQD</td>
              </tr>
            </tbody>
          </table>
          
          ${project.deliveryStr ? `
            <div class="section-title">${lang === 'ku' ? 'زانیاری گەیاندن' : 'Delivery Information'}</div>
            <p style="color: #475569; font-size: 14px; margin-top: 10px;">
              <span class="badge">${project.deliveryStr}</span>
            </p>
          ` : ''}

          ${project.estimations && Object.keys(project.estimations).length > 0 ? `
            <div class="section-title">${lang === 'ku' ? 'خەمڵاندنە ئەندازیارییەکان' : 'Engineering Estimations'}</div>
            <ul>
              ${Object.values(project.estimations).map(est => `<li>${est}</li>`).join('')}
            </ul>
          ` : ''}
          
          <div style="margin-top: 50px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            Generated by Cost Material App • ${dateStr}
          </div>
        </body>
        </html>
      `;

      // Natively trigger the print/preview dialog directly for all platforms.
      // This allows the user to preview the generated PDF, select "Save as PDF" (or print),
      // adjust margins, scale, and paper size natively.
      if (Platform.OS === 'web') {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument.write(html);
        iframe.contentDocument.close();
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
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
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
              <AppIcon name="folder" size={24} color={colors.white} />
              <Text style={[s.headerTitle, isRTL && s.textRTL]}>
                {copy.title}
              </Text>
            </View>
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
          <AppIcon name="plus-circle" size={20} color={colors.white} />
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
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <AppIcon name="store" size={16} color={colors.white} />
                  <Text style={s.goStoreBtnText}>{copy.goToStore}</Text>
                </View>
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
                      <AppIcon name="building" size={22} color={tc.primary} />
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
                      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <AppIcon name="file-text" size={12} color={colors.darkGray} />
                        <Text
                          style={[s.projectNote, isRTL && s.textRTL, { marginTop: 0 }]}
                          numberOfLines={1}
                        >
                          {project.note}
                        </Text>
                      </View>
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
                            onPress={(e) => {
                              if (e && e.stopPropagation) e.stopPropagation();
                              if (setActiveProjectId) setActiveProjectId(project.id);
                              if (onGoToStore) onGoToStore(project.id);
                            }}
                            activeOpacity={0.8}
                          >
                            <View style={[s.quickLinkIcon, { backgroundColor: "#EBF5FF" }]}>
                              <AppIcon name="store" size={22} color="#2563EB" />
                            </View>
                            <Text style={s.quickLinkText}>{copy.goStore}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={s.quickLinkBtn}
                            onPress={(e) => {
                              if (e && e.stopPropagation) e.stopPropagation();
                              if (setActiveProjectId) setActiveProjectId(project.id);
                              if (onGoToDelivery) onGoToDelivery(project.id);
                            }}
                            activeOpacity={0.8}
                          >
                            <View style={[s.quickLinkIcon, { backgroundColor: "#ECFDF5" }]}>
                              <AppIcon name="truck" size={22} color="#059669" />
                            </View>
                            <Text style={s.quickLinkText}>{copy.goDelivery}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={s.quickLinkBtn}
                            onPress={(e) => {
                              if (e && e.stopPropagation) e.stopPropagation();
                              if (setActiveProjectId) setActiveProjectId(project.id);
                              if (onGoToEstimation) onGoToEstimation(project.id);
                            }}
                            activeOpacity={0.8}
                          >
                            <View style={[s.quickLinkIcon, { backgroundColor: "#FFF7ED" }]}>
                              <AppIcon name="layers" size={22} color="#EA580C" />
                            </View>
                            <Text style={s.quickLinkText}>{copy.goEstimation}</Text>
                          </TouchableOpacity>
                        </View>
                        
                        {/* ═══ AI Tools (Project Context) ═══ */}
                        <Text style={[s.quickLinksLabel, isRTL && s.textRTL, { marginTop: 16 }]}>
                          {lang === 'ku' ? 'ئامرازەکانی AI' : 'AI Tools'}
                        </Text>
                        <View style={[s.quickLinksRow, isRTL && s.rowRTL]}>
                          <TouchableOpacity style={s.quickLinkBtn} onPress={(e) => { 
                            if (e && e.stopPropagation) e.stopPropagation();
                            if (setActiveProjectId) setActiveProjectId(project.id);
                            if (onOpenAiCamera) onOpenAiCamera(); 
                          }} activeOpacity={0.8}>
                            <View style={[s.quickLinkIcon, { backgroundColor: 'rgba(212,168,67,0.15)' }]}>
                              <AppIcon name="scan" size={22} color={tc.accent} />
                            </View>
                            <Text style={s.quickLinkText}>{lang === 'ku' ? 'ناسینەوە' : 'Scanner'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={s.quickLinkBtn} onPress={(e) => { 
                            if (e && e.stopPropagation) e.stopPropagation();
                            if (setActiveProjectId) setActiveProjectId(project.id);
                            if(onNavigate) onNavigate("aiArchitect", project.id); 
                          }} activeOpacity={0.8}>
                            <View style={[s.quickLinkIcon, { backgroundColor: 'rgba(220,38,38,0.15)' }]}>
                              <AppIcon name="bot" size={22} color="#DC2626" />
                            </View>
                            <Text style={s.quickLinkText}>{lang === 'ku' ? 'ئەندازیار' : 'Architect'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={s.quickLinkBtn} onPress={(e) => { 
                            if (e && e.stopPropagation) e.stopPropagation();
                            if (setActiveProjectId) setActiveProjectId(project.id);
                            if(onNavigate) onNavigate("arVisualizer", project.id); 
                          }} activeOpacity={0.8}>
                            <View style={[s.quickLinkIcon, { backgroundColor: 'rgba(124,58,237,0.15)' }]}>
                              <AppIcon name="glasses" size={22} color="#7C3AED" />
                            </View>
                            <Text style={s.quickLinkText}>{lang === 'ku' ? 'بینەری AR' : 'AR View'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {project.deliveryStr && (
                        <View style={s.itemsList}>
                          <Text style={[s.itemName, isRTL && s.textRTL, { fontWeight: 'bold', marginBottom: 4 }]}>
                            {lang === "ku" ? "گەیاندن (خەمڵێندراو):" : "Delivery (Est):"}
                          </Text>
                          <Text style={[s.itemQty, isRTL && s.textRTL, { marginLeft: 0, fontWeight: 'normal', color: colors.darkGray }]}>{project.deliveryStr}</Text>
                        </View>
                      )}

                      {project.estimations && Object.keys(project.estimations).length > 0 && (
                        <View style={s.itemsList}>
                          <Text style={[s.itemName, isRTL && s.textRTL, { fontWeight: 'bold', marginBottom: 6 }]}>
                            {lang === "ku" ? "کەرەستە خەمڵێندراوەکان:" : "Estimations:"}
                          </Text>
                          {Object.values(project.estimations).map((estStr, i) => (
                            <Text key={i} style={[s.itemQty, isRTL && s.textRTL, { marginLeft: 0, fontWeight: '500', color: colors.darkGray, marginBottom: 4 }]}>• {estStr}</Text>
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
                          onPress={() => setViewProject(project)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <AppIcon name="folder-open" size={16} color={colors.white} />
                            <Text style={s.loadBtnText}>{copy.load}</Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={s.exportBtn}
                          onPress={() => exportPDF(project)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <AppIcon name="file-text" size={16} color="#4B5563" />
                            <Text style={s.exportBtnText}>{copy.exportPdf}</Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={s.deleteBtn}
                          onPress={(e) => {
                            if (e && e.stopPropagation) e.stopPropagation();
                            deleteProject(project.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <AppIcon name="trash" size={18} color="#DC2626" />
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

      {/* ═══ Project Detail Modal (Open) ═══ */}
      <Modal
        visible={!!viewProject}
        transparent
        animationType="none"
        onRequestClose={() => setViewProject(null)}
      >
        <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-start' }}>
          <Animated.View entering={FadeInDown.duration(380).springify().damping(22).stiffness(180)} style={[{ backgroundColor: tc.offWhite, flex: 1, marginTop: Platform.OS === 'ios' ? 44 : 20, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl }]}>
            <View style={[isRTL ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' }, { alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }]}>
              <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
                <Text style={[s.modalTitle, isRTL && s.textRTL, { color: tc.charcoal, marginBottom: 0 }]} numberOfLines={1}>
                  {viewProject?.name}
                </Text>
                {viewProject?.note ? <Text style={[{ fontSize: 12, color: tc.mediumGray, marginTop: 4 }, isRTL && s.textRTL]}>{viewProject.note}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => setViewProject(null)} style={{ padding: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20 }}>
                <Text style={{ fontSize: 16, color: tc.mediumGray, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Stats row */}
            <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' }]}>
              <View style={{ backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                  {viewProject?.items?.length || 0} {lang === 'ku' ? 'ب\u0631گە' : 'items'}
                </Text>
              </View>
              {viewProject?.totalCostUSD ? (
                <View style={{ backgroundColor: colors.accent + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accent }}>
                    ${viewProject.totalCostUSD.toFixed(0)}
                  </Text>
                </View>
              ) : null}
              {viewProject?.deliveryStr ? (
                <View style={{ backgroundColor: '#0891B215', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#0891B2' }}>
                    🚛 {lang === 'ku' ? 'گەیاندن' : 'Delivery'}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Full item list */}
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {(viewProject?.items || []).map((item) => {
                const mat = materials.find(m => m.id === item.id);
                if (!mat) return null;
                const itemCost = mat.basePrice * item.qty;
                return (
                  <View key={item.id} style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: tc.cardBorder }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ fontSize: 14, fontWeight: '600', color: tc.charcoal }, isRTL && s.textRTL]}>
                        {lang === 'ku' ? mat.nameKU : mat.nameEN}
                      </Text>
                      <Text style={[{ fontSize: 12, color: tc.mediumGray }, isRTL && s.textRTL]}>
                        {mat.unit} • ${mat.basePrice}/{mat.unit}
                      </Text>
                    </View>
                    <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: tc.primary }}>{isRTL ? `${item.qty}×` : `×${item.qty}`}</Text>
                      <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '600' }}>${itemCost.toFixed(0)}</Text>
                    </View>
                  </View>
                );
              })}
              {viewProject?.deliveryStr && (
                <View style={{ marginTop: 12, padding: 12, backgroundColor: '#EFF6FF', borderRadius: 10 }}>
                  <Text style={[{ fontSize: 13, fontWeight: '700', color: '#1E3A8A', marginBottom: 4 }, isRTL && s.textRTL]}>
                    🚛 {lang === 'ku' ? 'تێچووی گەیاندن' : 'Delivery Cost'}
                  </Text>
                  <Text style={[{ fontSize: 12, color: '#3B82F6' }, isRTL && s.textRTL]}>{viewProject.deliveryStr}</Text>
                </View>
              )}
              {viewProject?.estimations && Object.keys(viewProject.estimations).length > 0 && (
                <View style={{ marginTop: 12, padding: 12, backgroundColor: colors.primary + '0D', borderRadius: 10 }}>
                  <Text style={[{ fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 6 }, isRTL && s.textRTL]}>
                    📐 {lang === 'ku' ? 'خەمڵاندنە ئەندازیارییەکان' : 'Engineering Estimations'}
                  </Text>
                  {Object.values(viewProject.estimations).map((est, i) => (
                    <Text key={i} style={[{ fontSize: 12, color: tc.charcoal, marginBottom: 3 }, isRTL && s.textRTL]}>• {est}</Text>
                  ))}
                </View>
              )}
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* PDF button at bottom */}
            <TouchableOpacity
              style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, marginTop: 12 }}
              onPress={() => { setViewProject(null); exportPDF(viewProject); }}
              activeOpacity={0.85}
            >
              <AppIcon name="file-text" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{copy.exportPdf}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* ═══ Create Modal ═══ */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <Animated.View entering={FadeIn.duration(180)} style={s.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowCreateModal(false)} />
          <Animated.View entering={FadeInUp.duration(350).springify().damping(22).stiffness(180)} style={s.modalCard} pointerEvents="box-none">
            <TouchableOpacity activeOpacity={1}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: spacing.lg, gap: 8 }}>
                <AppIcon name="save" size={24} color={tc.charcoal} />
                <Text style={[s.modalTitle, isRTL && s.textRTL, { marginBottom: 0 }]}>
                  {copy.create}
                </Text>
              </View>

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

              <View style={[s.selectedSummary]}>
                <Text style={[s.selectedText, isRTL && s.textRTL]}>
                  {currentItemCount > 0
                    ? `${copy.saveCurrent}: ${currentItemCount} ${copy.items}`
                    : (lang === 'ku' ? "هیچ بابەتێک هەڵنەبژێردراوە. دەتوانیت پاشەکەوتی بکەیت و دواتر بابەت زیاد بکەیت." : "No items selected. You can save and add items later.")}
                </Text>
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
                    (!projectName.trim()) && s.saveBtnDisabled,
                  ]}
                  onPress={createProject}
                  disabled={!projectName.trim()}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <AppIcon name="save" size={18} color={colors.white} />
                    <Text style={s.saveBtnText}>{copy.save}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
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
  aiToolsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 12,
  },
  aiToolBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  aiToolIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  aiToolText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
