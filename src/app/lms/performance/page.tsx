"use client";

import { useEffect, useState } from "react";
import {
  IconChartBar, IconCalendarCheck, IconClipboardList, IconStar, IconTrophy,
} from "@tabler/icons-react";
import { getStudentPerformance } from "@/app/actions";

type Perf = Awaited<ReturnType<typeof getStudentPerformance>>;
type SubTab = "attendance" | "progress";

// ─── Skeleton ──────────────────────────────────────────────────────
function PerfSkeleton({ tab }: { tab: SubTab }) {
  if (tab === "attendance") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
        {/* Attendance Ring Card Skeleton */}
        <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 flex flex-col items-center gap-6">
          <div className="h-4 w-36 animate-shimmer rounded self-start" />
          <div className="relative w-32 h-32 rounded-full border-[12px] border-[#EBF2FF] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-12 animate-shimmer rounded bg-slate-200" />
              <div className="h-3 w-10 animate-shimmer rounded bg-slate-100" />
            </div>
          </div>
        </div>

        {/* By Subject Card Skeleton */}
        <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6">
          <div className="h-4 w-24 animate-shimmer rounded bg-slate-200 mb-6" />
          <div className="space-y-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3.5 w-24 animate-shimmer rounded bg-slate-200" />
                  <div className="h-3 w-8 animate-shimmer rounded bg-slate-150" />
                </div>
                <div className="h-2 w-full bg-[#EBF2FF] rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-slate-200 animate-shimmer rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Progress Tab Skeleton
  return (
    <div className="space-y-6 animate-pulse">
      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#D0DCF5] p-6 text-center flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 animate-shimmer" />
            <div className="h-3 w-16 animate-shimmer rounded bg-slate-150" />
            <div className="h-8 w-16 animate-shimmer rounded bg-slate-200" />
            <div className="h-3 w-28 animate-shimmer rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Recent Scores + Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recent Scores Card */}
        <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 space-y-4">
          <div className="h-4 w-28 animate-shimmer rounded bg-slate-200 mb-2" />
          <div className="space-y-0">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-[#F0F3FB] last:border-0">
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 w-40 animate-shimmer rounded bg-slate-200" />
                  <div className="h-2.5 w-24 animate-shimmer rounded bg-slate-100" />
                </div>
                <div className="h-5 w-10 animate-shimmer rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Mentor Feedback Card */}
        <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 space-y-4">
          <div className="h-4 w-32 animate-shimmer rounded bg-slate-200 mb-2" />
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-[#F5F8FF] rounded-xl p-4 border border-[#E6F1FB] space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-250 animate-shimmer shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-20 animate-shimmer rounded bg-slate-200" />
                    <div className="h-2.5 w-12 animate-shimmer rounded bg-slate-150" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full animate-shimmer rounded bg-slate-200" />
                  <div className="h-3 w-5/6 animate-shimmer rounded bg-slate-150" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Attendance ring ────────────────────────────────────────────────
function AttendanceRing({ pct }: { pct: number | null }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const filled = pct !== null ? (pct / 100) * circ : 0;
  return (
    <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 flex flex-col items-center gap-4">
      <h3 className="text-[13px] font-bold text-[#1B3A6B] self-start">Overall Attendance</h3>
      <div className="relative">
        <svg width="128" height="128" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#E6F1FB" strokeWidth="12" />
          {pct !== null && (
            <circle cx="64" cy="64" r={radius} fill="none" stroke="#2F7FE8" strokeWidth="12"
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
            <span className="text-[12px] text-[#4A5A7A] font-semibold text-center leading-tight px-2">No data yet</span>
          )}
        </div>
      </div>
    </div>
  );
}

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#2F7FE8", Physics: "#534AB7", English: "#0F6E56",
  Science: "#D97706", Chemistry: "#993556", Programming: "#085041",
};
function subjectColor(name: string) { return SUBJECT_COLORS[name] ?? "#2F7FE8"; }

// ─── Main page ──────────────────────────────────────────────────────
export default function StudentPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [perf, setPerf] = useState<Perf | null>(null);
  const [tab, setTab] = useState<SubTab>("attendance");

  useEffect(() => {
    getStudentPerformance()
      .then(setPerf)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const TABS = [
    { key: "attendance" as const, label: "Attendance" },
    { key: "progress"   as const, label: "Progress" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">Performance</h1>
        <p className="text-[13px] text-[#4A5A7A] mt-0.5">Track your attendance, scores and mentor feedback.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
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

      {loading ? (
        <PerfSkeleton tab={tab} />
      ) : (
        <>
          {/* ── ATTENDANCE TAB ── */}
          {tab === "attendance" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <AttendanceRing pct={perf?.attendanceRate ?? null} />

              {/* Subject bars */}
              <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6">
                <h3 className="text-[13px] font-bold text-[#1B3A6B] mb-4">By Subject</h3>
                {!perf?.subjectAttendance?.length ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                    <IconCalendarCheck className="w-9 h-9 text-[#D0DCF5]" />
                    <p className="text-[12px] font-semibold text-[#4A5A7A]">No attendance data yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {perf?.subjectAttendance?.map((s) => (
                      <div key={s.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-semibold text-[#1B3A6B]">{s.name}</span>
                          <span className="text-[11px] text-[#4A5A7A]">{s.pct}%</span>
                        </div>
                        <div className="h-2 w-full bg-[#EBF2FF] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${s.pct}%`, backgroundColor: subjectColor(s.name) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PROGRESS TAB ── */}
          {tab === "progress" && (
            <div className="space-y-5">
              {/* Summary stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Average score card */}
                <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#E6F1FB] flex items-center justify-center mx-auto mb-3">
                    <IconChartBar className="w-5 h-5 text-[#2F7FE8]" />
                  </div>
                  <p className="text-[10px] font-bold text-[#4A5A7A] uppercase tracking-widest mb-2">Avg Score</p>
                  <p className="text-[32px] font-extrabold font-heading text-[#1B3A6B]">
                    {perf?.avgScore !== null && perf?.avgScore !== undefined ? `${perf?.avgScore}%` : "—"}
                  </p>
                  <p className="text-[11px] text-[#4A5A7A]">across all subjects</p>
                </div>

                {/* Assignments submitted card */}
                <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 text-center">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                    <IconClipboardList className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-[10px] font-bold text-[#4A5A7A] uppercase tracking-widest mb-2">Submitted</p>
                  <p className="text-[32px] font-extrabold font-heading text-[#1B3A6B]">{perf?.submittedCount ?? 0}</p>
                  <p className="text-[11px] text-[#4A5A7A]">of {perf?.totalAssignments ?? 0} assignments</p>
                </div>

                {/* Best subject card */}
                <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 text-center">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-3">
                    <IconTrophy className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-[10px] font-bold text-[#4A5A7A] uppercase tracking-widest mb-2">Best Subject</p>
                  <p className="text-[18px] font-extrabold font-heading text-[#1B3A6B] mt-2">
                    {perf?.bestSubject ?? "—"}
                  </p>
                  <p className="text-[11px] text-[#4A5A7A]">
                    {perf?.bestSubjectAvg ? `avg ${perf.bestSubjectAvg}%` : "No data yet"}
                  </p>
                </div>
              </div>

              {/* Recent scores + Mentor feedback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Recent scores */}
                <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6">
                  <h3 className="text-[13px] font-bold text-[#1B3A6B] mb-4">Recent scores</h3>
                  {!perf?.recentScores?.length ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                      <IconStar className="w-9 h-9 text-[#D0DCF5]" />
                      <p className="text-[12px] font-semibold text-[#4A5A7A]">No graded assignments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {perf?.recentScores?.map((s) => (
                        <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-[#F0F3FB] last:border-0">
                          <div>
                            <p className="text-[12px] font-semibold text-[#1B3A6B]">{s.title}</p>
                            <p className="text-[10px] text-[#4A5A7A] mt-0.5">{s.subject} · {s.date}</p>
                          </div>
                          <span className={`text-[16px] font-extrabold font-heading ${
                            s.score >= 80 ? "text-green-600" : s.score >= 60 ? "text-amber-500" : "text-red-500"
                          }`}>
                            {s.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mentor feedback */}
                <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6">
                  <h3 className="text-[13px] font-bold text-[#1B3A6B] mb-4">Mentor feedback</h3>
                  {!perf?.mentorFeedback?.length ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                      <IconChartBar className="w-9 h-9 text-[#D0DCF5]" />
                      <p className="text-[12px] font-semibold text-[#4A5A7A]">No feedback yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {perf?.mentorFeedback?.map((f, i) => (
                        <div key={i} className="bg-[#F5F8FF] rounded-xl p-4 border border-[#E6F1FB]">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-7 h-7 rounded-full bg-[#2F7FE8] flex items-center justify-center font-heading text-white text-[10px] font-bold shrink-0"
                            >
                              {f.initials}
                            </div>
                            <div>
                              <p className="text-[12px] font-bold text-[#1B3A6B]">{f.mentor}</p>
                              <p className="text-[10px] text-[#4A5A7A]">{f.date}</p>
                            </div>
                          </div>
                          <p className="text-[12px] text-[#4A5A7A] leading-relaxed">{f.feedback}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
