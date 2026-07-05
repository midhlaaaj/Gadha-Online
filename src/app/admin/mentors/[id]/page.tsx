"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconClock,
  IconCalendar,
  IconStar,
  IconSchool,
  IconUsers,
  IconBook,
  IconCurrencyRupee,
  IconEdit,
  IconCheck,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconLoader,
} from "@tabler/icons-react";
import { getMentorDetailsData, getAdminData, updateMentorRate, updateMentorProfileByAdmin } from "../../../actions";

interface Params {
  id: string;
}

const DEFAULT_MENTOR_AVAILABILITY: any = {
  Monday: [{ start: "09:00 AM", end: "09:00 PM" }],
  Tuesday: [{ start: "09:00 AM", end: "09:00 PM" }],
  Wednesday: [{ start: "09:00 AM", end: "09:00 PM" }],
  Thursday: [{ start: "09:00 AM", end: "09:00 PM" }],
  Friday: [{ start: "09:00 AM", end: "09:00 PM" }],
  Saturday: [],
  Sunday: []
};

export default function MentorDetailPage({ params }: { params: React.ComponentProps<any>["params"] }) {
  const [mentorId, setMentorId] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve(params).then((resolvedParams: any) => {
      setMentorId(resolvedParams.id);
    });
  }, [params]);

  const [mentor, setMentor] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [mentorBookings, setMentorBookings] = useState<any[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRate, setEditRate] = useState<number>(0);
  const [editVerified, setEditVerified] = useState(false);
  const [editQualification, setEditQualification] = useState("");
  const [editExperience, setEditExperience] = useState<number>(0);
  const [editBio, setEditBio] = useState("");

  useEffect(() => {
    if (mentor && isEditingProfile) {
      setEditName(mentor.name || "");
      setEditEmail(mentor.email || "");
      setEditRate(mentor.rate || 0);
      setEditVerified(mentor.verified || false);
      setEditQualification(mentor.qualification || "");
      setEditExperience(mentor.experience || 0);
      setEditBio(mentor.bio || "");
    }
  }, [isEditingProfile, mentor]);

  // Weekly Calendar Navigation helper functions
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));

  const getMentorAvail = () => {
    const avail = mentor?.availability || {};
    const hasSlots = Object.values(avail).some((slots: any) => slots && slots.length > 0);
    return hasSlots ? avail : DEFAULT_MENTOR_AVAILABILITY;
  };

  useEffect(() => {
    if (!mentorId) return;

    // Reset previous states to prevent bleeding from other loaded mentor pages
    setMentor(null);
    setCourses([]);
    setSessions([]);
    setMentorBookings([]);
    setScheduledClasses([]);
    setLoading(true);

    async function loadMentorData() {
      try {
        // 1. Fetch mentor details, courses, and sessions
        const details = await getMentorDetailsData(mentorId as string);
        setMentor(details.mentor);
        setCourses(details.courses);
        setSessions(details.sessions);
        setScheduledClasses(details.scheduledClasses || []);

        // 2. Fetch platform bookings to filter this mentor's bookings
        const adminData = await getAdminData();
        const allBookings = adminData.bookings || [];
        
        // Match bookings with this mentor's courses or sessions
        const mentorCourseTitles = details.courses.map((c: any) => c.title.toLowerCase());
        const mentorSessionTitles = details.sessions.map((s: any) => s.title.toLowerCase());
        
        const filtered = allBookings.filter((b: any) => {
          const title = b.itemTitle.toLowerCase();
          return mentorCourseTitles.includes(title) || mentorSessionTitles.includes(title);
        });
        
        setMentorBookings(filtered);
      } catch (err) {
        console.error("Failed to load mentor detailed view:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMentorData();
  }, [mentorId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert("Name is required.");
      return;
    }
    if (!editEmail.trim()) {
      alert("Email is required.");
      return;
    }
    const rateNum = Number(editRate);
    if (isNaN(rateNum) || rateNum < 0) {
      alert("Please enter a valid tuition rate.");
      return;
    }
    const expNum = Number(editExperience);
    if (isNaN(expNum) || expNum < 0) {
      alert("Please enter a valid experience number.");
      return;
    }

    setProfileSaving(true);
    try {
      await updateMentorProfileByAdmin(mentorId as string, {
        name: editName,
        email: editEmail,
        rate: rateNum,
        verified: editVerified,
        qualification: editQualification,
        experience: expNum,
        bio: editBio
      });

      // Update local state
      setMentor((prev: any) => ({
        ...prev,
        name: editName,
        email: editEmail,
        rate: rateNum,
        verified: editVerified,
        qualification: editQualification,
        experience: expNum,
        bio: editBio,
        avatarText: editName.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase()
      }));

      setIsEditingProfile(false);
    } catch (err: any) {
      alert("Failed to update mentor profile: " + err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePrevWeek = () => {
    const nextStart = new Date(currentWeekStart);
    nextStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(nextStart);
  };

  const handleNextWeek = () => {
    const nextStart = new Date(currentWeekStart);
    nextStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(nextStart);
  };

  const handleCurrentWeek = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  const getWeekDates = (start: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const isTimeAvailable = (dayName: string, hour: number) => {
    const avail = getMentorAvail();
    const slots = avail[dayName] || [];
    if (slots.length === 0) return false;

    const timeVal = hour;

    const parseTimeToDecimal = (timeStr: string) => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 0;
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return h + m / 60;
    };

    return slots.some((s: any) => {
      if (typeof s === "string") {
        const parts = s.split("-");
        if (parts.length === 2) {
          const start = parseTimeToDecimal(parts[0].trim());
          const end = parseTimeToDecimal(parts[1].trim());
          return timeVal >= start && timeVal < end;
        }
      } else if (s && s.start && s.end) {
        const start = parseTimeToDecimal(s.start);
        const end = parseTimeToDecimal(s.end);
        return timeVal >= start && timeVal < end;
      }
      return false;
    });
  };

  const getBookingForDateTime = (date: Date, hour: number) => {
    return scheduledClasses.find((c: any) => {
      const classDate = new Date(c.scheduledAt);
      if (!isSameDay(classDate, date)) return false;
      
      const startHour = classDate.getHours() + classDate.getMinutes() / 60;
      const endHour = startHour + (c.durationMinutes || 60) / 60;
      return hour >= Math.floor(startHour) && hour < Math.ceil(endHour);
    });
  };

  if (loading || !mentorId) {
    return (
      <div className="space-y-6 animate-pulse font-sans">
        {/* Back Link Skeleton */}
        <div className="h-4 w-32 bg-slate-200 rounded-lg"></div>

        {/* Hero Card Skeleton */}
        <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between">
          <div className="flex flex-col md:flex-row gap-5 items-start w-full">
            <div className="w-20 h-20 bg-slate-200 rounded-3xl shrink-0"></div>
            <div className="space-y-2 w-full max-w-xs">
              <div className="h-6 bg-slate-200 rounded-lg w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded-lg w-1/2"></div>
              <div className="h-3 bg-slate-200 rounded-lg w-2/3 pt-1"></div>
            </div>
          </div>
          <div className="h-20 w-48 bg-slate-100 border border-slate-200 rounded-2xl shrink-0"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              <div className="h-6 bg-slate-200 rounded-lg w-1/3"></div>
            </div>
          ))}
        </div>

        {/* Bio & Availability Rules Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-100 rounded w-full"></div>
              <div className="h-3 bg-slate-100 rounded w-11/12"></div>
              <div className="h-3 bg-slate-100 rounded w-4/5"></div>
            </div>
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="h-3 bg-slate-100 rounded w-1/3"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          </div>
          <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-5 bg-slate-100 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar Skeleton */}
        <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2 w-1/3">
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-3 bg-slate-100 rounded w-3/4"></div>
            </div>
            <div className="h-8 bg-slate-100 rounded-lg w-28"></div>
          </div>
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="grid grid-cols-8 bg-slate-50 border-b border-slate-100 p-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 bg-slate-200 rounded mx-2"></div>
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-8 p-3">
                  <div className="h-3 bg-slate-100 rounded w-2/3 mx-auto"></div>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div key={j} className="h-6 bg-slate-50 rounded mx-1"></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="bg-white border border-[#E6EBF8] rounded-2xl p-6 text-center space-y-4 font-sans">
        <p className="text-sm text-text-muted font-semibold">Mentor profile details not found.</p>
        <Link
          href="/admin/mentors"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7FE8] hover:underline"
        >
          <IconArrowLeft className="w-4 h-4" /> Back to Mentors List
        </Link>
      </div>
    );
  }

  const totalBookings = mentorBookings.length;
  const totalEarned = mentorBookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
  const averageBookingValue = totalBookings > 0 ? Math.round(totalEarned / totalBookings) : 0;
  
  const weekDates = getWeekDates(currentWeekStart);
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 AM (8) to 10:00 PM (22)

  const formatHourLabel = (h: number) => {
    if (h === 12) return "12:00 PM";
    if (h < 12) return `${h}:00 AM`;
    return `${h - 12}:00 PM`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Back Header */}
      <div>
        <Link
          href="/admin/mentors"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7A99] hover:text-[#1B3A6B] transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </div>

      {/* Mentor Hero Section */}
      <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between relative">
        {/* Edit Button in Top Right */}
        <button
          onClick={() => setIsEditingProfile(true)}
          className="absolute top-6 right-6 inline-flex items-center gap-1.5 bg-[#2F7FE8] hover:bg-[#1B3A6B] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-all shadow-sm duration-150 hover:scale-[1.02]"
        >
          <IconEdit className="w-3.5 h-3.5" /> Edit Profile
        </button>

        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div
            style={{ backgroundColor: mentor.avatarBg || "#1B3A6B" }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center font-heading text-3xl font-extrabold text-accent shrink-0 shadow-sm"
          >
            {mentor.avatarText}
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap pr-24 md:pr-0">
              <h2 className="font-heading text-2xl font-extrabold text-[#1B3A6B]">{mentor.name}</h2>
              <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${
                mentor.verified ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
              }`}>
                {mentor.verified ? "Verified" : "Unverified"}
              </span>
            </div>
            <p className="text-xs text-text-muted font-semibold">{mentor.email}</p>
            <div className="flex items-center gap-4 text-xs text-[#6B7A99] pt-2 font-medium">
              <span className="flex items-center gap-1"><IconSchool className="w-4 h-4 text-[#9BA8C0]" /> {mentor.qualification || "Educator"}</span>
              <span className="flex items-center gap-1"><IconClock className="w-4 h-4 text-[#9BA8C0]" /> {mentor.experience || 0} Years Exp</span>
              <span className="flex items-center gap-1 text-accent"><IconStar className="w-4 h-4 fill-accent" /> {mentor.rating || 5.0} Rating</span>
            </div>

            {/* Incorporated Biography & Specialties */}
            <div className="pt-3 border-t border-slate-100 space-y-2 mt-3 max-w-xl">
              <p className="text-xs text-primary leading-relaxed font-semibold">
                <strong>Bio: </strong>{mentor.bio || "No biography provided by the mentor yet."}
              </p>
              {mentor.subject && (
                <p className="text-[11px] text-[#6B7A99] font-bold">
                  <strong>Specialties:</strong> {mentor.subject}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tuition Rate Card */}
        <div className="bg-slate-50 border border-[#E6EBF8] rounded-2xl p-4 min-w-[220px] text-right space-y-1.5 md:mr-28">
          <div className="text-[10px] uppercase font-bold text-text-muted">
            Hourly Tuition Rate
          </div>
          <div className="font-heading text-2xl font-extrabold text-[#1B3A6B]">
            ₹{mentor.rate || 0}
            <span className="text-xs font-normal text-text-muted">/hr</span>
          </div>
          <div className="text-[10px] text-[#2F7FE8] font-bold">100% of payout rate</div>
        </div>
      </div>

      {/* Stats Counter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm">
          <div className="w-[36px] h-[36px] rounded-xl bg-green-50 flex items-center justify-center text-green-700 mb-3">
            <IconCurrencyRupee className="w-5 h-5" />
          </div>
          <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Total Sales (Gross)</div>
          <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">₹{totalEarned.toLocaleString()}</div>
        </div>

        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm">
          <div className="w-[36px] h-[36px] rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 mb-3">
            <IconUsers className="w-5 h-5" />
          </div>
          <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Assigned Bookings</div>
          <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">{totalBookings}</div>
        </div>

        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm">
          <div className="w-[36px] h-[36px] rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 mb-3">
            <IconBook className="w-5 h-5" />
          </div>
          <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Active Courses</div>
          <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">{courses.length}</div>
        </div>

        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm">
          <div className="w-[36px] h-[36px] rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 mb-3">
            <IconClock className="w-5 h-5" />
          </div>
          <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Avg Order Value</div>
          <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">₹{averageBookingValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Weekly Visual Interactive Google Calendar Section */}
      <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6EBF8] pb-4">
          <div className="space-y-1">
            <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] flex items-center gap-2">
              <IconCalendar className="w-5 h-5 text-[#2F7FE8]" /> Weekly Schedule Calendar
            </h3>
            <p className="text-[11px] text-text-muted font-semibold">
              View availability slots and actual bookings
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-[#E6EBF8] p-1 rounded-xl shrink-0">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-[#6B7A99] hover:text-[#1B3A6B] transition-all cursor-pointer"
              title="Previous Week"
            >
              <IconChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleCurrentWeek}
              className="text-[10px] font-extrabold px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-lg text-[#1B3A6B] transition-all cursor-pointer flex items-center gap-1.5"
              title={isSameDay(currentWeekStart, getMonday(new Date())) ? "Viewing Current Week" : "Go to Today (Current Week)"}
            >
              {isSameDay(currentWeekStart, getMonday(new Date())) ? (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0"></span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
              )}
              <span>
                {weekDates[0].toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - {weekDates[6].toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-[#6B7A99] hover:text-[#1B3A6B] transition-all cursor-pointer"
              title="Next Week"
            >
              <IconChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-[#6B7A99]">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-200 block"></span>
            <span>Available Slots</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-red-50 border border-red-200 block"></span>
            <span>Booked Sessions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-white border border-[#E6EBF8] border-dashed block"></span>
            <span>Unavailable</span>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-[#E6EBF8]">
                <th className="w-[100px] text-[10px] font-bold text-text-muted py-2 px-1 uppercase bg-slate-50/50 rounded-tl-xl text-center">
                  Time Slot
                </th>
                {weekDates.map((date, idx) => {
                  const isToday = isSameDay(date, new Date());
                  return (
                    <th
                      key={idx}
                      className={`py-2 px-1 text-center border-l border-[#E6EBF8] ${
                        isToday ? "bg-blue-50/40" : ""
                      } ${idx === 6 ? "rounded-tr-xl" : ""}`}
                    >
                      <div className="text-[10px] font-bold text-text-muted uppercase">
                        {date.toLocaleDateString("en-IN", { weekday: "short" })}
                      </div>
                      <div
                        className={`text-xs font-extrabold mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          isToday ? "bg-[#2F7FE8] text-white" : "text-[#1B3A6B]"
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => {
                return (
                  <tr key={hour} className="border-b border-[#E6EBF8]/50 hover:bg-slate-50/10">
                    <td className="py-2 px-1 text-[9px] font-bold text-[#1B3A6B] text-center bg-slate-50/20 border-r border-[#E6EBF8]">
                      {formatHourLabel(hour)}
                    </td>
                    {weekDates.map((date, dayIdx) => {
                      const dayName = date.toLocaleDateString("en-IN", { weekday: "long" });
                      const available = isTimeAvailable(dayName, hour);
                      const booking = getBookingForDateTime(date, hour);
                      const isToday = isSameDay(date, new Date());

                      let cellBgClass = "bg-white";
                      let cellBorderClass = "border-l border-[#E6EBF8]/30";
                      let content = null;

                      if (booking) {
                        cellBgClass = "bg-red-50 hover:bg-red-100/70";
                        cellBorderClass = "border border-red-200 border-l-4 border-l-red-500";
                        content = (
                          <div className="space-y-0.5">
                            <div className="text-[8px] font-extrabold text-red-800 line-clamp-1">
                              {booking.title}
                            </div>
                            <div className="text-[8px] font-semibold text-red-600">
                              Booked ({booking.durationMinutes}m)
                            </div>
                          </div>
                        );
                      } else if (available) {
                        cellBgClass = "bg-emerald-50 hover:bg-emerald-100/60";
                        cellBorderClass = "border border-emerald-100 border-l-4 border-l-emerald-500";
                        content = (
                          <span className="text-[8px] font-extrabold text-emerald-700">
                            Available
                          </span>
                        );
                      }

                      return (
                        <td
                          key={dayIdx}
                          onClick={() => {
                            if (booking) {
                              setSelectedBooking(booking);
                            }
                          }}
                          className={`p-1 text-center min-h-[38px] transition-colors ${cellBgClass} ${cellBorderClass} ${
                            isToday && !booking && !available ? "bg-blue-50/10" : ""
                          } ${booking ? "cursor-pointer select-none" : ""}`}
                        >
                          <div className="min-h-[24px] flex flex-col justify-center items-center">
                            {content}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bookings & Courses Detail Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mentor's Active Bookings */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-heading text-xs font-bold text-[#1B3A6B] uppercase tracking-wider">
            Assigned Bookings ({totalBookings})
          </h3>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-badge-bg/30 border-b border-[#E6EBF8]">
                  <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Booking ID</th>
                  <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Parent/Student</th>
                  <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left font-sans">Paid</th>
                  <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {mentorBookings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-text-muted italic">
                      No bookings found for this mentor.
                    </td>
                  </tr>
                ) : (
                  mentorBookings.map((b) => (
                    <tr key={b.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-xs font-mono text-primary font-bold">
                        #{b.id.substring(0, 8)}
                      </td>
                      <td className="py-2.5 px-3 text-xs font-semibold text-[#1B3A6B]">
                        <div>{b.parentName && b.parentName !== "Unknown Parent" ? b.parentName : b.parentEmail}</div>
                        <div className="text-[9px] text-[#9BA8C0]">Student: {b.studentName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-primary font-bold">
                        ₹{b.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-xs">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === "confirmed" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700"
                        }`}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mentor's Offerings (Courses & Sessions) */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-heading text-xs font-bold text-[#1B3A6B] uppercase tracking-wider">
            Assigned Courses & Sessions ({courses.length + sessions.length})
          </h3>
          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {courses.map((c) => (
              <div key={c.id} className="p-3 border border-[#E6EBF8] rounded-xl flex items-center justify-between hover:shadow-xs transition-shadow">
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full">
                    Course &middot; {c.format}
                  </span>
                  <h4 className="text-xs font-bold text-[#1B3A6B] mt-1.5">{c.title}</h4>
                  <p className="text-[9px] text-text-muted font-medium mt-0.5">{c.subject} &middot; ⭐ {c.rating}</p>
                </div>
                <div className="font-heading text-xs font-extrabold text-[#1B3A6B] shrink-0">
                  ₹{c.price.toLocaleString()}
                </div>
              </div>
            ))}

            {sessions.map((s) => (
              <div key={s.id} className="p-3 border border-[#E6EBF8] rounded-xl flex items-center justify-between hover:shadow-xs transition-shadow">
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                    Session &middot; {s.type}
                  </span>
                  <h4 className="text-xs font-bold text-[#1B3A6B] mt-1.5">{s.title}</h4>
                  <p className="text-[9px] text-text-muted font-medium mt-0.5">{s.subject} &middot; {s.bookings} Booked</p>
                </div>
                <div className="font-heading text-xs font-extrabold text-[#1B3A6B] shrink-0">
                  ₹{s.price.toLocaleString()}/hr
                </div>
              </div>
            ))}

            {courses.length === 0 && sessions.length === 0 && (
              <p className="text-xs text-text-muted italic text-center py-6">
                No active courses or group sessions assigned to this mentor.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Booking Details Modal Popup */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E6EBF8] pb-3">
              <h3 className="font-heading text-base font-extrabold text-[#1B3A6B]">
                Class Session Details
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-text-muted hover:text-[#1B3A6B] p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-text-muted">Class / Topic</span>
                <p className="text-sm font-bold text-[#1B3A6B]">{selectedBooking.title}</p>
              </div>

              {selectedBooking.itemName && selectedBooking.itemName !== selectedBooking.title && (
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-text-muted">Associated Item</span>
                  <p className="font-semibold text-primary">{selectedBooking.itemName}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-text-muted">Student Name</span>
                  <p className="font-bold text-[#1B3A6B]">{selectedBooking.studentName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-text-muted">Booking Type</span>
                  <div>
                    <span className="inline-block font-bold text-[9px] bg-[#EBF2FF] text-[#2F7FE8] border border-blue-100 px-2.5 py-0.5 rounded-full mt-0.5">
                      {selectedBooking.bookingType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-3 border-t border-slate-100">
                <span className="text-[9px] uppercase font-bold text-text-muted">Timing Details</span>
                <div className="flex items-center gap-2 text-[#1B3A6B] font-semibold mt-1">
                  <IconCalendar className="w-4 h-4 text-primary" />
                  <span>
                    {new Date(selectedBooking.scheduledAt).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#1B3A6B] font-semibold mt-1">
                  <IconClock className="w-4 h-4 text-primary" />
                  <span>
                    {(() => {
                      const d = new Date(selectedBooking.scheduledAt);
                      const start = d.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });
                      const dEnd = new Date(d.getTime() + selectedBooking.durationMinutes * 60000);
                      const end = dEnd.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });
                      return `${start} - ${end} (${selectedBooking.durationMinutes} minutes)`;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-[#E6EBF8]">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-[#1B3A6B] hover:bg-[#2F7FE8] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal Popup */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-[#E6EBF8] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E6EBF8] p-5 shrink-0 bg-slate-50/50">
              <h3 className="font-heading text-base font-extrabold text-[#1B3A6B]">
                Edit Mentor Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-text-muted hover:text-[#1B3A6B] p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-lg outline-none bg-white text-primary focus:border-[#2F7FE8]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-lg outline-none bg-white text-primary focus:border-[#2F7FE8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 block">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editRate}
                    onChange={(e) => setEditRate(Number(e.target.value))}
                    className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-lg outline-none bg-white text-primary focus:border-[#2F7FE8]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 block">Experience (Years)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editExperience}
                    onChange={(e) => setEditExperience(Number(e.target.value))}
                    className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-lg outline-none bg-white text-primary focus:border-[#2F7FE8]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 block">Verification Status</label>
                  <select
                    value={editVerified ? "true" : "false"}
                    onChange={(e) => setEditVerified(e.target.value === "true")}
                    className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-lg outline-none bg-white text-primary focus:border-[#2F7FE8] cursor-pointer"
                  >
                    <option value="true">Verified</option>
                    <option value="false">Unverified</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 block">Qualification</label>
                <input
                  type="text"
                  value={editQualification}
                  onChange={(e) => setEditQualification(e.target.value)}
                  className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-lg outline-none bg-white text-primary focus:border-[#2F7FE8]"
                  placeholder="e.g. BTech CSE / MA English"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 block">Biography</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-lg outline-none bg-white text-primary focus:border-[#2F7FE8]"
                  placeholder="Write a brief overview biography of the educator..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E6EBF8] flex justify-end gap-2.5 bg-slate-50/50 shrink-0">
              <button
                type="button"
                disabled={profileSaving}
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={profileSaving}
                className="px-4 py-2 bg-[#1B3A6B] hover:bg-[#2F7FE8] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {profileSaving ? (
                  <>
                    <IconLoader className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
