"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  IconSparkles,
  IconUsers,
  IconUserCheck,
  IconBook,
  IconCurrencyRupee,
  IconCalendar,
  IconX,
  IconSearch,
} from "@tabler/icons-react";
import { getAdminData } from "../../actions";
import { SkeletonMetric } from "@/components/Skeleton";

interface Course {
  id: string;
  title: string;
  students: number;
  format: string;
}

interface Session {
  id: string;
  title: string;
  mentor: string;
  subject: string;
  type: string;
}

interface Mentor {
  id: string;
  name: string;
  isInvitation?: boolean;
}

interface Testimonial {
  id: string;
  studentName: string;
  avatarBg: string;
  avatarText: string;
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Time filters
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month" | "custom" | "all">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Student list modal state
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const loadData = async () => {
    try {
      const res = await getAdminData();
      setCourses(res.courses || []);
      setSessions(res.sessions || []);
      setMentors(res.mentors || []);
      setTestimonials(res.testimonials || []);
      setBookings(res.bookings || []);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter bookings based on universal date filter
  const filteredBookings = useMemo(() => {
    const now = new Date();
    
    return bookings.filter((b: any) => {
      const bDate = new Date(b.createdAt);
      
      if (timeFilter === "today") {
        return bDate.toDateString() === now.toDateString();
      } else if (timeFilter === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return bDate >= oneWeekAgo;
      } else if (timeFilter === "month") {
        return bDate.getFullYear() === now.getFullYear() && bDate.getMonth() === now.getMonth();
      } else if (timeFilter === "custom") {
        if (!customStartDate || !customEndDate) return true;
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return bDate >= start && bDate <= end;
      }
      return true; // all
    });
  }, [bookings, timeFilter, customStartDate, customEndDate]);

  // Aggregate active students list from filtered bookings
  const uniqueStudentsList = useMemo(() => {
    const studentsMap = new Map<string, any>();
    
    filteredBookings.forEach((b: any) => {
      const email = (b.parentEmail || b.studentEmail || "").toLowerCase();
      if (!email) return;
      
      if (!studentsMap.has(email)) {
        studentsMap.set(email, {
          name: b.studentName || "Unknown Student",
          email: email,
          parentName: b.parentName || "Unknown Parent",
          items: [b.itemTitle],
          bookingDates: [new Date(b.createdAt).toLocaleDateString("en-IN")]
        });
      } else {
        const s = studentsMap.get(email);
        if (!s.items.includes(b.itemTitle)) s.items.push(b.itemTitle);
        s.bookingDates.push(new Date(b.createdAt).toLocaleDateString("en-IN"));
      }
    });
    
    return Array.from(studentsMap.values());
  }, [filteredBookings]);

  const totalStudentsCount = uniqueStudentsList.length;

  const activeTutorsCount = useMemo(() => {
    return mentors.filter((m: any) => !m.isInvitation).length;
  }, [mentors]);

  // Filter paid revenue within dynamic range
  const filteredRevenue = useMemo(() => {
    return filteredBookings
      .filter((b: any) => b.paymentStatus === "paid")
      .reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  }, [filteredBookings]);

  // Course Breakdown formatting: Recorded, Live Batch, Live Individual
  const courseStats = useMemo(() => {
    const counts = { Recorded: 0, LiveBatch: 0, LiveIndividual: 0 };
    courses.forEach((c: any) => {
      const f = (c.format || "").toLowerCase();
      if (f.includes("recorded")) counts.Recorded++;
      else if (f.includes("batch")) counts.LiveBatch++;
      else if (f.includes("individual")) counts.LiveIndividual++;
      else counts.Recorded++;
    });

    const total = courses.length || 1;
    const recordedPct = Math.round((counts.Recorded / total) * 100);
    const liveBatchPct = Math.round((counts.LiveBatch / total) * 100);
    const liveIndividualPct = Math.round((counts.LiveIndividual / total) * 100);

    return {
      recordedPct,
      liveBatchPct,
      liveIndividualPct,
      recordedCirc: Math.round((recordedPct / 100) * 214),
      liveBatchCirc: Math.round((liveBatchPct / 100) * 214),
      liveIndividualCirc: Math.round((liveIndividualPct / 100) * 214),
      total: courses.length,
    };
  }, [courses]);

  // Session Breakdown formatting: 1 on 1, Group
  const sessionStats = useMemo(() => {
    const counts = { OneOnOne: 0, Group: 0 };
    sessions.forEach((s: any) => {
      const t = (s.type || "").toLowerCase();
      if (t.includes("group")) counts.Group++;
      else counts.OneOnOne++;
    });

    const total = sessions.length || 1;
    const oneOnOnePct = Math.round((counts.OneOnOne / total) * 100);
    const groupPct = Math.round((counts.Group / total) * 100);

    return {
      oneOnOnePct,
      groupPct,
      oneOnOneCirc: Math.round((oneOnOnePct / 100) * 214),
      groupCirc: Math.round((groupPct / 100) * 214),
      total: sessions.length,
    };
  }, [sessions]);

  // Revenue daily bars over trailing 7 days
  const revenueLast7Days = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const results = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayLabel = days[d.getDay()];
      const dateStr = d.toDateString();

      const dayRevenue = filteredBookings
        .filter((b: any) => new Date(b.createdAt).toDateString() === dateStr && b.paymentStatus === "paid")
        .reduce((sum, b) => sum + (b.amountPaid || 0), 0);

      results.push({ label: dayLabel, revenue: dayRevenue });
    }

    const maxRevenue = Math.max(...results.map((r) => r.revenue), 1);
    return results.map((r, idx) => ({
      l: r.label,
      h: Math.max(10, Math.round((r.revenue / maxRevenue) * 100)),
      revenue: r.revenue,
      a: idx === 6,
    }));
  }, [filteredBookings]);

  const recentSignupsList = useMemo(() => {
    return filteredBookings.slice(0, 4).map((b: any) => {
      const initials = b.studentName
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
      const date = new Date(b.createdAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      if (date.toDateString() === today.toDateString()) {
        dateStr = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateStr = "Yesterday";
      }

      return {
        studentName: b.studentName,
        avatarText: initials,
        avatarBg: "#EBF2FF",
        itemTitle: b.itemTitle,
        dateStr,
      };
    });
  }, [filteredBookings]);

  // Filter students based on search string
  const searchedStudents = useMemo(() => {
    const term = studentSearch.toLowerCase();
    return uniqueStudentsList.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.parentName.toLowerCase().includes(term)
    );
  }, [uniqueStudentsList, studentSearch]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonMetric />
          <SkeletonMetric />
          <SkeletonMetric />
          <SkeletonMetric />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4 animate-pulse h-48">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-full bg-slate-200 rounded text-slate-200/50"></div>
          </div>
          <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm space-y-4 animate-pulse h-48">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-full bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Universal Time Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-extrabold text-[#1B3A6B]">Dashboard Overview</h2>
          <p className="text-xs text-text-muted mt-0.5 font-semibold">Real-time statistics & business tracker logs</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-white border border-[#E6EBF8] p-1.5 rounded-2xl shadow-xs self-end shrink-0">
          {(["today", "week", "month", "custom", "all"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTimeFilter(mode)}
              className={`text-[10px] font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition-all ${
                timeFilter === mode
                  ? "bg-[#2F7FE8] text-white shadow-xs"
                  : "text-[#6B7A99] hover:bg-[#F5F7FF] hover:text-[#1B3A6B]"
              }`}
            >
              {mode === "today" && "Today"}
              {mode === "week" && "This Week"}
              {mode === "month" && "This Month"}
              {mode === "custom" && "Custom Range"}
              {mode === "all" && "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Custom range input picker panel */}
      {timeFilter === "custom" && (
        <div className="flex items-center gap-3 bg-white border border-[#E6EBF8] p-4 rounded-2xl max-w-md shadow-xs animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1 flex-1">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Start Date</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full text-xs font-bold p-2 border border-slate-200 rounded-lg outline-none bg-white text-[#1B3A6B]"
            />
          </div>
          <div className="space-y-1 flex-1">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">End Date</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-full text-xs font-bold p-2 border border-slate-200 rounded-lg outline-none bg-white text-[#1B3A6B]"
            />
          </div>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Students (Clickable Modal) */}
        <button
          onClick={() => setStudentsModalOpen(true)}
          className="bg-white border border-[#E6EBF8] rounded-2xl p-5 flex flex-col justify-between shadow-sm text-left hover:border-[#2F7FE8] hover:shadow-md cursor-pointer transition-all duration-150 hover:scale-[1.01]"
        >
          <div className="w-[38px] h-[38px] rounded-xl bg-badge-bg flex items-center justify-center text-secondary mb-3">
            <IconUsers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Total Students</div>
            <div className="font-heading text-2xl font-extrabold text-[#1B3A6B] flex items-baseline gap-1.5">
              {totalStudentsCount.toLocaleString()}
              <span className="text-[9px] font-bold text-[#2F7FE8] hover:underline">View All &rarr;</span>
            </div>
          </div>
          <div className="text-[10px] text-emerald-700 mt-2 font-semibold">
            Based on active filter
          </div>
        </button>

        {/* Card 2: Active Tutors (Clickable Route) */}
        <Link
          href="/admin/mentors"
          className="bg-white border border-[#E6EBF8] rounded-2xl p-5 flex flex-col justify-between shadow-sm text-left hover:border-green-500 hover:shadow-md cursor-pointer transition-all duration-150 hover:scale-[1.01]"
        >
          <div className="w-[38px] h-[38px] rounded-xl bg-green-50 flex items-center justify-center text-green-700 mb-3">
            <IconUserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Active Tutors</div>
            <div className="font-heading text-2xl font-extrabold text-[#1B3A6B]">
              {activeTutorsCount.toLocaleString()}
            </div>
          </div>
          <div className="text-[10px] text-emerald-700 mt-2 font-semibold">
            Manage mentors list
          </div>
        </Link>

        {/* Card 3: Courses */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="w-[38px] h-[38px] rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-700 mb-3">
            <IconBook className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Total Courses</div>
            <div className="font-heading text-2xl font-extrabold text-[#1B3A6B]">
              {courseStats.total}
            </div>
          </div>
          <div className="text-[10px] text-emerald-700 mt-2 font-semibold">
            Active courses inventory
          </div>
        </div>

        {/* Card 4: Revenue */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="w-[38px] h-[38px] rounded-xl bg-pink-50 flex items-center justify-center text-pink-700 mb-3">
            <IconCurrencyRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Revenue</div>
            <div className="font-heading text-2xl font-extrabold text-[#1B3A6B]">
              ₹{filteredRevenue.toLocaleString()}
            </div>
          </div>
          <div className="text-[10px] text-emerald-700 mt-2 font-semibold">
            Sum of paid bookings
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 1: Revenue tracker */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm">
          <h3 className="font-heading text-xs font-bold text-[#1B3A6B] mb-6 uppercase tracking-wider">
            Daily Revenue (₹) &mdash; Last 7 Days
          </h3>
          <div className="flex items-end gap-3 h-28 pt-2">
            {revenueLast7Days.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  style={{ height: `${bar.h}%` }}
                  className={`w-full rounded-t-sm min-h-[4px] transition-all duration-500 ${
                    bar.a ? "bg-emerald-500" : "bg-emerald-400/60"
                  }`}
                  title={`₹${bar.revenue}`}
                ></div>
                <span className="text-[9px] text-[#1B3A6B] font-bold">₹{bar.revenue > 0 ? bar.revenue : 0}</span>
                <span className="text-[9px] text-text-muted font-bold">{bar.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Courses breakdown */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm flex flex-col items-center justify-between">
          <h3 className="font-heading text-xs font-bold text-[#1B3A6B] w-full text-left mb-4 uppercase tracking-wider">
            Courses by Format
          </h3>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="34" fill="none" stroke="#E6F1FB" strokeWidth="10" />
              {courseStats.liveBatchCirc > 0 && (
                <circle
                  cx="45"
                  cy="45"
                  r="34"
                  fill="none"
                  stroke="#2F7FE8"
                  strokeWidth="10"
                  strokeDasharray={`${courseStats.liveBatchCirc} 214`}
                  strokeDashoffset="0"
                  transform="rotate(-90 45 45)"
                />
              )}
              {courseStats.recordedCirc > 0 && (
                <circle
                  cx="45"
                  cy="45"
                  r="34"
                  fill="none"
                  stroke="#FFC107"
                  strokeWidth="10"
                  strokeDasharray={`${courseStats.recordedCirc} 214`}
                  strokeDashoffset={`-${courseStats.liveBatchCirc}`}
                  transform="rotate(-90 45 45)"
                />
              )}
              {courseStats.liveIndividualCirc > 0 && (
                <circle
                  cx="45"
                  cy="45"
                  r="34"
                  fill="none"
                  stroke="#2ECC71"
                  strokeWidth="10"
                  strokeDasharray={`${courseStats.liveIndividualCirc} 214`}
                  strokeDashoffset={`-${courseStats.liveBatchCirc + courseStats.recordedCirc}`}
                  transform="rotate(-90 45 45)"
                />
              )}
            </svg>
            <div className="absolute font-heading text-xs font-extrabold text-[#1B3A6B]">
              {courseStats.total}
            </div>
          </div>
          <div className="w-full space-y-1.5 mt-4">
            <div className="flex items-center text-[10px] text-text-muted font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2F7FE8] mr-2"></span>
              Live batch
              <span className="ml-auto font-bold text-[#1B3A6B]">{courseStats.liveBatchPct}%</span>
            </div>
            <div className="flex items-center text-[10px] text-text-muted font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2"></span>
              Recorded
              <span className="ml-auto font-bold text-[#1B3A6B]">{courseStats.recordedPct}%</span>
            </div>
            <div className="flex items-center text-[10px] text-text-muted font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>
              Live individual
              <span className="ml-auto font-bold text-[#1B3A6B]">{courseStats.liveIndividualPct}%</span>
            </div>
          </div>
        </div>

        {/* Chart 3: Sessions breakdown */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm flex flex-col items-center justify-between">
          <h3 className="font-heading text-xs font-bold text-[#1B3A6B] w-full text-left mb-4 uppercase tracking-wider">
            Sessions by Type
          </h3>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="34" fill="none" stroke="#E6F1FB" strokeWidth="10" />
              {sessionStats.oneOnOneCirc > 0 && (
                <circle
                  cx="45"
                  cy="45"
                  r="34"
                  fill="none"
                  stroke="#993556"
                  strokeWidth="10"
                  strokeDasharray={`${sessionStats.oneOnOneCirc} 214`}
                  strokeDashoffset="0"
                  transform="rotate(-90 45 45)"
                />
              )}
              {sessionStats.groupCirc > 0 && (
                <circle
                  cx="45"
                  cy="45"
                  r="34"
                  fill="none"
                  stroke="#534AB7"
                  strokeWidth="10"
                  strokeDasharray={`${sessionStats.groupCirc} 214`}
                  strokeDashoffset={`-${sessionStats.oneOnOneCirc}`}
                  transform="rotate(-90 45 45)"
                />
              )}
            </svg>
            <div className="absolute font-heading text-xs font-extrabold text-[#1B3A6B]">
              {sessionStats.total}
            </div>
          </div>
          <div className="w-full space-y-1.5 mt-4">
            <div className="flex items-center text-[10px] text-text-muted font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#993556] mr-2"></span>
              1 on 1
              <span className="ml-auto font-bold text-[#1B3A6B]">{sessionStats.oneOnOnePct}%</span>
            </div>
            <div className="flex items-center text-[10px] text-text-muted font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#534AB7] mr-2"></span>
              Group
              <span className="ml-auto font-bold text-[#1B3A6B]">{sessionStats.groupPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm overflow-x-auto">
          <h3 className="font-heading text-xs font-bold text-[#1B3A6B] mb-4 uppercase tracking-wider">
            Recent signups
          </h3>
          {recentSignupsList.length === 0 ? (
            <div className="text-center text-xs text-text-muted py-6 italic">No signups found in this period.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-badge-bg/40 border-b border-[#E6EBF8]">
                  <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Student</th>
                  <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Course / Session</th>
                  <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSignupsList.map((signup, i) => (
                  <tr key={i} className="border-b border-[#E6EBF8]/50 hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-xs text-primary flex items-center gap-2 font-semibold">
                      <div
                        style={{ backgroundColor: signup.avatarBg }}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-[#2F7FE8] font-heading border border-blue-100"
                      >
                        {signup.avatarText}
                      </div>
                      {signup.studentName}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-text-muted font-semibold truncate max-w-[200px]" title={signup.itemTitle}>
                      {signup.itemTitle}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-text-muted font-medium">
                      {signup.dateStr}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm overflow-x-auto">
          <h3 className="font-heading text-xs font-bold text-[#1B3A6B] mb-4 uppercase tracking-wider">
            Active sessions catalog
          </h3>
          {sessions.length === 0 ? (
            <div className="text-center text-xs text-text-muted py-6 italic">No active sessions found.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-badge-bg/40 border-b border-[#E6EBF8]">
                  <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Session</th>
                  <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Mentor</th>
                  <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Subject</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 4).map((sess, i) => (
                  <tr key={i} className="border-b border-[#E6EBF8]/50 hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-xs text-[#1B3A6B] font-bold truncate max-w-[150px]" title={sess.title}>
                      {sess.title}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-text-muted font-medium">
                      {sess.mentor}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-text-muted font-medium">
                      {sess.subject}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Total Students Roster Modal Popup */}
      {studentsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white border border-[#E6EBF8] rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E6EBF8] p-5 shrink-0 bg-slate-50/50">
              <div>
                <h3 className="font-heading text-base font-extrabold text-[#1B3A6B]">
                  Roster of Registered Students
                </h3>
                <p className="text-[10px] text-text-muted font-semibold mt-0.5">
                  Showing {searchedStudents.length} students enrolled in the active time range.
                </p>
              </div>
              <button
                onClick={() => {
                  setStudentsModalOpen(false);
                  setStudentSearch("");
                }}
                className="text-text-muted hover:text-[#1B3A6B] p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Toolbar */}
            <div className="p-4 border-b border-slate-100 shrink-0">
              <div className="relative">
                <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search students by name, email, or parent details..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 border border-[#E6EBF8] rounded-xl bg-white outline-none font-semibold text-[#1B3A6B] focus:border-[#2F7FE8]"
                />
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {searchedStudents.length === 0 ? (
                <p className="text-center text-xs text-text-muted italic py-12">No student records match filters.</p>
              ) : (
                <div className="border border-[#E6EBF8] rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#E6EBF8] text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                        <th className="p-3 text-left">Student</th>
                        <th className="p-3 text-left">Parent Profile</th>
                        <th className="p-3 text-left">Booked Items</th>
                        <th className="p-3 text-left">Registration Dates</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {searchedStudents.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 text-xs">
                            <div className="font-bold text-[#1B3A6B]">{s.name}</div>
                            <div className="text-[10px] text-text-muted mt-0.5">{s.email}</div>
                          </td>
                          <td className="p-3 text-xs font-semibold text-[#1B3A6B]">
                            {s.parentName}
                          </td>
                          <td className="p-3 text-xs">
                            <div className="flex flex-wrap gap-1">
                              {s.items.map((it: string, i: number) => (
                                <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#2F7FE8] border border-blue-100">
                                  {it}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-xs text-text-muted font-medium">
                            {s.bookingDates.join(", ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E6EBF8] flex justify-end bg-slate-50/50 shrink-0">
              <button
                onClick={() => {
                  setStudentsModalOpen(false);
                  setStudentSearch("");
                }}
                className="px-5 py-2.5 bg-[#1B3A6B] hover:bg-[#2F7FE8] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
