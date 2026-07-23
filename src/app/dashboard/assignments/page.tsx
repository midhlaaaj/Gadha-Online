"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  IconClipboardList,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconStar,
} from "@tabler/icons-react";
import { getChildAssignments } from "@/app/actions";

type Assignment = Awaited<ReturnType<typeof getChildAssignments>>[number];
type Filter = "all" | "pending" | "completed";

// ─── Skeleton ──────────────────────────────────────────────────────
function AssignmentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full animate-shimmer" />
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#D0DCF5] p-5 space-y-3">
          <div className="flex gap-3 items-start">
            <div className="h-10 w-10 rounded-xl animate-shimmer shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-48 animate-shimmer rounded" />
              <div className="h-2.5 w-32 animate-shimmer rounded" />
            </div>
            <div className="h-6 w-20 animate-shimmer rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Status badge ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; icon: React.ElementType }
> = {
  Pending:   { bg: "bg-amber-50",  text: "text-amber-600",  icon: IconClock },
  Submitted: { bg: "bg-blue-50",   text: "text-[#2F7FE8]",  icon: IconCheck },
  Overdue:   { bg: "bg-red-50",    text: "text-red-500",    icon: IconAlertTriangle },
  Graded:    { bg: "bg-green-50",  text: "text-green-600",  icon: IconStar },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      <cfg.icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
}

// ─── Assignment card ────────────────────────────────────────────────
function AssignmentCard({ a }: { a: Assignment }) {
  return (
    <div className="bg-white rounded-2xl border border-[#D0DCF5] p-5 flex gap-4 items-start hover:shadow-sm transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        a.status === "Overdue" ? "bg-red-50" :
        a.status === "Graded"  ? "bg-green-50" :
        a.status === "Submitted" ? "bg-blue-50" :
        "bg-amber-50"
      }`}>
        {a.status === "Overdue"   ? <IconAlertTriangle className="w-5 h-5 text-red-500" /> :
         a.status === "Graded"    ? <IconStar className="w-5 h-5 text-green-500" /> :
         a.status === "Submitted" ? <IconCheck className="w-5 h-5 text-[#2F7FE8]" /> :
         <IconClock className="w-5 h-5 text-amber-500" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[#1B3A6B] truncate">{a.title}</p>
        <p className="text-[11px] text-[#4A5A7A] mt-0.5">
          {a.subject} · {a.mentor}
        </p>
        <p className={`text-[11px] mt-1 font-semibold ${
          a.status === "Overdue" ? "text-red-500" : "text-[#4A5A7A]"
        }`}>
          {a.dueMeta}
        </p>
        {a.feedback && (
          <p className="text-[11px] text-[#4A5A7A] mt-1.5 bg-[#F5F8FF] rounded-lg px-3 py-2 italic">
            &ldquo;{a.feedback}&rdquo;
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <StatusBadge status={a.status} />
        {a.score !== null && a.score !== undefined && (
          <span className="text-[12px] font-bold text-[#0F6E56] bg-green-50 px-2 py-0.5 rounded-full">
            {a.score}/100
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────
function EmptyAssignments({ filter }: { filter: Filter }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center bg-white rounded-2xl border border-dashed border-[#D0DCF5]">
      <IconClipboardList className="w-12 h-12 text-[#D0DCF5]" />
      <h2 className="text-[16px] font-extrabold font-heading text-[#1B3A6B]">
        {filter === "all" ? "No assignments yet" : `No ${filter} assignments`}
      </h2>
      <p className="text-[13px] text-[#4A5A7A] max-w-xs">
        {filter === "all"
          ? "Your mentor will assign homework here after sessions begin."
          : `No ${filter} assignments to show. Try switching to 'All'.`}
      </p>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────
export default function AssignmentsPage() {
  const searchParams = useSearchParams();
  const childId = searchParams.get("child");

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-driven-by-childId-param; bails out synchronously only when there's no child to load
    if (!childId) { setLoading(false); return; }
    setLoading(true);
    getChildAssignments(childId)
      .then(setAssignments)
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) return <AssignmentsSkeleton />;

  const filtered = assignments.filter((a) => {
    if (filter === "pending")   return a.status === "Pending" || a.status === "Overdue";
    if (filter === "completed") return a.status === "Submitted" || a.status === "Graded";
    return true;
  });

  const overdueCount = assignments.filter((a) => a.status === "Overdue").length;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">Assignments</h1>
        <p className="text-[13px] text-[#4A5A7A] mt-0.5">Track homework and graded work from your mentors.</p>
      </div>

      {/* Overdue banner */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <IconAlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-[13px] font-semibold text-red-700">
            {overdueCount} assignment{overdueCount !== 1 ? "s are" : " is"} overdue. Please submit as soon as possible.
          </p>
        </div>
      )}

      {/* Filters */}
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
            {key === "pending" && assignments.filter((a) => a.status === "Pending" || a.status === "Overdue").length > 0 && (
              <span className="ml-1.5 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {assignments.filter((a) => a.status === "Pending" || a.status === "Overdue").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Assignment list */}
      {filtered.length === 0 ? (
        <EmptyAssignments filter={filter} />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => <AssignmentCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}
