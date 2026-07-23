"use client";

import { useEffect, useState, useCallback } from "react";
import {
  IconVideo, IconClock, IconCheck, IconX,
  IconCalendar, IconPlus, IconExternalLink,
  IconTrash, IconEdit, IconLoader, IconUsers,
  IconLink, IconCheckbox,
} from "@tabler/icons-react";
import {
  getMentorClasses,
  getMentorStudents,
  createScheduledClass,
  updateScheduledClass,
  cancelScheduledClass,
  getClassAttendance,
  markAttendance,
  markClassCompleted,
  updateCourseJoinUrl,
  updateSessionJoinUrl,
} from "@/app/actions";

type MentorClass = Awaited<ReturnType<typeof getMentorClasses>>[number] & {
  bookingCourseId?: string;
  bookingSessionId?: string;
};
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

type ClassAttendanceResult = Awaited<ReturnType<typeof getClassAttendance>>;

function AttendanceModal({ classId, onClose, onSaved }: { classId: string; onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classInfo, setClassInfo] = useState<ClassAttendanceResult["class"]>(null);
  const [students, setStudents] = useState<ClassAttendanceResult["students"]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  useEffect(() => {
    getClassAttendance(classId).then((res) => {
      setClassInfo(res.class);
      setStudents(res.students);
      const pre: Record<string, string> = {};
      const att = (res.attendance || {}) as Record<string, string>;
      res.students.forEach((s) => { pre[s.id] = att[s.id] || "present"; });
      setAttendance(pre);
    }).finally(() => setLoading(false));
  }, [classId]);

  const toggle = (studentId: string) => {
    setAttendance((prev) => ({ ...prev, [studentId]: prev[studentId] === "present" ? "absent" : "present" }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({ studentId, status: status as "present" | "absent" | "excused" }));
      await markAttendance(classId, records);
      onSaved();
      onClose();
    } catch { alert("Failed to save attendance"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-[#0f2347]/30 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl border border-[#D0DCF5] shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F3FB]">
          <div>
            <h3 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">Mark Attendance</h3>
            {classInfo && <p className="text-[11px] text-[#4A5A7A] mt-0.5">{classInfo.title} · {new Date(classInfo.scheduled_at).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 cursor-pointer"><IconX className="w-4 h-4 text-[#9BA8C0]" /></button>
        </div>
        <div className="max-h-72 overflow-y-auto premium-scrollbar px-6 py-4 space-y-1">
          {loading ? [...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 animate-pulse">
              <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100" /><div className="h-3 w-32 rounded bg-slate-100" /></div>
              <div className="h-7 w-20 rounded-lg bg-slate-100" />
            </div>
          )) : students.length === 0 ? (
            <p className="text-[12px] text-[#9BA8C0] text-center py-6">No students found</p>
          ) : students.map((s) => {
            const isPresent = attendance[s.id] === "present";
            const initials = (s.full_name || "?").split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();
            return (
              <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-[#F0F3FB] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1B3A6B] text-white text-[11px] font-bold flex items-center justify-center shrink-0">{initials}</div>
                  <p className="text-[12px] font-semibold text-[#1B3A6B]">{s.full_name}</p>
                </div>
                <button onClick={() => toggle(s.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${isPresent ? "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100" : "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"}`}>
                  {isPresent ? <><IconCheck className="w-3 h-3" /> Present</> : <><IconX className="w-3 h-3" /> Absent</>}
                </button>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-[#F0F3FB] flex gap-3">
          <button onClick={onClose} className="flex-1 text-xs font-bold py-2.5 rounded-xl border border-[#D0DCF5] text-[#4A5A7A] hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={saving || loading} className="flex-1 text-xs font-bold py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60">
            {saving && <IconLoader className="w-3.5 h-3.5 animate-spin" />} Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
}

function LinkModal({ cls, onClose, onSaved }: { cls: MentorClass; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState(cls.join_url || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (cls.bookingCourseId) {
        await updateCourseJoinUrl(cls.bookingCourseId, value);
      } else if (cls.bookingSessionId) {
        await updateSessionJoinUrl(cls.bookingSessionId, value);
      } else {
        await updateScheduledClass(cls.id, { joinUrl: value });
      }
      onSaved();
      onClose();
    } catch { alert("Failed to save meeting link"); }
    finally { setSaving(false); }
  };

  const scope = cls.bookingCourseId ? "Course (applies to all sessions)" : cls.bookingSessionId ? "Session (applies to all students)" : "This class only";

  return (
    <div className="fixed inset-0 bg-[#0f2347]/30 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl border border-[#D0DCF5] shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">Meeting Link</h3>
            <p className="text-[10px] text-[#9BA8C0] mt-0.5">Scope: {scope}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 cursor-pointer"><IconX className="w-4 h-4 text-[#9BA8C0]" /></button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">Zoom / Google Meet URL</label>
            <input type="url" placeholder="https://meet.google.com/..." value={value} onChange={(e) => setValue(e.target.value)} className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold" />
          </div>
          <div className="border-t border-[#F0F3FB] pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 text-xs font-bold py-2.5 rounded-xl border border-[#D0DCF5] text-[#4A5A7A] hover:bg-slate-50 cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 text-xs font-bold py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60">
              {saving && <IconLoader className="w-3.5 h-3.5 animate-spin" />} Save Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MentorClassesPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<MentorClass[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<MentorClass | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ studentIndex: "", title: "", subject: "", scheduledAt: "", durationMinutes: 60, joinUrl: "" });
  const [linkModalClass, setLinkModalClass] = useState<MentorClass | null>(null);
  const [attendanceClassId, setAttendanceClassId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([getMentorClasses(), getMentorStudents()]);
      setClasses(c || []);
      setStudents(s || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-on-mount; setState fires after the awaited request resolves, not synchronously
    loadData();
  }, [loadData]);

  const openAddModal = () => {
    setEditingClass(null);
    setFormData({ studentIndex: "", title: "", subject: "", scheduledAt: "", durationMinutes: 60, joinUrl: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (c: MentorClass) => {
    setEditingClass(c);
    const studIdx = students.findIndex((s) => s.id === c.student_id);
    const d = new Date(c.scheduled_at);
    const localTime = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setFormData({ studentIndex: studIdx >= 0 ? studIdx.toString() : "", title: c.title, subject: c.subject, scheduledAt: localTime, durationMinutes: c.duration_minutes, joinUrl: c.join_url || "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingClass) {
        await updateScheduledClass(editingClass.id, { title: formData.title, subject: formData.subject, scheduledAt: new Date(formData.scheduledAt).toISOString(), durationMinutes: Number(formData.durationMinutes), joinUrl: formData.joinUrl });
      } else {
        const student = students[Number(formData.studentIndex)];
        if (!student) return;
        await createScheduledClass({ bookingId: student.bookingId, studentId: student.id, title: formData.title, subject: formData.subject, scheduledAt: new Date(formData.scheduledAt).toISOString(), durationMinutes: Number(formData.durationMinutes), joinUrl: formData.joinUrl });
      }
      setIsModalOpen(false);
      loadData();
    } catch { alert("Failed to schedule class"); }
    finally { setSubmitting(false); }
  };

  const handleCancelClass = async (classId: string) => {
    if (!confirm("Are you sure you want to cancel this class?")) return;
    try { await cancelScheduledClass(classId); loadData(); }
    catch { alert("Failed to cancel class"); }
  };

  const handleMarkCompleted = async (classId: string) => {
    if (!confirm("Mark this class as completed?")) return;
    setCompletingId(classId);
    try { await markClassCompleted(classId); loadData(); }
    catch { alert("Failed to mark as completed"); }
    finally { setCompletingId(null); }
  };

  const filteredClasses = classes.filter((c) => {
    const isUpcoming = c.status === "scheduled" && new Date(c.scheduled_at) >= new Date();
    return tab === "upcoming" ? isUpcoming : !isUpcoming;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">Classes & Calendar</h1>
          <p className="text-[13px] text-[#4A5A7A] mt-0.5">Manage your scheduled sessions, attendance, and meeting links.</p>
        </div>
        <button onClick={openAddModal} className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] hover:shadow-md transition-all cursor-pointer focus:outline-none">
          <IconPlus className="w-4 h-4" /> Schedule Class
        </button>
      </div>

      <div className="flex border-b border-[#E6EBF8] gap-6">
        {(["upcoming", "history"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-3 text-xs font-bold transition-all relative cursor-pointer focus:outline-none ${tab === t ? "text-[#2F7FE8]" : "text-[#9BA8C0] hover:text-[#1B3A6B]"}`}>
            {t === "upcoming" ? "Upcoming Classes" : "Past / Completed"}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2F7FE8]" />}
          </button>
        ))}
      </div>

      {loading ? <ClassesSkeleton /> : filteredClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-2xl border border-dashed border-[#D0DCF5]">
          <IconCalendar className="w-10 h-10 text-[#D0DCF5]" />
          <h2 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">No Classes Found</h2>
          <p className="text-[13px] text-[#4A5A7A] max-w-xs">{tab === "upcoming" ? "No upcoming classes scheduled." : "No past classes registered."}</p>
          {tab === "upcoming" && <button onClick={openAddModal} className="mt-2 text-[11px] font-bold text-[#2F7FE8] hover:underline">Schedule one now</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClasses.map((c) => {
            const dateStr = new Date(c.scheduled_at).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
            const timeStr = new Date(c.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + ` (${c.duration_minutes} min)`;
            const isCompleting = completingId === c.id;

            return (
              <div key={c.id} className="bg-white rounded-2xl border border-[#D0DCF5] p-5 hover:shadow-sm transition-shadow flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E6F1FB] flex items-center justify-center shrink-0">
                    <IconVideo className="w-5 h-5 text-[#2F7FE8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-bold text-[#1B3A6B] truncate">{c.title}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-[11px] text-[#4A5A7A] mt-1 font-semibold">Student: {c.studentName}</p>
                    {(c.topic_details || c.attachment_url) && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {c.topic_details && (
                          <div className="text-[10px] text-secondary font-semibold bg-[#F5F8FF] border border-blue-100/50 px-2.5 py-1 rounded-lg text-left" title={c.topic_details}>
                            Topic Focus: {c.topic_details}
                          </div>
                        )}
                        {c.attachment_url && (
                          <a
                            href={c.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary bg-white hover:bg-secondary hover:text-white border border-blue-100/60 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                          >
                            📎 View Attachment
                          </a>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] text-[#9BA8C0] mt-1">{c.subject} · {dateStr} · {timeStr}</p>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2 border-t border-[#F0F3FB] pt-3">
                  {c.join_url ? (
                    <>
                      <a href={c.join_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#1B3A6B] text-white hover:bg-[#2F7FE8] transition-colors">
                        Launch <IconExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => setLinkModalClass(c)} className="text-[10px] font-bold text-[#4A5A7A] hover:text-[#2F7FE8] underline cursor-pointer border-none bg-transparent">Edit Link</button>
                    </>
                  ) : (
                    <button onClick={() => setLinkModalClass(c)} className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#D0DCF5] text-[#2F7FE8] hover:bg-blue-50/50 transition-colors cursor-pointer bg-white">
                      <IconLink className="w-3.5 h-3.5" /> Add Link
                    </button>
                  )}

                  {c.status === "scheduled" && (
                    <button onClick={() => setAttendanceClassId(c.id)} className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#D0DCF5] text-[#4A5A7A] hover:border-[#2F7FE8] hover:text-[#2F7FE8] transition-colors cursor-pointer bg-white">
                      <IconUsers className="w-3.5 h-3.5" /> Attendance
                    </button>
                  )}

                  {c.status === "scheduled" && (
                    <button onClick={() => handleMarkCompleted(c.id)} disabled={isCompleting} className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors cursor-pointer bg-white disabled:opacity-60">
                      {isCompleting ? <IconLoader className="w-3.5 h-3.5 animate-spin" /> : <IconCheckbox className="w-3.5 h-3.5" />}
                      Complete
                    </button>
                  )}

                  {c.status === "scheduled" && (
                    <div className="ml-auto flex gap-2">
                      <button onClick={() => openEditModal(c)} title="Reschedule" className="w-8 h-8 rounded-lg border border-[#D0DCF5] flex items-center justify-center text-[#4A5A7A] hover:border-[#2F7FE8] hover:text-[#2F7FE8] cursor-pointer">
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleCancelClass(c.id)} title="Cancel" className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 cursor-pointer">
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f2347]/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl border border-[#D0DCF5] shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">{editingClass ? "Reschedule Class" : "Schedule New Class"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 cursor-pointer"><IconX className="w-4 h-4 text-[#9BA8C0]" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingClass && (
                <div>
                  <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">Select Student</label>
                  <select required value={formData.studentIndex} onChange={(e) => setFormData({ ...formData, studentIndex: e.target.value })} className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] bg-white text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold">
                    <option value="" disabled>Choose a student...</option>
                    {students.map((s, idx) => <option key={s.id} value={idx}>{s.name} ({s.subject} · {s.grade})</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">Class Title</label>
                <input type="text" required placeholder="e.g. Calculus Review" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">Subject</label>
                <select required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] bg-white text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold">
                  <option value="" disabled>Select subject...</option>
                  {["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">Scheduled Time</label>
                <input type="datetime-local" required value={formData.scheduledAt} onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })} className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">Duration</label>
                  <select value={formData.durationMinutes} onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })} className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] bg-white text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold">
                    {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m}m</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">Meeting URL</label>
                  <input type="url" placeholder="https://meet.google.com/..." value={formData.joinUrl} onChange={(e) => setFormData({ ...formData, joinUrl: e.target.value })} className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold" />
                </div>
              </div>
              <div className="border-t border-[#F0F3FB] pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 text-xs font-bold py-2.5 rounded-xl border border-[#D0DCF5] text-[#4A5A7A] hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 text-xs font-bold py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-all cursor-pointer flex items-center justify-center gap-1.5">
                  {submitting && <IconLoader className="w-3.5 h-3.5 animate-spin" />}
                  {editingClass ? "Reschedule" : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {linkModalClass && <LinkModal cls={linkModalClass} onClose={() => setLinkModalClass(null)} onSaved={loadData} />}
      {attendanceClassId && <AttendanceModal classId={attendanceClassId} onClose={() => setAttendanceClassId(null)} onSaved={loadData} />}
    </div>
  );
}