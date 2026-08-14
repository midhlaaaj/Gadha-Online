"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconArrowLeft,
  IconClock,
  IconStar,
  IconSchool,
  IconBook,
  IconCurrencyRupee,
  IconCheck,
  IconBookmark,
  IconEdit,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  getAdminCourseDetails,
  getAdminData,
  upsertCourse,
  uploadCourseCover,
  getCourseUnits,
  upsertCourseUnit,
  deleteCourseUnit,
  reorderCourseUnits,
  checkMentorScheduleConflict,
  getSubjects,
  deleteStorageFileByUrl,
  type ScheduleConflict,
} from "../../../actions";
import { parseTimeToMinutes, minutesToTimeString } from "@/lib/schedule";

const START_TIME_OPTIONS = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type CourseDetails = Awaited<ReturnType<typeof getAdminCourseDetails>>;
type Course = CourseDetails["course"];
type CourseBooking = CourseDetails["bookings"][number];
type Mentor = Awaited<ReturnType<typeof getAdminData>>["mentors"][number];
type CourseUnit = Awaited<ReturnType<typeof getCourseUnits>>[number];
type EditForm = Omit<Partial<Parameters<typeof upsertCourse>[0]>, "durationDays" | "totalSessions" | "sessionsPerWeek"> & {
  _customSubjectActive?: boolean;
  // Bound directly to number `<input>` onChange handlers, which pass the raw string value.
  durationDays?: number | string;
  totalSessions?: number | string;
  sessionsPerWeek?: number | string;
};

export default function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve(params).then((resolvedParams) => {
      setCourseId(resolvedParams.id);
    });
  }, [params]);

  const [course, setCourse] = useState<Course | null>(null);
  const [bookings, setBookings] = useState<CourseBooking[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [subjects, setSubjects] = useState<Awaited<ReturnType<typeof getSubjects>>>([]);
  const [loading, setLoading] = useState(true);

  // Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [scheduleConflicts, setScheduleConflicts] = useState<ScheduleConflict[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Curriculum Editor States
  const [courseUnits, setCourseUnits] = useState<CourseUnit[]>([]);
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [newUnitUrl, setNewUnitUrl] = useState("");
  const [newUnitDesc, setNewUnitDesc] = useState("");
  const [newUnitDur, setNewUnitDur] = useState(0);
  const [newUnitModule, setNewUnitModule] = useState("");
  const [unitSaving, setUnitSaving] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitOrder, setEditingUnitOrder] = useState<number>(0);

  const loadData = async () => {
    if (!courseId) return;
    try {
      const res = await getAdminCourseDetails(courseId);
      setCourse(res.course);
      setBookings(res.bookings || []);
      
      // Load mentors and subjects too
      const [adminData, subjectsRes] = await Promise.all([getAdminData(), getSubjects()]);
      setMentors(adminData.mentors || []);
      setSubjects(subjectsRes);

      if (res.course && res.course.format === "Recorded") {
        const units = await getCourseUnits(courseId);
        setCourseUnits(units || []);
      }
    } catch (err) {
      console.error("Failed to load course details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-on-mount; setState fires after the awaited request resolves, not synchronously
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadData is redefined each render but only reads courseId, which is already tracked
  }, [courseId]);

  const startEdit = () => {
    if (!course) return;
    setEditForm({
      ...course,
      mentor: course.mentor ? course.mentor.name : mentors[0]?.name || "",
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setScheduleConflicts([]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadCourseCover(formData);
      setEditForm((prev) => ({ ...prev, coverImageUrl: res.publicUrl }));
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Couldn't upload the image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const doSave = async () => {
    try {
      await upsertCourse(editForm as Parameters<typeof upsertCourse>[0]);
      setIsEditing(false);
      setScheduleConflicts([]);
      setLoading(true);
      await loadData();
    } catch (err) {
      console.error("Failed to save course:", err);
      alert("Couldn't save this course. Please try again.");
    }
  };

  // Only Live batch / Live individual courses have a fixed weekly
  // schedule worth conflict-checking; Recorded courses have none.
  const handleSave = async () => {
    const mentorId = mentors.find((m) => m.name === editForm.mentor)?.id;
    const days = editForm.classDays ? editForm.classDays.split(",").map((d) => d.trim()).filter(Boolean) : [];
    const isScheduled = editForm.format === "Live batch" || editForm.format === "Live individual";

    if (mentorId && isScheduled && days.length > 0 && editForm.classTime) {
      setCheckingConflicts(true);
      try {
        const duration = Number(editForm.durationMinutes) || 60;
        const startMinutes = parseTimeToMinutes(editForm.classTime);
        const endTimeStr = startMinutes === -1 ? editForm.classTime : minutesToTimeString(startMinutes + duration);

        const conflicts = await checkMentorScheduleConflict(mentorId, {
          days,
          startTime: editForm.classTime,
          endTime: endTimeStr,
          excludeId: courseId || undefined,
          excludeType: "course",
        });

        if (conflicts.length > 0) {
          setScheduleConflicts(conflicts);
          return;
        }
      } finally {
        setCheckingConflicts(false);
      }
    }

    await doSave();
  };

  const saveAnyway = async () => {
    setScheduleConflicts([]);
    await doSave();
  };

  // Recorded Units CRUD handlers
  const handleSaveUnit = async () => {
    if (!courseId) return;
    if (!newUnitTitle.trim() || !newUnitUrl.trim()) {
      alert("Unit title and Video URL are required.");
      return;
    }
    setUnitSaving(true);
    try {
      const order = editingUnitId ? editingUnitOrder : (courseUnits.length + 1);
      await upsertCourseUnit({
        id: editingUnitId || undefined,
        courseId: courseId,
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
      
      const updated = await getCourseUnits(courseId);
      setCourseUnits(updated);
    } catch (err) {
      console.error("Failed to save unit:", err);
      alert("Couldn't save this video unit. Please try again.");
    } finally {
      setUnitSaving(false);
    }
  };

  const handleEditUnit = (unit: CourseUnit) => {
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
    if (confirm("Are you sure you want to delete this video lecture unit?")) {
      try {
        await deleteCourseUnit(unitId);
        const updated = await getCourseUnits(courseId as string);
        setCourseUnits(updated);
      } catch (err) {
        console.error("Failed to delete unit:", err);
        alert("Couldn't delete this video unit. Please try again.");
      }
    }
  };

  const handleMoveUnit = async (idx: number, direction: "up" | "down") => {
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
    } catch (err) {
      console.error("Failed to persist order: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (loading || !courseId) {
    return (
      <div className="space-y-6 font-sans">
        <div className="h-3.5 w-32 bg-slate-200 rounded animate-shimmer"></div>

        {/* Hero card */}
        <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-2xl bg-slate-100 animate-shimmer shrink-0"></div>
            <div className="space-y-2.5 flex-1 pt-1">
              <div className="flex items-center gap-2">
                <div className="h-4 w-16 rounded-full bg-slate-100 animate-shimmer"></div>
                <div className="h-4 w-14 rounded-full bg-slate-100 animate-shimmer"></div>
              </div>
              <div className="h-5 w-64 bg-slate-200 rounded animate-shimmer"></div>
              <div className="h-3 w-80 bg-slate-100 rounded animate-shimmer"></div>
              <div className="h-3 w-52 bg-slate-100 rounded animate-shimmer"></div>
            </div>
          </div>
          <div className="border-t md:border-t-0 md:border-l border-[#E6EBF8] pt-4 md:pt-0 md:pl-6 flex flex-col justify-center min-w-[200px] space-y-2">
            <div className="h-2.5 w-20 bg-slate-100 rounded animate-shimmer"></div>
            <div className="h-6 w-24 bg-slate-200 rounded animate-shimmer"></div>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="w-[36px] h-[36px] rounded-xl bg-slate-100 animate-shimmer"></div>
              <div className="h-2.5 w-24 bg-slate-100 rounded animate-shimmer"></div>
              <div className="h-5 w-20 bg-slate-200 rounded animate-shimmer"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="h-3.5 w-56 bg-slate-200 rounded animate-shimmer pb-3 border-b border-[#E6EBF8]"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-2.5 w-16 bg-slate-100 rounded animate-shimmer"></div>
                    <div className="h-3 w-20 bg-slate-100 rounded animate-shimmer"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="h-3.5 w-64 bg-slate-200 rounded animate-shimmer pb-3 border-b border-[#E6EBF8]"></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-3 flex items-center justify-between gap-4 border-b border-[#E6EBF8]/50 last:border-0">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="h-3 w-40 bg-slate-100 rounded animate-shimmer"></div>
                    <div className="h-2.5 w-52 bg-slate-100 rounded animate-shimmer"></div>
                  </div>
                  <div className="h-3 w-20 bg-slate-100 rounded animate-shimmer shrink-0"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="h-3.5 w-32 bg-slate-200 rounded animate-shimmer pb-3 border-b border-[#E6EBF8]"></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 animate-shimmer shrink-0"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-24 bg-slate-100 rounded animate-shimmer"></div>
                  <div className="h-2.5 w-32 bg-slate-100 rounded animate-shimmer"></div>
                </div>
              </div>
              <div className="space-y-2 border-t border-[#E6EBF8]/60 pt-3.5">
                <div className="h-2.5 w-28 bg-slate-100 rounded animate-shimmer"></div>
                <div className="h-2.5 w-36 bg-slate-100 rounded animate-shimmer"></div>
                <div className="h-2.5 w-20 bg-slate-100 rounded animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-white border border-[#E6EBF8] rounded-2xl p-6 text-center space-y-4 font-sans">
        <p className="text-sm text-text-muted font-semibold">Course details not found.</p>
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7FE8] hover:underline"
        >
          <IconArrowLeft className="w-4 h-4" /> Back to Courses List
        </Link>
      </div>
    );
  }

  // Calculate gross metrics
  const totalSales = bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <div className="space-y-6 font-sans">
      {/* Back Link & Edit Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7A99] hover:text-[#1B3A6B] transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>

        {!isEditing ? (
          <button
            onClick={startEdit}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <IconEdit className="w-4 h-4" /> Edit Course
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={cancelEdit}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1B3A6B] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={checkingConflicts}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingConflicts ? "Checking availability..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {isEditing && scheduleConflicts.length > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
            <IconAlertTriangle className="w-4 h-4 shrink-0" />
            Schedule conflict with this mentor
          </div>
          <ul className="space-y-1">
            {scheduleConflicts.map((c) => (
              <li key={`${c.type}-${c.id}`} className="text-[11px] text-amber-700 font-medium">
                Conflicts with {c.type} &quot;{c.name}&quot;{c.days ? ` on ${c.days}` : ""} at {c.time}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setScheduleConflicts([])}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white text-primary border border-amber-300 hover:bg-amber-100/50 cursor-pointer"
            >
              Go back and edit
            </button>
            <button
              onClick={saveAnyway}
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
            >
              Save anyway
            </button>
          </div>
        </div>
      )}

      {isEditing ? (
        /* COURSE EDITING PANEL LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Details Form */}
            <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">
                Course Core Parameters
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Course Title</label>
                <input
                  type="text"
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Short Description</label>
                <textarea
                  value={editForm.description || ""}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Subject</label>
                  <select
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                    value={
                      subjects.some((s) => s.name === editForm.subject)
                        ? editForm.subject
                        : editForm.subject
                        ? "Custom"
                        : subjects[0]?.name || "Custom"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Custom") {
                        setEditForm({ ...editForm, subject: "", _customSubjectActive: true });
                      } else {
                        setEditForm({ ...editForm, subject: val, _customSubjectActive: false });
                      }
                    }}
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                    <option value="Custom">Create New Subject...</option>
                  </select>
                  {(editForm._customSubjectActive || !subjects.some((s) => s.name === editForm.subject)) && (
                    <input
                      className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] mt-1.5 bg-white w-full"
                      type="text"
                      placeholder="Enter custom subject name..."
                      value={editForm.subject || ""}
                      onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Class Level / Grade</label>
                  <input
                    type="text"
                    placeholder="e.g. Class 10, JEE Prep"
                    value={editForm.classLevel || ""}
                    onChange={(e) => setEditForm({ ...editForm, classLevel: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Format</label>
                  <select
                    value={editForm.format || "Live batch"}
                    onChange={(e) => setEditForm({ ...editForm, format: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  >
                    <option>Live batch</option>
                    <option>Live individual</option>
                    <option>Recorded</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Price (₹)</label>
                  <input
                    type="number"
                    value={editForm.price || 0}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Status</label>
                  <select
                    value={editForm.status || "Draft"}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  >
                    <option>Draft</option>
                    <option>Active</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Schedule & Outcomes Form */}
            <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">
                Schedule & Advanced Configurations
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Duration (Days)</label>
                  <input
                    type="number"
                    value={editForm.durationDays || 30}
                    onChange={(e) => setEditForm({ ...editForm, durationDays: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Total Sessions</label>
                  <input
                    type="number"
                    value={editForm.totalSessions || 10}
                    onChange={(e) => setEditForm({ ...editForm, totalSessions: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Sessions Per Week</label>
                  <input
                    type="number"
                    value={editForm.sessionsPerWeek || 2}
                    onChange={(e) => setEditForm({ ...editForm, sessionsPerWeek: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Class Days</label>
                <div className="flex flex-wrap gap-1">
                  {WEEKDAYS.map((day) => {
                    const selectedDays = editForm.classDays ? editForm.classDays.split(",").map((d) => d.trim()).filter(Boolean) : [];
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const newDays = isSelected
                            ? selectedDays.filter((d) => d !== day)
                            : [...selectedDays, day].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b));
                          setEditForm({ ...editForm, classDays: newDays.join(", ") });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-[#2F7FE8] border-[#2F7FE8] text-white shadow-sm font-bold"
                            : "bg-white border-[#E6EBF8] text-primary hover:bg-slate-50"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Start Time</label>
                  <select
                    value={editForm.classTime || "05:00 PM"}
                    onChange={(e) => {
                      const startTime = e.target.value;
                      const duration = Number(editForm.durationMinutes) || 60;
                      const startMin = parseTimeToMinutes(startTime);
                      const endTime = startMin === -1 ? "" : minutesToTimeString(startMin + duration);
                      setEditForm({
                        ...editForm,
                        classTime: startTime,
                        classTiming: endTime ? `${startTime} - ${endTime}` : startTime,
                      });
                    }}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  >
                    {START_TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Duration (minutes)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={editForm.durationMinutes || 60}
                    onChange={(e) => {
                      const duration = Number(e.target.value) || 60;
                      const startTime = editForm.classTime || "05:00 PM";
                      const startMin = parseTimeToMinutes(startTime);
                      const endTime = startMin === -1 ? "" : minutesToTimeString(startMin + duration);
                      setEditForm({
                        ...editForm,
                        durationMinutes: duration,
                        classTiming: endTime ? `${startTime} - ${endTime}` : startTime,
                      });
                    }}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">About Course Detailed Text</label>
                <textarea
                  value={editForm.aboutCourse || ""}
                  onChange={(e) => setEditForm({ ...editForm, aboutCourse: e.target.value })}
                  className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full h-24 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Learning Outcomes (one outcome per line)</label>
                <textarea
                  value={editForm.learningOutcomes ? editForm.learningOutcomes.join("\n") : ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      learningOutcomes: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                  className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full h-24 resize-none"
                  placeholder="e.g. Understand basic derivatives&#10;Solve quadratic equations"
                />
              </div>
            </div>

            {/* Recorded units curriculum editor inside edit mode */}
            {editForm.format === "Recorded" && (
              <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3 uppercase tracking-wider">
                  Lecture Videos & Syllabus Curriculum ({courseUnits.length})
                </h3>

                {/* Units List */}
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {courseUnits.map((u, i) => (
                    <div
                      key={u.id}
                      className="p-3 border border-[#E6EBF8] rounded-xl flex items-center justify-between bg-slate-50 gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1B3A6B] truncate">
                          {u.order_index}. {u.title}
                        </p>
                        <p className="text-[9px] text-[#6B7A99] mt-0.5 truncate font-semibold">
                          {u.module_name} &middot; {Math.round((u.duration_seconds || 0) / 60)} mins
                        </p>
                        {u.youtube_url && (
                          <p className="text-[8px] text-[#2F7FE8] font-mono mt-0.5 truncate">{u.youtube_url}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={i === 0}
                          onClick={() => handleMoveUnit(i, "up")}
                          className="w-6 h-6 border border-[#E6EBF8] rounded-lg flex items-center justify-center text-[11px] bg-white cursor-pointer disabled:opacity-40"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={i === courseUnits.length - 1}
                          onClick={() => handleMoveUnit(i, "down")}
                          className="w-6 h-6 border border-[#E6EBF8] rounded-lg flex items-center justify-center text-[11px] bg-white cursor-pointer disabled:opacity-40"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditUnit(u)}
                          className="w-6 h-6 border border-blue-100 rounded-lg flex items-center justify-center text-[11px] bg-white text-[#2F7FE8] hover:bg-blue-50 cursor-pointer"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUnit(u.id)}
                          className="w-6 h-6 border border-red-100 rounded-lg flex items-center justify-center text-[11px] bg-white text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {courseUnits.length === 0 && (
                    <p className="text-xs text-text-muted italic text-center py-4">No video lectures recorded yet.</p>
                  )}
                </div>

                {/* Add/Edit lecture sub-panel */}
                <div className="p-4 bg-slate-50 border border-[#E6EBF8] rounded-2xl space-y-3">
                  <span className="text-[10px] font-extrabold text-[#1B3A6B] uppercase tracking-wider block">
                    {editingUnitId ? "✎ Edit Lecture Details" : "＋ Add Lecture Video"}
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Lecture Title</span>
                      <input
                        type="text"
                        placeholder="e.g. 1. Introduction to Calculus"
                        value={newUnitTitle}
                        onChange={(e) => setNewUnitTitle(e.target.value)}
                        className="text-xs p-2 border border-[#E6EBF8] rounded-lg bg-white font-semibold text-[#1B3A6B]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400">YouTube Embed Link</span>
                      <input
                        type="text"
                        placeholder="e.g. https://www.youtube.com/embed/..."
                        value={newUnitUrl}
                        onChange={(e) => setNewUnitUrl(e.target.value)}
                        className="text-xs p-2 border border-[#E6EBF8] rounded-lg bg-white font-semibold text-[#1B3A6B]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Module (Chapter) Name</span>
                      <input
                        type="text"
                        placeholder="e.g. Chapter 1: Foundations"
                        value={newUnitModule}
                        onChange={(e) => setNewUnitModule(e.target.value)}
                        className="text-xs p-2 border border-[#E6EBF8] rounded-lg bg-white font-semibold text-[#1B3A6B]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Duration (Mins)</span>
                      <input
                        type="number"
                        placeholder="Mins"
                        value={newUnitDur || ""}
                        onChange={(e) => setNewUnitDur(Number(e.target.value))}
                        className="text-xs p-2 border border-[#E6EBF8] rounded-lg bg-white font-semibold text-[#1B3A6B]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Lecture Summary</span>
                    <input
                      type="text"
                      placeholder="Brief details about what is taught in this video..."
                      value={newUnitDesc}
                      onChange={(e) => setNewUnitDesc(e.target.value)}
                      className="text-xs p-2 border border-[#E6EBF8] rounded-lg bg-white font-semibold text-[#1B3A6B]"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    {editingUnitId && (
                      <button
                        type="button"
                        onClick={handleCancelEditUnit}
                        className="text-[10px] font-bold px-3 py-1.5 border border-[#E6EBF8] rounded-lg bg-white text-text-muted hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveUnit}
                      disabled={unitSaving}
                      className="text-[10px] font-bold px-4 py-1.5 rounded-lg bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] cursor-pointer"
                    >
                      {unitSaving ? "Saving..." : editingUnitId ? "Update lecture" : "Save lecture"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Cover image editor */}
            <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">
                Cover Image
              </h3>
              {editForm.coverImageUrl ? (
                <div className="relative border border-[#E6EBF8] rounded-2xl p-2 bg-slate-50">
                  <div className="relative w-full h-32">
                    <Image src={editForm.coverImageUrl} fill className="rounded-xl object-cover" alt="Cover Preview" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = editForm.coverImageUrl;
                      setEditForm({ ...editForm, coverImageUrl: "" });
                      if (url) deleteStorageFileByUrl(url).catch((err) => console.error("Failed to delete cover image:", err));
                    }}
                    className="absolute top-4 right-4 bg-white/90 hover:bg-red-50 hover:text-red-600 text-xs font-bold px-2.5 py-1 rounded-lg border border-[#E6EBF8] cursor-pointer shadow"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="relative border border-dashed border-[#E6EBF8] hover:border-[#2F7FE8] rounded-2xl p-6 text-center cursor-pointer min-h-[120px] flex items-center justify-center bg-slate-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <span className="text-[11px] text-text-muted font-bold">
                    {uploadingImage ? "Uploading Image..." : "Upload Cover Image"}
                  </span>
                </div>
              )}
            </div>

            {/* Mentor assignment selector */}
            <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">
                Assign Course Mentor
              </h3>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Assigned Educator</label>
                <select
                  className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  value={editForm.mentor || ""}
                  onChange={(e) => setEditForm({ ...editForm, mentor: e.target.value })}
                >
                  {mentors.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD VIEW DETAILS MODE */
        <>
          {/* Course Main Summary Header */}
          <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-stretch">
            <div className="flex flex-col md:flex-row gap-5 items-start flex-1">
              {course.coverImageUrl ? (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-[#E6EBF8] shrink-0">
                  <Image src={course.coverImageUrl} alt={course.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-[#EBF2FF] flex items-center justify-center text-[#2F7FE8] shrink-0 border border-[#D0DCF5]">
                  <IconBook className="w-10 h-10" />
                </div>
              )}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-extrabold uppercase bg-blue-50 text-[#2F7FE8] border border-blue-100 px-2 py-0.5 rounded-full">
                    {course.format}
                  </span>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                    course.status === "Active" ? "bg-green-50 text-green-700 border border-green-100" : "bg-gray-100 text-gray-700"
                  }`}>
                    {course.status}
                  </span>
                  {course.classLevel && (
                    <span className="text-[9px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full">
                      {course.classLevel}
                    </span>
                  )}
                </div>
                <h2 className="font-heading text-xl font-extrabold text-[#1B3A6B] leading-snug">{course.title}</h2>
                <p className="text-xs text-[#6B7A99] font-medium max-w-2xl leading-relaxed">{course.description}</p>
                <div className="flex items-center gap-4 text-xs text-[#6B7A99] pt-2 font-medium">
                  <span><strong>Subject:</strong> {course.subject}</span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1"><IconStar className="w-3.5 h-3.5 fill-accent text-accent" /> {course.rating || 5.0} Rating</span>
                  <span className="text-slate-300">|</span>
                  <span><strong>Languages:</strong> {course.languages.join(", ")}</span>
                </div>
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-[#E6EBF8] pt-4 md:pt-0 md:pl-6 flex flex-col justify-center min-w-[200px] text-left md:text-right space-y-1">
              <div className="text-[10px] uppercase font-bold text-text-muted">Course Price</div>
              <div className="font-heading text-2xl font-extrabold text-[#1B3A6B]">
                ₹{course.price.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#2F7FE8] font-bold">One-time payment</div>
            </div>
          </div>

          {/* KPI Stats Counter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm">
              <div className="w-[36px] h-[36px] rounded-xl bg-green-50 flex items-center justify-center text-green-700 mb-3">
                <IconCurrencyRupee className="w-5 h-5" />
              </div>
              <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Total Sales Revenue</div>
              <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">₹{totalSales.toLocaleString()}</div>
            </div>

            <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm">
              <div className="w-[36px] h-[36px] rounded-xl bg-blue-50 flex items-center justify-center text-[#2F7FE8] mb-3">
                <IconBookmark className="w-5 h-5" />
              </div>
              <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Total Enrollments</div>
              <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">{totalBookings} booked</div>
            </div>

            <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm">
              <div className="w-[36px] h-[36px] rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 mb-3">
                <IconCheck className="w-5 h-5" />
              </div>
              <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Active Confirmed Users</div>
              <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">{activeBookings} active</div>
            </div>
          </div>

          {/* Two-Column split details layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Columns - Details Parameters */}
            <div className="lg:col-span-2 space-y-6">
              {/* Syllabus & Course Overview parameters */}
              <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">Course Schedule & Duration</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-[#1B3A6B]">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                    <span className="text-[#1B3A6B]">{course.durationDays || 30} Days</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sessions</span>
                    <span>{course.totalSessions || 10} classes</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weekly Frequency</span>
                    <span>{course.sessionsPerWeek || 2} sessions / wk</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Days</span>
                    <span>{course.classDays || "Self-Paced / Recorded"}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timing</span>
                    <span>{course.classTiming || "TBA"}</span>
                  </div>
                </div>
                
                {course.aboutCourse && (
                  <div className="pt-4 border-t border-[#E6EBF8] space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">About the Course</span>
                    <p className="text-xs text-[#6B7A99] leading-relaxed whitespace-pre-wrap">{course.aboutCourse}</p>
                  </div>
                )}

                {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                  <div className="pt-4 border-t border-[#E6EBF8] space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">What You&apos;ll Learn</span>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-[#6B7A99] font-medium">
                      {course.learningOutcomes.map((out: string, index: number) => (
                        <li key={index}>{out}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recorded units curriculum display in read-only mode */}
              {course.format === "Recorded" && courseUnits.length > 0 && (
                <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3 uppercase tracking-wider">
                    Syllabus Curriculum ({courseUnits.length} video lectures)
                  </h3>

                  <div className="divide-y divide-[#E6EBF8]/60">
                    {courseUnits.map((u) => (
                      <div key={u.id} className="py-3 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1B3A6B]">
                            {u.order_index}. {u.title}
                          </p>
                          <p className="text-[10px] text-text-muted mt-0.5 font-semibold">
                            {u.module_name} &middot; {Math.round((u.duration_seconds || 0) / 60)} mins
                          </p>
                          {u.description && (
                            <p className="text-[10px] text-[#6B7A99] mt-1 font-medium italic">{u.description}</p>
                          )}
                        </div>
                        {u.youtube_url && (
                          <a
                            href={u.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-[#2F7FE8] hover:underline shrink-0 self-start md:self-center"
                          >
                            Watch Video &rarr;
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Bookings Roster */}
              <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">Student Enrollment Roster</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#E6EBF8]">
                        <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Booking ID</th>
                        <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Student Details</th>
                        <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Parent Details</th>
                        <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Enrolled Date</th>
                        <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Payment</th>
                        <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-[#E6EBF8]/50 hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-[10px] font-bold text-[#1B3A6B] truncate max-w-[80px]">{b.id}</td>
                          <td className="py-3 px-4">
                            <div className="text-xs font-bold text-[#1B3A6B]">{b.studentName}</div>
                            <div className="text-[9px] text-text-muted font-semibold mt-0.5">{b.studentEmail}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs font-bold text-[#1B3A6B]">{b.parentName}</div>
                            <div className="text-[9px] text-text-muted font-semibold mt-0.5">{b.parentEmail}</div>
                          </td>
                          <td className="py-3 px-4 text-xs text-text-muted font-medium">
                            {new Date(b.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              b.paymentStatus === "paid" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700"
                            }`}>
                              {b.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              b.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-slate-700"
                            }`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {bookings.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-xs text-text-muted italic">
                            No students enrolled in this course yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Assigned Mentor details */}
            <div className="space-y-6">
              <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">Assigned Mentor</h3>
                
                {course.mentor ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {course.mentor.avatarUrl ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#E6EBF8] shrink-0">
                          <Image src={course.mentor.avatarUrl} alt={course.mentor.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#1B3A6B] text-accent flex items-center justify-center font-heading text-sm font-bold shrink-0">
                          {course.mentor.name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#1B3A6B] truncate">{course.mentor.name}</h4>
                        <p className="text-[10px] text-text-muted truncate mt-0.5 font-semibold">{course.mentor.email}</p>
                      </div>
                    </div>

                    <div className="text-xs text-[#6B7A99] space-y-2 border-t border-[#E6EBF8]/60 pt-3.5 font-medium">
                      <div className="flex items-center gap-1.5"><IconSchool className="w-4 h-4 text-[#9BA8C0]" /> {course.mentor.qualification}</div>
                      <div className="flex items-center gap-1.5"><IconClock className="w-4 h-4 text-[#9BA8C0]" /> {course.mentor.experience} Years Experience</div>
                      <div className="flex items-center gap-1.5 text-accent"><IconStar className="w-4 h-4 fill-accent" /> {course.mentor.rating} Rating</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic text-center py-2">No mentor assigned to this course.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
