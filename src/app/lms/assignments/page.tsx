"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconClipboardList, IconAlertTriangle, IconCheck,
  IconClock, IconStar, IconX, IconUpload, IconCircleCheck,
} from "@tabler/icons-react";
import { getStudentAssignments } from "@/app/actions";

type Assignment = Awaited<ReturnType<typeof getStudentAssignments>>[number];
type Filter = "all" | "pending" | "submitted" | "graded" | "overdue";

// ─── Skeleton ──────────────────────────────────────────────────────
function AssignmentsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#D0DCF5] p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-48 animate-shimmer rounded" />
            <div className="h-2.5 w-32 animate-shimmer rounded" />
          </div>
          <div className="h-6 w-20 animate-shimmer rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Status config ──────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
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
function AssignmentCard({ a, onClick }: { a: Assignment; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#D0DCF5] hover:shadow-sm hover:border-[#B5D4F4] transition-all text-left cursor-pointer"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
        a.status === "Overdue" ? "bg-red-50" :
        a.status === "Graded"  ? "bg-green-50" :
        a.status === "Submitted" ? "bg-blue-50" : "bg-amber-50"
      }`}>
        {a.status === "Overdue"   ? <IconAlertTriangle className="w-5 h-5 text-red-500" /> :
         a.status === "Graded"    ? <IconStar className="w-5 h-5 text-green-500" /> :
         a.status === "Submitted" ? <IconCheck className="w-5 h-5 text-[#2F7FE8]" /> :
         <IconClock className="w-5 h-5 text-amber-500" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[#1B3A6B] truncate">{a.title}</p>
        <p className="text-[11px] text-[#4A5A7A] mt-0.5">{a.subject} · {a.mentor}</p>
        <p className={`text-[11px] mt-1 font-semibold ${a.status === "Overdue" ? "text-red-500" : "text-[#4A5A7A]"}`}>
          {a.dueMeta}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <StatusBadge status={a.status} />
        {a.score !== null && a.score !== undefined && (
          <span className="text-[12px] font-bold text-[#0F6E56] bg-green-50 px-2 py-0.5 rounded-full">
            {a.score}/100
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Assignment Drawer ──────────────────────────────────────────────
function AssignmentDrawer({
  assignment,
  onClose,
}: {
  assignment: Assignment | null;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isOpen = !!assignment;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate reset-on-reopen; drawer stays mounted, form state is cleared whenever the target assignment changes
    setFile(null);
    setSubmitted(false);
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isOpen is derived directly from assignment, which is already tracked
  }, [assignment]);

  const handleSubmit = () => {
    setSubmitted(true);
    onClose();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const canSubmit = assignment?.status === "Pending" || assignment?.status === "Overdue";

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#1B3A6B]/40 z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[480px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {assignment && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#D0DCF5] shrink-0">
              <div>
                <h2 className="text-[15px] font-bold text-[#1B3A6B] font-heading leading-tight">{assignment.title}</h2>
                <p className="text-[11px] text-[#4A5A7A] mt-0.5">{assignment.subject} · {assignment.mentor}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border border-[#D0DCF5] flex items-center justify-center text-[#4A5A7A] hover:border-[#1B3A6B] transition-colors cursor-pointer"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 premium-scrollbar">
              {/* Status + due */}
              <div className="flex items-center gap-3">
                <StatusBadge status={assignment.status} />
                <span className={`text-[12px] font-semibold ${assignment.status === "Overdue" ? "text-red-500" : "text-[#4A5A7A]"}`}>
                  {assignment.dueMeta}
                </span>
              </div>

              {/* Grade & feedback */}
              {assignment.status === "Graded" && (
                <div className="bg-[#F5F8FF] border border-[#D0DCF5] rounded-xl p-4">
                  <p className="text-[10px] font-bold text-[#4A5A7A] uppercase tracking-widest mb-2">Grade & Feedback</p>
                  <p className="text-[28px] font-extrabold font-heading text-[#1B3A6B] mb-2">
                    {assignment.score}/100
                  </p>
                  {assignment.feedback && (
                    <p className="text-[12px] text-[#4A5A7A] leading-relaxed">{assignment.feedback}</p>
                  )}
                </div>
              )}

              {/* Submitted state */}
              {assignment.status === "Submitted" && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <IconCheck className="w-5 h-5 text-[#2F7FE8] shrink-0" />
                  <div>
                    <p className="text-[13px] font-bold text-[#1B3A6B]">Submitted successfully</p>
                    <p className="text-[11px] text-[#4A5A7A]">Awaiting mentor review and grading.</p>
                  </div>
                </div>
              )}

              {/* Upload zone for pending/overdue */}
              {canSubmit && !submitted && (
                <div>
                  <p className="text-[10px] font-bold text-[#4A5A7A] uppercase tracking-widest mb-3">Your Submission</p>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#D0DCF5] rounded-xl p-8 text-center hover:border-[#2F7FE8] hover:bg-[#F0F6FF] transition-all cursor-pointer"
                  >
                    <IconUpload className="w-7 h-7 text-[#4A5A7A] mx-auto mb-2" />
                    <p className="text-[13px] font-semibold text-[#1B3A6B] mb-1">Drop your file here or click to upload</p>
                    <p className="text-[11px] text-[#4A5A7A]">PDF, DOC, DOCX, JPG · max 10 MB</p>
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </button>
                  {file && (
                    <div className="flex items-center gap-3 mt-3 p-3 bg-[#F5F8FF] border border-[#D0DCF5] rounded-xl">
                      <IconCircleCheck className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="text-[12px] font-semibold text-[#1B3A6B] truncate flex-1">{file.name}</span>
                      <span className="text-[10px] text-[#4A5A7A]">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {canSubmit && !submitted && (
              <div className="px-6 py-4 border-t border-[#D0DCF5] shrink-0">
                <button
                  onClick={handleSubmit}
                  disabled={!file}
                  className="w-full py-3 rounded-xl bg-[#1B3A6B] text-white text-[13px] font-bold hover:bg-[#2F7FE8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Submit assignment
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-[#1B3A6B] text-white px-5 py-3.5 rounded-2xl shadow-2xl animate-fade-in-up text-[13px] font-semibold">
          <IconCircleCheck className="w-5 h-5 text-green-400" />
          Assignment submitted successfully!
        </div>
      )}
    </>
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
export default function StudentAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Assignment | null>(null);

  useEffect(() => {
    getStudentAssignments()
      .then(setAssignments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);



  const filtered = assignments.filter((a) => {
    if (filter === "pending")   return a.status === "Pending";
    if (filter === "overdue")   return a.status === "Overdue";
    if (filter === "submitted") return a.status === "Submitted";
    if (filter === "graded")    return a.status === "Graded";
    return true;
  });

  const overdueCount = assignments.filter((a) => a.status === "Overdue").length;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "pending",   label: "Pending" },
    { key: "overdue",   label: "Overdue" },
    { key: "submitted", label: "Submitted" },
    { key: "graded",    label: "Graded" },
  ];

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">Assignments</h1>
          <p className="text-[13px] text-[#4A5A7A] mt-0.5">Submit work and view mentor feedback.</p>
        </div>

        {overdueCount > 0 && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
            <IconAlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-[13px] font-semibold text-red-700">
              {overdueCount} assignment{overdueCount !== 1 ? "s are" : " is"} overdue. Please submit as soon as possible.
            </p>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
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
              {key === "overdue" && overdueCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {overdueCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <AssignmentsSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyAssignments filter={filter} />
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => (
              <AssignmentCard key={a.id} a={a} onClick={() => setSelected(a)} />
            ))}
          </div>
        )}
      </div>

      {/* Slide-in drawer */}
      <AssignmentDrawer assignment={selected} onClose={() => setSelected(null)} />
    </>
  );
}
