"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  IconSearch,
  IconLayoutGrid,
  IconList,
  IconPlus,
  IconEdit,
  IconTrash,
  IconPhoto,
  IconVideo,
  IconX,
  IconUpload,
} from "@tabler/icons-react";
import {
  getAdminData,
  upsertTestimonial,
  deleteTestimonial as apiDeleteTestimonial,
  toggleTestimonialStatus as apiToggleTestimonialStatus,
  uploadTestimonialMedia,
} from "../../actions";
import ImageCropperModal from "@/components/ImageCropperModal";

interface Testimonial {
  id: string;
  studentName: string;
  role: string;
  quote: string;
  rating: number;
  showOnSite: boolean;
  avatarBg: string;
  avatarText: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "";
}

function TestimonialsSkeleton() {
  return (
    <div className="space-y-4 font-sans animate-pulse">
      {/* Toolbar Skeleton */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
          <div className="h-9 w-24 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex gap-2 items-center">
          <div className="h-9 w-20 bg-slate-100 rounded-lg" />
          <div className="h-9 w-28 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Media Skeleton */}
              <div className="w-full aspect-[4/3] bg-slate-100 rounded-xl" />
              
              {/* Avatar + Name Skeleton */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                </div>
                <div className="h-3 bg-slate-100 rounded w-12" />
              </div>

              {/* Quote Skeleton */}
              <div className="space-y-1.5 pt-1">
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>

            {/* Footer Buttons Skeleton */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E6EBF8]">
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
              <div className="flex gap-2">
                <div className="w-7 h-7 bg-slate-100 rounded-lg" />
                <div className="w-7 h-7 bg-slate-100 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // View States - default to card/grid
  const [testimonialView, setTestimonialView] = useState<"grid" | "list">("grid");

  // Search & Filter States
  const [testimonialSearch, setTestimonialSearch] = useState("");
  const [testimonialFilter, setTestimonialFilter] = useState("All");

  // Drawer modal state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEditId, setDrawerEditId] = useState<string | null>(null);
  const [drawerForm, setDrawerForm] = useState<Partial<Testimonial>>({});
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const loadData = async () => {
    try {
      const res = await getAdminData();
      setTestimonials(res.testimonials as Testimonial[]);
    } catch (err) {
      console.error("Failed to load testimonials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-on-mount; setState fires after the awaited request resolves, not synchronously
    loadData();
  }, []);

  const openDrawer = (id: string | null = null) => {
    setDrawerEditId(id);
    if (id) {
      const item = testimonials.find((x) => x.id === id);
      setDrawerForm({ ...item });
    } else {
      setDrawerForm({
        studentName: "",
        role: "",
        quote: "",
        rating: 5,
        showOnSite: true,
        mediaUrl: "",
        mediaType: "",
      });
    }
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerEditId(null);
  };

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState("");

  const uploadFileDirect = async (file: File) => {
    setUploadingMedia(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { publicUrl, mediaType } = await uploadTestimonialMedia(fd);
      setDrawerForm((prev) => ({ ...prev, mediaUrl: publicUrl, mediaType }));
    } catch (err) {
      console.error("Error uploading media:", err);
      alert("Couldn't upload the media. Please try again.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setCropperSrc(reader.result);
          setCropperOpen(true);
        }
      };
      reader.readAsDataURL(file);
    } else {
      uploadFileDirect(file);
    }
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const file = new File([croppedBlob], `testimonial-${Date.now()}.jpg`, { type: "image/jpeg" });
    uploadFileDirect(file);
  };

  const saveDrawerData = async () => {
    try {
      await upsertTestimonial(drawerForm as Parameters<typeof upsertTestimonial>[0]);
      closeDrawer();
      await loadData();
    } catch (err) {
      console.error("Error saving testimonial:", err);
      alert("Couldn't save this testimonial. Please try again.");
    }
  };

  const deleteItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this testimonial?")) {
      try {
        await apiDeleteTestimonial(id);
        await loadData();
      } catch (err) {
        console.error("Error deleting testimonial:", err);
        alert("Couldn't delete this testimonial. Please try again.");
      }
    }
  };

  const toggleTestiStatus = async (id: string) => {
    const item = testimonials.find((x) => x.id === id);
    if (!item) return;
    try {
      await apiToggleTestimonialStatus(id, item.showOnSite);
      await loadData();
    } catch (err) {
      console.error("Error toggling testimonial visibility:", err);
      alert("Couldn't update visibility. Please try again.");
    }
  };

  // Filters application
  const filteredTestimonials = testimonials.filter((x) => {
    const matchSearch = x.studentName.toLowerCase().includes(testimonialSearch.toLowerCase());
    const matchStatus =
      testimonialFilter === "All" ||
      (testimonialFilter === "Visible" ? x.showOnSite : !x.showOnSite);
    return matchSearch && matchStatus;
  });

  if (loading) {
    return <TestimonialsSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-xl flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search testimonials..."
              value={testimonialSearch}
              onChange={(e) => setTestimonialSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-border-subtle rounded-lg bg-white outline-none font-semibold text-[#1B3A6B]"
            />
          </div>
          <select
            value={testimonialFilter}
            onChange={(e) => setTestimonialFilter(e.target.value)}
            className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer font-semibold text-[#1B3A6B]"
          >
            <option>All</option>
            <option>Visible</option>
            <option>Hidden</option>
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex border border-[#E6EBF8] rounded-lg overflow-hidden shrink-0 shadow-sm bg-white">
            <button
              onClick={() => setTestimonialView("grid")}
              className={`p-2 cursor-pointer transition-colors ${
                testimonialView === "grid" ? "bg-[#EBF2FF] text-[#1B3A6B]" : "bg-white text-[#9BA8C0]"
              }`}
            >
              <IconLayoutGrid className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setTestimonialView("list")}
              className={`p-2 cursor-pointer transition-colors ${
                testimonialView === "list" ? "bg-[#EBF2FF] text-[#1B3A6B]" : "bg-white text-[#9BA8C0]"
              }`}
            >
              <IconList className="w-4.5 h-4.5" />
            </button>
          </div>

          <button
            onClick={() => openDrawer()}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <IconPlus className="w-4 h-4" /> Add new
          </button>
        </div>
      </div>

      {/* View Render */}
      {testimonialView === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
          {filteredTestimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Fixed Media Box for all cards */}
                <div className="relative rounded-xl overflow-hidden aspect-[4/3] h-44 bg-slate-50 border border-slate-100 flex items-center justify-center">
                  {t.mediaUrl ? (
                    <>
                      {t.mediaType === "video" ? (
                        <video src={t.mediaUrl} className="w-full h-full object-cover" muted />
                      ) : (
                        <Image src={t.mediaUrl} alt={t.studentName} fill className="object-cover" />
                      )}
                      <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center">
                        {t.mediaType === "video" ? (
                          <IconVideo className="w-3.5 h-3.5" />
                        ) : (
                          <IconPhoto className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300 space-y-1">
                      <IconPhoto className="w-7 h-7 stroke-[1.5]" />
                      <span className="text-[10px] font-semibold text-slate-400">No media attached</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div
                    style={{ backgroundColor: t.avatarBg }}
                    className="w-10 h-10 rounded-full flex items-center justify-center font-heading text-xs font-extrabold text-accent shrink-0"
                  >
                    {t.avatarText}
                  </div>
                  <div>
                    <div className="font-bold text-[#1B3A6B] text-xs">{t.studentName}</div>
                    <div className="text-[9px] text-[#9BA8C0] font-semibold mt-0.5">{t.role}</div>
                  </div>
                </div>

                <p className="text-xs text-text-muted italic leading-relaxed font-semibold line-clamp-3 min-h-[54px]">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between border-t border-[#E6EBF8]/50 pt-3 mt-4">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-text-muted">Rating:</span>
                    <span className="text-xs text-accent">{"★".repeat(t.rating)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-text-muted font-bold">Show:</span>
                    <div
                      onClick={() => toggleTestiStatus(t.id)}
                      className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors duration-200 ${
                        t.showOnSite ? "bg-green-500" : "bg-[#9BA8C0]"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${
                          t.showOnSite ? "left-4" : "left-0.5"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-[#E6EBF8] mt-3">
                  <button
                    onClick={() => openDrawer(t.id)}
                    className="flex-1 text-xs font-semibold py-2 rounded-lg border border-[#E6EBF8] hover:bg-slate-50 text-[#6B7A99] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <IconEdit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => deleteItem(t.id)}
                    className="px-3 text-xs py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-4 shadow-sm overflow-x-auto font-sans">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-badge-bg/30 border-b border-[#E6EBF8]">
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Student</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Role / Achievement</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Quote</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Rating</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Show on Site</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTestimonials.map((t) => (
                <tr key={t.id} className="border-b border-[#E6EBF8]/50 hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-xs text-primary flex items-center gap-2.5">
                    <div
                      style={{ backgroundColor: t.avatarBg }}
                      className="w-7 h-7 rounded-full flex items-center justify-center font-heading text-[10px] font-bold text-accent"
                    >
                      {t.avatarText}
                    </div>
                    <span className="font-bold text-[#1B3A6B]">{t.studentName}</span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-text-muted font-semibold">{t.role}</td>
                  <td className="py-2.5 px-3 text-xs text-text-muted max-w-[200px] truncate font-medium">
                    &ldquo;{t.quote}&rdquo;
                  </td>
                  <td className="py-2.5 px-3 text-xs text-accent font-bold select-none">
                    {"★".repeat(t.rating)}
                  </td>
                  <td className="py-2.5 px-3 text-xs">
                    <div
                      onClick={() => toggleTestiStatus(t.id)}
                      className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors duration-200 ${
                        t.showOnSite ? "bg-green-500" : "bg-border-subtle"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${
                          t.showOnSite ? "left-4" : "left-0.5"
                        }`}
                      ></div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex gap-1.5 justify-center">
                      <button
                        onClick={() => openDrawer(t.id)}
                        className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg text-[#6B7A99] cursor-pointer"
                      >
                        <IconEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteItem(t.id)}
                        className="w-7 h-7 rounded-lg border border-red-200 bg-white flex items-center justify-center hover:bg-red-50 text-red-600 cursor-pointer"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DRAWER MODAL OVERLAY */}
      {drawerOpen && (
        <>
          <div
            onClick={closeDrawer}
            className="fixed inset-0 bg-[#1B3A6B]/30 backdrop-blur-xs z-[200] transition-opacity duration-300"
          ></div>
          <div className="fixed top-0 right-0 w-[420px] h-full bg-white z-[201] shadow-2xl flex flex-col transition-transform duration-300 animate-slide-in">
            <header className="px-6 py-4.5 border-b border-[#E6EBF8] flex items-center justify-between shrink-0">
              <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B]">
                {drawerEditId ? "Edit Testimonial Quote" : "Add new testimonial"}
              </h3>
              <button
                onClick={closeDrawer}
                className="w-7 h-7 border border-[#E6EBF8] bg-surface hover:bg-badge-bg rounded-lg text-primary text-sm flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Student name</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="text"
                  placeholder="e.g. Rohan Agarwal"
                  value={drawerForm.studentName || ""}
                  onChange={(e) => setDrawerForm({ ...drawerForm, studentName: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Role / Achievement</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="text"
                  placeholder="e.g. AIR 412"
                  value={drawerForm.role || ""}
                  onChange={(e) => setDrawerForm({ ...drawerForm, role: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Quote</label>
                <textarea
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] resize-none h-20"
                  placeholder="What did the student say?"
                  value={drawerForm.quote || ""}
                  onChange={(e) => setDrawerForm({ ...drawerForm, quote: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Photo or video (optional)</label>
                {drawerForm.mediaUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-[#E6EBF8] aspect-[4/3] bg-slate-100">
                    {drawerForm.mediaType === "video" ? (
                      <video src={drawerForm.mediaUrl} className="w-full h-full object-cover" controls />
                    ) : (
                      <Image src={drawerForm.mediaUrl} alt="Testimonial media" fill className="object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setDrawerForm({ ...drawerForm, mediaUrl: "", mediaType: "" })}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                    >
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1.5 aspect-[4/3] rounded-lg border border-dashed border-[#E6EBF8] bg-surface text-[#9BA8C0] cursor-pointer hover:border-secondary hover:text-secondary transition-colors">
                    {uploadingMedia ? (
                      <span className="text-[10px] font-semibold">Uploading...</span>
                    ) : (
                      <>
                        <IconUpload className="w-5 h-5" />
                        <span className="text-[10px] font-semibold">Upload image or video</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      disabled={uploadingMedia}
                      onChange={handleMediaSelect}
                    />
                  </label>
                )}
                <p className="text-[9px] text-[#9BA8C0]">Leave empty for a text-only review. Max 25MB.</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Rating</label>
                <div className="flex gap-1.5 select-none pt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      onClick={() => setDrawerForm({ ...drawerForm, rating: n })}
                      className={`text-2xl cursor-pointer transition-colors ${
                        n <= (drawerForm.rating || 5) ? "text-accent animate-scale-up" : "text-[#9BA8C0]"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Show on website</label>
                <select
                  className="text-xs p-2.5 border border-[#E6EBF8] rounded-lg outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  value={drawerForm.showOnSite ? "Yes" : "No"}
                  onChange={(e) => setDrawerForm({ ...drawerForm, showOnSite: e.target.value === "Yes" })}
                >
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-[#E6EBF8] flex gap-3 shrink-0">
              <button
                onClick={closeDrawer}
                className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-transparent text-primary border border-border-subtle hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={saveDrawerData}
                className="flex-1 text-xs font-bold py-2.5 rounded-lg bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors"
              >
                Save changes
              </button>
            </footer>
          </div>
        </>
      )}
      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={cropperSrc}
        aspectRatio={4 / 3}
        title="Crop Testimonial Media Image"
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
