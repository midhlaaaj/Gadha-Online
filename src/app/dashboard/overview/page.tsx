"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  IconCalendarCheck,
  IconClipboardList,
  IconVideo,
  IconChartBar,
  IconArrowRight,
  IconSparkles,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { getChildOverviewStats, getParentChildren } from "@/app/actions";

type Stats = Awaited<ReturnType<typeof getChildOverviewStats>>;

// ─── Skeleton helpers ──────────────────────────────────────────────
function Skel({ className }: { className?: string }) {
  return <div className={`animate-shimmer rounded-xl ${className}`} />;
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#D0DCF5] p-5 flex flex-col gap-3">
      <Skel className="h-3 w-24" />
      <Skel className="h-8 w-16" />
      <Skel className="h-2.5 w-32" />
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#D0DCF5] p-6 space-y-4">
          <Skel className="h-4 w-40" />
          {[...Array(3)].map((_, i) => <Skel key={i} className="h-14 w-full" />)}
        </div>
        <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 space-y-4">
          <Skel className="h-4 w-32" />
          <Skel className="h-32 w-32 rounded-full mx-auto" />
          {[...Array(2)].map((_, i) => <Skel key={i} className="h-8 w-full" />)}
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  href,
  childId,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  href: string;
  childId: string | null;
}) {
  return (
    <Link
      href={`${href}${childId ? `?child=${childId}` : ""}`}
      className="group bg-white rounded-2xl border border-[#D0DCF5] p-5 hover:shadow-md hover:border-[#B5D4F4] transition-all duration-200 flex flex-col gap-2"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${accent}18` }}>
        <Icon className="w-4.5 h-4.5" style={{ color: accent }} />
      </div>
      <p className="text-[22px] font-extrabold font-heading text-[#1B3A6B] leading-none mt-1">{value}</p>
      <p className="text-[11px] font-bold text-[#4A5A7A] uppercase tracking-wider">{label}</p>
      <p className="text-[11px] text-[#4A5A7A]">{sub}</p>
      <span className="text-[11px] font-semibold text-[#2F7FE8] flex items-center gap-1 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
        View details <IconArrowRight className="w-3.5 h-3.5" />
      </span>
    </Link>
  );
}

// ─── Attendance ring ────────────────────────────────────────────────
function AttendanceRing({ pct, childId }: { pct: number | null; childId: string | null }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const filled = pct !== null ? (pct / 100) * circ : 0;

  return (
    <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 flex flex-col items-center gap-4">
      <h3 className="text-[13px] font-bold text-[#1B3A6B] self-start">Attendance Rate</h3>

      <div className="relative">
        <svg width="128" height="128" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#E6F1FB" strokeWidth="12" />
          {pct !== null && (
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="#2F7FE8"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circ}`}
              strokeDashoffset={circ * 0.25}
              transform="rotate(-90 64 64)"
              className="transition-all duration-700"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {pct !== null ? (
            <>
              <span className="text-[26px] font-extrabold font-heading text-[#1B3A6B]">{pct}%</span>
              <span className="text-[10px] text-[#4A5A7A] font-semibold">overall</span>
            </>
          ) : (
            <span className="text-[12px] text-[#4A5A7A] font-semibold text-center leading-tight px-2">
              No data yet
            </span>
          )}
        </div>
      </div>

      <Link
        href={`/dashboard/attendance${childId ? `?child=${childId}` : ""}`}
        className="text-[11px] font-semibold text-[#2F7FE8] hover:underline flex items-center gap-1"
      >
        Full report <IconArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ─── Upcoming class card ────────────────────────────────────────────
function UpcomingClass({
  upcomingClass,
  childId,
}: {
  upcomingClass: Stats["upcomingClass"];
  childId: string | null;
}) {
  if (!upcomingClass) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-[#D0DCF5] p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[100px]">
        <IconVideo className="w-8 h-8 text-[#D0DCF5]" />
        <p className="text-[13px] font-semibold text-[#4A5A7A]">No classes scheduled yet</p>
        <p className="text-[11px] text-[#4A5A7A]">Classes will appear here once scheduled by your mentor.</p>
        <Link
          href={`/dashboard/classes${childId ? `?child=${childId}` : ""}`}
          className="text-[11px] font-semibold text-[#2F7FE8] hover:underline"
        >
          View enrolled courses
        </Link>
      </div>
    );
  }
  return (
    <div className="bg-gradient-to-br from-[#1B3A6B] to-[#2F7FE8] rounded-2xl p-5 text-white flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Next Class</span>
        {upcomingClass.joinUrl && (
          <a
            href={upcomingClass.joinUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-semibold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
          >
            Join →
          </a>
        )}
      </div>
      <p className="text-[18px] font-extrabold font-heading leading-snug">{upcomingClass.title}</p>
      <p className="text-[12px] text-blue-100">{upcomingClass.subject} · {upcomingClass.mentor}</p>
      <div className="flex items-center gap-2 mt-1 bg-white/10 px-3 py-2 rounded-xl">
        <IconCalendarCheck className="w-4 h-4 text-blue-200" />
        <span className="text-[12px] font-semibold">{upcomingClass.dateTime}</span>
      </div>
    </div>
  );
}

// ─── Pending assignments card ───────────────────────────────────────
function AssignmentsSummary({
  pendingCount,
  overdueCount,
  childId,
}: {
  pendingCount: number;
  overdueCount: number;
  childId: string | null;
}) {
  const href = `/dashboard/assignments${childId ? `?child=${childId}` : ""}`;
  if (pendingCount === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#D0DCF5] p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
          <IconClipboardList className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#1B3A6B]">All caught up!</p>
          <p className="text-[11px] text-[#4A5A7A]">No pending assignments right now.</p>
        </div>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-[#D0DCF5] p-5 flex items-center gap-4 hover:shadow-md hover:border-[#B5D4F4] transition-all"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${overdueCount > 0 ? "bg-red-50" : "bg-amber-50"}`}>
        {overdueCount > 0
          ? <IconAlertTriangle className="w-5 h-5 text-red-500" />
          : <IconClipboardList className="w-5 h-5 text-amber-500" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[#1B3A6B]">
          {pendingCount} pending assignment{pendingCount !== 1 ? "s" : ""}
          {overdueCount > 0 && (
            <span className="ml-2 text-[11px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              {overdueCount} overdue
            </span>
          )}
        </p>
        <p className="text-[11px] text-[#4A5A7A]">Click to view and track assignments</p>
      </div>
      <IconArrowRight className="w-4 h-4 text-[#4A5A7A] group-hover:text-[#2F7FE8] transition-colors shrink-0" />
    </Link>
  );
}

// ─── Main page ──────────────────────────────────────────────────────
export default function OverviewPage() {
  const searchParams = useSearchParams();
  const childId = searchParams.get("child");

  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState<string>("your child");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!childId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    Promise.all([
      getChildOverviewStats(childId),
      getParentChildren(),
    ])
      .then(([s, kids]) => {
        setStats(s);
        const found = (kids as any[]).find((k) => k.id === childId);
        if (found) setChildName(found.name.split(" ")[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) return <OverviewSkeleton />;

  if (!childId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <IconSparkles className="w-12 h-12 text-[#D0DCF5]" />
        <h2 className="text-[20px] font-extrabold font-heading text-[#1B3A6B]">Welcome to your dashboard</h2>
        <p className="text-[14px] text-[#4A5A7A]">Add a child to start tracking their progress.</p>
        <a
          href="/my-children"
          className="mt-2 px-5 py-2.5 bg-[#2F7FE8] text-white text-[13px] font-bold rounded-full hover:bg-[#1B3A6B] transition-colors"
        >
          Add a child
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <IconAlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-[14px] font-semibold text-[#1B3A6B]">Could not load dashboard</p>
        <p className="text-[12px] text-[#4A5A7A]">{error}</p>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-[20px] md:text-[22px] font-extrabold font-heading text-[#1B3A6B]">
          {childName}&apos;s Overview
        </h1>
        <p className="text-[13px] text-[#4A5A7A] mt-0.5">
          A summary of progress, upcoming classes, and tasks.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={IconCalendarCheck}
          label="Attendance"
          value={s.attendanceRate !== null ? `${s.attendanceRate}%` : "—"}
          sub={s.totalClasses > 0 ? `${s.attendedClasses} of ${s.totalClasses} classes` : "No records yet"}
          accent="#2F7FE8"
          href="/dashboard/attendance"
          childId={childId}
        />
        <StatCard
          icon={IconVideo}
          label="Enrolled"
          value={s.totalEnrolled}
          sub={`${s.activeCourses} course${s.activeCourses !== 1 ? "s" : ""} · ${s.activeSessions} session${s.activeSessions !== 1 ? "s" : ""}`}
          accent="#0F6E56"
          href="/dashboard/classes"
          childId={childId}
        />
        <StatCard
          icon={IconClipboardList}
          label="Assignments"
          value={s.pendingAssignmentsCount}
          sub={s.overdueAssignmentsCount > 0 ? `${s.overdueAssignmentsCount} overdue!` : "pending"}
          accent={s.overdueAssignmentsCount > 0 ? "#EF4444" : "#D97706"}
          href="/dashboard/assignments"
          childId={childId}
        />
        <StatCard
          icon={IconChartBar}
          label="This month"
          value={s.thisMonthTotal > 0 ? `${s.thisMonthAttended}/${s.thisMonthTotal}` : "—"}
          sub="classes attended"
          accent="#534AB7"
          href="/dashboard/attendance"
          childId={childId}
        />
      </div>

      {/* Main widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: upcoming class + assignments */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <UpcomingClass upcomingClass={s.upcomingClass} childId={childId} />
          <AssignmentsSummary
            pendingCount={s.pendingAssignmentsCount}
            overdueCount={s.overdueAssignmentsCount}
            childId={childId}
          />

          {/* Recent activity */}
          {s.recentActivity.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#D0DCF5] p-5 space-y-3">
              <h3 className="text-[16px] md:text-[18px] font-extrabold font-heading text-[#1B3A6B]">Recent Activity</h3>
              {s.recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                      a.type === "attended" ? "bg-green-400" : "bg-red-400"
                    }`}
                  />
                  <div>
                    <p className="text-[12px] font-semibold text-[#1B3A6B]">{a.text}</p>
                    <p className="text-[11px] text-[#4A5A7A]">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: attendance ring */}
        <div className="flex flex-col gap-4">
          <AttendanceRing pct={s.attendanceRate} childId={childId} />

          {/* Subject breakdown */}
          {s.subjectAttendance.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#D0DCF5] p-5 space-y-3">
              <h3 className="text-[16px] md:text-[18px] font-extrabold font-heading text-[#1B3A6B]">By Subject</h3>
              {s.subjectAttendance.map((sub) => (
                <div key={sub.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#1B3A6B]">{sub.name}</span>
                    <span className="text-[11px] text-[#4A5A7A]">{sub.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#E6F1FB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2F7FE8] rounded-full transition-all duration-500"
                      style={{ width: `${sub.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
