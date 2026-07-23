"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconCalendarCheck, IconClipboardList, IconVideo,
  IconArrowRight, IconAlertTriangle, IconCheck, IconX, IconSparkles,
  IconChartBar,
} from "@tabler/icons-react";
import { getStudentOverviewStats, getStudentProfile } from "@/app/actions";

type Stats = Awaited<ReturnType<typeof getStudentOverviewStats>>;
type Profile = Awaited<ReturnType<typeof getStudentProfile>>;

// ─── Skeleton ──────────────────────────────────────────────────────
function Skel({ className }: { className?: string }) {
  return <div className={`animate-shimmer rounded-xl ${className}`} />;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div><Skel className="h-7 w-56 mb-2" /><Skel className="h-4 w-72" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E6EBF8] p-5 space-y-3">
            <Skel className="h-9 w-9" /><Skel className="h-8 w-16" /><Skel className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E6EBF8] p-6 space-y-3">
            <Skel className="h-4 w-40" />
            {[...Array(3)].map((_, i) => <Skel key={i} className="h-16 w-full" />)}
          </div>
          <div className="bg-white rounded-2xl border border-[#E6EBF8] p-6 space-y-3">
            <Skel className="h-4 w-36" />
            {[...Array(3)].map((_, i) => <Skel key={i} className="h-10 w-full" />)}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E6EBF8] p-6 flex flex-col items-center gap-4">
            <Skel className="h-4 w-28 self-start" />
            <Skel className="h-32 w-32 rounded-full" />
          </div>
          <div className="bg-white rounded-2xl border border-[#E6EBF8] p-6 space-y-3">
            <Skel className="h-4 w-28" />
            {[...Array(3)].map((_, i) => <Skel key={i} className="h-10 w-full" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, accentBg, accentIcon, href,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub: string; accentBg: string; accentIcon: string; href: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-[#E6EBF8] p-5 hover:shadow-md hover:border-[#BDD0F8] transition-all duration-200 flex flex-col gap-2"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentBg }}>
        <Icon className="w-5 h-5" style={{ color: accentIcon }} />
      </div>
      <p className="text-[24px] font-extrabold font-heading text-[#1B3A6B] leading-none mt-1">{value}</p>
      <p className="text-[11px] font-bold text-[#9BA8C0] uppercase tracking-wider">{label}</p>
      <p className="text-[11px] text-[#9BA8C0]">{sub}</p>
      <span className="text-[11px] font-semibold text-[#2F7FE8] flex items-center gap-1 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
        View details <IconArrowRight className="w-3.5 h-3.5" />
      </span>
    </Link>
  );
}

// ─── Attendance ring ────────────────────────────────────────────────
function AttendanceRing({ pct }: { pct: number | null }) {
  const radius = 48;
  const circ = 2 * Math.PI * radius;
  const filled = pct !== null ? (pct / 100) * circ : 0;
  return (
    <div className="bg-white rounded-2xl border border-[#E6EBF8] p-6 flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full">
        <h3 className="text-[13px] font-bold text-[#1B3A6B]">Attendance</h3>
        <Link href="/lms/performance" className="text-[11px] font-semibold text-[#2F7FE8] hover:underline">
          Full report →
        </Link>
      </div>
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#EBF2FF" strokeWidth="10" />
          {pct !== null && (
            <circle
              cx="60" cy="60" r={radius} fill="none" stroke="#2F7FE8" strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circ}`}
              strokeDashoffset={circ * 0.25}
              transform="rotate(-90 60 60)"
              className="transition-all duration-700"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {pct !== null ? (
            <>
              <span className="text-[24px] font-extrabold font-heading text-[#1B3A6B]">{pct}%</span>
              <span className="text-[10px] text-[#9BA8C0] font-semibold">overall</span>
            </>
          ) : (
            <span className="text-[11px] text-[#9BA8C0] font-semibold text-center px-2">No data</span>
          )}
        </div>
      </div>

      {/* Subject bars */}
    </div>
  );
}

// ─── Subject colors ─────────────────────────────────────────────────
const SUBJ_COLORS: Record<string, string> = {
  Mathematics: "#2F7FE8", Physics: "#534AB7", English: "#0F6E56",
  Science: "#D97706", Chemistry: "#E24B4A", Programming: "#0F6E56",
};
function sc(n: string) { return SUBJ_COLORS[n] ?? "#2F7FE8"; }

// ─── Today class card ────────────────────────────────────────────────
function TodayClassCard({ cls }: { cls: Stats["todayClasses"][number] }) {
  const scheduledAt = new Date(cls.scheduledAt);
  const endAt = new Date(scheduledAt.getTime() + cls.durationMinutes * 60000);
  const now = new Date();
  const isLive = scheduledAt <= now && now <= endAt;
  const isPast = now > endAt;

  return (
    <div className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all ${isLive ? "border-red-200 bg-red-50/40" : "border-[#E6EBF8] bg-[#F5F7FF]"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLive ? "bg-red-100" : "bg-[#EBF2FF]"}`}>
        <IconVideo className={`w-5 h-5 ${isLive ? "text-red-500" : "text-[#2F7FE8]"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[#1B3A6B] truncate">{cls.title}</p>
        <p className="text-[11px] text-[#9BA8C0] mt-0.5">{cls.mentor} · {cls.timeLabel}</p>
      </div>
      {isLive ? (
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-600 animate-pulse whitespace-nowrap">● LIVE</span>
          {cls.joinUrl && (
            <a href={cls.joinUrl} target="_blank" rel="noreferrer"
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#1B3A6B] text-white hover:bg-[#2F7FE8] transition-colors whitespace-nowrap">
              Join
            </a>
          )}
        </div>
      ) : isPast ? (
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 whitespace-nowrap">
          Session ended
        </span>
      ) : (
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#EBF2FF] text-[#2F7FE8] whitespace-nowrap">
          Upcoming
        </span>
      )}
    </div>
  );
}

// ─── Assignment row ─────────────────────────────────────────────────
function AssignmentRow({ a }: { a: Stats["pendingAssignments"][number] }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#F0F3FB] last:border-0">
      <div className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${a.status === "Overdue" ? "bg-red-500" : "bg-[#FFC107]"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[#1B3A6B] truncate">{a.title}</p>
        <p className="text-[10px] text-[#9BA8C0] mt-0.5">{a.subject} · {a.dueMeta}</p>
      </div>
      <span className={`text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${
        a.status === "Overdue" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
      }`}>
        {a.status}
      </span>
    </div>
  );
}

// ─── Activity item ──────────────────────────────────────────────────
function ActivityItem({ a }: { a: Stats["recentActivity"][number] }) {
  const ok = a.status === "present";
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#F0F3FB] last:border-0">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${ok ? "bg-green-50" : "bg-red-50"}`}>
        {ok ? <IconCheck className="w-3.5 h-3.5 text-green-600" /> : <IconX className="w-3.5 h-3.5 text-red-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[#1B3A6B]">{a.text} <span className="font-normal text-[#9BA8C0]">· {a.subject}</span></p>
        <p className="text-[10px] text-[#9BA8C0] mt-0.5">{a.date}</p>
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────
export default function StudentOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      getStudentProfile().catch(() => null),
      getStudentOverviewStats().catch(() => null),
    ]).then(([p, s]) => {
      setProfile(p);
      setStats(s);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <OverviewSkeleton />;

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  return (
    <div className="space-y-6">
      {/* ── Top row: welcome + profile pill ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-extrabold font-heading text-[#1B3A6B]">
            {greeting}, {profile?.name?.split(" ")[0] ?? "Student"} 👋
          </h1>
          <p className="text-[13px] text-[#9BA8C0] mt-1">
            {stats?.totalClassesToday
              ? `You have ${stats.totalClassesToday} class${stats.totalClassesToday !== 1 ? "es" : ""} today`
              : "No classes scheduled today"}
            {stats?.pendingCount ? ` · ${stats.pendingCount} pending assignment${stats.pendingCount !== 1 ? "s" : ""}` : ""}
          </p>
        </div>

        {/* Profile pill (desktop only — mobile shows this in the top bar) */}
        <div className="hidden sm:flex items-center gap-2 pl-1.5 pr-4 py-1.5 border border-[#d0e0f8] bg-white rounded-full shadow-sm shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#0f2347] flex items-center justify-center font-heading text-xs font-extrabold text-[#ffc107] shadow-inner shrink-0">
            {profile?.avatarText ?? "S"}
          </div>
          <div className="hidden sm:block">
            <p className="text-[12px] font-bold text-[#1B3A6B] leading-tight">{profile?.name ?? "Student"}</p>
            <p className="text-[10px] text-[#9BA8C0] leading-tight capitalize">{profile?.gradeLevel ?? "Student"}</p>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={IconCalendarCheck} label="Attendance"
          value={stats?.attendanceRate !== null && stats?.attendanceRate !== undefined ? `${stats.attendanceRate}%` : "—"}
          sub="Overall rate" accentBg="#EBF2FF" accentIcon="#2F7FE8" href="/lms/performance"
        />
        <StatCard
          icon={IconVideo} label="Next class"
          value={stats?.nextClass ? new Date(stats.nextClass.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "None"}
          sub={stats?.nextClass?.subject ?? "No upcoming classes"} accentBg="#ECFDF5" accentIcon="#0F6E56" href="/lms/classes"
        />
        <StatCard
          icon={IconClipboardList} label="Assignments"
          value={stats?.pendingCount ?? 0}
          sub={stats?.overdueCount ? `${stats.overdueCount} overdue` : "All on track"} accentBg="#FFFBEB" accentIcon="#D97706" href="/lms/assignments"
        />
        <StatCard
          icon={IconChartBar} label="Performance"
          value="—" sub="View full report" accentBg="#F5F3FF" accentIcon="#534AB7" href="/lms/performance"
        />
      </div>

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Left: 2/3 width ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Today's Classes */}
          <div className="bg-white rounded-2xl border border-[#E6EBF8] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] md:text-[18px] font-extrabold font-heading text-[#1B3A6B]">Today&apos;s Classes</h2>
              <Link href="/lms/classes" className="text-[11px] font-semibold text-[#2F7FE8] hover:underline flex items-center gap-1">
                View all <IconArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {!stats?.todayClasses?.length ? (
              <div className="flex flex-col items-center py-10 gap-2 text-center">
                <IconVideo className="w-9 h-9 text-[#E6EBF8]" />
                <p className="text-[13px] font-semibold text-[#9BA8C0]">No classes today</p>
                <p className="text-[11px] text-[#9BA8C0]">Check your upcoming classes for tomorrow.</p>
                <Link href="/lms/classes" className="mt-2 text-[11px] font-bold text-[#2F7FE8] hover:underline">View schedule</Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.todayClasses.map((c) => <TodayClassCard key={c.id} cls={c} />)}
              </div>
            )}
          </div>

          {/* Pending Assignments */}
          <div className="bg-white rounded-2xl border border-[#E6EBF8] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] md:text-[18px] font-extrabold font-heading text-[#1B3A6B]">Pending Assignments</h2>
              <Link href="/lms/assignments" className="text-[11px] font-semibold text-[#2F7FE8] hover:underline flex items-center gap-1">
                View all <IconArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {stats?.overdueCount && stats.overdueCount > 0 ? (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl mb-3">
                <IconAlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-[12px] font-semibold text-red-700">
                  {stats.overdueCount} overdue assignment{stats.overdueCount !== 1 ? "s" : ""} — please submit soon
                </p>
              </div>
            ) : null}
            {!stats?.pendingAssignments?.length ? (
              <div className="flex flex-col items-center py-8 gap-2 text-center">
                <IconSparkles className="w-9 h-9 text-[#E6EBF8]" />
                <p className="text-[13px] font-semibold text-[#9BA8C0]">All caught up!</p>
                <p className="text-[11px] text-[#9BA8C0]">No pending assignments right now.</p>
              </div>
            ) : (
              <div>{stats.pendingAssignments.slice(0, 5).map((a) => <AssignmentRow key={a.id} a={a} />)}</div>
            )}
          </div>
        </div>

        {/* ── Right: 1/3 width ── */}
        <div className="space-y-5">

          {/* Attendance ring */}
          <AttendanceRing pct={stats?.attendanceRate ?? null} />

          {/* Subject attendance bars */}
          {stats?.subjectAttendance && stats.subjectAttendance.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E6EBF8] p-6">
              <h3 className="text-[13px] font-bold text-[#1B3A6B] mb-4">By Subject</h3>
              <div className="space-y-3.5">
                {stats.subjectAttendance.map((s) => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-[#1B3A6B]">{s.name}</span>
                      <span className="text-[11px] text-[#9BA8C0]">{s.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#EBF2FF] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.pct}%`, backgroundColor: sc(s.name) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next class card */}
          {stats?.nextClass && (
            <div className="bg-gradient-to-br from-[#1B3A6B] to-[#2F7FE8] rounded-2xl p-5 text-white">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Next Class</span>
              <p className="text-[16px] font-extrabold font-heading leading-snug mt-2">{stats.nextClass.title}</p>
              <p className="text-[11px] text-blue-200 mt-1">{stats.nextClass.subject} · {stats.nextClass.mentor}</p>
              <div className="flex items-center gap-2 mt-3 bg-white/10 px-3 py-2 rounded-xl">
                <IconCalendarCheck className="w-4 h-4 text-blue-200" />
                <span className="text-[12px] font-semibold">{stats.nextClass.dateTime}</span>
              </div>
              {stats.nextClass.joinUrl && (
                <a href={stats.nextClass.joinUrl} target="_blank" rel="noreferrer"
                  className="mt-3 w-full block text-center text-[12px] font-bold py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
                  Join class →
                </a>
              )}
            </div>
          )}

          {/* Recent activity */}
          {stats?.recentActivity && stats.recentActivity.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E6EBF8] p-6">
              <h3 className="text-[13px] font-bold text-[#1B3A6B] mb-4">Recent Activity</h3>
              <div>{stats.recentActivity.map((a, i) => <ActivityItem key={i} a={a} />)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
