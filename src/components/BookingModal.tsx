"use client";

import React, { useState, useEffect, useRef } from "react";
import { IconX, IconCheck, IconCalendar, IconClock, IconUsers, IconCreditCard, IconChevronRight, IconAlertCircle } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { getParentChildren, bookCourseOrSessionAction } from "@/app/actions";

interface SupabaseUser {
  id: string;
  email?: string;
}

interface ChildStudent {
  id: string;
  name: string;
  grade: string;
  joined: boolean;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: "course" | "session" | "mentor";
  title: string;
  price: number;
  durationMinutes?: number;
  selectedSlot?: { day: string; time: string };
  mentorName: string;
  isLiveIndividual: boolean;
  onSuccess?: () => void;
}

function getDayOfWeekName(dateStr: string): string {
  if (!dateStr) return "Mon";
  const d = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[d.getDay()];
}



export default function BookingModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  title,
  price,
  durationMinutes,
  selectedSlot,
  mentorName,
  isLiveIndividual,
  onSuccess,
}: BookingModalProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // States for Mentor Direct 1-on-1 Booking
  const [availableDates] = useState(() => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        dateStr: d.toISOString().split("T")[0],
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString("en-US", { month: "short" }),
      });
    }
    return dates;
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>("10:00 AM");
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [mentorAvailability, setMentorAvailability] = useState<any>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [mentorActiveBatches, setMentorActiveBatches] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    if (!isOpen) return;

    async function checkAuthAndLoadData() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser({ id: currentUser.id, email: currentUser.email });
        } else {
          setUser(null);
          setLoading(false);
          return;
        }

        // Get role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();
        
        setRole(profile?.role || "parent");

        if (profile?.role === "parent") {
          const fetchedChildren = await getParentChildren();
          // Filter only active registered children (joined: true)
          const activeChildren = fetchedChildren.filter((c) => c.joined);
          setChildren(activeChildren as ChildStudent[]);
          if (activeChildren.length > 0) {
            setSelectedStudentId(activeChildren[0].id);
          }
        }

        let targetMentorId = targetId;

        // Fetch course details if target is course
        if (targetType === "course") {
          try {
            const { data: cour } = await supabase
              .from("courses")
              .select("id, format, duration_days, total_sessions, sessions_per_week, mentor_id")
              .eq("id", targetId)
              .single();
            if (cour) {
              setCourseDetails(cour);
              if (cour.mentor_id) {
                targetMentorId = cour.mentor_id;
              }
            }
          } catch (e) {
            console.error("Failed to load course details:", e);
          }
        }

        // Fetch session details if target is session
        if (targetType === "session") {
          try {
            const { data: sess } = await supabase
              .from("sessions")
              .select("id, type, price, session_date, session_time, mentor_id")
              .eq("id", targetId)
              .single();
            if (sess) {
              setSessionDetails(sess);
              if (sess.type === "Group") {
                if (sess.session_date) {
                  setSelectedDateStr(sess.session_date);
                }
                if (sess.session_time) {
                  setSelectedSlotTime(sess.session_time);
                }
              }
              if (sess.mentor_id) {
                targetMentorId = sess.mentor_id;
              }
            }
          } catch (e) {
            console.error("Failed to load session details:", e);
          }
        }

        // Fetch mentor's availability if applicable (all paths except recorded courses have mentors)
        if (targetMentorId) {
          try {
            const { data: ment } = await supabase
              .from("mentors")
              .select("availability")
              .eq("id", targetMentorId)
              .single();
            const DEFAULT_MENTOR_AVAILABILITY = {
              Monday: [{ start: "09:00 AM", end: "09:00 PM" }],
              Tuesday: [{ start: "09:00 AM", end: "09:00 PM" }],
              Wednesday: [{ start: "09:00 AM", end: "09:00 PM" }],
              Thursday: [{ start: "09:00 AM", end: "09:00 PM" }],
              Friday: [{ start: "09:00 AM", end: "09:00 PM" }],
              Saturday: [],
              Sunday: []
            };

            if (ment?.availability && Object.keys(ment.availability).length > 0 && Object.values(ment.availability).some((arr: any) => arr.length > 0)) {
              setMentorAvailability(ment.availability);
            } else {
              setMentorAvailability(DEFAULT_MENTOR_AVAILABILITY);
            }

            // Fetch active Live Batch courses taught by this mentor to block their calendar timing
            const { data: activeBatches } = await supabase
              .from("courses")
              .select("title, batch_start_date, batch_end_date, class_days, class_timing")
              .eq("mentor_id", targetMentorId)
              .eq("format", "Live batch")
              .eq("status", "Active");
            setMentorActiveBatches(activeBatches || []);
          } catch (e) {
            console.error("Failed to load mentor availability:", e);
          }
        }
      } catch (err: unknown) {
        console.error(err);
        setError("Failed to load details. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndLoadData();
  }, [isOpen, targetId, supabase, targetType]);

  useEffect(() => {
    if (!isTimeDropdownOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const container = document.getElementById("time-selector-wrapper");
      if (container && !container.contains(e.target as Node)) {
        setIsTimeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isTimeDropdownOpen]);

  const getAvailableTimesList = () => {
    const defaultTimes = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"];
    if (!mentorAvailability || !selectedDateStr) return defaultTimes;

    try {
      const d = new Date(selectedDateStr);
      const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
      const slots = mentorAvailability[dayName];
      
      if (Array.isArray(slots)) {
        if (slots.length === 0) return [];
        const timeToMinutes = (timeStr: string): number => {
          const match = timeStr.match(/^(\d+):?(\d*)\s*(AM|PM)$/i);
          if (!match) return 0;
          let h = parseInt(match[1], 10);
          const m = match[2] ? parseInt(match[2], 10) : 0;
          const meridiem = match[3].toUpperCase();
          if (meridiem === "PM" && h < 12) h += 12;
          if (meridiem === "AM" && h === 12) h = 0;
          return h * 60 + m;
        };

        const filtered = defaultTimes.filter((t) => {
          const optMin = timeToMinutes(t);
          return slots.some((slot) => {
            const startMin = timeToMinutes(slot.start);
            const endMin = timeToMinutes(slot.end);
            return optMin >= startMin && optMin <= endMin;
          });
        });

        // Filter out conflicting Live Batch hours assigned to the mentor
        const finalTimes = filtered.filter((tOption) => {
          const hasConflict = mentorActiveBatches.some((batch) => {
            if (!batch.batch_start_date || !batch.batch_end_date) return false;
            
            const bStart = new Date(batch.batch_start_date);
            const bEnd = new Date(batch.batch_end_date);
            const targetDate = new Date(selectedDateStr);
            
            bStart.setHours(0,0,0,0);
            bEnd.setHours(0,0,0,0);
            targetDate.setHours(0,0,0,0);

            if (targetDate >= bStart && targetDate <= bEnd) {
              const dayName = targetDate.toLocaleDateString("en-US", { weekday: "long" });
              const daysList = batch.class_days ? batch.class_days.toLowerCase().split(",").map((s: string) => s.trim()) : [];
              if (daysList.includes(dayName.toLowerCase())) {
                const classTiming = batch.class_timing;
                if (!classTiming) return false;

                const parts = classTiming.split(/[–\-]|to/);
                if (parts.length === 2) {
                  let startStr = parts[0].trim();
                  let endStr = parts[1].trim();
                  if (!/AM|PM/i.test(startStr)) {
                    const suffixMatch = endStr.match(/AM|PM/i);
                    if (suffixMatch) startStr += " " + suffixMatch[0];
                  }
                  const classStartMin = timeToMinutes(startStr);
                  const classEndMin = timeToMinutes(endStr);
                  const optMin = timeToMinutes(tOption);
                  const optEndMin = optMin + 60; // 1 hour booking block
                  
                  if (classStartMin !== -1 && classEndMin !== -1) {
                    return classStartMin < optEndMin && optMin < classEndMin;
                  }
                } else {
                  const classStartMin = timeToMinutes(classTiming);
                  const optMin = timeToMinutes(tOption);
                  if (classStartMin !== -1 && Math.abs(classStartMin - optMin) < 60) {
                    return true;
                  }
                }
              }
            }
            return false;
          });
          return !hasConflict;
        });

        return finalTimes;
      }
    } catch (e) {
      console.error(e);
    }
    return defaultTimes;
  };

  const availableTimes = getAvailableTimesList();
  const isCurrentTimeAvailable = availableTimes.includes(selectedSlotTime);

  const isCustomScheduled = targetType === "mentor" || 
    (targetType === "session" && sessionDetails?.type === "1-on-1") ||
    (targetType === "course" && courseDetails?.format === "Live individual");

  if (!isOpen) return null;

  const handleBooking = async () => {
    setError(null);
    setBookingLoading(true);

    try {

      if (role === "parent" && !selectedStudentId) {
        throw new Error("Please select a student for this booking.");
      }

      if (isCustomScheduled && !isCurrentTimeAvailable) {
        throw new Error("The tutor is not available at the selected date and time. Please select an available slot.");
      }

      const currentUserId = user?.id || "";
      const res = await bookCourseOrSessionAction({
        targetId,
        targetType,
        studentId: role === "student" ? currentUserId : selectedStudentId,
        durationMinutes: isCustomScheduled ? 60 : durationMinutes,
        selectedSlot: isCustomScheduled
          ? { day: getDayOfWeekName(selectedDateStr), time: selectedSlotTime }
          : selectedSlot,
        selectedDate: isCustomScheduled ? selectedDateStr : undefined,
      });

      if (res.success) {
        setSuccess(true);
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errMsg);
    } finally {
      setBookingLoading(false);
    }
  };

  const currentPrice = price;

  const displayBookingDetailsStr = () => {
    if ((targetType === "mentor" || (targetType === "session" && isLiveIndividual)) && selectedDateStr) {
      const d = new Date(selectedDateStr);
      const formattedDate = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
      return `${formattedDate} at ${selectedSlotTime} IST`;
    }
    if (selectedSlot) {
      return `${selectedSlot.day} at ${selectedSlot.time} IST`;
    }
    return "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col z-10 animate-fade-in max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-heading text-lg font-bold text-primary">
            {success ? "Booking Confirmed" : "Confirm Booking"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-secondary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-text-muted">Loading your booking options...</p>
          </div>
        ) : !user ? (
          /* Not Logged In State */
          <div className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-secondary rounded-full flex items-center justify-center shadow-inner">
              <IconUsers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-primary text-base">Authentication Required</h4>
              <p className="text-xs text-text-muted mt-1 max-w-[280px]">
                Please sign in or create an account to book this {targetType === "mentor" ? "session" : targetType}.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full mt-2">
              <a
                href="/mentor/login"
                className="py-3 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/95 shadow-md text-center transition-all"
              >
                Sign In
              </a>
              <button
                onClick={onClose}
                className="py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : success ? (
          /* Success Screen */
          <div className="p-8 flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center shadow-inner animate-scale-in">
              <IconCheck className="w-8 h-8 text-emerald-600 stroke-[3]" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-primary text-lg">Booking Successful!</h4>
              <p className="text-xs text-text-muted mt-1 px-4 leading-relaxed">
                Your booking for <strong>{title}</strong> with <strong>{mentorName}</strong> has been confirmed.
              </p>
              {isLiveIndividual && (selectedSlot || targetType === "mentor") && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F8FF] border border-blue-100 rounded-lg text-[11px] font-semibold text-secondary">
                  <IconCalendar className="w-3.5 h-3.5" />
                  <span>Scheduled on {displayBookingDetailsStr()}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full mt-2">
              <a
                href={role === "student" ? "/lms/overview" : "/bookings"}
                className="py-3.5 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/95 shadow-md text-center transition-all flex items-center justify-center gap-1.5"
              >
                <span>Go to Portal</span>
                <IconChevronRight className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                className="py-2.5 text-slate-500 hover:text-slate-700 text-xs font-semibold hover:underline"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          /* Booking Flow Screen */
          <div 
            className="p-6 space-y-5 overflow-y-auto flex-1 premium-scrollbar" 
            style={{ scrollbarGutter: "stable" }}
          >
            
            {/* Target Card Header Details */}
            <div className="bg-[#F5F8FF] border border-blue-50 rounded-xl p-4 flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-heading text-base font-extrabold text-secondary flex-shrink-0">
                {title.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">
                  {targetType === "mentor" ? "1-on-1 session" : targetType}
                </p>
                <h4 className="font-heading text-sm font-bold text-primary truncate">{title}</h4>
                <p className="text-[11px] text-text-muted mt-0.5">Mentor: {mentorName}</p>
              </div>
            </div>

            {/* Select student (Parents only) */}
            {role === "parent" && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select student
                </label>
                {children.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-text-muted">No child student profile registered yet.</p>
                    <a
                      href="/my-children"
                      className="mt-3.5 inline-block text-xs font-bold text-secondary hover:underline"
                    >
                      + Register a Child
                    </a>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full text-xs font-semibold p-3.5 border border-slate-200 rounded-lg outline-none bg-white text-primary focus:border-secondary cursor-pointer"
                    >
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name} ({child.grade})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* DATE & TIME SELECTORS FOR MENTORS & 1-on-1 SESSIONS */}
            {isCustomScheduled && (() => {
              const getTomorrowDateString = () => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                return d.toISOString().split("T")[0];
              };

              const getMaxDateString = () => {
                const d = new Date();
                d.setDate(d.getDate() + 90);
                return d.toISOString().split("T")[0];
              };

              const formatSelectedDate = (dateStr: string): string => {
                if (!dateStr) return "Select Date";
                try {
                  const d = new Date(dateStr);
                  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                  const dayNum = d.getDate();
                  const monthName = d.toLocaleDateString("en-US", { month: "short" });
                  return `${dayName}, ${dayNum} ${monthName}`;
                } catch (e) {
                  return dateStr;
                }
              };

              const getAvailableTimes = () => {
                const defaultTimes = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"];
                if (!mentorAvailability || !selectedDateStr) return defaultTimes;

                try {
                  const d = new Date(selectedDateStr);
                  const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
                  const slots = mentorAvailability[dayName];
                  
                  if (Array.isArray(slots)) {
                    if (slots.length === 0) return [];
                    const timeToMinutes = (timeStr: string): number => {
                      const match = timeStr.match(/^(\d+):?(\d*)\s*(AM|PM)$/i);
                      if (!match) return 0;
                      let h = parseInt(match[1], 10);
                      const m = match[2] ? parseInt(match[2], 10) : 0;
                      const meridiem = match[3].toUpperCase();
                      if (meridiem === "PM" && h < 12) h += 12;
                      if (meridiem === "AM" && h === 12) h = 0;
                      return h * 60 + m;
                    };

                    return defaultTimes.filter((t) => {
                      const optMin = timeToMinutes(t);
                      return slots.some((slot) => {
                        const startMin = timeToMinutes(slot.start);
                        const endMin = timeToMinutes(slot.end);
                        return optMin >= startMin && optMin <= endMin;
                      });
                    });
                  }
                } catch (e) {
                  console.error(e);
                }
                return defaultTimes;
              };

              const displayDateLabel = formatSelectedDate(selectedDateStr);

              return (
                <div className="space-y-4">
                  <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    {/* DATE SELECTOR */}
                    <div id="date-selector-wrapper" className="space-y-1.5 text-left relative min-w-0 w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Select Date
                      </label>
                      <div 
                        onClick={() => {
                          if (dateInputRef.current) {
                            try {
                              dateInputRef.current.showPicker();
                            } catch (e) {
                              console.error(e);
                            }
                          }
                        }}
                        className="w-full text-xs font-semibold p-3.5 border border-slate-200 rounded-lg bg-white text-primary hover:border-slate-300 transition-all cursor-pointer pr-10 flex items-center justify-between relative select-none"
                        style={{ minHeight: "46px" }}
                      >
                        <span>{displayDateLabel}</span>
                        <IconCalendar className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                        
                        <input
                          ref={dateInputRef}
                          type="date"
                          min={getTomorrowDateString()}
                          max={getMaxDateString()}
                          value={selectedDateStr}
                          onChange={(e) => setSelectedDateStr(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                      </div>
                    </div>

                    {/* TIME SELECTOR */}
                    <div id="time-selector-wrapper" className="space-y-1.5 text-left relative min-w-0 w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Select Time (IST)
                      </label>
                      <div 
                        onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                        className={`w-full text-xs font-semibold p-3.5 border rounded-lg bg-white text-primary transition-all cursor-pointer pr-10 flex items-center justify-between relative select-none ${
                          !isCurrentTimeAvailable
                            ? "border-amber-300 focus-within:border-amber-400 hover:border-amber-400"
                            : "border-slate-200 hover:border-slate-300 focus-within:border-secondary"
                        }`}
                        style={{ minHeight: "46px" }}
                      >
                        <span className={!isCurrentTimeAvailable ? "text-amber-800" : ""}>{selectedSlotTime}</span>
                        <IconClock className="w-4 h-4 text-slate-400 absolute right-3" />
                      </div>

                      {isTimeDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-[100] max-h-36 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-50 premium-scrollbar">
                          {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"].map((t) => {
                            const isAvailable = availableTimes.includes(t);
                            return (
                              <div
                                key={t}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isAvailable) return;
                                  setSelectedSlotTime(t);
                                  setIsTimeDropdownOpen(false);
                                }}
                                className={`px-4 py-3 text-xs font-semibold relative z-[101] transition-colors ${
                                  !isAvailable
                                    ? "text-slate-300 bg-slate-50/50 cursor-not-allowed line-through"
                                    : "cursor-pointer hover:bg-slate-50 text-primary"
                                } ${
                                  selectedSlotTime === t && isAvailable ? "text-secondary font-bold bg-[#F5F8FF]" : ""
                                }`}
                              >
                                {t}
                                {!isAvailable && <span className="absolute right-3 text-[9px] font-bold text-slate-300 normal-case no-underline">Unavailable</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unavailability Warnings & Suggestions */}
                  {selectedDateStr && !isCurrentTimeAvailable && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 space-y-2 animate-fade-in text-left">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <IconAlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Tutor unavailable for this hour ({selectedSlotTime})</span>
                      </div>
                      {availableTimes.length > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Suggested available times:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {availableTimes.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setSelectedSlotTime(t)}
                                className="px-2.5 py-1 rounded-full bg-white border border-amber-200 text-[#1B3A6B] hover:border-[#2F7FE8] hover:text-[#2F7FE8] transition-all text-[10px] font-bold cursor-pointer hover:shadow-sm"
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-amber-700">Tutor is completely unavailable on this day. Please select another date.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}


            {/* Selected Timing & Location Summary (Only for Course/Session that have page-level selected slot) */}
            {targetType !== "mentor" && isLiveIndividual && selectedSlot && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Scheduled time
                </label>
                <div className="border border-slate-100 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <IconCalendar className="w-4 h-4 text-slate-400" />
                      Day
                    </span>
                    <strong className="text-primary font-bold">{selectedSlot.day} (Next occurrence)</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <IconClock className="w-4 h-4 text-slate-400" />
                      Time slot
                    </span>
                    <strong className="text-primary font-bold">{selectedSlot.time} IST</strong>
                  </div>
                  {durationMinutes && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted flex items-center gap-1.5">
                        <IconClock className="w-4 h-4 text-slate-400" />
                        Duration
                      </span>
                      <strong className="text-primary font-bold">{durationMinutes} minutes</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live Individual Validity Summary */}
            {targetType === "course" && courseDetails?.format === "Live individual" && selectedDateStr && (() => {
              const getValidityEndDate = () => {
                if (!selectedDateStr || !courseDetails?.duration_days) return "";
                try {
                  const d = new Date(selectedDateStr);
                  d.setDate(d.getDate() + Number(courseDetails.duration_days));
                  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
                } catch (e) {
                  return "";
                }
              };
              const validityEndStr = getValidityEndDate();
              return (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Course Validity & Access
                  </label>
                  <div className="border border-slate-100 rounded-xl p-3.5 space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted flex items-center gap-1.5">
                        <IconCalendar className="w-4 h-4 text-slate-400" />
                        Validity duration
                      </span>
                      <strong className="text-primary font-bold">{courseDetails.duration_days} Days</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted flex items-center gap-1.5">
                        <IconClock className="w-4 h-4 text-slate-400" />
                        Total classes
                      </span>
                      <strong className="text-primary font-bold">{courseDetails.total_sessions} Sessions ({courseDetails.sessions_per_week}/week)</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-dashed border-slate-100 pt-2 mt-1">
                      <span className="text-text-muted">Start Date</span>
                      <strong className="text-secondary font-bold">{new Date(selectedDateStr).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted">Expiration Date</span>
                      <strong className="text-red-600 font-bold">{validityEndStr}</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Group Session Scheduled Info */}
            {targetType === "session" && sessionDetails?.type === "Group" && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Scheduled timing
                </label>
                <div className="border border-slate-100 rounded-xl p-3.5 space-y-2 text-left bg-slate-50/50">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <IconCalendar className="w-4 h-4 text-slate-400" />
                      Session Date
                    </span>
                    <strong className="text-primary font-bold">
                      {sessionDetails.session_date
                        ? new Date(sessionDetails.session_date).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
                        : "TBA"}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <IconClock className="w-4 h-4 text-slate-400" />
                      Timing (IST)
                    </span>
                    <strong className="text-secondary font-bold">{sessionDetails.session_time || "TBA"}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Price Summary */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Payment summary
              </label>
              <div className="border border-slate-100 rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">Base Price</span>
                  <span className="text-primary font-medium">₹{currentPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">GST / Processing Fees</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>
                <div className="border-t border-slate-100 pt-2.5 flex justify-between items-center">
                  <span className="text-xs font-bold text-primary">Amount to Pay</span>
                  <span className="font-heading text-lg font-extrabold text-primary">
                    ₹{currentPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3.5 rounded-lg text-center animate-fade-in">
                {error}
              </div>
            )}

            {/* Booking buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={bookingLoading}
                className="flex-1 py-3.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={bookingLoading || (role === "parent" && children.length === 0)}
                className="flex-1 py-3.5 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/95 shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
              >
                {bookingLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <IconCreditCard className="w-4.5 h-4.5" />
                    <span>Pay & Confirm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
