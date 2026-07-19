"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconUpload,
  IconPhoto,
  IconCheck,
  IconX,
  IconGripVertical,
} from "@tabler/icons-react";
import {
  getAdminData,
  updateAboutSettings,
  uploadTeamMemberPhoto,
  upsertTeamMember,
  deleteTeamMember,
  toggleTeamMemberStatus,
  reorderTeamMembers,
  uploadAchievementImage,
  upsertAchievement,
  deleteAchievement,
  toggleAchievementStatus,
  reorderAchievements,
} from "../../actions";
import ImageCropperModal from "@/components/ImageCropperModal";
import ConfirmDialog from "@/components/ConfirmDialog";

const DEFAULT_SETTINGS = {
  heroTitle: "About Tutoboard",
  heroSubtitle: "Connecting students with expert mentors since day one.",
  visionTitle: "Our Vision",
  visionText: "To make quality, personalized education accessible to every student, everywhere.",
  missionTitle: "Our Mission",
  missionText: "We connect students with verified, expert mentors for 1-on-1 sessions and structured courses tailored to their pace and goals.",
};

function AdminAboutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab");
  const tab: "content" | "team" | "achievements" =
    tabParam === "team" ? "team" : tabParam === "achievements" ? "achievements" : "content";

  const handleTabChange = (newTab: "content" | "team" | "achievements") => {
    router.push(`/admin/about?tab=${newTab}`, { scroll: false });
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState(DEFAULT_SETTINGS);
  const [contentEditMode, setContentEditMode] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: "destructive" | "constructive";
    onConfirm: () => void;
  } | null>(null);

  // Drag and drop state
  const [draggedTeamIndex, setDraggedTeamIndex] = useState<number | null>(null);
  const [draggedAchIndex, setDraggedAchIndex] = useState<number | null>(null);

  // Image Cropper modal state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState("");
  const [cropperAspect, setCropperAspect] = useState(1);
  const [cropperTarget, setCropperTarget] = useState<"team" | "achievement" | null>(null);

  // Team drawer
  const [teamDrawerOpen, setTeamDrawerOpen] = useState(false);
  const [teamDrawerEditId, setTeamDrawerEditId] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState<any>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Achievement drawer
  const [achDrawerOpen, setAchDrawerOpen] = useState(false);
  const [achDrawerEditId, setAchDrawerEditId] = useState<string | null>(null);
  const [achForm, setAchForm] = useState<any>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadData = async () => {
    try {
      const res = await getAdminData();
      if (res.aboutSettings) {
        const loaded = {
          heroTitle: res.aboutSettings.hero_title || DEFAULT_SETTINGS.heroTitle,
          heroSubtitle: res.aboutSettings.hero_subtitle || DEFAULT_SETTINGS.heroSubtitle,
          visionTitle: res.aboutSettings.vision_title || DEFAULT_SETTINGS.visionTitle,
          visionText: res.aboutSettings.vision_text || DEFAULT_SETTINGS.visionText,
          missionTitle: res.aboutSettings.mission_title || DEFAULT_SETTINGS.missionTitle,
          missionText: res.aboutSettings.mission_text || DEFAULT_SETTINGS.missionText,
        };
        setSettings(loaded);
        setSavedSettings(loaded);
      }
      setTeamMembers(res.teamMembers || []);
      setAchievements(res.achievements || []);
    } catch (err) {
      console.error("Failed to load about page admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await updateAboutSettings(settings);
      await loadData();
      setContentEditMode(false);
    } catch (err: any) {
      alert("Failed to save about page content: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmSaveSettings = () => {
    setConfirmDialog({
      title: "Publish these changes?",
      message: "This updates the live About page content immediately for all visitors.",
      confirmLabel: "Publish",
      variant: "constructive",
      onConfirm: () => {
        setConfirmDialog(null);
        saveSettings();
      },
    });
  };

  const cancelEditSettings = () => {
    setSettings(savedSettings);
    setContentEditMode(false);
  };

  // ---------------- Image Selection & Cropping ----------------
  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropperSrc(reader.result);
        setCropperAspect(1); // 1:1 for profile photo
        setCropperTarget("team");
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAchImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropperSrc(reader.result);
        setCropperAspect(16 / 9); // 16:9 for achievement card image
        setCropperTarget("achievement");
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (cropperTarget === "team") {
      setUploadingPhoto(true);
      try {
        const file = new File([croppedBlob], `team-${Date.now()}.jpg`, { type: "image/jpeg" });
        const fd = new FormData();
        fd.append("file", file);
        const { publicUrl } = await uploadTeamMemberPhoto(fd);
        setTeamForm((prev: any) => ({ ...prev, photoUrl: publicUrl }));
      } catch (err: any) {
        alert("Error uploading photo: " + err.message);
      } finally {
        setUploadingPhoto(false);
      }
    } else if (cropperTarget === "achievement") {
      setUploadingImage(true);
      try {
        const file = new File([croppedBlob], `ach-${Date.now()}.jpg`, { type: "image/jpeg" });
        const fd = new FormData();
        fd.append("file", file);
        const { publicUrl } = await uploadAchievementImage(fd);
        setAchForm((prev: any) => ({ ...prev, imageUrl: publicUrl }));
      } catch (err: any) {
        alert("Error uploading image: " + err.message);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  // ---------------- Team member handlers ----------------
  const openTeamDrawer = (id: string | null = null) => {
    setTeamDrawerEditId(id);
    if (id) {
      const item = teamMembers.find((x) => x.id === id);
      setTeamForm({ ...item });
    } else {
      setTeamForm({
        name: "",
        role: "",
        bio: "",
        photoUrl: "",
        displayOrder: teamMembers.length,
        showOnSite: true,
      });
    }
    setTeamDrawerOpen(true);
  };

  const closeTeamDrawer = () => {
    setTeamDrawerOpen(false);
    setTeamDrawerEditId(null);
  };

  const saveTeamMember = async () => {
    try {
      await upsertTeamMember(teamForm);
      closeTeamDrawer();
      await loadData();
    } catch (err: any) {
      alert("Error saving team member: " + err.message);
    }
  };

  const removeTeamMember = (id: string) => {
    const item = teamMembers.find((x) => x.id === id);
    setConfirmDialog({
      title: "Remove team member?",
      message: `${item?.name || "This team member"} will be permanently removed from the About page. This cannot be undone.`,
      confirmLabel: "Remove",
      variant: "destructive",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteTeamMember(id);
          await loadData();
        } catch (err: any) {
          alert("Error deleting team member: " + err.message);
        }
      },
    });
  };

  const toggleTeamVisibility = async (id: string) => {
    const item = teamMembers.find((x) => x.id === id);
    if (!item) return;
    try {
      await toggleTeamMemberStatus(id, item.showOnSite);
      await loadData();
    } catch (err: any) {
      alert("Error toggling visibility: " + err.message);
    }
  };

  // Team Drag & Drop Reordering
  const handleTeamDrop = async (targetIndex: number) => {
    if (draggedTeamIndex === null || draggedTeamIndex === targetIndex) return;
    const newList = [...teamMembers];
    const [moved] = newList.splice(draggedTeamIndex, 1);
    newList.splice(targetIndex, 0, moved);
    setTeamMembers(newList);
    setDraggedTeamIndex(null);

    try {
      const payload = newList.map((item, idx) => ({ id: item.id, displayOrder: idx }));
      await reorderTeamMembers(payload);
    } catch (err: any) {
      alert("Failed to save team member order: " + err.message);
    }
  };

  // ---------------- Achievement handlers ----------------
  const openAchDrawer = (id: string | null = null) => {
    setAchDrawerEditId(id);
    if (id) {
      const item = achievements.find((x) => x.id === id);
      setAchForm({ ...item });
    } else {
      setAchForm({
        statValue: "",
        statLabel: "",
        imageUrl: "",
        displayOrder: achievements.length,
        showOnSite: true,
      });
    }
    setAchDrawerOpen(true);
  };

  const closeAchDrawer = () => {
    setAchDrawerOpen(false);
    setAchDrawerEditId(null);
  };

  const saveAchievement = async () => {
    try {
      await upsertAchievement(achForm);
      closeAchDrawer();
      await loadData();
    } catch (err: any) {
      alert("Error saving achievement: " + err.message);
    }
  };

  const removeAchievement = (id: string) => {
    const item = achievements.find((x) => x.id === id);
    setConfirmDialog({
      title: "Remove achievement?",
      message: `"${item?.statLabel || "This achievement"}" will be permanently removed from the About page. This cannot be undone.`,
      confirmLabel: "Remove",
      variant: "destructive",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteAchievement(id);
          await loadData();
        } catch (err: any) {
          alert("Error deleting achievement: " + err.message);
        }
      },
    });
  };

  const toggleAchVisibility = async (id: string) => {
    const item = achievements.find((x) => x.id === id);
    if (!item) return;
    try {
      await toggleAchievementStatus(id, item.showOnSite);
      await loadData();
    } catch (err: any) {
      alert("Error toggling visibility: " + err.message);
    }
  };

  // Achievements Drag & Drop Reordering
  const handleAchDrop = async (targetIndex: number) => {
    if (draggedAchIndex === null || draggedAchIndex === targetIndex) return;
    const newList = [...achievements];
    const [moved] = newList.splice(draggedAchIndex, 1);
    newList.splice(targetIndex, 0, moved);
    setAchievements(newList);
    setDraggedAchIndex(null);

    try {
      const payload = newList.map((item, idx) => ({ id: item.id, displayOrder: idx }));
      await reorderAchievements(payload);
    } catch (err: any) {
      alert("Failed to save achievement order: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 font-sans animate-pulse">
        {/* Tab skeleton */}
        <div className="flex gap-2 border-b border-[#E6EBF8] pb-2">
          <div className="h-6 w-24 bg-slate-200 rounded" />
          <div className="h-6 w-20 bg-slate-200 rounded" />
          <div className="h-6 w-28 bg-slate-200 rounded" />
        </div>
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-[#E6EBF8] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-10 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      {/* URL-based Search Tabs */}
      <div className="flex gap-2 border-b border-[#E6EBF8]">
        {(["content", "team", "achievements"] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`text-xs font-bold px-4 py-2.5 border-b-2 -mb-px transition-colors cursor-pointer capitalize ${
              tab === t
                ? "border-[#2F7FE8] text-[#2F7FE8]"
                : "border-transparent text-[#6B7A99] hover:text-[#1B3A6B]"
            }`}
          >
            {t === "content" ? "Vision & Mission" : t === "team" ? "Team" : "Achievements"}
          </button>
        ))}
      </div>

      {/* VISION & MISSION TAB */}
      {tab === "content" && (
        <div className="bg-white border border-border-subtle rounded-2xl p-5 shadow-sm space-y-5 max-w-2xl">
          {!contentEditMode ? (
            <>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1B3A6B]">
                  Vision & Mission content
                </div>
                <button
                  onClick={() => setContentEditMode(true)}
                  className="text-xs font-bold px-4 py-2 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <IconEdit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-[#9BA8C0] uppercase">Hero title</p>
                  <p className="text-sm font-semibold text-[#1B3A6B] mt-1">{settings.heroTitle}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#9BA8C0] uppercase">Hero subtitle</p>
                  <p className="text-sm font-semibold text-[#1B3A6B] mt-1">{settings.heroSubtitle}</p>
                </div>
              </div>

              <div className="border-t border-border-subtle pt-4">
                <p className="text-[10px] font-bold text-[#9BA8C0] uppercase">{settings.visionTitle}</p>
                <p className="text-sm text-text-muted leading-relaxed mt-1">{settings.visionText}</p>
              </div>

              <div className="border-t border-border-subtle pt-4">
                <p className="text-[10px] font-bold text-[#9BA8C0] uppercase">{settings.missionTitle}</p>
                <p className="text-sm text-text-muted leading-relaxed mt-1">{settings.missionText}</p>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Hero title</label>
                  <input
                    className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] focus:border-secondary"
                    type="text"
                    value={settings.heroTitle}
                    onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Hero subtitle</label>
                  <input
                    className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] focus:border-secondary"
                    type="text"
                    value={settings.heroSubtitle}
                    onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                  />
                </div>
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-[#1B3A6B] border-b border-border-subtle pb-2 pt-2">
                Vision
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Vision title</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] focus:border-secondary"
                  type="text"
                  value={settings.visionTitle}
                  onChange={(e) => setSettings({ ...settings, visionTitle: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Vision text</label>
                <textarea
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] focus:border-secondary resize-none h-20"
                  value={settings.visionText}
                  onChange={(e) => setSettings({ ...settings, visionText: e.target.value })}
                />
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-[#1B3A6B] border-b border-border-subtle pb-2 pt-2">
                Mission
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Mission title</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] focus:border-secondary"
                  type="text"
                  value={settings.missionTitle}
                  onChange={(e) => setSettings({ ...settings, missionTitle: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Mission text</label>
                <textarea
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] focus:border-secondary resize-none h-20"
                  value={settings.missionText}
                  onChange={(e) => setSettings({ ...settings, missionText: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-[#E6EBF8]">
                <button
                  onClick={confirmSaveSettings}
                  disabled={saving}
                  className="text-xs font-bold px-6 py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <IconCheck className="w-4 h-4" />
                  {saving ? "Saving..." : "Publish changes"}
                </button>
                <button
                  onClick={cancelEditSettings}
                  className="text-xs font-bold px-4 py-2.5 rounded-xl bg-transparent text-[#1B3A6B] border border-border-subtle hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* TEAM TAB WITH DOT DRAG & DROP REORDERING */}
      {tab === "team" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-text-muted font-medium">
              Drag using the dot handles <IconGripVertical className="w-3.5 h-3.5 inline text-slate-400" /> to rearrange member order.
            </p>
            <button
              onClick={() => openTeamDrawer()}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <IconPlus className="w-4 h-4" /> Add team member
            </button>
          </div>

          {teamMembers.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-[#E6EBF8]">
              <p className="text-sm text-text-muted">No team members yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((m, idx) => (
                <div
                  key={m.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedTeamIndex(idx);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleTeamDrop(idx);
                  }}
                  className={`bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-transform duration-150 ${
                    draggedTeamIndex === idx ? "opacity-40 border-dashed border-[#2F7FE8]" : "hover:border-[#2F7FE8]/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                      ) : (
                        <div
                          style={{ backgroundColor: m.avatarBg }}
                          className="w-12 h-12 rounded-full flex items-center justify-center font-heading text-sm font-extrabold text-accent shrink-0"
                        >
                          {m.avatarText}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[#1B3A6B] text-xs truncate">{m.name}</div>
                        <div className="text-[10px] text-[#9BA8C0] font-semibold mt-0.5 truncate">{m.role}</div>
                      </div>
                    </div>

                    {/* Dot Drag Handle */}
                    <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors" title="Drag to reorder">
                      <IconGripVertical className="w-4 h-4" />
                    </div>
                  </div>

                  {m.bio && <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{m.bio}</p>}

                  <div>
                    <div className="flex items-center justify-between border-t border-[#E6EBF8]/50 pt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-text-muted font-bold">Show:</span>
                        <div
                          onClick={() => toggleTeamVisibility(m.id)}
                          className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors duration-200 ${
                            m.showOnSite ? "bg-green-500" : "bg-[#9BA8C0]"
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${
                              m.showOnSite ? "left-4" : "left-0.5"
                            }`}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-[#E6EBF8] mt-3">
                      <button
                        onClick={() => openTeamDrawer(m.id)}
                        className="flex-1 text-xs font-semibold py-2 rounded-lg border border-[#E6EBF8] hover:bg-slate-50 text-[#6B7A99] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <IconEdit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => removeTeamMember(m.id)}
                        className="px-3 text-xs py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACHIEVEMENTS TAB WITH DOT DRAG & DROP REORDERING */}
      {tab === "achievements" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-text-muted font-medium">
              Drag using the dot handles <IconGripVertical className="w-3.5 h-3.5 inline text-slate-400" /> to rearrange achievement order.
            </p>
            <button
              onClick={() => openAchDrawer()}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <IconPlus className="w-4 h-4" /> Add achievement
            </button>
          </div>

          {achievements.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-[#E6EBF8]">
              <p className="text-sm text-text-muted">No achievements yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((a, idx) => (
                <div
                  key={a.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedAchIndex(idx);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleAchDrop(idx);
                  }}
                  className={`bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-transform duration-150 ${
                    draggedAchIndex === idx ? "opacity-40 border-dashed border-[#2F7FE8]" : "hover:border-[#2F7FE8]/60"
                  }`}
                >
                  <div className="relative rounded-xl overflow-hidden h-32 bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {a.imageUrl ? (
                      <img src={a.imageUrl} alt={a.statLabel} className="w-full h-full object-cover" />
                    ) : (
                      <IconPhoto className="w-7 h-7 stroke-[1.5] text-slate-300" />
                    )}
                    {/* Dot Drag Handle */}
                    <div className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1.5 bg-white/90 backdrop-blur-xs shadow-xs rounded-lg text-slate-600 hover:text-slate-900 transition-colors" title="Drag to reorder">
                      <IconGripVertical className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="font-heading text-lg font-extrabold text-[#1B3A6B]">{a.statValue}</p>
                    <p className="text-xs text-text-muted mt-0.5">{a.statLabel}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between border-t border-[#E6EBF8]/50 pt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-text-muted font-bold">Show:</span>
                        <div
                          onClick={() => toggleAchVisibility(a.id)}
                          className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors duration-200 ${
                            a.showOnSite ? "bg-green-500" : "bg-[#9BA8C0]"
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${
                              a.showOnSite ? "left-4" : "left-0.5"
                            }`}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-[#E6EBF8] mt-3">
                      <button
                        onClick={() => openAchDrawer(a.id)}
                        className="flex-1 text-xs font-semibold py-2 rounded-lg border border-[#E6EBF8] hover:bg-slate-50 text-[#6B7A99] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <IconEdit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => removeAchievement(a.id)}
                        className="px-3 text-xs py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TEAM MEMBER DRAWER */}
      {teamDrawerOpen && (
        <>
          <div
            onClick={closeTeamDrawer}
            className="fixed inset-0 bg-[#1B3A6B]/30 backdrop-blur-xs z-[200] transition-opacity duration-300"
          ></div>
          <div className="fixed top-0 right-0 w-[420px] h-full bg-white z-[201] shadow-2xl flex flex-col transition-transform duration-300 animate-slide-in">
            <header className="px-6 py-4.5 border-b border-[#E6EBF8] flex items-center justify-between shrink-0">
              <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B]">
                {teamDrawerEditId ? "Edit team member" : "Add team member"}
              </h3>
              <button
                onClick={closeTeamDrawer}
                className="w-7 h-7 border border-[#E6EBF8] bg-surface hover:bg-badge-bg rounded-lg text-primary text-sm flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Name</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={teamForm.name || ""}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Role</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="text"
                  placeholder="e.g. Co-founder & CEO"
                  value={teamForm.role || ""}
                  onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Bio (optional)</label>
                <textarea
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] resize-none h-20"
                  value={teamForm.bio || ""}
                  onChange={(e) => setTeamForm({ ...teamForm, bio: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Photo (optional)</label>
                {teamForm.photoUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-[#E6EBF8] aspect-square w-24 bg-slate-100">
                    <img src={teamForm.photoUrl} alt="Team member" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setTeamForm({ ...teamForm, photoUrl: "" })}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                    >
                      <IconX className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1.5 w-24 aspect-square rounded-lg border border-dashed border-[#E6EBF8] bg-surface text-[#9BA8C0] cursor-pointer hover:border-secondary hover:text-secondary transition-colors">
                    {uploadingPhoto ? (
                      <span className="text-[9px] font-semibold">Uploading...</span>
                    ) : (
                      <>
                        <IconUpload className="w-4 h-4" />
                        <span className="text-[9px] font-semibold">Crop & Upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingPhoto}
                      onChange={handlePhotoFileSelect}
                    />
                  </label>
                )}
                <p className="text-[9px] text-[#9BA8C0]">Leave empty to use initials avatar.</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Display order</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="number"
                  value={teamForm.displayOrder ?? 0}
                  onChange={(e) => setTeamForm({ ...teamForm, displayOrder: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Show on website</label>
                <select
                  className="text-xs p-2.5 border border-[#E6EBF8] rounded-lg outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  value={teamForm.showOnSite ? "Yes" : "No"}
                  onChange={(e) => setTeamForm({ ...teamForm, showOnSite: e.target.value === "Yes" })}
                >
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-[#E6EBF8] flex gap-3 shrink-0">
              <button
                onClick={closeTeamDrawer}
                className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-transparent text-primary border border-border-subtle hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={saveTeamMember}
                className="flex-1 text-xs font-bold py-2.5 rounded-lg bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors"
              >
                Save changes
              </button>
            </footer>
          </div>
        </>
      )}

      {/* ACHIEVEMENT DRAWER */}
      {achDrawerOpen && (
        <>
          <div
            onClick={closeAchDrawer}
            className="fixed inset-0 bg-[#1B3A6B]/30 backdrop-blur-xs z-[200] transition-opacity duration-300"
          ></div>
          <div className="fixed top-0 right-0 w-[420px] h-full bg-white z-[201] shadow-2xl flex flex-col transition-transform duration-300 animate-slide-in">
            <header className="px-6 py-4.5 border-b border-[#E6EBF8] flex items-center justify-between shrink-0">
              <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B]">
                {achDrawerEditId ? "Edit achievement" : "Add achievement"}
              </h3>
              <button
                onClick={closeAchDrawer}
                className="w-7 h-7 border border-[#E6EBF8] bg-surface hover:bg-badge-bg rounded-lg text-primary text-sm flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Stat value</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="text"
                  placeholder="e.g. 12,400+"
                  value={achForm.statValue || ""}
                  onChange={(e) => setAchForm({ ...achForm, statValue: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Stat label</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="text"
                  placeholder="e.g. Students enrolled"
                  value={achForm.statLabel || ""}
                  onChange={(e) => setAchForm({ ...achForm, statLabel: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Image (optional)</label>
                {achForm.imageUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-[#E6EBF8] aspect-video bg-slate-100">
                    <img src={achForm.imageUrl} alt="Achievement" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAchForm({ ...achForm, imageUrl: "" })}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                    >
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1.5 aspect-video rounded-lg border border-dashed border-[#E6EBF8] bg-surface text-[#9BA8C0] cursor-pointer hover:border-secondary hover:text-secondary transition-colors">
                    {uploadingImage ? (
                      <span className="text-[10px] font-semibold">Uploading...</span>
                    ) : (
                      <>
                        <IconUpload className="w-5 h-5" />
                        <span className="text-[10px] font-semibold">Crop & Upload image</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={handleAchImageFileSelect}
                    />
                  </label>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Display order</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="number"
                  value={achForm.displayOrder ?? 0}
                  onChange={(e) => setAchForm({ ...achForm, displayOrder: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Show on website</label>
                <select
                  className="text-xs p-2.5 border border-[#E6EBF8] rounded-lg outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  value={achForm.showOnSite ? "Yes" : "No"}
                  onChange={(e) => setAchForm({ ...achForm, showOnSite: e.target.value === "Yes" })}
                >
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-[#E6EBF8] flex gap-3 shrink-0">
              <button
                onClick={closeAchDrawer}
                className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-transparent text-primary border border-border-subtle hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={saveAchievement}
                className="flex-1 text-xs font-bold py-2.5 rounded-lg bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors"
              >
                Save changes
              </button>
            </footer>
          </div>
        </>
      )}

      {/* CONFIRM DIALOG (constructive + destructive actions) */}
      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        confirmLabel={confirmDialog?.confirmLabel}
        variant={confirmDialog?.variant}
        onConfirm={() => confirmDialog?.onConfirm()}
        onCancel={() => setConfirmDialog(null)}
      />

      {/* REUSABLE IMAGE CROPPER MODAL */}
      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={cropperSrc}
        aspectRatio={cropperAspect}
        title={cropperTarget === "team" ? "Crop Team Member Photo" : "Crop Achievement Image"}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}

export default function AdminAboutPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 font-sans animate-pulse">
          <div className="flex gap-2 border-b border-[#E6EBF8] pb-2">
            <div className="h-6 w-24 bg-slate-200 rounded" />
            <div className="h-6 w-20 bg-slate-200 rounded" />
            <div className="h-6 w-28 bg-slate-200 rounded" />
          </div>
        </div>
      }
    >
      <AdminAboutContent />
    </Suspense>
  );
}
