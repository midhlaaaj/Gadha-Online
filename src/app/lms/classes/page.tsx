"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconVideo, IconClock, IconCheck, IconX,
  IconPlayerPlay, IconBroadcast, IconCalendar,
  IconChevronRight, IconLoader,
} from "@tabler/icons-react";
import { getStudentClasses, getStudentBookingsAction, getStudentScheduledClassesResolved } from "@/app/actions";

type Classes = Awaited<ReturnType<typeof getStudentClasses>>;
type AnyClass = Classes["today"][number];
type SubTab = "today" | "upcoming" | "recorded" | "history";

// ─── Skeleton ──────────────────────────────────────────────────────
function ClassesSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#D0DCF5] p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl animate-shimmer" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-44 rounded animate-shimmer" />
              <div className="h-2.5 w-32 rounded animate-shimmer" />
            </div>
            <div className="h-6 w-20 rounded-full animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Status badge ───────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "live") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600 animate-pulse">
      <IconBroadcast className="w-3 h-3" /> Live
    </span>
  );
  if (status === "scheduled") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E6F1FB] text-[#2F7FE8]">
      <IconClock className="w-3 h-3" /> Upcoming
    </span>
  );
  if (status === "completed") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-600">
      <IconCheck className="w-3 h-3" /> Attended
    </span>
  );
  if (status === "cancelled") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
      <IconX className="w-3 h-3" /> Missed
    </span>
  );
  return null;
}

// ─── Class card ─────────────────────────────────────────────────────
function ClassCard({ cls, showJoin, showWatch }: { cls: AnyClass; showJoin?: boolean; showWatch?: boolean }) {
  const isLive = cls.status === "live";
  return (
    <div className={`flex items-center gap-4 p-5 bg-white rounded-2xl border transition-shadow hover:shadow-sm ${isLive ? "border-red-200 bg-red-50/30" : "border-[#D0DCF5]"}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isLive ? "bg-red-100" : "bg-[#E6F1FB]"}`}>
        <IconVideo className={`w-5 h-5 ${isLive ? "text-red-500" : "text-[#2F7FE8]"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[#1B3A6B] truncate">{cls.title}</p>
        <p className="text-[11px] text-[#4A5A7A] mt-0.5">
          {cls.mentor} · {cls.dateLabel} · {cls.timeLabel}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={cls.status} />
        {showJoin && cls.joinUrl && (
          <a
            href={cls.joinUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#1B3A6B] text-white hover:bg-[#2F7FE8] transition-colors ml-1"
          >
            Join now
          </a>
        )}
        {showWatch && cls.recordingUrl && (
          <a
            href={cls.recordingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#F5F8FF] border border-[#D0DCF5] text-[#1B3A6B] hover:border-[#2F7FE8] hover:text-[#2F7FE8] transition-colors ml-1"
          >
            <IconPlayerPlay className="w-3.5 h-3.5" /> Watch
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Recorded class card ────────────────────────────────────────────
function RecordedCard({ cls }: { cls: AnyClass }) {
  return (
    <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#D0DCF5] hover:shadow-sm transition-shadow">
      <div className="relative w-20 h-14 rounded-xl bg-[#E6F1FB] flex items-center justify-center shrink-0 overflow-hidden">
        <IconVideo className="w-6 h-6 text-[#2F7FE8]" />
        <div className="absolute inset-0 bg-[#1B3A6B]/30 flex items-center justify-center">
          <IconPlayerPlay className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[#1B3A6B] truncate">{cls.title}</p>
        <p className="text-[11px] text-[#4A5A7A] mt-0.5">{cls.mentor} · Recorded {cls.dateLabel}</p>
      </div>
      {cls.recordingUrl && (
        <a
          href={cls.recordingUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#F5F8FF] border border-[#D0DCF5] text-[#1B3A6B] hover:border-[#2F7FE8] hover:text-[#2F7FE8] transition-colors shrink-0"
        >
          <IconPlayerPlay className="w-3.5 h-3.5" /> Watch
        </a>
      )}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-2xl border border-dashed border-[#D0DCF5]">
      <IconCalendar className="w-10 h-10 text-[#D0DCF5]" />
      <h2 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">No {label}</h2>
      <p className="text-[13px] text-[#4A5A7A] max-w-xs">Classes will appear here once scheduled by your mentor.</p>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────
export default function StudentClassesPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Classes | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tab, setTab] = useState<SubTab>("today");

  // Live booking classes schedule drill-down states
  const [selectedLiveBooking, setSelectedLiveBooking] = useState<any | null>(null);
  const [bookingClasses, setBookingClasses] = useState<any[]>([]);
  const [loadingBookingClasses, setLoadingBookingClasses] = useState(false);

  const handleOpenLiveBooking = async (b: any) => {
    setSelectedLiveBooking(b);
    setLoadingBookingClasses(true);
    try {
      const data = await getStudentScheduledClassesResolved(b.id);
      setBookingClasses(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBookingClasses(false);
    }
  };

  useEffect(() => {
    Promise.all([
      getStudentClasses().catch(() => null),
      getStudentBookingsAction().catch(() => []),
    ])
      .then(([c, b]) => {
        if (c) setClasses(c);
        if (b) setBookings(b);
      })
      .finally(() => setLoading(false));
  }, []);



  const TABS: { key: SubTab; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "recorded", label: "Recorded" },
    { key: "history", label: "History" },
  ];

  const todayList = classes?.today ?? [];
  const liveClass = todayList.find((c) => c.status === "live");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">Classes</h1>
        <p className="text-[13px] text-[#4A5A7A] mt-0.5">Your live, upcoming, recorded and past sessions.</p>
      </div>

      {/* Sub-tabs (rendered statically) */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-bold border transition-colors cursor-pointer ${
              tab === key
                ? "bg-[#1B3A6B] text-white border-[#1B3A6B]"
                : "bg-white text-[#4A5A7A] border-[#D0DCF5] hover:border-[#2F7FE8] hover:text-[#2F7FE8]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content / loading skeleton */}
      {loading ? (
        <ClassesSkeleton />
      ) : (
        <>
          {/* Live class banner */}
          {liveClass && (
            <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 rounded-2xl mb-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full animate-pulse">
                  <IconBroadcast className="w-3 h-3" /> Live now
                </span>
                <p className="text-[13px] font-bold text-[#1B3A6B]">{liveClass.title}</p>
                <p className="text-[11px] text-[#4A5A7A]">{liveClass.mentor}</p>
              </div>
              {liveClass.joinUrl && (
                <a href={liveClass.joinUrl} target="_blank" rel="noreferrer"
                  className="text-[12px] font-bold px-4 py-2 rounded-xl bg-[#1B3A6B] text-white hover:bg-[#2F7FE8] transition-colors shrink-0">
                  Join class
                </a>
              )}
            </div>
          )}

          {tab === "today" && (
            <div className="space-y-3">
              {!todayList.length
                ? <EmptyState label="classes today" />
                : todayList.map((c) => <ClassCard key={c.id} cls={c} showJoin />)
              }
            </div>
          )}
          {tab === "upcoming" && (
            <div className="space-y-3">
              {!classes?.upcoming?.length
                ? <EmptyState label="upcoming classes" />
                : classes.upcoming.map((c) => <ClassCard key={c.id} cls={c} />)
              }
            </div>
          )}
          {tab === "recorded" && (
            <div className="space-y-3">
              {!classes?.recorded?.length
                ? <EmptyState label="recorded sessions" />
                : classes.recorded.map((c) => <RecordedCard key={c.id} cls={c} />)
              }
            </div>
          )}
          {tab === "history" && (
            <div className="space-y-3">
              {!classes?.history?.length
                ? <EmptyState label="past classes" />
                : classes.history.map((c) => <ClassCard key={c.id} cls={c} showWatch />)
              }
            </div>
          )}
        </>
      )}



      {/* Live Booking Classes Drill-Down Modal */}
      {selectedLiveBooking && (
        <div className="fixed inset-0 bg-[#0f2347]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl border border-[#D0DCF5] shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#F0F3FB]">
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                  Course Schedule
                </span>
                <h3 className="text-[15px] font-extrabold font-heading text-[#1B3A6B] mt-1.5">
                  {selectedLiveBooking.itemTitle}
                </h3>
                <p className="text-[11px] text-[#4A5A7A] mt-0.5">
                  Mentor: {selectedLiveBooking.mentorName}
                </p>
              </div>
              <button
                onClick={() => setSelectedLiveBooking(null)}
                className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 cursor-pointer"
              >
                <IconX className="w-4 h-4 text-[#9BA8C0]" />
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto premium-scrollbar px-6 py-4 space-y-3">
              {loadingBookingClasses ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <IconLoader className="w-6 h-6 text-[#2F7FE8] animate-spin" />
                  <p className="text-[11px] font-bold text-[#4A5A7A]">Loading schedule...</p>
                </div>
              ) : bookingClasses.length === 0 ? (
                <p className="text-[12px] text-[#9BA8C0] text-center py-10 italic">
                  No upcoming classes scheduled for this course yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {bookingClasses.map((c: any) => {
                    const now = new Date();
                    const classTime = new Date(c.scheduled_at);
                    const minsUntil = (classTime.getTime() - now.getTime()) / 60000;
                    const canJoin = c.status === "scheduled" && minsUntil <= 15 && minsUntil > -120;
                    const isPastClass = minsUntil < -(c.duration_minutes || 60);

                    const formatCountdown = () => {
                      if (minsUntil <= 0) return null;
                      if (minsUntil < 60) return `${Math.round(minsUntil)}m`;
                      const h = Math.floor(minsUntil / 60);
                      const m = Math.round(minsUntil % 60);
                      return `${h}h ${m > 0 ? `${m}m` : ""}`;
                    };

                    const countdown = formatCountdown();
                    const dateStr = classTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
                    const timeStr = classTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

                    return (
                      <div key={c.id} className="bg-[#F5F7FF] rounded-2xl border border-[#D0DCF5] p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-[#1B3A6B] truncate">{c.title}</p>
                          <p className="text-[10px] text-[#4A5A7A] mt-0.5 font-semibold">
                            {dateStr} at {timeStr} ({c.duration_minutes} mins)
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {c.attendance_status ? (
                            c.attendance_status === "present" ? (
                              <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full whitespace-nowrap">
                                Attended
                              </span>
                            ) : c.attendance_status === "absent" ? (
                              <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-full whitespace-nowrap">
                                Absent
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full whitespace-nowrap">
                                Excused
                              </span>
                            )
                          ) : c.booking_created_at && (new Date(c.scheduled_at) < new Date(c.booking_created_at)) ? (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full whitespace-nowrap">
                              Not Enrolled
                            </span>
                          ) : c.status === "scheduled" && (
                            isPastClass ? (
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full whitespace-nowrap">
                                Session ended
                              </span>
                            ) : canJoin && c.join_url ? (
                              <a
                                href={c.join_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold px-3 py-1.5 bg-[#2F7FE8] text-white rounded-full hover:bg-[#1B3A6B] transition-colors animate-pulse"
                              >
                                Join Class
                              </a>
                            ) : countdown ? (
                              <span className="text-[9px] font-bold text-[#9BA8C0] bg-white border border-[#D0DCF5] px-2 py-1 rounded-full whitespace-nowrap">
                                Starts in {countdown}
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-full whitespace-nowrap">
                                Upcoming
                              </span>
                            )
                          )}
                          {c.status === "completed" && (
                            <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full whitespace-nowrap">
                              Completed
                            </span>
                          )}
                          {c.status === "cancelled" && (
                            <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-1 rounded-full whitespace-nowrap">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#F0F3FB] flex">
              <button
                onClick={() => setSelectedLiveBooking(null)}
                className="w-full text-xs font-bold py-2.5 rounded-xl bg-slate-100 text-[#4A5A7A] hover:bg-slate-200 cursor-pointer"
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
