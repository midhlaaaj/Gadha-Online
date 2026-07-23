"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  IconVideo,
  IconClock,
  IconPlayerPlay,
  IconCheck,
  IconX,
  IconBook2,
} from "@tabler/icons-react";
import { getParentBookings, getChildScheduledClasses } from "@/app/actions";

type Booking = Awaited<ReturnType<typeof getParentBookings>>[number];
type Class  = Awaited<ReturnType<typeof getChildScheduledClasses>>[number];

type Filter = "all" | "upcoming" | "past";

// ─── Skeleton ──────────────────────────────────────────────────────
function ClassesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full animate-shimmer" />
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#D0DCF5] p-5 space-y-3">
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
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
  scheduled:  { bg: "bg-blue-50",   text: "text-[#2F7FE8]",  label: "Upcoming",   icon: IconClock },
  completed:  { bg: "bg-green-50",  text: "text-green-600",  label: "Completed",  icon: IconCheck },
  cancelled:  { bg: "bg-red-50",    text: "text-red-500",    label: "Cancelled",  icon: IconX },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.scheduled;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${s.bg} ${s.text}`}>
      <s.icon className="w-3.5 h-3.5" />
      {s.label}
    </span>
  );
}

// ─── Scheduled class row ────────────────────────────────────────────
function ClassRow({ c }: { c: Class }) {
  const now = new Date();
  const classTime = new Date(c.scheduledAt);
  const minsUntil = (classTime.getTime() - now.getTime()) / 60000;
  const canJoin = c.status === "scheduled" && minsUntil <= 15 && minsUntil > -120;

  const formatCountdown = () => {
    if (minsUntil <= 0) return null;
    if (minsUntil < 60) return `Starts in ${Math.round(minsUntil)}m`;
    const h = Math.floor(minsUntil / 60);
    const m = Math.round(minsUntil % 60);
    return `Starts in ${h}h ${m > 0 ? `${m}m` : ""}`;
  };

  const countdown = formatCountdown();

  return (
    <div className="bg-white rounded-2xl border border-[#D0DCF5] p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className="w-10 h-10 rounded-xl bg-[#E6F1FB] flex items-center justify-center shrink-0">
        <IconVideo className="w-5 h-5 text-[#2F7FE8]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[#1B3A6B] truncate">{c.title}</p>
        <p className="text-[11px] text-[#4A5A7A]">{c.subject} · {c.mentor}</p>
        <p className="text-[11px] text-[#4A5A7A] flex items-center gap-1 mt-0.5">
          <IconClock className="w-3.5 h-3.5" />
          {c.dateTime} · {c.durationMinutes} min
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <StatusBadge status={c.status} />
        {c.status === "scheduled" && (
          canJoin && c.joinUrl ? (
            <a
              href={c.joinUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2F7FE8] text-white text-[11px] font-bold rounded-full hover:bg-[#1B3A6B] transition-colors animate-pulse"
            >
              <IconPlayerPlay className="w-3.5 h-3.5" />
              Join Now
            </a>
          ) : countdown ? (
            <span className="text-[10px] font-bold text-[#9BA8C0] bg-slate-50 border border-[#E6EBF8] px-2.5 py-1 rounded-full whitespace-nowrap">
              {countdown}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}


// ─── Enrolled booking row ───────────────────────────────────────────
function EnrolledRow({ b }: { b: Booking }) {
  const getCourseAccessStatus = () => {
    // If not a course, assume active session booking
    if (b.type !== "Course") {
      return { label: "Enrolled", bg: "bg-green-50", text: "text-green-600", active: true };
    }
    
    // Recorded courses always active
    if (b.format === "Recorded") {
      return { label: "Lifetime Access", bg: "bg-green-50", text: "text-green-600", active: true };
    }
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Live Batch date check
    if (b.format === "Live batch") {
      const bStartStr = b.batchStartDate;
      const bEndStr = b.batchEndDate;
      if (!bStartStr || !bEndStr) {
        return { label: "Active Access", bg: "bg-green-50", text: "text-green-600", active: true };
      }
      const sDate = new Date(bStartStr);
      const eDate = new Date(bEndStr);
      sDate.setHours(0, 0, 0, 0);
      eDate.setHours(0, 0, 0, 0);

      if (now < sDate) {
        return { label: `Access Starts ${sDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, bg: "bg-amber-55 bg-amber-50", text: "text-amber-700", active: false };
      } else if (now > eDate) {
        return { label: "Expired", bg: "bg-red-50", text: "text-red-500", active: false };
      } else {
        return { label: `Active (Ends ${eDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`, bg: "bg-green-50", text: "text-green-600", active: true };
      }
    }

    // Live Individual date validity limit check
    if (b.format === "Live individual") {
      const createdStr = b.createdAt;
      const duration = b.durationDays;
      if (!createdStr || !duration) {
        return { label: "Active Access", bg: "bg-green-50", text: "text-green-600", active: true };
      }
      const sDate = new Date(createdStr);
      sDate.setHours(0, 0, 0, 0);
      const eDate = new Date(sDate);
      eDate.setDate(sDate.getDate() + Number(duration));
      eDate.setHours(0, 0, 0, 0);

      if (now > eDate) {
        return { label: "Expired", bg: "bg-red-50", text: "text-red-500", active: false };
      } else {
        return { label: `Active (Expires ${eDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`, bg: "bg-green-50", text: "text-green-600", active: true };
      }
    }

    return { label: "Enrolled", bg: "bg-green-50", text: "text-green-600", active: true };
  };

  const status = getCourseAccessStatus();

  return (
    <div className="bg-white rounded-2xl border border-[#D0DCF5] p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className="w-10 h-10 rounded-xl bg-[#E6F1FB] flex items-center justify-center shrink-0">
        <IconBook2 className="w-5 h-5 text-[#2F7FE8]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[#1B3A6B] truncate">{b.title}</p>
        <p className="text-[11px] text-[#4A5A7A]">{b.subject} · {b.mentorName}</p>
        <p className="text-[11px] text-[#4A5A7A] mt-0.5">{b.type === "course" ? "Course" : "Session"} · {b.dateTime}</p>
      </div>
      <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${status.bg} ${status.text}`}>
        {status.active ? <IconCheck className="w-3.5 h-3.5" /> : <IconX className="w-3.5 h-3.5" />}
        {status.label}
      </span>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────
function EmptyClasses({ filter }: { filter: Filter }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-2xl border border-dashed border-[#D0DCF5]">
      <IconVideo className="w-10 h-10 text-[#D0DCF5]" />
      <p className="text-[14px] font-bold text-[#1B3A6B]">
        {filter === "upcoming" ? "No upcoming classes" : filter === "past" ? "No past classes" : "No classes yet"}
      </p>
      <p className="text-[12px] text-[#4A5A7A] max-w-xs">
        {filter === "all"
          ? "Once your mentor schedules individual classes, they'll appear here."
          : "Try switching to 'All' to see all classes."}
      </p>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────
export default function ClassesPage() {
  const searchParams = useSearchParams();
  const childId = searchParams.get("child");

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [scheduled, setScheduled] = useState<Class[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-driven-by-childId-param; bails out synchronously only when there's no child to load
    if (!childId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      getChildScheduledClasses(childId),
      getParentBookings(),
    ])
      .then(([sc, bk]) => {
        setScheduled(sc);
        // Only bookings for this child
        setBookings(bk.filter((b) => b.studentId === childId));
      })
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) return <ClassesSkeleton />;

  const now = new Date();
  const filtered: Class[] = scheduled.filter((c) => {
    const at = new Date(c.scheduledAt);
    if (filter === "upcoming") return at >= now && c.status === "scheduled";
    if (filter === "past") return at < now || c.status === "completed";
    return true;
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">Classes</h1>
        <p className="text-[13px] text-[#4A5A7A] mt-0.5">Scheduled sessions and enrolled courses.</p>
      </div>

      {/* Scheduled classes section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[#1B3A6B]">Scheduled Classes</h2>
          <div className="flex gap-2">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer border ${
                  filter === key
                    ? "bg-[#1B3A6B] text-white border-[#1B3A6B]"
                    : "bg-white text-[#4A5A7A] border-[#D0DCF5] hover:border-[#2F7FE8] hover:text-[#2F7FE8]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyClasses filter={filter} />
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => <ClassRow key={c.id} c={c} />)}
          </div>
        )}
      </section>

      {/* Enrolled courses/sessions from bookings */}
      {bookings.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[14px] font-bold text-[#1B3A6B]">Enrolled Courses & Sessions</h2>
          <div className="space-y-3">
            {bookings.map((b) => <EnrolledRow key={b.id} b={b} />)}
          </div>
        </section>
      )}
    </div>
  );
}
