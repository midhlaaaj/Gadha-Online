"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  IconCalculator,
  IconCode,
  IconFlask,
  IconPencil,
  IconBook,
  IconCalendarOff,
  IconChevronRight,
  IconChevronDown,
  IconUser,
  IconCalendar,
  IconClock,
  IconTrendingUp,
  IconAlertCircle,
} from "@tabler/icons-react";
import { getParentChildren, getParentBookings } from "../actions";

// Dynamic Icon Picker Helper
const getSubjectIcon = (iconName: string) => {
  switch (iconName) {
    case "math":
    case "calculator":
      return <IconCalculator className="w-5 h-5 text-blue-600 animate-pulse-slow" />;
    case "code":
      return <IconCode className="w-5 h-5 text-green-700" />;
    case "flask":
    case "science":
      return <IconFlask className="w-5 h-5 text-amber-700" />;
    case "writing":
    case "pencil":
      return <IconPencil className="w-5 h-5 text-purple-700" />;
    default:
      return <IconBook className="w-5 h-5 text-slate-500" />;
  }
};

const getSubjectBgColor = (subject: string) => {
  switch (subject) {
    case "Mathematics":
      return "bg-blue-50 border border-blue-100";
    case "Programming":
      return "bg-green-50 border border-green-100";
    case "Science":
      return "bg-amber-50 border border-amber-100";
    case "English":
      return "bg-purple-50 border border-purple-100";
    default:
      return "bg-slate-50 border border-slate-100";
  }
};

export default function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [activeChildId, setActiveChildId] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");

  // Child Menu Open State
  const [isChildMenuOpen, setIsChildMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const kids = await getParentChildren();
      setChildren(kids);
      const bkList = await getParentBookings();
      setBookings(bkList);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load bookings details. Please sign in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsChildMenuOpen(false);
      }
    }
    if (isChildMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isChildMenuOpen]);

  // Derived filter logic
  const filteredBookings = bookings.filter((b) => {
    const childMatch = activeChildId === "all" || b.studentId === activeChildId || (children.find(k => k.id === activeChildId)?.email === b.email);
    
    // Status mapping check
    if (activeStatus === "all") return childMatch;
    
    if (activeStatus === "upcoming") {
      return childMatch && b.status === "confirmed";
    }
    if (activeStatus === "active") {
      return childMatch && b.type === "Course" && b.status === "confirmed";
    }
    if (activeStatus === "completed") {
      return childMatch && b.status === "completed";
    }
    if (activeStatus === "cancelled") {
      return childMatch && b.status === "cancelled";
    }
    return childMatch;
  });

  const getChildDetails = (id: string) => {
    if (id === "all") {
      return { name: "All children", initials: "All", bg: "bg-[#1B3A6B]" };
    }
    const kid = children.find((k) => k.id === id);
    if (!kid) return { name: "All children", initials: "All", bg: "bg-[#1B3A6B]" };
    
    // Color mapping
    const hash = kid.name.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const colors = ["bg-[#2F7FE8]", "bg-[#993556]", "bg-[#0F6E56]", "bg-[#534AB7]"];
    const colorBg = colors[hash % colors.length];

    return {
      name: kid.name,
      initials: kid.avatarText,
      bg: colorBg,
    };
  };

  const getStatusBadge = (status: string, type: string) => {
    if (status === "confirmed" && type === "Course") {
      return <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#dcfce7] text-[#085041]">Active</span>;
    }
    if (status === "confirmed") {
      return <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#E6F1FB] text-[#0C447C]">Upcoming</span>;
    }
    if (status === "completed") {
      return <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">Completed</span>;
    }
    if (status === "cancelled") {
      return <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-red-50 text-red-700">Cancelled</span>;
    }
    return <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-50 text-slate-500">{status}</span>;
  };

  const getFormatBadgeColor = (format: string) => {
    if (format === "1-on-1" || format === "Group" || format === "Session") {
      return "bg-[#dcfce7] text-[#085041]";
    }
    if (format === "Live batch") {
      return "bg-[#E6F1FB] text-[#0C447C]";
    }
    return "bg-[#FFF3CD] text-[#7a4d00]";
  };

  // Group Bookings by Category for Display
  const upcomingBookings = filteredBookings.filter(b => b.status === "confirmed" && b.type !== "Course");
  const activeCourseBookings = filteredBookings.filter(b => b.status === "confirmed" && b.type === "Course");
  const completedBookings = filteredBookings.filter(b => b.status === "completed");
  const cancelledBookings = filteredBookings.filter(b => b.status === "cancelled");

  const currentSelection = getChildDetails(activeChildId);

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col font-sans text-[#1B3A6B]">

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <div className="w-12 h-12 border-4 border-[#1B3A6B]/20 border-t-[#2F7FE8] rounded-full animate-spin mb-4"></div>
          <span className="text-sm text-slate-500 font-medium">Loading bookings...</span>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md shadow-sm">
            <IconAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="font-heading text-lg font-bold text-red-700 mb-2">Access Denied</h3>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-semibold px-6 py-3 bg-[#1B3A6B] text-white rounded-lg hover:bg-[#2F7FE8] transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* PAGE HEADER */}
          <header className="bg-[#f5f8ff] px-6 md:px-12 py-8 border-b border-[#d0dcf5]">
            <div className="max-w-7xl mx-auto w-full">
              {/* Breadcrumb */}
              <nav className="text-[11px] text-slate-400 mb-3 flex items-center gap-1.5 font-medium">
                <a href="/" className="hover:text-[#2F7FE8] transition-colors">Home</a>
                <span className="text-slate-300">/</span>
                <span className="text-[#1B3A6B] font-semibold">My bookings</span>
              </nav>
              
              <h1 className="font-heading text-3xl font-extrabold text-[#1B3A6B] mb-1">
                My bookings
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                All sessions and courses booked for your children
              </p>
            </div>
          </header>

          <div className="max-w-[860px] mx-auto w-full px-6 py-8 flex-1">

          {/* TOOLBAR */}
          <div className="bg-white border border-[#d0dcf5] rounded-2xl p-4.5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* CHILD DROPDOWN SELECTOR */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsChildMenuOpen(!isChildMenuOpen)}
                  className="flex items-center gap-2.5 pl-2.5 pr-4 py-2 border border-[#d0dcf5] bg-white hover:border-[#2F7FE8] rounded-full cursor-pointer transition-all select-none outline-none"
                >
                  <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-heading text-[10px] font-bold ${currentSelection.bg}`}>
                    {currentSelection.initials}
                  </div>
                  <span className="text-xs font-semibold text-[#1B3A6B]">{currentSelection.name}</span>
                  <IconChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isChildMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {isChildMenuOpen && (
                  <div className="absolute left-0 mt-2 w-[210px] bg-white rounded-2xl border border-slate-100 shadow-xl py-1.5 z-40 origin-top-left animate-fade-in-up">
                    <button
                      onClick={() => {
                        setActiveChildId("all");
                        setIsChildMenuOpen(false);
                      }}
                      className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors ${
                        activeChildId === "all" ? "bg-[#E6F1FB] text-[#0C447C]" : "text-[#1B3A6B]"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center font-heading text-[10px] font-bold">
                        All
                      </div>
                      <span>All children</span>
                    </button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    {children.map((kid) => {
                      const details = getChildDetails(kid.id);
                      return (
                        <button
                          key={kid.id}
                          onClick={() => {
                            setActiveChildId(kid.id);
                            setIsChildMenuOpen(false);
                          }}
                          className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors ${
                            activeChildId === kid.id ? "bg-[#E6F1FB] text-[#0C447C]" : "text-[#1B3A6B]"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-heading text-[10px] font-bold ${details.bg}`}>
                            {details.initials}
                          </div>
                          <div className="flex flex-col">
                            <span>{kid.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{kid.grade}</span>
                          </div>
                        </button>
                      );
                    })}
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        window.location.href = "/my-children";
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#2F7FE8] hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-[#2F7FE8] flex items-center justify-center font-heading text-[10px] font-bold">
                        +
                      </div>
                      <span>Add children</span>
                    </button>
                  </div>
                )}
              </div>

              {/* STATUS FILTER CHIPS */}
              <div className="flex gap-2 flex-wrap">
                {["all", "upcoming", "active", "completed", "cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setActiveStatus(status)}
                    className={`text-[11px] font-semibold px-4 py-2 rounded-full border transition-all cursor-pointer ${
                      activeStatus === status
                        ? "bg-[#1B3A6B] text-white border-[#1B3A6B]"
                        : "bg-white text-slate-500 border-[#d0dcf5] hover:border-slate-400"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium whitespace-nowrap self-end sm:self-auto">
              <strong className="text-[#1B3A6B] font-bold">{filteredBookings.length}</strong> bookings
            </div>
          </div>

          {/* BOOKINGS WRAPPER */}
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white border border-[#d0dcf5] rounded-2xl p-12 text-center shadow-sm">
              <IconCalendarOff className="w-12 h-12 text-slate-300 mb-3" />
              <h4 className="font-heading text-base font-bold text-[#1B3A6B] mb-1">No bookings found</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Try changing the filters or checking on a different child's profile
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* UPCOMING SESSIONS */}
              {upcomingBookings.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Upcoming</h4>
                  <div className="flex flex-col gap-2.5">
                    {upcomingBookings.map((b) => {
                      const kidDetails = getChildDetails(b.studentId || "all");
                      return (
                        <div
                          key={b.id}
                          className="bg-white border border-[#d0dcf5] rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex gap-4.5 items-start md:items-center">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${getSubjectBgColor(b.subject)}`}>
                              {getSubjectIcon(b.iconName)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-xs font-bold text-[#1B3A6B]">{b.title}</h5>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getFormatBadgeColor(b.format)}`}>
                                  {b.format}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
                                <span className="flex items-center gap-1">
                                  <IconUser className="w-3.5 h-3.5 text-slate-400" />
                                  {b.mentorName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IconCalendar className="w-3.5 h-3.5 text-slate-400" />
                                  {b.dateTime}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IconClock className="w-3.5 h-3.5 text-slate-400" />
                                  {b.duration}
                                </span>
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-semibold text-slate-600">
                                  <div className={`w-3.5 h-3.5 rounded-full text-white flex items-center justify-center text-[7px] font-bold ${kidDetails.bg}`}>
                                    {kidDetails.initials}
                                  </div>
                                  {b.childName}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex md:flex-col items-baseline md:items-end justify-between md:justify-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            {getStatusBadge(b.status, b.type)}
                            <strong className="font-heading text-base font-bold text-[#1B3A6B]">₹{b.price}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ACTIVE COURSES */}
              {activeCourseBookings.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Active courses</h4>
                  <div className="flex flex-col gap-2.5">
                    {activeCourseBookings.map((b) => {
                      const kidDetails = getChildDetails(b.studentId || "all");
                      return (
                        <div
                          key={b.id}
                          className="bg-white border border-[#d0dcf5] rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex gap-4.5 items-start md:items-center">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${getSubjectBgColor(b.subject)}`}>
                              {getSubjectIcon(b.iconName)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-xs font-bold text-[#1B3A6B]">{b.title}</h5>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getFormatBadgeColor(b.format)}`}>
                                  {b.format}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
                                <span className="flex items-center gap-1">
                                  <IconUser className="w-3.5 h-3.5 text-slate-400" />
                                  {b.mentorName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IconCalendar className="w-3.5 h-3.5 text-slate-400" />
                                  {b.dateTime}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IconTrendingUp className="w-3.5 h-3.5 text-slate-400" />
                                  {b.duration}
                                </span>
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-semibold text-slate-600">
                                  <div className={`w-3.5 h-3.5 rounded-full text-white flex items-center justify-center text-[7px] font-bold ${kidDetails.bg}`}>
                                    {kidDetails.initials}
                                  </div>
                                  {b.childName}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex md:flex-col items-baseline md:items-end justify-between md:justify-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            {getStatusBadge(b.status, b.type)}
                            <strong className="font-heading text-base font-bold text-[#1B3A6B]">₹{b.price}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COMPLETED */}
              {completedBookings.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Completed</h4>
                  <div className="flex flex-col gap-2.5">
                    {completedBookings.map((b) => {
                      const kidDetails = getChildDetails(b.studentId || "all");
                      return (
                        <div
                          key={b.id}
                          className="bg-white border border-[#d0dcf5] rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow opacity-75 hover:opacity-100"
                        >
                          <div className="flex gap-4.5 items-start md:items-center">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${getSubjectBgColor(b.subject)}`}>
                              {getSubjectIcon(b.iconName)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-xs font-bold text-[#1B3A6B]">{b.title}</h5>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getFormatBadgeColor(b.format)}`}>
                                  {b.format}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
                                <span className="flex items-center gap-1">
                                  <IconUser className="w-3.5 h-3.5 text-slate-400" />
                                  {b.mentorName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IconCalendar className="w-3.5 h-3.5 text-slate-400" />
                                  {b.dateTime}
                                </span>
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-semibold text-slate-600">
                                  <div className={`w-3.5 h-3.5 rounded-full text-white flex items-center justify-center text-[7px] font-bold ${kidDetails.bg}`}>
                                    {kidDetails.initials}
                                  </div>
                                  {b.childName}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex md:flex-col items-baseline md:items-end justify-between md:justify-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            {getStatusBadge(b.status, b.type)}
                            <strong className="font-heading text-base font-bold text-[#1B3A6B]">₹{b.price}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CANCELLED */}
              {cancelledBookings.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Cancelled</h4>
                  <div className="flex flex-col gap-2.5">
                    {cancelledBookings.map((b) => {
                      const kidDetails = getChildDetails(b.studentId || "all");
                      return (
                        <div
                          key={b.id}
                          className="bg-white border border-[#d0dcf5] rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-60 hover:opacity-100 transition-all hover:shadow-sm"
                        >
                          <div className="flex gap-4.5 items-start md:items-center">
                            <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                              <IconCalendarOff className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-xs font-bold text-[#1B3A6B]">{b.title}</h5>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getFormatBadgeColor(b.format)}`}>
                                  {b.format}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-medium">
                                <span className="flex items-center gap-1">
                                  <IconUser className="w-3.5 h-3.5 text-slate-350" />
                                  {b.mentorName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IconCalendar className="w-3.5 h-3.5 text-slate-355" />
                                  {b.dateTime}
                                </span>
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-semibold text-slate-500">
                                  <div className={`w-3.5 h-3.5 rounded-full text-white flex items-center justify-center text-[7px] font-bold ${kidDetails.bg}`}>
                                    {kidDetails.initials}
                                  </div>
                                  {b.childName}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex md:flex-col items-baseline md:items-end justify-between md:justify-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            {getStatusBadge(b.status, b.type)}
                            <strong className="font-heading text-base font-bold text-slate-400 line-through">₹{b.price}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </>
    )}
  </div>
);
}
