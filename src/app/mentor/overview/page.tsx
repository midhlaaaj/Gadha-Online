"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconCalendarCheck, IconClipboardList, IconVideo,
  IconArrowRight, IconCheck, IconX, IconSparkles,
  IconChartBar, IconCoin, IconMessageCircle, IconUsers
} from "@tabler/icons-react";
import { getMentorOverviewStats, getMentorProfile, getMentorClasses } from "@/app/actions";

type Stats = Awaited<ReturnType<typeof getMentorOverviewStats>>;
type Profile = Awaited<ReturnType<typeof getMentorProfile>>;
type MentorClass = Awaited<ReturnType<typeof getMentorClasses>>[number];

// ─── Skeleton ──────────────────────────────────────────────────────
function Skel({ className }: { className?: string }) {
  return <div className={`animate-shimmer rounded-xl ${className}`} />;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div><Skel className="h-7 w-56 mb-2" /><Skel className="h-4 w-72" /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E6EBF8] p-6 flex flex-col items-center gap-4">
            <Skel className="h-4 w-28 self-start" />
            <Skel className="h-20 w-20 rounded-full" />
            <Skel className="h-4 w-32" />
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

// ─── Today class card ────────────────────────────────────────────────
function ClassCard({ cls }: { cls: MentorClass }) {
  const scheduledAt = new Date(cls.scheduled_at);
  const endAt = new Date(scheduledAt.getTime() + cls.duration_minutes * 60000);
  const now = new Date();
  const isLive = scheduledAt <= now && now <= endAt;

  const timeLabel = scheduledAt.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }) + ` (${cls.duration_minutes} min)`;

  return (
    <div className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all ${isLive ? "border-red-200 bg-red-50/40" : "border-[#E6EBF8] bg-[#F5F7FF]"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLive ? "bg-red-100" : "bg-[#EBF2FF]"}`}>
        <IconVideo className={`w-5 h-5 ${isLive ? "text-red-500" : "text-[#2F7FE8]"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[#1B3A6B] truncate">{cls.title}</p>
        <p className="text-[11px] text-[#9BA8C0] mt-0.5">{cls.studentName} · {cls.subject} · {timeLabel}</p>
      </div>
      {isLive ? (
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-600 animate-pulse whitespace-nowrap">● LIVE</span>
          {cls.join_url && (
            <a href={cls.join_url} target="_blank" rel="noreferrer"
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#1B3A6B] text-white hover:bg-[#2F7FE8] transition-colors whitespace-nowrap">
              Join
            </a>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#EBF2FF] text-[#2F7FE8] whitespace-nowrap">
            Scheduled
          </span>
          {cls.join_url && (
            <a href={cls.join_url} target="_blank" rel="noreferrer"
              className="text-[11px] font-bold px-3 py-1 rounded-lg border border-[#D0DCF5] text-[#1B3A6B] hover:border-[#2F7FE8] hover:text-[#2F7FE8] transition-colors whitespace-nowrap">
              Launch
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function MentorOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [classes, setClasses] = useState<MentorClass[]>([]);

  useEffect(() => {
    Promise.all([
      getMentorProfile().catch(() => null),
      getMentorOverviewStats().catch(() => null),
      getMentorClasses().catch(() => []),
    ]).then(([p, s, c]) => {
      setProfile(p);
      setStats(s);
      setClasses(c || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <OverviewSkeleton />;

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);

  const todayClasses = classes.filter((c) => {
    const d = new Date(c.scheduled_at);
    return d >= todayStart && d <= todayEnd && c.status === "scheduled";
  });

  const upcomingClasses = classes.filter((c) => {
    const d = new Date(c.scheduled_at);
    return d > todayEnd && c.status === "scheduled";
  }).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* ── Top row: welcome + profile pill ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">
            {greeting}, {profile?.name?.split(" ")[0] ?? "Tutor"} 👋
          </h1>
          <p className="text-[13px] text-[#9BA8C0] mt-1">
            {todayClasses.length
              ? `You have ${todayClasses.length} class${todayClasses.length !== 1 ? "es" : ""} scheduled today`
              : "No classes scheduled today"}
            {stats?.pendingAssignmentsCount ? ` · ${stats.pendingAssignmentsCount} assignment review${stats.pendingAssignmentsCount !== 1 ? "s" : ""} pending` : ""}
          </p>
        </div>

        {/* Profile pill */}
        <div className="flex items-center gap-2 pl-1.5 pr-4 py-1.5 border border-[#d0e0f8] bg-white rounded-full shadow-sm shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#0f2347] flex items-center justify-center font-heading text-xs font-extrabold text-[#ffc107] shadow-inner shrink-0">
            {profile?.avatarText ?? "T"}
          </div>
          <div className="hidden sm:block">
            <p className="text-[12px] font-bold text-[#1B3A6B] leading-tight">{profile?.name ?? "Tutor"}</p>
            <p className="text-[10px] text-[#9BA8C0] leading-tight capitalize">{profile?.qualification ?? "Educator"}</p>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={IconCoin} label="Earnings"
          value={stats?.earningsThisMonth !== undefined ? `₹${stats.earningsThisMonth.toLocaleString("en-IN")}` : "₹0"}
          sub="Earnings this month" accentBg="#EBF2FF" accentIcon="#2F7FE8" href="/mentor/earnings"
        />
        <StatCard
          icon={IconVideo} label="Today's Classes"
          value={stats?.todayClassesCount ?? 0}
          sub="Sessions scheduled today" accentBg="#ECFDF5" accentIcon="#0F6E56" href="/mentor/classes"
        />
        <StatCard
          icon={IconClipboardList} label="Assignment Reviews"
          value={stats?.pendingAssignmentsCount ?? 0}
          sub="Awaiting grading" accentBg="#FFFBEB" accentIcon="#D97706" href="/mentor/assignments"
        />
        <StatCard
          icon={IconMessageCircle} label="Messages"
          value={stats?.unreadMessagesCount ?? 0}
          sub="Unread in last 24h" accentBg="#F5F3FF" accentIcon="#534AB7" href="/mentor/messages"
        />
      </div>

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Left: 2/3 width ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Today's Classes */}
          <div className="bg-white rounded-2xl border border-[#E6EBF8] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-[#1B3A6B]">Today's Schedule</h2>
              <Link href="/mentor/classes" className="text-[11px] font-semibold text-[#2F7FE8] hover:underline flex items-center gap-1">
                View calendar <IconArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {!todayClasses.length ? (
              <div className="flex flex-col items-center py-10 gap-2 text-center">
                <IconVideo className="w-9 h-9 text-[#E6EBF8]" />
                <p className="text-[13px] font-semibold text-[#9BA8C0]">No classes today</p>
                <p className="text-[11px] text-[#9BA8C0]">Use the calendar tool to schedule a session.</p>
                <Link href="/mentor/classes" className="mt-2 text-[11px] font-bold text-[#2F7FE8] hover:underline">Schedule session</Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayClasses.map((c) => <ClassCard key={c.id} cls={c} />)}
              </div>
            )}
          </div>

          {/* Upcoming Classes */}
          <div className="bg-white rounded-2xl border border-[#E6EBF8] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-[#1B3A6B]">Upcoming Sessions</h2>
              <Link href="/mentor/classes" className="text-[11px] font-semibold text-[#2F7FE8] hover:underline">
                View all →
              </Link>
            </div>
            {!upcomingClasses.length ? (
              <p className="text-[12px] text-[#9BA8C0] py-4 text-center">No other upcoming classes scheduled.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingClasses.map((c) => <ClassCard key={c.id} cls={c} />)}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: 1/3 width ── */}
        <div className="space-y-5">
          {/* Profile details & expertise */}
          <div className="bg-white rounded-2xl border border-[#E6EBF8] p-6 flex flex-col items-center text-center gap-4">
            <h3 className="text-[13px] font-bold text-[#1B3A6B] self-start">Tutor Profile</h3>
            
            <div className="w-16 h-16 rounded-2xl bg-[#F5F8FF] border border-[#d0e0f8] flex items-center justify-center font-heading text-lg font-extrabold text-[#2F7FE8] shadow-inner shrink-0">
              {profile?.avatarText ?? "M"}
            </div>

            <div>
              <h4 className="text-[15px] font-extrabold text-[#1B3A6B]">{profile?.name}</h4>
              <p className="text-[11px] text-[#9BA8C0] mt-0.5">{profile?.qualification}</p>
              <p className="text-[11px] text-[#2F7FE8] font-semibold mt-1">{profile?.email}</p>
            </div>

            <div className="w-full border-t border-[#F0F3FB] pt-4">
              <h5 className="text-[11px] font-bold text-[#1B3A6B] text-left uppercase tracking-wider mb-2">Subject Expertise</h5>
              <div className="flex flex-wrap gap-1.5 justify-start">
                {profile?.expertise && profile.expertise.length > 0 ? (
                  profile.expertise.map((exp: string, index: number) => (
                    <span
                      key={index}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EBF2FF] text-[#2F7FE8]"
                    >
                      {exp}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#9BA8C0]">No expertise listed</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-[#E6EBF8] p-6">
            <h3 className="text-[13px] font-bold text-[#1B3A6B] mb-3">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link href="/mentor/attendance" className="flex items-center justify-between p-3 rounded-xl border border-[#E6EBF8] hover:border-[#BDD0F8] hover:bg-[#F5F8FF] transition-colors group">
                <span className="text-[12px] font-bold text-[#1B3A6B]">Mark Attendance</span>
                <IconArrowRight className="w-4 h-4 text-[#9BA8C0] group-hover:text-[#2F7FE8] transition-colors" />
              </Link>
              <Link href="/mentor/assignments" className="flex items-center justify-between p-3 rounded-xl border border-[#E6EBF8] hover:border-[#BDD0F8] hover:bg-[#F5F8FF] transition-colors group">
                <span className="text-[12px] font-bold text-[#1B3A6B]">Review Assignments</span>
                <IconArrowRight className="w-4 h-4 text-[#9BA8C0] group-hover:text-[#2F7FE8] transition-colors" />
              </Link>
              <Link href="/mentor/resources" className="flex items-center justify-between p-3 rounded-xl border border-[#E6EBF8] hover:border-[#BDD0F8] hover:bg-[#F5F8FF] transition-colors group">
                <span className="text-[12px] font-bold text-[#1B3A6B]">Publish Materials</span>
                <IconArrowRight className="w-4 h-4 text-[#9BA8C0] group-hover:text-[#2F7FE8] transition-colors" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
