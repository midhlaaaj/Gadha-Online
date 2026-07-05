"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconChevronLeft,
  IconVideo,
  IconClock,
  IconCalendar,
  IconFileText,
  IconCheck,
  IconX,
  IconArrowRight,
  IconSparkles,
  IconAlertTriangle,
  IconDownload,
  IconExternalLink,
  IconBook,
  IconLoader,
} from "@tabler/icons-react";
import { getStudentBookingDashboardDetails } from "@/app/actions";

type TabType = "schedule" | "assignments" | "resources";

function BookingDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back button skeleton */}
      <div className="h-4 w-28 rounded animate-shimmer" />

      {/* Header skeleton */}
      <div className="bg-white rounded-3xl border border-[#D0DCF5] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
        <div className="space-y-2.5 flex-1">
          <div className="h-4.5 w-24 bg-slate-100 rounded" />
          <div className="h-6 w-1/2 bg-slate-200 rounded" />
          <div className="h-3.5 w-1/3 bg-slate-100 rounded" />
        </div>
        <div className="h-8 w-28 bg-slate-200 rounded-full shrink-0" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#D0DCF5] p-4.5 flex flex-col justify-between min-h-[95px] animate-pulse">
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-7 w-12 bg-slate-200 rounded mt-2" />
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="border-b border-[#E6EBF8] flex gap-6 pb-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-4 w-28 bg-slate-100 rounded animate-shimmer" />
        ))}
      </div>

      {/* List content skeleton */}
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#D0DCF5] p-5 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <div className="h-3.5 w-1/2 bg-slate-200 rounded" />
                <div className="h-2.5 w-1/3 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="h-7 w-20 bg-slate-200 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentBookingDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("schedule");

  useEffect(() => {
    if (!bookingId) return;
    getStudentBookingDashboardDetails(bookingId)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to load booking details.");
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return <BookingDetailsSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-[#D0DCF5] p-6 max-w-lg mx-auto mt-10">
        <IconAlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-[#1B3A6B]">Error Loading Dashboard</h3>
        <p className="text-sm text-text-muted mt-2">{error || "Could not retrieve booking details."}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 px-5 py-2.5 bg-[#2F7FE8] text-white text-[13px] font-bold rounded-full hover:bg-[#1B3A6B] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { booking, classes, assignments, attendance, resources } = data;

  // Calculate metrics
  const totalClasses = classes.length;
  const completedClasses = classes.filter((c: any) => c.status === "completed").length;
  const scheduledClasses = classes.filter((c: any) => c.status === "scheduled").length;
  
  const presentCount = attendance.filter((a: any) => a.status === "present").length;
  const totalAttendance = attendance.length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null;

  const pendingAssignments = assignments.filter((a: any) => a.status !== "submitted" && a.status !== "graded").length;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4A5A7A] hover:text-[#1B3A6B] transition-colors cursor-pointer"
      >
        <IconChevronLeft className="w-4 h-4" /> Back to Courses
      </button>

      {/* Header Container */}
      <div className="bg-white rounded-3xl border border-[#D0DCF5] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            booking.bookingType === "Course" 
              ? "bg-purple-50 text-purple-600 border-purple-200" 
              : "bg-blue-50 text-blue-600 border-blue-200"
          }`}>
            {booking.bookingType} · {booking.courseFormat || "Live format"}
          </span>
          <h1 className="text-[20px] font-extrabold font-heading text-[#1B3A6B] mt-2.5 leading-tight">
            {booking.itemTitle}
          </h1>
          <p className="text-[12px] text-[#4A5A7A] mt-1 font-semibold">
            Subject: {booking.subject} · Mentor: {booking.mentorName}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-bold px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full">
            ● Booking Active
          </span>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completed Classes */}
        <div className="bg-white rounded-2xl border border-[#D0DCF5] p-4.5 shadow-xs flex flex-col justify-between min-h-[95px]">
          <span className="text-[9px] font-extrabold text-[#9BA8C0] uppercase tracking-wider">Completed Sessions</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">{completedClasses}</span>
            <span className="text-xs text-[#9BA8C0] font-semibold">/ {totalClasses || 0} classes</span>
          </div>
        </div>

        {/* Card 2: Remaining Classes */}
        <div className="bg-white rounded-2xl border border-[#D0DCF5] p-4.5 shadow-xs flex flex-col justify-between min-h-[95px]">
          <span className="text-[9px] font-extrabold text-[#9BA8C0] uppercase tracking-wider">Upcoming Sessions</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] font-extrabold font-heading text-[#2F7FE8]">{scheduledClasses}</span>
            <span className="text-xs text-[#9BA8C0] font-semibold">scheduled</span>
          </div>
        </div>

        {/* Card 3: Attendance */}
        <div className="bg-white rounded-2xl border border-[#D0DCF5] p-4.5 shadow-xs flex flex-col justify-between min-h-[95px]">
          <span className="text-[9px] font-extrabold text-[#9BA8C0] uppercase tracking-wider">Attendance Rate</span>
          <div className="mt-2">
            {attendanceRate !== null ? (
              <span className="text-[22px] font-extrabold font-heading text-emerald-600">{attendanceRate}%</span>
            ) : (
              <span className="text-xs font-semibold text-[#9BA8C0] italic">No attendance records</span>
            )}
          </div>
        </div>

        {/* Card 4: Assignments */}
        <div className="bg-white rounded-2xl border border-[#D0DCF5] p-4.5 shadow-xs flex flex-col justify-between min-h-[95px]">
          <span className="text-[9px] font-extrabold text-[#9BA8C0] uppercase tracking-wider">Pending Assignments</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-[22px] font-extrabold font-heading ${pendingAssignments > 0 ? "text-amber-600" : "text-slate-500"}`}>
              {pendingAssignments}
            </span>
            <span className="text-xs text-[#9BA8C0] font-semibold">items homework</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E6EBF8] flex gap-6 pb-px">
        {(["schedule", "assignments", "resources"] as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === "schedule" ? "Syllabus & Classes" : tab === "assignments" ? "Homework & Assignments" : "Shared Resources";
          const count = tab === "assignments" ? assignments.length : tab === "resources" ? resources.length : classes.length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-extrabold relative transition-all cursor-pointer focus:outline-none ${
                isActive ? "text-[#2F7FE8]" : "text-[#9BA8C0] hover:text-[#1B3A6B]"
              }`}
            >
              {label} <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-500">{count}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2F7FE8] rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="space-y-4">
        {activeTab === "schedule" && (
          <div className="space-y-3">
            {classes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#D0DCF5] p-10 text-center space-y-2">
                <IconVideo className="w-8 h-8 text-[#9BA8C0] mx-auto" />
                <h4 className="text-[13px] font-bold text-[#1B3A6B]">No Scheduled Classes</h4>
                <p className="text-[11px] text-[#4A5A7A] max-w-xs mx-auto">
                  Your mentor hasn't scheduled any classes for this booking yet.
                </p>
              </div>
            ) : (
              classes.map((c: any) => {
                const now = new Date();
                const classTime = new Date(c.scheduled_at);
                const bookingCreatedAt = new Date(booking.createdAt);
                const isBeforeEnrollment = classTime < bookingCreatedAt;

                const minsUntil = (classTime.getTime() - now.getTime()) / 60000;
                const canJoin = c.status === "scheduled" && minsUntil <= 15 && minsUntil > -120;
                const isPastClass = minsUntil < -(c.duration_minutes || 60);

                const classAttendance = attendance?.find((a: any) => a.scheduled_class_id === c.id);

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
                  <div key={c.id} className="bg-white rounded-2xl border border-[#D0DCF5] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-xs transition-shadow">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        classAttendance?.status === "present"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : classAttendance?.status === "absent"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : classAttendance?.status === "excused"
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : c.status === "completed" 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                : c.status === "cancelled" 
                                  ? "bg-red-50 text-red-600 border border-red-100" 
                                  : "bg-[#F5F8FF] text-[#2F7FE8] border border-[#E6EBF8]"
                      }`}>
                        <IconVideo className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-bold text-[#1B3A6B] truncate">{c.title}</h4>
                        <p className="text-[10px] text-[#4A5A7A] mt-1 font-semibold flex items-center gap-1.5">
                          <IconCalendar className="w-3.5 h-3.5 text-slate-400" />
                          {dateStr} at {timeStr} ({c.duration_minutes} mins)
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
                      {classAttendance ? (
                        classAttendance.status === "present" ? (
                          <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                            Attended
                          </span>
                        ) : classAttendance.status === "absent" ? (
                          <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                            Absent
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                            Excused
                          </span>
                        )
                      ) : isBeforeEnrollment ? (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                          Not Enrolled
                        </span>
                      ) : c.status === "scheduled" && (
                        isPastClass ? (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                            Session ended
                          </span>
                        ) : canJoin && c.join_url ? (
                          <a
                            href={c.join_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold px-4.5 py-2 bg-[#2F7FE8] text-white rounded-full hover:bg-[#1B3A6B] transition-colors animate-pulse flex items-center gap-1"
                          >
                            Join Class <IconExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : countdown ? (
                          <span className="text-[10px] font-bold text-[#9BA8C0] bg-slate-50 border border-[#D0DCF5] px-3 py-1.5 rounded-full whitespace-nowrap">
                            Starts in {countdown}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                            Upcoming
                          </span>
                        )
                      )}
                      {c.status === "completed" && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                            Completed
                          </span>
                          {c.recording_url && (
                            <a
                              href={c.recording_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold px-3 py-1.5 bg-[#F5F8FF] border border-[#D0DCF5] text-[#1B3A6B] hover:border-[#2F7FE8] hover:text-[#2F7FE8] rounded-full transition-colors flex items-center gap-1"
                            >
                              Watch Recording
                            </a>
                          )}
                        </div>
                      )}
                      {c.status === "cancelled" && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="space-y-3">
            {assignments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#D0DCF5] p-10 text-center space-y-2">
                <IconFileText className="w-8 h-8 text-[#9BA8C0] mx-auto" />
                <h4 className="text-[13px] font-bold text-[#1B3A6B]">No Homework assigned</h4>
                <p className="text-[11px] text-[#4A5A7A] max-w-xs mx-auto">
                  Your mentor hasn't assigned any homework worksheets or tests for this booking yet.
                </p>
              </div>
            ) : (
              assignments.map((a: any) => {
                const dateStr = a.due_date 
                  ? new Date(a.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                  : "No due date";

                return (
                  <div key={a.id} className="bg-white rounded-2xl border border-[#D0DCF5] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-xs transition-shadow">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        a.status === "graded" 
                          ? "bg-green-50 text-green-600 border border-green-100" 
                          : a.status === "submitted" 
                            ? "bg-blue-50 text-blue-600 border border-blue-100" 
                            : "bg-amber-50 text-amber-600 border border-amber-150"
                      }`}>
                        <IconFileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-bold text-[#1B3A6B] truncate">{a.title}</h4>
                        <p className="text-[10px] text-[#4A5A7A] mt-1 font-semibold flex items-center gap-1.5">
                          <span>Due: {dateStr}</span>
                          {a.grade_score && (
                            <span className="text-[#2F7FE8]">· Score: {a.grade_score}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2.5 self-start sm:self-auto">
                      {a.status === "graded" && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                          Graded
                        </span>
                      )}
                      {a.status === "submitted" && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
                          Submitted
                        </span>
                      )}
                      {a.status === "assigned" && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                          Pending
                        </span>
                      )}
                      
                      {a.file_url && (
                        <a
                          href={a.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold px-3 py-1.5 bg-[#F5F8FF] border border-[#D0DCF5] text-[#1B3A6B] hover:border-[#2F7FE8] hover:text-[#2F7FE8] rounded-full transition-colors flex items-center gap-1"
                        >
                          View Work <IconDownload className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "resources" && (
          <div className="space-y-3">
            {resources.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#D0DCF5] p-10 text-center space-y-2">
                <IconBook className="w-8 h-8 text-[#9BA8C0] mx-auto" />
                <h4 className="text-[13px] font-bold text-[#1B3A6B]">No study material</h4>
                <p className="text-[11px] text-[#4A5A7A] max-w-xs mx-auto">
                  Your mentor hasn't shared any textbooks or cheat sheets for this course yet.
                </p>
              </div>
            ) : (
              resources.map((r: any) => (
                <div key={r.id} className="bg-white rounded-2xl border border-[#D0DCF5] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-xs transition-shadow">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-[#2F7FE8]">
                      <IconBook className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-bold text-[#1B3A6B] truncate">{r.name}</h4>
                      <p className="text-[10px] text-[#4A5A7A] mt-1 font-semibold">
                        Shared: {r.date} {r.size && `· Size: ${r.size}`}
                      </p>
                    </div>
                  </div>

                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold px-4 py-2 bg-[#F5F8FF] border border-[#D0DCF5] text-[#1B3A6B] hover:border-[#2F7FE8] hover:text-[#2F7FE8] rounded-full transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                  >
                    Open Resource <IconExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
