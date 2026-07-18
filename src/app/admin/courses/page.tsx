"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconSearch,
  IconLayoutGrid,
  IconList,
  IconPlus,
  IconEdit,
  IconTrash,
  IconBook,
  IconMath,
  IconCode,
  IconFlask,
  IconPencil,
  IconDna,
  IconEye,
} from "@tabler/icons-react";
import {
  getAdminData,
  upsertCourse,
  deleteCourse as apiDeleteCourse,
  toggleCourseStatus as apiToggleCourseStatus,
  uploadCourseCover,
  getCourseUnits,
  upsertCourseUnit,
  deleteCourseUnit,
  reorderCourseUnits,
} from "../../actions";
import { SkeletonCard } from "@/components/Skeleton";

interface Course {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  subject: string;
  format: string;
  price: number;
  mentor: string;
  students: number;
  rating: number;
  status: "Active" | "Draft";
  colorBg: string;
  iconName: string;
  classLevel?: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View States
  const [courseView, setCourseView] = useState<"grid" | "list">("grid");

  // Search & Filter States
  const [courseSearch, setCourseSearch] = useState("");
  const [courseFormatFilter, setCourseFormatFilter] = useState("All formats");
  const [courseSubjectFilter, setCourseSubjectFilter] = useState("All subjects");
  const [courseClassFilter, setCourseClassFilter] = useState("All classes");

  // Drawer modal state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEditId, setDrawerEditId] = useState<string | null>(null);
  const [drawerForm, setDrawerForm] = useState<any>({});
  const [showMoreCourseDetails, setShowMoreCourseDetails] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [courseLangDropdownOpen, setCourseLangDropdownOpen] = useState(false);

  // Recorded units editor state
  const [courseUnits, setCourseUnits] = useState<any[]>([]);
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [newUnitUrl, setNewUnitUrl] = useState("");
  const [newUnitDesc, setNewUnitDesc] = useState("");
  const [newUnitDur, setNewUnitDur] = useState(0);
  const [newUnitModule, setNewUnitModule] = useState("");
  const [unitSaving, setUnitSaving] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitOrder, setEditingUnitOrder] = useState<number>(0);

  const loadData = async () => {
    try {
      const res = await getAdminData();
      setCourses(res.courses);
      setMentors(res.mentors);
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadCourseCover(formData);
      setDrawerForm((prev: any) => ({ ...prev, coverImageUrl: res.publicUrl }));
    } catch (err: any) {
      alert("Image upload failed: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const openDrawer = (id: string | null = null) => {
    setDrawerEditId(id);
    setCourseUnits([]);
    
    if (id) {
      const item = courses.find((x) => x.id === id);
      setDrawerForm({ ...item });
      if (item && item.format === "Recorded") {
        getCourseUnits(id).then(setCourseUnits).catch(console.error);
      }
    } else {
      setDrawerForm({
        title: "",
        description: "",
        coverImageUrl: "",
        subject: "Mathematics",
        format: "Live batch",
        price: 0,
        mentor: mentors[0]?.name || "Arjun Kapoor",
        students: 0,
        rating: 5.0,
        status: "Draft",
        durationDays: 30,
        totalSessions: 10,
        sessionsPerWeek: 2,
        classDays: "",
        classTiming: "",
        languages: ["English"],
        classLevel: "",
      });
    }
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerEditId(null);
    setShowMoreCourseDetails(false);
    handleCancelEditUnit();
  };

  const saveDrawerData = async () => {
    try {
      await upsertCourse(drawerForm);
      closeDrawer();
      await loadData();
    } catch (err: any) {
      alert("Error saving course: " + err.message);
    }
  };

  const deleteItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      try {
        await apiDeleteCourse(id);
        await loadData();
      } catch (err: any) {
        alert("Error deleting course: " + err.message);
      }
    }
  };

  const toggleCourseStatus = async (id: string) => {
    const item = courses.find((x) => x.id === id);
    if (!item) return;
    try {
      await apiToggleCourseStatus(id, item.status);
      await loadData();
    } catch (err: any) {
      alert("Error toggling course status: " + err.message);
    }
  };

  // Recorded Units CRUD handlers
  const handleSaveUnit = async () => {
    if (!drawerEditId) return;
    if (!newUnitTitle.trim() || !newUnitUrl.trim()) {
      alert("Unit title and Video URL are required.");
      return;
    }
    setUnitSaving(true);
    try {
      const order = editingUnitId ? editingUnitOrder : (courseUnits.length + 1);
      await upsertCourseUnit({
        id: editingUnitId || undefined,
        courseId: drawerEditId,
        title: newUnitTitle.trim(),
        youtubeUrl: newUnitUrl.trim(),
        description: newUnitDesc.trim(),
        durationSeconds: Number(newUnitDur || 0) * 60,
        moduleName: newUnitModule.trim() || "Module 1",
        orderIndex: order,
      });
      setNewUnitTitle("");
      setNewUnitUrl("");
      setNewUnitDesc("");
      setNewUnitDur(0);
      setNewUnitModule("");
      setEditingUnitId(null);
      
      const updated = await getCourseUnits(drawerEditId);
      setCourseUnits(updated);
    } catch (err: any) {
      alert("Failed to save unit: " + err.message);
    } finally {
      setUnitSaving(false);
    }
  };

  const handleEditUnit = (unit: any) => {
    setEditingUnitId(unit.id);
    setNewUnitTitle(unit.title);
    setNewUnitUrl(unit.youtube_url || "");
    setNewUnitDesc(unit.description || "");
    setNewUnitDur(Math.round((unit.duration_seconds || 0) / 60));
    setNewUnitModule(unit.module_name || "");
    setEditingUnitOrder(unit.order_index || 0);
  };

  const handleCancelEditUnit = () => {
    setEditingUnitId(null);
    setNewUnitTitle("");
    setNewUnitUrl("");
    setNewUnitDesc("");
    setNewUnitDur(0);
    setNewUnitModule("");
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!drawerEditId) return;
    if (confirm("Are you sure you want to delete this video lecture unit?")) {
      try {
        await deleteCourseUnit(unitId);
        const updated = await getCourseUnits(drawerEditId);
        setCourseUnits(updated);
      } catch (err: any) {
        alert("Failed to delete unit: " + err.message);
      }
    }
  };

  const handleMoveUnit = async (idx: number, direction: "up" | "down") => {
    if (!drawerEditId) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= courseUnits.length) return;

    const list = [...courseUnits];
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    const updatedList = list.map((item, i) => ({
      ...item,
      order_index: i + 1,
    }));
    setCourseUnits(updatedList);

    try {
      await reorderCourseUnits(updatedList.map((x) => x.id));
    } catch (err: any) {
      console.error("Failed to persist order: " + err.message);
    }
  };

  // Extract unique subjects and classes dynamically
  const uniqueSubjects = React.useMemo(() => {
    const subs = new Set<string>();
    courses.forEach((c) => {
      if (c.subject) subs.add(c.subject);
    });
    return Array.from(subs).sort();
  }, [courses]);

  const uniqueClasses = React.useMemo(() => {
    const cls = new Set<string>();
    courses.forEach((c) => {
      if (c.classLevel) cls.add(c.classLevel);
    });
    return Array.from(cls).sort();
  }, [courses]);

  // Filters application
  const filteredCourses = courses.filter((x) => {
    const matchSearch = x.title.toLowerCase().includes(courseSearch.toLowerCase());
    const matchFormat =
      courseFormatFilter === "All formats" || x.format === courseFormatFilter;
    const matchSubject =
      courseSubjectFilter === "All subjects" || x.subject === courseSubjectFilter;
    const matchClass =
      courseClassFilter === "All classes" || x.classLevel === courseClassFilter;
    return matchSearch && matchFormat && matchSubject && matchClass;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Toolbar Skeleton */}
        <div className="flex items-center justify-between gap-3 flex-wrap animate-pulse">
          <div className="flex items-center gap-2 flex-1 max-w-xl flex-wrap">
            <div className="h-8 bg-slate-200 rounded-lg w-48"></div>
            <div className="h-8 bg-slate-200 rounded-lg w-28"></div>
            <div className="h-8 bg-slate-200 rounded-lg w-28"></div>
          </div>
          <div className="h-8 bg-slate-200 rounded-lg w-24"></div>
        </div>
        {/* Course Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
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
              placeholder="Search courses..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-border-subtle rounded-lg bg-white outline-none font-semibold text-[#1B3A6B]"
            />
          </div>
          <select
            value={courseFormatFilter}
            onChange={(e) => setCourseFormatFilter(e.target.value)}
            className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer font-semibold text-[#1B3A6B]"
          >
            <option>All formats</option>
            <option>Live batch</option>
            <option>Recorded</option>
            <option>Hourly</option>
          </select>
          <select
            value={courseSubjectFilter}
            onChange={(e) => setCourseSubjectFilter(e.target.value)}
            className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer font-semibold text-[#1B3A6B]"
          >
            <option>All subjects</option>
            {uniqueSubjects.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
          <select
            value={courseClassFilter}
            onChange={(e) => setCourseClassFilter(e.target.value)}
            className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer font-semibold text-[#1B3A6B]"
          >
            <option>All classes</option>
            {uniqueClasses.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex border border-[#E6EBF8] rounded-lg overflow-hidden shrink-0 shadow-sm bg-white">
            <button
              onClick={() => setCourseView("grid")}
              className={`p-2 cursor-pointer transition-colors ${
                courseView === "grid" ? "bg-[#EBF2FF] text-[#1B3A6B]" : "bg-white text-[#9BA8C0]"
              }`}
            >
              <IconLayoutGrid className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setCourseView("list")}
              className={`p-2 cursor-pointer transition-colors ${
                courseView === "list" ? "bg-[#EBF2FF] text-[#1B3A6B]" : "bg-white text-[#9BA8C0]"
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
      {courseView === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((c) => {
            let IconComponent = IconBook;
            if (c.iconName === "math") IconComponent = IconMath;
            else if (c.iconName === "code") IconComponent = IconCode;
            else if (c.iconName === "flask") IconComponent = IconFlask;
            else if (c.iconName === "writing") IconComponent = IconPencil;
            else if (c.iconName === "dna") IconComponent = IconDna;

            return (
              <div
                key={c.id}
                className="bg-white border border-[#E6EBF8] rounded-2xl overflow-hidden hover:shadow-md transition-shadow group relative flex flex-col justify-between"
              >
                <div>
                  {c.coverImageUrl ? (
                    <div className="w-full h-28 overflow-hidden relative border-b border-[#E6EBF8]">
                      <img src={c.coverImageUrl} alt={c.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={() => openDrawer(c.id)}
                          className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg cursor-pointer text-text-muted"
                        >
                          <IconEdit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteItem(c.id)}
                          className="w-7 h-7 rounded-lg border border-red-200 bg-white flex items-center justify-center hover:bg-red-50 text-red-600 cursor-pointer"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{ backgroundColor: c.colorBg }}
                      className="w-full h-28 flex items-center justify-center relative border-b border-[#E6EBF8]"
                    >
                      <IconComponent className="w-10 h-10 text-primary/80" />
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openDrawer(c.id)}
                          className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg cursor-pointer text-text-muted"
                        >
                          <IconEdit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteItem(c.id)}
                          className="w-7 h-7 rounded-lg border border-red-200 bg-white flex items-center justify-center hover:bg-red-50 text-red-600 cursor-pointer"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="p-4 space-y-1.5">
                    <span
                      className={`text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                        (c.format === "Live batch" || c.format === "Live individual")
                          ? "bg-blue-50 text-[#2F7FE8] border border-blue-100"
                          : c.format === "Recorded"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-green-50 text-green-700 border border-green-100"
                      }`}
                    >
                      {c.format}
                    </span>
                    <h3 className="font-heading text-xs font-bold text-primary truncate">
                      {c.title}
                    </h3>
                    <div className="text-[10px] text-[#6B7A99] flex items-center gap-1.5">
                      <span>{c.subject}</span>
                      <span className="text-[#E6EBF8]">&middot;</span>
                      <span>⭐ {c.rating} ({c.students} students)</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-[#E6EBF8]/50 flex items-center justify-between">
                  <span className="font-heading text-sm font-extrabold text-[#1B3A6B]">
                    ₹{c.price.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === "Active"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {c.status}
                    </span>
                    <div
                      onClick={() => toggleCourseStatus(c.id)}
                      className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors duration-200 ${
                        c.status === "Active" ? "bg-green-500" : "bg-border-subtle"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${
                          c.status === "Active" ? "left-4" : "left-0.5"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-0">
                  <Link
                    href={`/admin/courses/${c.id}`}
                    className="w-full text-[11px] font-bold py-2 rounded-xl bg-[#EBF2FF] text-[#1B3A6B] hover:bg-[#2F7FE8] hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                  >
                    <IconEye className="w-3.5 h-3.5" /> View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-4 shadow-sm overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-badge-bg/30 border-b border-[#E6EBF8]">
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Course</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Subject</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Format</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Price</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Students</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Status</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Active</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((c) => (
                <tr key={c.id} className="border-b border-[#E6EBF8]/50 hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-xs text-[#1B3A6B] font-bold">{c.title}</td>
                  <td className="py-2.5 px-3 text-xs text-text-muted font-medium">{c.subject}</td>
                  <td className="py-2.5 px-3 text-xs">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        (c.format === "Live batch" || c.format === "Live individual")
                          ? "bg-[#EBF2FF] text-[#1B3A6B] border border-blue-100"
                          : c.format === "Recorded"
                          ? "bg-amber-50 text-amber-800 border border-amber-100"
                          : "bg-green-50 text-green-700 border border-green-100"
                      }`}
                    >
                      {c.format}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-primary font-bold">
                    ₹{c.price.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-text-muted font-semibold">{c.students}</td>
                  <td className="py-2.5 px-3 text-xs">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === "Active"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs">
                    <div
                      onClick={() => toggleCourseStatus(c.id)}
                      className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors duration-200 ${
                        c.status === "Active" ? "bg-green-500" : "bg-border-subtle"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${
                          c.status === "Active" ? "left-4" : "left-0.5"
                        }`}
                      ></div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex gap-1.5 justify-center">
                      <Link
                        href={`/admin/courses/${c.id}`}
                        className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg text-[#1B3A6B] cursor-pointer"
                      >
                        <IconEye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => openDrawer(c.id)}
                        className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg text-[#6B7A99] cursor-pointer"
                      >
                        <IconEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteItem(c.id)}
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
                {drawerEditId ? "Edit Course Details" : "Add new course"}
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
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Course title</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="text"
                  placeholder="e.g. Advanced Calculus & Algebra"
                  value={drawerForm.title || ""}
                  onChange={(e) => setDrawerForm({ ...drawerForm, title: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Short Description</label>
                <textarea
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] resize-none h-18"
                  placeholder="Enter course details..."
                  value={drawerForm.description || ""}
                  onChange={(e) => setDrawerForm({ ...drawerForm, description: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Subject</label>
                <select
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  value={
                    ["Mathematics", "Science", "Programming", "English"].includes(drawerForm.subject)
                      ? drawerForm.subject
                      : drawerForm.subject
                      ? "Custom"
                      : "Mathematics"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Custom") {
                      setDrawerForm({ ...drawerForm, subject: "", _customSubjectActive: true });
                    } else {
                      setDrawerForm({ ...drawerForm, subject: val, _customSubjectActive: false });
                    }
                  }}
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Programming">Programming</option>
                  <option value="English">English</option>
                  <option value="Custom">Create New Subject...</option>
                </select>
                {(drawerForm._customSubjectActive || !["Mathematics", "Science", "Programming", "English"].includes(drawerForm.subject)) && (
                  <input
                    className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] mt-1.5"
                    type="text"
                    placeholder="Enter custom subject name..."
                    value={drawerForm.subject || ""}
                    onChange={(e) => setDrawerForm({ ...drawerForm, subject: e.target.value })}
                  />
                )}
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Class (Grade Level) - Optional</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="text"
                  placeholder="e.g. Class 10, Grade 8, JEE Prep"
                  value={drawerForm.classLevel || drawerForm.class_level || ""}
                  onChange={(e) => setDrawerForm({ ...drawerForm, classLevel: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Format</label>
                  <select
                    className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                    value={drawerForm.format || "Live batch"}
                    onChange={(e) => setDrawerForm({ ...drawerForm, format: e.target.value })}
                  >
                    <option>Live batch</option>
                    <option>Live individual</option>
                    <option>Recorded</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Price (₹)</label>
                  <input
                    className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                    type="number"
                    value={drawerForm.price || 0}
                    onChange={(e) => setDrawerForm({ ...drawerForm, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Assign Mentor</label>
                <select
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  value={drawerForm.mentor || "Arjun Kapoor"}
                  onChange={(e) => setDrawerForm({ ...drawerForm, mentor: e.target.value })}
                >
                  {mentors.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cover image upload */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Cover Image</label>
                {drawerForm.coverImageUrl ? (
                  <div className="relative border border-[#E6EBF8] rounded-lg p-2 flex items-center gap-3 bg-slate-50">
                    <img src={drawerForm.coverImageUrl} className="w-12 h-12 rounded object-cover" alt="Cover Preview" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-semibold text-primary truncate">{drawerForm.coverImageUrl}</p>
                      <button
                        type="button"
                        onClick={() => setDrawerForm({ ...drawerForm, coverImageUrl: "" })}
                        className="text-[9px] text-red-600 font-bold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative border border-dashed border-border-subtle hover:border-secondary hover:bg-badge-bg/10 rounded-lg p-4 text-center transition-colors cursor-pointer min-h-[50px] flex items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <span className="text-[11px] text-text-muted font-bold">
                      {uploadingImage ? "Uploading Image..." : "Upload Cover from Device"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Status</label>
                <select
                  className="text-xs p-2.5 border border-[#E6EBF8] rounded-lg outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  value={drawerForm.status || "Draft"}
                  onChange={(e) => setDrawerForm({ ...drawerForm, status: e.target.value })}
                >
                  <option>Draft</option>
                  <option>Active</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowMoreCourseDetails(!showMoreCourseDetails)}
                className="w-full text-xs font-bold py-2 border border-secondary rounded-lg text-secondary hover:bg-[#F0F6FF] transition-colors mt-2 cursor-pointer"
              >
                {showMoreCourseDetails ? "Hide Advanced Config" : "Show Advanced Config"}
              </button>

              {showMoreCourseDetails && (
                <div className="space-y-4 border-t border-[#E6EBF8] pt-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">About Course Detail Paragraph</label>
                    <textarea
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] resize-none h-20"
                      placeholder="Custom course information..."
                      value={drawerForm.aboutCourse || ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, aboutCourse: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Learning Outcomes (one item per line)</label>
                    <textarea
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] resize-none h-20"
                      placeholder="What you'll learn..."
                      value={drawerForm.learningOutcomes ? drawerForm.learningOutcomes.join("\n") : ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, learningOutcomes: e.target.value.split("\n").filter(Boolean) })}
                    />
                  </div>

                  {/* Recorded Course Unit list */}
                  {drawerForm.format === "Recorded" && drawerEditId && (
                    <div className="space-y-4 border-t border-[#E6EBF8] pt-4 mt-4">
                      <div className="font-heading text-xs font-extrabold text-[#1B3A6B] uppercase tracking-wider">
                        Lecture Videos & Curriculum ({courseUnits.length})
                      </div>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {courseUnits.map((u, i) => (
                          <div key={u.id} className="p-2 border border-[#E6EBF8] rounded-xl flex items-center justify-between bg-slate-50 gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#1B3A6B] truncate">
                                {u.order_index}. {u.title}
                              </p>
                              <p className="text-[9px] text-text-muted mt-0.5 truncate font-semibold">
                                {u.module_name} &middot; {Math.round((u.duration_seconds || 0) / 60)} mins
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={i === 0}
                                onClick={() => handleMoveUnit(i, "up")}
                                className="w-5 h-5 border border-border-subtle rounded flex items-center justify-center text-[10px] bg-white cursor-pointer disabled:opacity-40"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={i === courseUnits.length - 1}
                                onClick={() => handleMoveUnit(i, "down")}
                                className="w-5 h-5 border border-border-subtle rounded flex items-center justify-center text-[10px] bg-white cursor-pointer disabled:opacity-40"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditUnit(u)}
                                className="w-5 h-5 border border-border-subtle rounded flex items-center justify-center text-[10px] bg-white text-primary hover:bg-slate-100 cursor-pointer"
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUnit(u.id)}
                                className="w-5 h-5 border border-red-100 rounded flex items-center justify-center text-[10px] bg-white text-red-600 hover:bg-red-50 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add/Edit unit panel */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E6EBF8] space-y-3">
                        <div className="text-[10px] font-extrabold text-[#1B3A6B] uppercase tracking-wider">
                          {editingUnitId ? "Edit video lecture" : "Add new video lecture"}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Lecture Title"
                            value={newUnitTitle}
                            onChange={(e) => setNewUnitTitle(e.target.value)}
                            className="text-xs p-2 border border-border-subtle rounded-lg bg-white font-semibold text-[#1B3A6B]"
                          />
                          <input
                            type="text"
                            placeholder="Video Embed URL"
                            value={newUnitUrl}
                            onChange={(e) => setNewUnitUrl(e.target.value)}
                            className="text-xs p-2 border border-border-subtle rounded-lg bg-white font-semibold text-[#1B3A6B]"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Module Name (e.g. Chapter 1)"
                            value={newUnitModule}
                            onChange={(e) => setNewUnitModule(e.target.value)}
                            className="text-xs p-2 col-span-2 border border-border-subtle rounded-lg bg-white font-semibold text-[#1B3A6B]"
                          />
                          <input
                            type="number"
                            placeholder="Mins"
                            value={newUnitDur || ""}
                            onChange={(e) => setNewUnitDur(Number(e.target.value))}
                            className="text-xs p-2 border border-border-subtle rounded-lg bg-white font-semibold text-[#1B3A6B]"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Short Description"
                          value={newUnitDesc}
                          onChange={(e) => setNewUnitDesc(e.target.value)}
                          className="w-full text-xs p-2 border border-border-subtle rounded-lg bg-white font-semibold text-[#1B3A6B]"
                        />
                        <div className="flex gap-2 justify-end">
                          {editingUnitId && (
                            <button
                              type="button"
                              onClick={handleCancelEditUnit}
                              className="text-[10px] font-bold px-3 py-1.5 border border-border-subtle rounded bg-white text-text-muted hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleSaveUnit}
                            disabled={unitSaving}
                            className="text-[10px] font-bold px-3 py-1.5 rounded bg-[#2F7FE8] text-white hover:bg-primary"
                          >
                            {unitSaving ? "Saving..." : (editingUnitId ? "Update lecture" : "Save lecture")}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
    </div>
  );
}
