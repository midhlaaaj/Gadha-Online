"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  IconCalendarCheck,
  IconCalendarX,
  IconTrendingUp,
  IconSparkles,
} from "@tabler/icons-react";
import { getChildAttendance } from "@/app/actions";

type AttendanceData = Awaited<ReturnType<typeof getChildAttendance>>;

// ─── Skeleton ──────────────────────────────────────────────────────
function AttendanceSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#D0DCF5] p-5 space-y-3">
            <div className="h-3 w-20 animate-shimmer rounded" />
            <div className="h-8 w-16 animate-shimmer rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[#D0DCF5] p-5 space-y-4">
        <div className="h-4 w-32 animate-shimmer rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-full animate-shimmer rounded" />
            <div className="h-2.5 w-3/4 animate-shimmer rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────
function StatBubble({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#D0DCF5] p-5 flex flex-col gap-2">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
      <p className="text-[24px] font-extrabold font-heading text-[#1B3A6B] leading-none mt-1">{value}</p>
      <p className="text-[11px] font-bold text-[#4A5A7A] uppercase tracking-wider">{label}</p>
      {sub && <p className="text-[11px] text-[#4A5A7A]">{sub}</p>}
    </div>
  );
}

// ─── Status dot ────────────────────────────────────────────────────
const STATUS_META: Record<string, { dot: string; label: string }> = {
  present: { dot: "bg-green-400",  label: "Present" },
  absent:  { dot: "bg-red-400",    label: "Absent" },
  excused: { dot: "bg-amber-400",  label: "Excused" },
};

// ─── Empty state ────────────────────────────────────────────────────
function EmptyAttendance() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center bg-white rounded-2xl border border-dashed border-[#D0DCF5]">
      <IconCalendarCheck className="w-12 h-12 text-[#D0DCF5]" />
      <h2 className="text-[16px] font-extrabold font-heading text-[#1B3A6B]">No attendance records yet</h2>
      <p className="text-[13px] text-[#4A5A7A] max-w-xs">
        Attendance is recorded after each scheduled class. Check back once sessions have started.
      </p>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────
export default function AttendancePage() {
  const searchParams = useSearchParams();
  const childId = searchParams.get("child");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AttendanceData | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-driven-by-childId-param; bails out synchronously only when there's no child to load
    if (!childId) { setLoading(false); return; }
    setLoading(true);
    getChildAttendance(childId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) return <AttendanceSkeleton />;

  const d = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">Attendance</h1>
        <p className="text-[13px] text-[#4A5A7A] mt-0.5">Track your child&apos;s session presence and trends.</p>
      </div>

      {(!d || d.totalClasses === 0) ? (
        <EmptyAttendance />
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatBubble
              icon={IconTrendingUp}
              label="Attendance Rate"
              value={d.attendanceRate !== null ? `${d.attendanceRate}%` : "—"}
              sub={`${d.attendedClasses} of ${d.totalClasses} sessions`}
              color="#2F7FE8"
            />
            <StatBubble
              icon={IconCalendarCheck}
              label="This Month"
              value={`${d.thisMonthAttended}/${d.thisMonthTotal}`}
              sub="classes attended"
              color="#0F6E56"
            />
            <StatBubble
              icon={d.attendanceRate !== null && d.attendanceRate >= 80 ? IconSparkles : IconCalendarX}
              label="Status"
              value={
                d.attendanceRate === null ? "—"
                  : d.attendanceRate >= 90 ? "Excellent"
                  : d.attendanceRate >= 75 ? "Good"
                  : d.attendanceRate >= 60 ? "Average"
                  : "Needs attention"
              }
              color={
                d.attendanceRate === null ? "#4A5A7A"
                  : d.attendanceRate >= 90 ? "#0F6E56"
                  : d.attendanceRate >= 75 ? "#2F7FE8"
                  : d.attendanceRate >= 60 ? "#D97706"
                  : "#EF4444"
              }
            />
          </div>

          {/* Subject breakdown */}
          {d.subjectBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 space-y-4">
              <h2 className="text-[14px] font-bold text-[#1B3A6B]">By Subject</h2>
              {d.subjectBreakdown.map((sub) => (
                <div key={sub.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-[#1B3A6B]">{sub.name}</span>
                    <span className="text-[12px] text-[#4A5A7A]">
                      {sub.attended}/{sub.total} · {sub.pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#E6F1FB] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${sub.pct}%`,
                        backgroundColor: sub.pct >= 80 ? "#2F7FE8" : sub.pct >= 60 ? "#D97706" : "#EF4444",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Attendance log */}
          <div className="bg-white rounded-2xl border border-[#D0DCF5] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D0DCF5]">
              <h2 className="text-[14px] font-bold text-[#1B3A6B]">Attendance Log</h2>
            </div>
            <div className="divide-y divide-[#D0DCF5]">
              {d.records.map((rec) => {
                const meta = STATUS_META[rec.status] ?? STATUS_META.present;
                const dateStr = new Date(rec.date).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                });
                return (
                  <div key={rec.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#F5F8FF] transition-colors">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1B3A6B]">{rec.subject}</p>
                      {rec.notes && <p className="text-[11px] text-[#4A5A7A]">{rec.notes}</p>}
                    </div>
                    <span className="text-[11px] text-[#4A5A7A] shrink-0">{dateStr}</span>
                    <span className={`text-[11px] font-bold shrink-0 ${
                      rec.status === "present" ? "text-green-600" :
                      rec.status === "excused" ? "text-amber-500" : "text-red-500"
                    }`}>
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
