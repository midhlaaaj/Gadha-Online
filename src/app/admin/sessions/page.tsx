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
  IconEye,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  getAdminData,
  upsertSession,
  deleteSession as apiDeleteSession,
  toggleSessionStatus as apiToggleSessionStatus,
  checkMentorScheduleConflict,
  getSubjects,
  type ScheduleConflict,
} from "../../actions";
import { SkeletonCard } from "@/components/Skeleton";
import { parseTimeToMinutes, minutesToTimeString } from "@/lib/schedule";

type AdminData = Awaited<ReturnType<typeof getAdminData>>;

interface Session {
  id: string;
  title: string;
  mentor: string;
  mentorAvatar: string;
  mentorColor: string;
  type: "1-on-1" | "Group";
  description: string;
  bookings: number;
  subject: string;
  price: number;
  status: "Active" | "Inactive";
  colorBg: string;
  iconName: string;
  classLevel?: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mentors, setMentors] = useState<AdminData["mentors"]>([]);
  const [subjects, setSubjects] = useState<Awaited<ReturnType<typeof getSubjects>>>([]);
  const [loading, setLoading] = useState(true);

  // View States
  const [sessionView, setSessionView] = useState<"grid" | "list">("grid");

  // Search & Filter States
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionSubjectFilter, setSessionSubjectFilter] = useState("All subjects");
  const [sessionTypeFilter, setSessionTypeFilter] = useState("All types");
  const [sessionClassFilter, setSessionClassFilter] = useState("All classes");

  // Drawer modal state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEditId, setDrawerEditId] = useState<string | null>(null);
  const [drawerForm, setDrawerForm] = useState<Partial<Parameters<typeof upsertSession>[0]> & { _customSubjectActive?: boolean }>({});
  const [showMoreSessionDetails, setShowMoreSessionDetails] = useState(false);
  const [scheduleConflicts, setScheduleConflicts] = useState<ScheduleConflict[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  const loadData = async () => {
    try {
      const [res, subjectsRes] = await Promise.all([getAdminData(), getSubjects()]);
      setSessions(res.sessions as Session[]);
      setMentors(res.mentors);
      setSubjects(subjectsRes);
    } catch (err) {
      console.error("Failed to load sessions:", err);
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
      const item = sessions.find((x) => x.id === id);
      setDrawerForm({ ...item });
    } else {
      setDrawerForm({
        title: "",
        description: "",
        subject: "Mathematics",
        mentor: mentors[0]?.name || "Arjun Kapoor",
        price: 0,
        type: "1-on-1",
        status: "Active",
        aboutSession: "",
        whatsCovered: [],
        inclusions: ["", "", "", "", ""],
        durationOptions: "60 or 90 min",
        platform: "Zoom",
        language: "English / Hindi",
        days: "Mon – Sat",
        reschedulePolicy: "Up to 4 hrs before",
        sessionDate: "",
        sessionTime: "",
        classLevel: "",
      });
    }
    setScheduleConflicts([]);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerEditId(null);
    setShowMoreSessionDetails(false);
    setScheduleConflicts([]);
  };

  // Only Group sessions with a fixed weekly day-list or a specific date
  // have a schedule worth conflict-checking; 1-on-1 sessions are booked
  // against the mentor's general availability, not a committed slot.
  const getProposedSchedule = (): { days?: string[]; sessionDate?: string; startTime: string } | null => {
    if (drawerForm.type !== "Group" || !drawerForm.sessionTime) return null;
    const startTime = drawerForm.sessionTime;
    if (drawerForm.isRepeatable) {
      const days = drawerForm.days ? drawerForm.days.split(",").map((d) => d.trim()).filter(Boolean) : [];
      if (days.length === 0) return null;
      return { days, startTime };
    }
    if (drawerForm.sessionDate) {
      return { sessionDate: drawerForm.sessionDate, startTime };
    }
    return null;
  };

  const doSave = async () => {
    try {
      await upsertSession(drawerForm as Parameters<typeof upsertSession>[0]);
      closeDrawer();
      await loadData();
    } catch (err) {
      console.error("Error saving session:", err);
      alert("Couldn't save this session. Please try again.");
    }
  };

  const saveDrawerData = async () => {
    const mentorId = mentors.find((m) => m.name === drawerForm.mentor)?.id;
    const proposed = getProposedSchedule();

    if (mentorId && proposed) {
      setCheckingConflicts(true);
      try {
        const duration = drawerForm.durationMinutes || 60;
        const startMinutes = parseTimeToMinutes(proposed.startTime);
        const endTimeStr = startMinutes === -1 ? proposed.startTime : minutesToTimeString(startMinutes + duration);

        const conflicts = await checkMentorScheduleConflict(mentorId, {
          days: proposed.days,
          sessionDate: proposed.sessionDate,
          startTime: proposed.startTime,
          endTime: endTimeStr,
          excludeId: drawerEditId || undefined,
          excludeType: drawerEditId ? "session" : undefined,
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

  const deleteItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this session?")) {
      try {
        await apiDeleteSession(id);
        await loadData();
      } catch (err) {
        console.error("Error deleting session:", err);
        alert("Couldn't delete this session. Please try again.");
      }
    }
  };

  const toggleSessionStatus = async (id: string) => {
    const item = sessions.find((x) => x.id === id);
    if (!item) return;
    try {
      await apiToggleSessionStatus(id, item.status);
      await loadData();
    } catch (err) {
      console.error("Error toggling session status:", err);
      alert("Couldn't update the session status. Please try again.");
    }
  };

  // Extract unique subjects and classes dynamically
  const uniqueSubjects = React.useMemo(() => {
    const subs = new Set<string>();
    sessions.forEach((s) => {
      if (s.subject) subs.add(s.subject);
    });
    return Array.from(subs).sort();
  }, [sessions]);

  const uniqueClasses = React.useMemo(() => {
    const cls = new Set<string>();
    sessions.forEach((s) => {
      if (s.classLevel) cls.add(s.classLevel);
    });
    return Array.from(cls).sort();
  }, [sessions]);

  // Filters application
  const filteredSessions = sessions.filter((x) => {
    const matchSearch = x.title.toLowerCase().includes(sessionSearch.toLowerCase());
    const matchSubject =
      sessionSubjectFilter === "All subjects" || x.subject === sessionSubjectFilter;
    const matchType =
      sessionTypeFilter === "All types" || x.type === sessionTypeFilter;
    const matchClass =
      sessionClassFilter === "All classes" || x.classLevel === sessionClassFilter;
    return matchSearch && matchSubject && matchType && matchClass;
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
              placeholder="Search sessions..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-border-subtle rounded-lg bg-white outline-none font-semibold text-[#1B3A6B]"
            />
          </div>
          <select
            value={sessionSubjectFilter}
            onChange={(e) => setSessionSubjectFilter(e.target.value)}
            className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer font-semibold text-[#1B3A6B]"
          >
            <option>All subjects</option>
            {uniqueSubjects.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
          <select
            value={sessionClassFilter}
            onChange={(e) => setSessionClassFilter(e.target.value)}
            className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer font-semibold text-[#1B3A6B]"
          >
            <option>All classes</option>
            {uniqueClasses.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <select
            value={sessionTypeFilter}
            onChange={(e) => setSessionTypeFilter(e.target.value)}
            className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer font-semibold text-[#1B3A6B]"
          >
            <option>All types</option>
            <option>1-on-1</option>
            <option>Group</option>
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex border border-[#E6EBF8] rounded-lg overflow-hidden shrink-0 shadow-sm bg-white">
            <button
              onClick={() => setSessionView("grid")}
              className={`p-2 cursor-pointer transition-colors ${
                sessionView === "grid" ? "bg-[#EBF2FF] text-[#1B3A6B]" : "bg-white text-[#9BA8C0]"
              }`}
            >
              <IconLayoutGrid className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setSessionView("list")}
              className={`p-2 cursor-pointer transition-colors ${
                sessionView === "list" ? "bg-[#EBF2FF] text-[#1B3A6B]" : "bg-white text-[#9BA8C0]"
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
      {sessionView === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
          {filteredSessions.map((s) => (
            <div
              key={s.id}
              className={`bg-white border border-[#E6EBF8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between ${
                s.status === "Inactive" ? "opacity-75" : ""
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-heading text-xs font-bold text-[#1B3A6B] truncate max-w-[160px]">
                    {s.title}
                  </h3>
                  <span
                    className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                      s.status === "Active"
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : "bg-red-50 text-red-700 border border-red-100"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    style={{ backgroundColor: s.mentorColor }}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-accent font-heading"
                  >
                    {s.mentorAvatar}
                  </div>
                  <span className="text-[10px] text-text-muted font-medium">{s.mentor}</span>
                  <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 ml-auto">
                    {s.type}
                  </span>
                </div>
                <p className="text-[10px] text-text-muted leading-relaxed mb-4 h-12 overflow-hidden text-ellipsis font-medium">
                  {s.description}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-4 text-[10px] text-text-muted mb-4 border-b border-[#E6EBF8]/50 pb-3 font-semibold">
                  <div>
                    <strong className="text-xs text-[#1B3A6B] font-extrabold block leading-tight">
                      {s.bookings}
                    </strong>
                    bookings
                  </div>
                  <div>
                    <strong className="text-xs text-[#1B3A6B] font-extrabold block leading-tight">
                      {s.subject}
                    </strong>
                    subject
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-heading text-base font-extrabold text-[#1B3A6B]">
                    ₹{s.price}
                    <span className="text-[10px] text-text-muted font-normal">/hr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      onClick={() => toggleSessionStatus(s.id)}
                      className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors duration-200 ${
                        s.status === "Active" ? "bg-green-500" : "bg-border-subtle"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${
                          s.status === "Active" ? "left-4" : "left-0.5"
                        }`}
                      ></div>
                    </div>
                    <button
                      onClick={() => openDrawer(s.id)}
                      className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg text-text-muted cursor-pointer"
                    >
                      <IconEdit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteItem(s.id)}
                      className="w-7 h-7 rounded-lg border border-red-200 bg-white flex items-center justify-center hover:bg-red-50 text-red-600 cursor-pointer"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E6EBF8]/50 flex gap-2">
                  <Link
                    href={`/admin/sessions/${s.id}`}
                    className="flex-1 text-[11px] font-bold py-2 rounded-xl bg-[#EBF2FF] text-[#1B3A6B] hover:bg-[#2F7FE8] hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                  >
                    <IconEye className="w-3.5 h-3.5" /> View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-4 shadow-sm overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-badge-bg/30 border-b border-[#E6EBF8]">
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Session</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Mentor</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Subject</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Price/hr</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Bookings</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Status</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Active</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((s) => (
                <tr key={s.id} className="border-b border-[#E6EBF8]/50 hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-xs text-[#1B3A6B] font-bold">{s.title}</td>
                  <td className="py-2.5 px-3 text-xs text-text-muted font-semibold">
                    <div className="flex items-center gap-1.5">
                      <div
                        style={{ backgroundColor: s.mentorColor }}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-accent font-heading"
                      >
                        {s.mentorAvatar}
                      </div>
                      {s.mentor}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-text-muted font-medium">{s.subject}</td>
                  <td className="py-2.5 px-3 text-xs text-primary font-bold">₹{s.price}</td>
                  <td className="py-2.5 px-3 text-xs text-text-muted font-semibold">{s.bookings}</td>
                  <td className="py-2.5 px-3 text-xs">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        s.status === "Active"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-red-50 text-red-700 border border-red-100"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs">
                    <div
                      onClick={() => toggleSessionStatus(s.id)}
                      className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors duration-200 ${
                        s.status === "Active" ? "bg-green-500" : "bg-border-subtle"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${
                          s.status === "Active" ? "left-4" : "left-0.5"
                        }`}
                      ></div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex gap-1.5 justify-center">
                      <Link
                        href={`/admin/sessions/${s.id}`}
                        className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg text-[#1B3A6B] cursor-pointer"
                      >
                        <IconEye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => openDrawer(s.id)}
                        className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg text-[#6B7A99] cursor-pointer"
                      >
                        <IconEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteItem(s.id)}
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
                {drawerEditId ? "Edit Session Details" : "Add new session"}
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
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Session title</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="text"
                  placeholder="e.g. 1-on-1 Physics Clarifications"
                  value={drawerForm.title || ""}
                  onChange={(e) => setDrawerForm({ ...drawerForm, title: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Description</label>
                <textarea
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] resize-none h-18"
                  placeholder="Enter details..."
                  value={drawerForm.description || ""}
                  onChange={(e) => setDrawerForm({ ...drawerForm, description: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Subject</label>
                <select
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  value={
                    subjects.some((s) => s.name === drawerForm.subject)
                      ? drawerForm.subject
                      : drawerForm.subject
                      ? "Custom"
                      : subjects[0]?.name || "Custom"
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
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                  <option value="Custom">Create New Subject...</option>
                </select>
                {(drawerForm._customSubjectActive || !subjects.some((s) => s.name === drawerForm.subject)) && (
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
                  value={drawerForm.classLevel || ""}
                  onChange={(e) => setDrawerForm({ ...drawerForm, classLevel: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Type</label>
                  <select
                    className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                    value={drawerForm.type || "1-on-1"}
                    onChange={(e) => setDrawerForm({ ...drawerForm, type: e.target.value })}
                  >
                    <option>1-on-1</option>
                    <option>Group</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Price (₹ / hr)</label>
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

              {drawerForm.type === "Group" && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-border-subtle">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-[#1B3A6B] uppercase">Schedule Type</label>
                    <select
                      className="text-xs p-2.5 border border-border-subtle rounded-lg bg-white outline-none cursor-pointer font-semibold text-[#1B3A6B]"
                      value={drawerForm.isRepeatable ? "Repeatable" : "Single Date"}
                      onChange={(e) => {
                        const isRep = e.target.value === "Repeatable";
                        setDrawerForm({
                          ...drawerForm,
                          isRepeatable: isRep,
                          sessionDate: isRep ? "" : (drawerForm.sessionDate || ""),
                          days: isRep ? (drawerForm.days === "Mon – Sat" ? "" : (drawerForm.days || "")) : (drawerForm.days || "")
                        });
                      }}
                    >
                      <option value="Single Date">Single Date Session</option>
                      <option value="Repeatable">Repeatable Session (Weekly)</option>
                    </select>
                  </div>

                  {drawerForm.isRepeatable && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-[#1B3A6B] uppercase">Repeat Days of Week</label>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                          const short = day.slice(0, 3);
                          const selectedDays = drawerForm.days ? drawerForm.days.split(", ").map((d: string) => d.trim()) : [];
                          const isSelected = selectedDays.includes(day);

                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                let newDays;
                                if (isSelected) {
                                  newDays = selectedDays.filter((d: string) => d !== day);
                                } else {
                                  newDays = [...selectedDays, day];
                                  const order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                                  newDays.sort((a: string, b: string) => order.indexOf(a) - order.indexOf(b));
                                }
                                setDrawerForm({
                                  ...drawerForm,
                                  days: newDays.join(", ")
                                });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                                isSelected
                                  ? "bg-[#2F7FE8] border-[#2F7FE8] text-white shadow-sm font-bold"
                                  : "bg-white border-border-subtle text-primary hover:bg-slate-50"
                              }`}
                            >
                              {short}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!drawerForm.isRepeatable ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-[#1B3A6B] uppercase">Session Date</label>
                        <input
                          className="text-xs p-2.5 border border-border-subtle bg-white rounded-lg outline-none font-semibold cursor-pointer text-[#1B3A6B]"
                          type="date"
                          value={drawerForm.sessionDate || ""}
                          onChange={(e) => setDrawerForm({ ...drawerForm, sessionDate: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-[#1B3A6B] uppercase">Session Time (IST)</label>
                        <select
                          className="text-xs p-2.5 border border-border-subtle rounded-lg bg-white outline-none cursor-pointer font-semibold text-[#1B3A6B]"
                          value={drawerForm.sessionTime || "10:00 AM"}
                          onChange={(e) => setDrawerForm({ ...drawerForm, sessionTime: e.target.value })}
                        >
                          {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-[#1B3A6B] uppercase">Session Time (IST)</label>
                      <select
                        className="text-xs p-2.5 border border-border-subtle rounded-lg bg-white outline-none cursor-pointer font-semibold text-[#1B3A6B]"
                        value={drawerForm.sessionTime || "10:00 AM"}
                        onChange={(e) => setDrawerForm({ ...drawerForm, sessionTime: e.target.value })}
                      >
                        {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-[#1B3A6B] uppercase">Meeting / Join URL</label>
                    <input
                      className="text-xs p-2 border border-border-subtle bg-white rounded-lg outline-none font-semibold text-[#1B3A6B]"
                      type="url"
                      placeholder="https://zoom.us/j/..."
                      value={drawerForm.joinUrl || ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, joinUrl: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowMoreSessionDetails(!showMoreSessionDetails)}
                className="w-full text-xs font-bold py-2 border border-secondary rounded-lg text-secondary hover:bg-[#F0F6FF] transition-colors mt-2 cursor-pointer"
              >
                {showMoreSessionDetails ? "Hide Advanced Config" : "Show Advanced Config"}
              </button>

              {showMoreSessionDetails && (
                <div className="space-y-4 border-t border-border-subtle pt-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">About Session Description</label>
                    <textarea
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] resize-none h-20"
                      placeholder="About session text..."
                      value={drawerForm.aboutSession || ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, aboutSession: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">What&apos;s Covered (one item per line)</label>
                    <textarea
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] resize-none h-20"
                      placeholder="Topic details..."
                      value={drawerForm.whatsCovered ? drawerForm.whatsCovered.join("\n") : ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, whatsCovered: e.target.value.split("\n").filter(Boolean) })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-[#1B3A6B] uppercase">Duration Options</label>
                      <select
                        className="text-xs p-2.5 border border-border-subtle bg-white rounded-lg outline-none font-semibold cursor-pointer text-[#1B3A6B]"
                        value={drawerForm.durationOptions || "60 or 90 min"}
                        onChange={(e) => setDrawerForm({ ...drawerForm, durationOptions: e.target.value })}
                      >
                        <option value="60 min">60 min</option>
                        <option value="90 min">90 min</option>
                        <option value="60 or 90 min">60 or 90 min</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-[#1B3A6B] uppercase">Platform</label>
                      <select
                        className="text-xs p-2.5 border border-border-subtle bg-white rounded-lg outline-none font-semibold cursor-pointer text-[#1B3A6B]"
                        value={drawerForm.platform || "Zoom"}
                        onChange={(e) => setDrawerForm({ ...drawerForm, platform: e.target.value })}
                      >
                        <option value="Zoom">Zoom</option>
                        <option value="Google Meet">Google Meet</option>
                        <option value="Microsoft Teams">Microsoft Teams</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-[#1B3A6B] uppercase">Reschedule Policy</label>
                    <select
                      className="text-xs p-2.5 border border-[#E6EBF8] bg-white rounded-lg outline-none font-semibold cursor-pointer text-[#1B3A6B]"
                      value={drawerForm.reschedulePolicy || "Up to 4 hrs before"}
                      onChange={(e) => setDrawerForm({ ...drawerForm, reschedulePolicy: e.target.value })}
                    >
                      <option value="Up to 4 hrs before">Up to 4 hrs before</option>
                      <option value="Up to 24 hrs before">Up to 24 hrs before</option>
                      <option value="No-reschedule, recording provided if missed">No-reschedule, recording provided if missed</option>
                      <option value="No-reschedule">No-reschedule</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {scheduleConflicts.length > 0 && (
              <div className="mx-6 mb-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
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
                <p className="text-[10px] text-amber-700">You can still save this session, or go back and change the day/time.</p>
              </div>
            )}

            <footer className="px-6 py-4 border-t border-[#E6EBF8] flex gap-3 shrink-0">
              {scheduleConflicts.length > 0 ? (
                <>
                  <button
                    onClick={() => setScheduleConflicts([])}
                    className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-transparent text-primary border border-border-subtle hover:bg-surface"
                  >
                    Go back and edit
                  </button>
                  <button
                    onClick={saveAnyway}
                    className="flex-1 text-xs font-bold py-2.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                  >
                    Save anyway
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={closeDrawer}
                    className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-transparent text-primary border border-border-subtle hover:bg-surface"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveDrawerData}
                    disabled={checkingConflicts}
                    className="flex-1 text-xs font-bold py-2.5 rounded-lg bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingConflicts ? "Checking availability..." : "Save changes"}
                  </button>
                </>
              )}
            </footer>
          </div>
        </>
      )}
    </div>
  );
}
