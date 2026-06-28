"use client";

import { useEffect, useState } from "react";
import {
  IconCalendarCheck, IconUser, IconClock, IconAlertTriangle,
  IconCheck, IconX, IconArrowRight, IconLoader, IconMoodSmile
} from "@tabler/icons-react";
import { getMentorClasses, saveAttendanceRecord } from "@/app/actions";

type MentorClass = Awaited<ReturnType<typeof getMentorClasses>>[number];

function AttendanceSkeleton() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
      <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 space-y-4">
        <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
        <div className="h-20 w-full bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function MentorAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<MentorClass[]>([]);
  const [selectedClassIndex, setSelectedClassIndex] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State
  const [status, setStatus] = useState<"present" | "absent" | "excused">("present");
  const [notes, setNotes] = useState("");

  const loadClasses = async () => {
    try {
      const data = await getMentorClasses();
      // Sort classes: show today's/recent classes first.
      const sorted = (data || []).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
      setClasses(sorted);
      
      // Auto-select first class if available
      if (sorted.length > 0) {
        setSelectedClassIndex("0");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const activeClass = selectedClassIndex !== "" ? classes[Number(selectedClassIndex)] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      await saveAttendanceRecord({
        studentId: activeClass.student_id,
        scheduledClassId: activeClass.id,
        bookingId: activeClass.booking_id,
        sessionDate: new Date(activeClass.scheduled_at).toISOString().split("T")[0],
        subject: activeClass.subject,
        status,
        notes,
      });
      setSavedSuccess(true);
      // Reload classes to update status
      await loadClasses();
      setNotes("");
    } catch (e) {
      console.error(e);
      alert("Failed to save attendance record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">Mark Attendance</h1>
        <p className="text-[13px] text-[#4A5A7A] mt-0.5">Select a scheduled class, log student presence, and record class notes.</p>
      </div>

      {loading ? (
        <AttendanceSkeleton />
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-2xl border border-dashed border-[#D0DCF5]">
          <IconCalendarCheck className="w-10 h-10 text-[#D0DCF5]" />
          <h2 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">No Classes Logged</h2>
          <p className="text-[13px] text-[#4A5A7A] max-w-xs">
            Once you schedule and complete classes, you can mark attendance here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Class Select Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">
              Select Scheduled Class
            </label>
            <select
              value={selectedClassIndex}
              onChange={(e) => {
                setSelectedClassIndex(e.target.value);
                setSavedSuccess(false);
              }}
              className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] bg-white text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold"
            >
              {classes.map((c, idx) => {
                const dateStr = new Date(c.scheduled_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const isCompleted = c.status === "completed";
                return (
                  <option key={c.id} value={idx}>
                    {c.title} ({c.studentName}) - {dateStr} {isCompleted ? "[Attendance Recorded]" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Active Class Card & Form */}
          {activeClass && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#D0DCF5] p-6 space-y-6">
              {/* Class Header info */}
              <div className="pb-4 border-b border-[#F0F3FB] flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold text-[#1B3A6B]">{activeClass.title}</h3>
                  <p className="text-[11px] text-[#4A5A7A] mt-0.5">
                    {activeClass.subject} · {new Date(activeClass.scheduled_at).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <div>
                  {activeClass.status === "completed" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-600">
                      <IconCheck className="w-3.5 h-3.5" /> Logged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600">
                      <IconClock className="w-3.5 h-3.5" /> Pending Log
                    </span>
                  )}
                </div>
              </div>

              {/* Student details */}
              <div className="flex items-center gap-3 bg-[#F5F8FF] p-3 rounded-xl border border-[#D0DCF5]">
                <div className="w-9 h-9 rounded-full bg-[#EBF2FF] border border-[#d0e0f8] flex items-center justify-center font-heading text-xs font-bold text-[#2F7FE8] shrink-0">
                  <IconUser className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#1B3A6B]">{activeClass.studentName}</p>
                  <p className="text-[10px] text-[#4A5A7A]">{activeClass.studentEmail}</p>
                </div>
              </div>

              {/* Success Notification */}
              {savedSuccess && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 animate-fade-in">
                  <IconCheck className="w-4 h-4 shrink-0" />
                  <span className="text-[12px] font-semibold">Attendance marked successfully!</span>
                </div>
              )}

              {/* Attendance Selection */}
              <div className="space-y-2">
                <span className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider">
                  Attendance Status
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "present", label: "Present", color: "border-green-200 text-green-700 checked:bg-green-600", activeClass: "bg-green-50/50 border-green-500 text-green-700" },
                    { id: "absent", label: "Absent", color: "border-red-200 text-red-700 checked:bg-red-500", activeClass: "bg-red-50/50 border-red-500 text-red-700" },
                    { id: "excused", label: "Excused", color: "border-amber-200 text-amber-700 checked:bg-amber-500", activeClass: "bg-amber-50/50 border-amber-500 text-amber-700" },
                  ].map((opt) => {
                    const isSelected = status === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setStatus(opt.id as any);
                          setSavedSuccess(false);
                        }}
                        className={`py-3 px-4 rounded-xl border text-[13px] font-bold transition-all text-center cursor-pointer focus:outline-none flex flex-col items-center justify-center gap-1 ${
                          isSelected ? opt.activeClass : "border-[#D0DCF5] bg-white text-[#4A5A7A] hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-[#1B3A6B] uppercase tracking-wider mb-1.5">
                  Class Notes / Comments (Optional)
                </label>
                <textarea
                  placeholder="e.g. Conducted test on Chapter 3, student scored 80%. Progress is steady."
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setSavedSuccess(false);
                  }}
                  rows={3}
                  className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#D0DCF5] text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] font-semibold resize-none"
                />
              </div>

              {/* Action Button */}
              <div className="border-t border-[#F0F3FB] pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-5 py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] hover:shadow-md transition-all cursor-pointer focus:outline-none"
                >
                  {saving ? (
                    <>Saving <IconLoader className="w-3.5 h-3.5 animate-spin" /></>
                  ) : (
                    <>Submit Attendance <IconArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
