"use client";

import { useEffect, useState } from "react";
import {
  IconVideo, IconClock, IconCheck, IconX,
  IconCalendar, IconPlus, IconExternalLink, IconDotsVertical,
  IconTrash, IconEdit, IconLoader
} from "@tabler/icons-react";
import {
  getMentorClasses,
  getMentorStudents,
  createScheduledClass,
  updateScheduledClass,
  cancelScheduledClass
} from "@/app/actions";

type MentorClass = Awaited<ReturnType<typeof getMentorClasses>>[number];
type StudentInfo = Awaited<ReturnType<typeof getMentorStudents>>[number];

function ClassesSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#D0DCF5] p-5 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-44 rounded bg-slate-100" />
              <div className="h-2.5 w-32 rounded bg-slate-100" />
            </div>
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "scheduled") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F1FB] text-[#2F7FE8]">
      <IconClock className="w-3 h-3" /> Scheduled
    </span>
  );
  if (status === "completed") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600">
      <IconCheck className="w-3 h-3" /> Completed
    </span>
  );
  if (status === "cancelled") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500">
      <IconX className="w-3 h-3" /> Cancelled
    </span>
  );
  return null;
}

export default function MentorClassesPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<MentorClass[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<MentorClass | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    studentIndex: "",
    title: "",
    subject: "",
    scheduledAt: "",
    durationMinutes: 60,
    joinUrl: "",
  });

  const loadData = async () => {
    try {
      const [c, s] = await Promise.all([
        getMentorClasses(),
        getMentorStudents(),
      ]);
      setClasses(c || []);
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

  const openAddModal = () => {
    setEditingClass(null);
    setFormData({
      studentIndex: "",
      title: "",
      subject: "",
      scheduledAt: "",
      durationMinutes: 60,
      joinUrl: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: MentorClass) => {
    setEditingClass(c);
    const studIdx = students.findIndex((s) => s.id === c.student_id);
    
    // Format timestamp for datetime-local input (YYYY-MM-DDTHH:MM)
    const d = new Date(c.scheduled_at);
    const offset = d.getTimezoneOffset() * 60000;
    const localTime = new Date(d.getTime() - offset).toISOString().slice(0, 16);

    setFormData({
      studentIndex: studIdx >= 0 ? studIdx.toString() : "",
      title: c.title,
      subject: c.subject,
      scheduledAt: localTime,
      durationMinutes: c.duration_minutes,
      joinUrl: c.join_url || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingClass) {
        await updateScheduledClass(editingClass.id, {
          title: formData.title,
          subject: formData.subject,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          durationMinutes: Number(formData.durationMinutes),
          joinUrl: formData.joinUrl,
        });
      } else {
        const student = students[Number(formData.studentIndex)];
        if (!student) return;
        await createScheduledClass({
          bookingId: student.bookingId,
          studentId: student.id,
          title: formData.title,
          subject: formData.subject,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          durationMinutes: Number(formData.durationMinutes),
          joinUrl: formData.joinUrl,
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to schedule class");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClass = async (classId: string) => {
    if (!confirm("Are you sure you want to cancel this class?")) return;
    try {
      await cancelScheduledClass(classId);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to cancel class");
    }
  };

  const filteredClasses = classes.filter((c) => {
    const isUpcoming = c.status === "scheduled" && new Date(c.scheduled_at) >= new Date();
    if (tab === "upcoming") return isUpcoming;
    return !isUpcoming;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">Classes & Calendar</h1>
          <p className="text-[13px] text-[#4A5A7A] mt-0.5">Plan, schedule, and launch live sessions with your students.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] hover:shadow-md transition-all cursor-pointer focus:outline-none"
        >
          <IconPlus className="w-4 h-4" /> Schedule Class
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E6EBF8] gap-6">
        <button
          onClick={() => setTab("upcoming")}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer focus:outline-none ${tab === "upcoming" ? "text-[#2F7FE8]" : "text-[#9BA8C0] hover:text-[#1B3A6B]"}`}
        >
          Upcoming Classes
          {tab === "upcoming" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2F7FE8]" />}
        </button>
        <button
          onClick={() => setTab("history")}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer focus:outline-none ${tab === "history" ? "text-[#2F7FE8]" : "text-[#9BA8C0] hover:text-[#1B3A6B]"}`}
        >
          Past / Completed
          {tab === "history" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2F7FE8]" />}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <ClassesSkeleton />
      ) : filteredClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-2xl border border-dashed border-[#D0DCF5]">
          <IconCalendar className="w-10 h-10 text-[#D0DCF5]" />
          <h2 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">No Classes Found</h2>
          <p className="text-[13px] text-[#4A5A7A] max-w-xs">
            {tab === "upcoming" ? "You don't have any classes scheduled yet." : "No past classes registered."}
          </p>
          {tab === "upcoming" && (
            <button
              onClick={openAddModal}
              className="mt-2 text-[11px] font-bold text-[#2F7FE8] hover:underline"
            >
              Schedule one now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClasses.map((c) => {
            const dateStr = new Date(c.scheduled_at).toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            const timeStr = new Date(c.scheduled_at).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            }) + ` (${c.duration_minutes} min)`;

            return (
              <div key={c.id} className="bg-white rounded-2xl border border-[#D0DCF5] p-5 hover:shadow-sm transition-shadow flex flex-col justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E6F1FB] flex items-center justify-center shrink-0">
                    <IconVideo className="w-5 h-5 text-[#2F7FE8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-bold text-[#1B3A6B] truncate">{c.title}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-[11px] text-[#4A5A7A] mt-1 font-semibold">
                      Student: {c.studentName}
                    </p>
                    <p className="text-[11px] text-[#9BA8C0] mt-0.5">
                      {c.subject} · {dateStr} · {timeStr}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#F0F3FB] pt-3">
                  {c.join_url ? (
                    <a
                      href={c.join_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#1B3A6B] text-white hover:bg-[#2F7FE8] transition-colors"
                    >
                      Launch Session <IconExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-[#9BA8C0]">No meeting link added</span>
                  )}

                  {c.status === "scheduled" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(c)}
                        title="Reschedule"
                        className="w-8 h-8 rounded-lg border border-[#D0DCF5] flex items-center justify-center text-[#4A5A7A] hover:border-[#2F7FE8] hover:text-[#2F7FE8] cursor-pointer"
                      >
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCancelClass(c.id)}
                        title="Cancel Class"
                        className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-50 cursor-pointer"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f2347]/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#D0DCF5] shadow-2xl p-6 w-full max-w-md mx-4 animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">
                {editingClass ? "Reschedule Class" : "Schedule New Class"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 cursor-pointer"
              >
                <IconX className="w-4 h-4 text-[#9BA8C0]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student Dropdown (Only for new classes) */}
              {!editingClass && (
                <div>
                  <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">
                    Select Student
                  </label>
                  <select
                    required
                    value={formData.studentIndex}
                    onChange={(e) => setFormData({ ...formData, studentIndex: e.target.value })}
                    className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] bg-white text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold"
                  >
                    <option value="" disabled>Choose a student...</option>
                    {students.map((s, idx) => (
                      <option key={s.id} value={idx}>
                        {s.name} ({s.subject} · {s.grade})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">
                  Class Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calculus Basics Review"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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

              {/* Date / Time */}
              <div>
                <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">
                  Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold"
                />
              </div>

              {/* Duration & Meeting Link */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">
                    Duration
                  </label>
                  <select
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] bg-white text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold"
                  >
                    <option value={30}>30m</option>
                    <option value={45}>45m</option>
                    <option value={60}>60m</option>
                    <option value={90}>90m</option>
                    <option value={120}>120m</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">
                    Meeting URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={formData.joinUrl}
                    onChange={(e) => setFormData({ ...formData, joinUrl: e.target.value })}
                    className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-[#F0F3FB] pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 text-xs font-bold py-2.5 rounded-xl border border-[#D0DCF5] text-[#4A5A7A] hover:bg-slate-50 cursor-pointer focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 text-xs font-bold py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] hover:shadow-md transition-all cursor-pointer focus:outline-none flex items-center justify-center gap-1.5"
                >
                  {submitting && <IconLoader className="w-3.5 h-3.5 animate-spin" />}
                  {editingClass ? "Reschedule" : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
