"use client";

import { useEffect, useState } from "react";
import {
  IconClipboardList, IconClock, IconStar, IconX,
  IconCheck, IconAlertTriangle, IconPlus, IconLoader
} from "@tabler/icons-react";
import {
  getMentorAssignments,
  getMentorStudents,
  createAssignment,
  reviewAssignmentSubmission
} from "@/app/actions";

type Assignment = Awaited<ReturnType<typeof getMentorAssignments>>[number];
type StudentInfo = Awaited<ReturnType<typeof getMentorStudents>>[number];
type TabFilter = "all" | "submitted" | "pending" | "reviewed";

function AssignmentsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#D0DCF5] p-5 flex items-center gap-4 animate-pulse">
          <div className="h-10 w-10 rounded-xl bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-48 bg-slate-100 rounded" />
            <div className="h-2.5 w-32 bg-slate-100 rounded" />
          </div>
          <div className="h-6 w-20 bg-slate-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  pending:  { bg: "bg-amber-50",  text: "text-amber-600",  icon: IconClock },
  submitted: { bg: "bg-blue-50",   text: "text-[#2F7FE8]",  icon: IconCheck },
  reviewed:  { bg: "bg-green-50",  text: "text-green-600",  icon: IconStar },
  overdue:   { bg: "bg-red-50",    text: "text-red-500",    icon: IconAlertTriangle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${cfg.bg} ${cfg.text}`}>
      <cfg.icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
}

export default function MentorAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [filter, setFilter] = useState<TabFilter>("all");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    studentIndex: "",
    title: "",
    subject: "",
    dueDate: "",
    description: "",
  });

  // Review Drawer State
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    score: "",
    feedback: "",
  });

  const loadData = async () => {
    try {
      const [a, s] = await Promise.all([
        getMentorAssignments(),
        getMentorStudents(),
      ]);
      setAssignments(a || []);
      setStudents(s || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      const student = students[Number(createForm.studentIndex)];
      if (!student) return;
      await createAssignment({
        studentId: student.id,
        bookingId: student.bookingId,
        title: createForm.title,
        subject: createForm.subject,
        dueDate: createForm.dueDate,
        description: createForm.description,
      });
      setIsCreateOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to create assignment");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleReviewSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setReviewSubmitting(true);
    try {
      await reviewAssignmentSubmission(
        selectedAssignment.id,
        Number(reviewForm.score),
        reviewForm.feedback
      );
      setSelectedAssignment(null);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const openReviewDrawer = (a: Assignment) => {
    setSelectedAssignment(a);
    setReviewForm({
      score: a.score !== null && a.score !== undefined ? a.score.toString() : "",
      feedback: a.feedback || "",
    });
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">Assignments</h1>
          <p className="text-[13px] text-[#4A5A7A] mt-0.5">Publish assignments, track student work, and grade submissions.</p>
        </div>
        <button
          onClick={() => {
            setCreateForm({
              studentIndex: "",
              title: "",
              subject: "",
              dueDate: "",
              description: "",
            });
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] hover:shadow-md transition-all cursor-pointer focus:outline-none"
        >
          <IconPlus className="w-4 h-4" /> Create Assignment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E6EBF8] gap-6">
        {[
          { id: "all", label: "All Assignments" },
          { id: "submitted", label: "Pending Review" },
          { id: "pending", label: "Awaiting Student" },
          { id: "reviewed", label: "Reviewed / Graded" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as TabFilter)}
            className={`pb-3 text-xs font-bold transition-all relative cursor-pointer focus:outline-none ${filter === t.id ? "text-[#2F7FE8]" : "text-[#9BA8C0] hover:text-[#1B3A6B]"}`}
          >
            {t.label}
            {filter === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2F7FE8]" />}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <AssignmentsSkeleton />
      ) : filteredAssignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-2xl border border-dashed border-[#D0DCF5]">
          <IconClipboardList className="w-10 h-10 text-[#D0DCF5]" />
          <h2 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">No Assignments</h2>
          <p className="text-[13px] text-[#4A5A7A] max-w-xs">
            No assignments match the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((a) => {
            const isSubmitted = a.status === "submitted";
            const isGraded = a.status === "reviewed";
            const dueStr = a.due_date ? new Date(a.due_date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            }) : "No due date";

            return (
              <button
                key={a.id}
                onClick={() => openReviewDrawer(a)}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-[#D0DCF5] hover:shadow-sm hover:border-[#BDD0F8] transition-all text-left cursor-pointer focus:outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isGraded ? "bg-green-50 text-green-500" :
                    isSubmitted ? "bg-blue-50 text-[#2F7FE8]" : "bg-amber-50 text-amber-500"
                  }`}>
                    <IconClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1B3A6B]">{a.title}</p>
                    <p className="text-[11px] text-[#4A5A7A] mt-0.5">
                      Student: {a.studentName} · Subject: {a.subject}
                    </p>
                    <p className="text-[10px] text-[#9BA8C0] mt-0.5">
                      Due Date: {dueStr}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={a.status} />
                  {a.score !== null && a.score !== undefined && (
                    <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      {a.score}/100
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-[#0f2347]/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#D0DCF5] shadow-2xl p-6 w-full max-w-md mx-4 animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">Create Assignment</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 cursor-pointer"
              >
                <IconX className="w-4 h-4 text-[#9BA8C0]" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              {/* Student */}
              <div>
                <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">
                  Target Student
                </label>
                <select
                  required
                  value={createForm.studentIndex}
                  onChange={(e) => setCreateForm({ ...createForm, studentIndex: e.target.value })}
                  className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] bg-white text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold"
                >
                  <option value="" disabled>Select student...</option>
                  {students.map((s, idx) => (
                    <option key={s.id} value={idx}>
                      {s.name} ({s.subject})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Limits and Continuity Practice Sheet"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <select
                  required
                  value={createForm.subject}
                  onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                  className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] bg-white text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold"
                >
                  <option value="" disabled>Select subject...</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="English">English</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                  className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">
                  Instructions / Description
                </label>
                <textarea
                  placeholder="Draft clear instructions or link supporting sheets..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="border-t border-[#F0F3FB] pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 text-xs font-bold py-2.5 rounded-xl border border-[#D0DCF5] text-[#4A5A7A] hover:bg-slate-50 cursor-pointer focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="flex-1 text-xs font-bold py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] hover:shadow-md transition-all cursor-pointer focus:outline-none flex items-center justify-center gap-1.5"
                >
                  {createSubmitting && <IconLoader className="w-3.5 h-3.5 animate-spin" />}
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW DRAWER */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-40 flex justify-end animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#0f2347]/30 backdrop-blur-xs"
            onClick={() => setSelectedAssignment(null)}
          />

          {/* Drawer content */}
          <div className="relative w-full max-w-md bg-white border-l border-[#D0DCF5] h-full shadow-2xl flex flex-col justify-between z-50">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#D0DCF5] bg-[#F5F8FF]">
              <div>
                <h3 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">Review Submission</h3>
                <p className="text-[11px] text-[#4A5A7A] mt-0.5">
                  Student: {selectedAssignment.studentName} · {selectedAssignment.subject}
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 cursor-pointer"
              >
                <IconX className="w-4 h-4 text-[#9BA8C0]" />
              </button>
            </div>

            {/* Scrollable details & form */}
            <form onSubmit={handleReviewSubmission} className="flex-1 overflow-y-auto p-6 space-y-5 premium-scrollbar">
              {/* Instructions */}
              <div>
                <span className="text-[9px] font-bold text-[#9BA8C0] uppercase tracking-wider">Assignment Details</span>
                <h4 className="text-[14px] font-bold text-[#1B3A6B] mt-1">{selectedAssignment.title}</h4>
                {selectedAssignment.feedback && (
                  <p className="text-[12px] text-[#4A5A7A] mt-1 bg-slate-50 p-3 rounded-xl border border-[#D0DCF5]">
                    {selectedAssignment.feedback}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <span className="text-[9px] font-bold text-[#9BA8C0] uppercase tracking-wider block mb-1">Status</span>
                <StatusBadge status={selectedAssignment.status} />
              </div>

              {/* Score input */}
              <div>
                <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">
                  Grade Score (Out of 100)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  placeholder="e.g. 85"
                  value={reviewForm.score}
                  onChange={(e) => setReviewForm({ ...reviewForm, score: e.target.value })}
                  className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold"
                />
              </div>

              {/* Feedback input */}
              <div>
                <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">
                  Review Feedback / Comments
                </label>
                <textarea
                  placeholder="Provide guidance, point out mistakes, or share encouragement..."
                  required
                  value={reviewForm.feedback}
                  onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                  rows={4}
                  className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="border-t border-[#F0F3FB] pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="flex-1 text-xs font-bold py-2.5 rounded-xl border border-[#D0DCF5] text-[#4A5A7A] hover:bg-slate-50 cursor-pointer focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="flex-1 text-xs font-bold py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] hover:shadow-md transition-all cursor-pointer focus:outline-none flex items-center justify-center gap-1.5"
                >
                  {reviewSubmitting && <IconLoader className="w-3.5 h-3.5 animate-spin" />}
                  Submit Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
