"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  IconSearch,
  IconCalendar,
  IconLink,
  IconUsers,
  IconEdit,
  IconX,
  IconCheck,
  IconInfoCircle,
} from "@tabler/icons-react";
import { getAdminSchedules, markAdminAttendance } from "../../actions";
import { SkeletonCard } from "@/components/Skeleton";

type ScheduleItem = Awaited<ReturnType<typeof getAdminSchedules>>[number];
type StudentInfo = ScheduleItem["studentInfo"];

interface Occurrence {
  id: string;
  lessonTopic: string;
  date: string;
  time: string;
  scheduledAt: string;
  zoomLink: string | null;
  students: StudentInfo[];
}

interface GroupedCard {
  courseTitle: string;
  subject: string;
  mentor: string;
  itemType: "course" | "session";
  subType: string;
  occurrences: Occurrence[];
  studentsBooked: number;
  attendanceRate: string;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Filter States
  const [filterType, setFilterType] = useState<"all" | "course" | "session">("all");
  const [filterSubType, setFilterSubType] = useState<string>("all");

  // Selected Card (representing a Course or Session group) for the modal
  const [selectedCard, setSelectedCard] = useState<GroupedCard | null>(null);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Record<string, "present" | "absent" | "excused" | "unmarked">>({});
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getAdminSchedules();
      setSchedules(res || []);
    } catch (err) {
      console.error("Failed to load schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-on-mount; setState fires after the awaited request resolves, not synchronously
    loadData();
  }, []);

  // Group flat scheduled classes by unique Course / Session title
  const groupedCards = useMemo((): GroupedCard[] => {
    interface CardAccumulator {
      courseTitle: string;
      subject: string;
      mentor: string;
      itemType: "course" | "session";
      subType: string;
      occurrencesMap: Map<string, Occurrence>;
    }
    const cardsMap = new Map<string, CardAccumulator>();

    schedules.forEach((item) => {
      const cardKey = item.courseTitle.toLowerCase();

      if (!cardsMap.has(cardKey)) {
        cardsMap.set(cardKey, {
          courseTitle: item.courseTitle,
          subject: item.subject,
          mentor: item.mentor,
          itemType: item.itemType,
          subType: item.subType,
          occurrencesMap: new Map<string, Occurrence>()
        });
      }

      const card = cardsMap.get(cardKey)!;
      const occKey = item.id; // scheduled_class.id

      if (!card.occurrencesMap.has(occKey)) {
        card.occurrencesMap.set(occKey, {
          id: item.id,
          lessonTopic: item.lessonTopic,
          date: item.date,
          time: item.time,
          scheduledAt: item.scheduledAt,
          zoomLink: item.zoomLink,
          students: [item.studentInfo]
        });
      } else {
        card.occurrencesMap.get(occKey)!.students.push(item.studentInfo);
      }
    });

    return Array.from(cardsMap.values()).map((card) => {
      const occurrences = Array.from(card.occurrencesMap.values()).sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );

      // Unique student count
      const studentIds = new Set();
      occurrences.forEach((occ) => {
        occ.students.forEach((std) => {
          if (std.studentId) studentIds.add(std.studentId);
        });
      });
      const uniqueStudentsCount = studentIds.size;

      // Attendance rate across all occurrences
      const allStudentMarks: StudentInfo[] = [];
      occurrences.forEach((occ) => {
        occ.students.forEach((std) => {
          if (std.status !== "unmarked") allStudentMarks.push(std);
        });
      });

      const presentMarks = allStudentMarks.filter((std) => std.status === "present").length;
      const attendanceRate = allStudentMarks.length > 0
        ? `${Math.round((presentMarks / allStudentMarks.length) * 100)}%`
        : "N/A";

      return {
        courseTitle: card.courseTitle,
        subject: card.subject,
        mentor: card.mentor,
        itemType: card.itemType,
        subType: card.subType,
        occurrences,
        studentsBooked: uniqueStudentsCount,
        attendanceRate
      };
    });
  }, [schedules]);

  // Filter grouped cards based on Search & Select toggles
  const filteredCards = useMemo(() => {
    return groupedCards.filter((card) => {
      const term = search.toLowerCase();
      const matchesSearch =
        card.courseTitle.toLowerCase().includes(term) ||
        card.subject.toLowerCase().includes(term) ||
        card.mentor.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // Main type filter
      if (filterType !== "all" && card.itemType !== filterType) return false;

      // Sub type filter
      if (filterSubType !== "all" && card.subType !== filterSubType) return false;

      return true;
    });
  }, [groupedCards, search, filterType, filterSubType]);

  const openAttendanceModal = (card: GroupedCard) => {
    setSelectedCard(card);
    if (card.occurrences.length > 0) {
      const initialOcc = card.occurrences[0];
      setSelectedOccurrenceId(initialOcc.id);

      const initialMarks: Record<string, "present" | "absent" | "excused" | "unmarked"> = {};
      initialOcc.students.forEach((s) => {
        initialMarks[s.studentId] = s.status || "unmarked";
      });
      setEditingAttendance(initialMarks);
    }
    setModalOpen(true);
  };

  const handleOccurrenceChange = (occId: string) => {
    setSelectedOccurrenceId(occId);
    if (!selectedCard) return;

    const occ = selectedCard.occurrences.find((o) => o.id === occId);
    if (occ) {
      const updatedMarks: Record<string, "present" | "absent" | "excused" | "unmarked"> = {};
      occ.students.forEach((s) => {
        updatedMarks[s.studentId] = s.status || "unmarked";
      });
      setEditingAttendance(updatedMarks);
    }
  };

  const handleStatusChange = (studentId: string, status: "present" | "absent" | "excused") => {
    setEditingAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const saveAttendanceMarks = async () => {
    if (!selectedCard || !selectedOccurrenceId) return;

    const activeOcc = selectedCard.occurrences.find((o) => o.id === selectedOccurrenceId);
    if (!activeOcc) return;

    setSaving(true);
    try {
      const recordsToUpdate = activeOcc.students.map((s) => {
        const mark = editingAttendance[s.studentId];
        return {
          studentId: s.studentId,
          scheduledClassId: s.scheduledClassId,
          bookingId: s.bookingId,
          status: mark === "unmarked" ? ("absent" as const) : mark,
          date: activeOcc.date,
          subject: selectedCard.subject,
        };
      });

      await markAdminAttendance(recordsToUpdate);
      setModalOpen(false);
      setSelectedCard(null);
      await loadData();
    } catch (err) {
      console.error("Failed to save attendance:", err);
      alert("Couldn't save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getSubjectBadgeStyles = (sub: string) => {
    switch (sub) {
      case "Mathematics":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Programming":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Science":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "English":
        return "bg-purple-50 text-purple-700 border-purple-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  // Find currently active occurrence in modal context
  const activeOccurrence = useMemo(() => {
    if (!selectedCard || !selectedOccurrenceId) return null;
    return selectedCard.occurrences.find((o) => o.id === selectedOccurrenceId) || null;
  }, [selectedCard, selectedOccurrenceId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="h-8 bg-slate-200 rounded-lg w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans">
      {/* Filters Toolbar */}
      <div className="bg-white border border-[#E6EBF8] rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Main search */}
          <div className="relative w-full md:max-w-md">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by catalog title, subject, or tutor name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-[#E6EBF8] rounded-lg bg-white outline-none font-semibold text-[#1B3A6B]"
            />
          </div>

          {/* Selector filters */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Type selector */}
            <div className="space-y-0.5 flex-1 md:flex-initial">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as "all" | "course" | "session");
                  setFilterSubType("all");
                }}
                className="w-full md:w-40 text-xs font-bold p-2 border border-[#E6EBF8] rounded-lg outline-none bg-white text-[#1B3A6B] cursor-pointer"
              >
                <option value="all">All Schedules</option>
                <option value="course">Courses Only</option>
                <option value="session">Sessions Only</option>
              </select>
            </div>

            {/* Sub-type filter dynamic */}
            <div className="space-y-0.5 flex-1 md:flex-initial">
              <select
                value={filterSubType}
                onChange={(e) => setFilterSubType(e.target.value)}
                className="w-full md:w-44 text-xs font-bold p-2 border border-[#E6EBF8] rounded-lg outline-none bg-white text-[#1B3A6B] cursor-pointer"
              >
                <option value="all">All Formats</option>
                {filterType === "all" && (
                  <>
                    <option value="Recorded">Recorded</option>
                    <option value="Live Batch">Live Batch</option>
                    <option value="Live Individual">Live Individual</option>
                    <option value="1 on 1">1 on 1</option>
                    <option value="Group">Group</option>
                  </>
                )}
                {filterType === "course" && (
                  <>
                    <option value="Recorded">Recorded</option>
                    <option value="Live Batch">Live Batch</option>
                    <option value="Live Individual">Live Individual</option>
                  </>
                )}
                {filterType === "session" && (
                  <>
                    <option value="1 on 1">1 on 1</option>
                    <option value="Group">Group</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map((s, index) => (
          <div
            key={index}
            className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start">
                <span className={`text-[8px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full ${getSubjectBadgeStyles(s.subject)}`}>
                  {s.subject}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  s.attendanceRate === "N/A"
                    ? "bg-slate-50 text-slate-500 border border-slate-100"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                }`}>
                  Attendance: {s.attendanceRate === "N/A" ? "Pending" : s.attendanceRate}
                </span>
              </div>
              <h4 className="font-bold text-[#1B3A6B] text-xs leading-snug mt-3">{s.courseTitle}</h4>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                {s.itemType === "course" ? `Course / ${s.subType}` : `Session / ${s.subType}`}
              </p>

              <div className="text-xs text-[#6B7A99] space-y-1.5 pt-3 border-t border-[#E6EBF8] mt-3 font-medium">
                <div className="flex items-center gap-1.5"><IconCalendar className="w-4 h-4 text-[#9BA8C0]" /> {s.occurrences.length} Classes Scheduled</div>
                <div className="flex items-center gap-1.5"><IconUsers className="w-4 h-4 text-[#9BA8C0]" /> {s.mentor} ({s.studentsBooked} Enrolled)</div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#E6EBF8] mt-4">
              <button
                onClick={() => openAttendanceModal(s)}
                className="flex-1 text-xs font-bold py-2 rounded-xl bg-[#EBF2FF] text-[#1B3A6B] hover:bg-[#2F7FE8] hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <IconEdit className="w-3.5 h-3.5" /> Manage Attendance
              </button>
            </div>
          </div>
        ))}

        {filteredCards.length === 0 && (
          <div className="col-span-full bg-white border border-[#E6EBF8] rounded-2xl p-6 text-center text-xs text-text-muted italic">
            No schedules found matching the filters.
          </div>
        )}
      </div>

      {/* Attendance Modal Overlay */}
      {modalOpen && selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E6EBF8] w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E6EBF8] flex items-start justify-between bg-slate-50/50">
              <div>
                <span className={`text-[8px] font-extrabold uppercase border px-2 py-0.5 rounded-full ${getSubjectBadgeStyles(selectedCard.subject)}`}>
                  {selectedCard.subject}
                </span>
                <h3 className="font-heading text-sm font-bold text-[#1B3A6B] mt-1.5">{selectedCard.courseTitle}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {selectedCard.itemType === "course" ? `Course / ${selectedCard.subType}` : `Session / ${selectedCard.subType}`}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Select class occurrence dropdown */}
              <div className="bg-slate-50 border border-[#E6EBF8] p-4 rounded-xl space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 block">Class Occurrence</label>
                  <select
                    value={selectedOccurrenceId}
                    onChange={(e) => handleOccurrenceChange(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 border border-[#E6EBF8] rounded-lg outline-none bg-white text-[#1B3A6B] cursor-pointer focus:border-[#2F7FE8]"
                  >
                    {selectedCard.occurrences.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.lessonTopic} ({o.date} &middot; {o.time})
                      </option>
                    ))}
                  </select>
                </div>

                {activeOccurrence?.zoomLink && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60 mt-1">
                    <IconLink className="w-4 h-4 text-[#2F7FE8]" />
                    <a
                      href={activeOccurrence.zoomLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#2F7FE8] hover:underline font-bold text-xs"
                    >
                      Open Live Lesson Zoom Link
                    </a>
                  </div>
                )}
              </div>

              {activeOccurrence && (
                <div className="space-y-3">
                  <h4 className="font-bold text-[#1B3A6B] text-xs uppercase tracking-wider">Student Roster</h4>
                  
                  <div className="divide-y divide-[#E6EBF8] border border-[#E6EBF8] rounded-xl overflow-hidden">
                    {activeOccurrence.students.map((student) => (
                      <div key={student.studentId} className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50/50 transition-colors">
                        <div>
                          <div className="text-xs font-bold text-[#1B3A6B]">{student.studentName}</div>
                          <div className="text-[10px] text-text-muted mt-0.5">{student.studentEmail}</div>
                        </div>

                        {/* Attendance marks buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.studentId, "present")}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                              editingAttendance[student.studentId] === "present"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-white text-[#6B7A99] border-slate-100 hover:border-slate-300"
                            }`}
                          >
                            <IconCheck className="w-3.5 h-3.5" /> Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.studentId, "absent")}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                              editingAttendance[student.studentId] === "absent"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-white text-[#6B7A99] border-slate-100 hover:border-slate-300"
                            }`}
                          >
                            <IconX className="w-3.5 h-3.5" /> Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.studentId, "excused")}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                              editingAttendance[student.studentId] === "excused"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-white text-[#6B7A99] border-slate-100 hover:border-slate-300"
                            }`}
                          >
                            <IconInfoCircle className="w-3.5 h-3.5" /> Excused
                          </button>
                        </div>
                      </div>
                    ))}

                    {activeOccurrence.students.length === 0 && (
                      <p className="text-xs text-text-muted italic text-center py-6">No students registered for this class.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E6EBF8] flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border border-[#E6EBF8] text-[#1B3A6B] text-xs font-bold rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAttendanceMarks}
                disabled={saving || !selectedOccurrenceId}
                className="px-5 py-2 bg-[#2F7FE8] hover:bg-[#1B3A6B] text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? "Saving Changes..." : "Save Attendance"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
