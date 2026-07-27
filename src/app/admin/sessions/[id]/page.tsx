"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconArrowLeft,
  IconClock,
  IconStar,
  IconSchool,
  IconVideo,
  IconCurrencyRupee,
  IconCheck,
  IconLoader,
  IconBookmark,
  IconEdit,
} from "@tabler/icons-react";
import {
  getAdminSessionDetails,
  getAdminData,
  upsertSession,
  getSubjects,
} from "../../../actions";

type SessionDetails = Awaited<ReturnType<typeof getAdminSessionDetails>>;
type AdminData = Awaited<ReturnType<typeof getAdminData>>;

export default function AdminSessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve(params).then((resolvedParams) => {
      setSessionId(resolvedParams.id);
    });
  }, [params]);

  const [session, setSession] = useState<SessionDetails["session"] | null>(null);
  const [bookings, setBookings] = useState<SessionDetails["bookings"]>([]);
  const [mentors, setMentors] = useState<AdminData["mentors"]>([]);
  const [subjects, setSubjects] = useState<Awaited<ReturnType<typeof getSubjects>>>([]);
  const [loading, setLoading] = useState(true);

  // Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Parameters<typeof upsertSession>[0]> & { _customSubjectActive?: boolean }>({});

  const loadData = async () => {
    if (!sessionId) return;
    try {
      const res = await getAdminSessionDetails(sessionId);
      setSession(res.session);
      setBookings(res.bookings || []);

      const [adminData, subjectsRes] = await Promise.all([getAdminData(), getSubjects()]);
      setMentors(adminData.mentors || []);
      setSubjects(subjectsRes);
    } catch (err) {
      console.error("Failed to load session details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-on-mount; setState fires after the awaited request resolves, not synchronously
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadData is redefined each render but only reads sessionId, which is already tracked
  }, [sessionId]);

  const startEdit = () => {
    if (!session) return;
    setEditForm({
      ...session,
      mentor: session.mentor ? session.mentor.name : mentors[0]?.name || "",
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      await upsertSession(editForm as Parameters<typeof upsertSession>[0]);
      setIsEditing(false);
      setLoading(true);
      await loadData();
    } catch (err) {
      console.error("Failed to save session:", err);
      alert("Couldn't save this session. Please try again.");
    }
  };

  if (loading || !sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] font-sans">
        <IconLoader className="w-8 h-8 text-[#2F7FE8] animate-spin" />
        <p className="mt-3 text-xs font-semibold text-slate-500">Loading Session Insights...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-white border border-[#E6EBF8] rounded-2xl p-6 text-center space-y-4 font-sans">
        <p className="text-sm text-text-muted font-semibold">Session details not found.</p>
        <Link
          href="/admin/sessions"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7FE8] hover:underline"
        >
          <IconArrowLeft className="w-4 h-4" /> Back to Sessions List
        </Link>
      </div>
    );
  }

  // Calculate stats
  const totalSales = bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <div className="space-y-6 font-sans">
      {/* Back Link & Edit Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/sessions"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7A99] hover:text-[#1B3A6B] transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>

        {!isEditing ? (
          <button
            onClick={startEdit}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <IconEdit className="w-4 h-4" /> Edit Session
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={cancelEdit}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1B3A6B] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        /* SESSION EDITING LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">
                Session Core Parameters
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Session Title</label>
                <input
                  type="text"
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Short Description</label>
                <textarea
                  value={editForm.description || ""}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Subject</label>
                  <select
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                    value={
                      subjects.some((s) => s.name === editForm.subject)
                        ? editForm.subject
                        : editForm.subject
                        ? "Custom"
                        : subjects[0]?.name || "Custom"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Custom") {
                        setEditForm({ ...editForm, subject: "", _customSubjectActive: true });
                      } else {
                        setEditForm({ ...editForm, subject: val, _customSubjectActive: false });
                      }
                    }}
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                    <option value="Custom">Create New Subject...</option>
                  </select>
                  {(editForm._customSubjectActive || !subjects.some((s) => s.name === editForm.subject)) && (
                    <input
                      className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] mt-1.5 bg-white w-full"
                      type="text"
                      placeholder="Enter custom subject name..."
                      value={editForm.subject || ""}
                      onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Class Level / Grade</label>
                  <input
                    type="text"
                    placeholder="e.g. Class 10, Grade 8, JEE Prep"
                    value={editForm.classLevel || ""}
                    onChange={(e) => setEditForm({ ...editForm, classLevel: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Type</label>
                  <select
                    value={editForm.type || "1-on-1"}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  >
                    <option value="1-on-1">1-on-1</option>
                    <option value="Group">Group</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Price (₹)</label>
                  <input
                    type="number"
                    value={editForm.price || 0}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Status</label>
                  <select
                    value={editForm.status || "Active"}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">
                Session Specifications & Location
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Duration Options</label>
                  <input
                    type="text"
                    value={editForm.durationOptions || "60 or 90 min"}
                    onChange={(e) => setEditForm({ ...editForm, durationOptions: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Platform</label>
                  <input
                    type="text"
                    value={editForm.platform || "Zoom"}
                    onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Language</label>
                  <input
                    type="text"
                    value={editForm.language || "English / Hindi"}
                    onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Schedule Days</label>
                  <input
                    type="text"
                    value={editForm.days || "Mon – Sat"}
                    onChange={(e) => setEditForm({ ...editForm, days: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Reschedule Policy</label>
                  <input
                    type="text"
                    value={editForm.reschedulePolicy || "Up to 4 hrs before"}
                    onChange={(e) => setEditForm({ ...editForm, reschedulePolicy: e.target.value })}
                    className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="isRepeatable"
                  checked={editForm.isRepeatable || false}
                  onChange={(e) => setEditForm({ ...editForm, isRepeatable: e.target.checked })}
                  className="w-4 h-4 rounded border-[#E6EBF8] text-[#2F7FE8] cursor-pointer"
                />
                <label htmlFor="isRepeatable" className="text-xs font-bold text-[#1B3A6B] uppercase cursor-pointer">
                  Weekly Recurring Session (Repeatable)
                </label>
              </div>

              {!editForm.isRepeatable && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Session Date</label>
                    <input
                      type="date"
                      value={editForm.sessionDate || ""}
                      onChange={(e) => setEditForm({ ...editForm, sessionDate: e.target.value })}
                      className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Session Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:00 AM - 11:30 AM"
                      value={editForm.sessionTime || ""}
                      onChange={(e) => setEditForm({ ...editForm, sessionTime: e.target.value })}
                      className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">About Session Details</label>
                <textarea
                  value={editForm.aboutSession || ""}
                  onChange={(e) => setEditForm({ ...editForm, aboutSession: e.target.value })}
                  className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none font-semibold text-[#1B3A6B] bg-white w-full h-24 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Mentor assignment selector */}
            <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">
                Assign Session Mentor
              </h3>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Assigned Educator</label>
                <select
                  className="text-xs p-3 border border-[#E6EBF8] rounded-xl outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  value={editForm.mentor || ""}
                  onChange={(e) => setEditForm({ ...editForm, mentor: e.target.value })}
                >
                  {mentors.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD VIEW SESSION MODE */
        <>
          {/* Session Header Card */}
          <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-stretch">
            <div className="flex flex-col md:flex-row gap-5 items-start flex-1">
              <div
                style={{ backgroundColor: session.colorBg || "#ede9fe" }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-primary shrink-0 border border-[#D0DCF5]"
              >
                <IconVideo className="w-8 h-8 text-primary/80" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                    {session.type} Session
                  </span>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                    session.status === "Active" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                  }`}>
                    {session.status}
                  </span>
                  {session.isRepeatable && (
                    <span className="text-[9px] font-extrabold uppercase bg-blue-50 text-[#2F7FE8] border border-blue-100 px-2 py-0.5 rounded-full">
                      Weekly Recurring
                    </span>
                  )}
                  {session.classLevel && (
                    <span className="text-[9px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full">
                      {session.classLevel}
                    </span>
                  )}
                </div>
                <h2 className="font-heading text-xl font-extrabold text-[#1B3A6B] leading-snug">{session.title}</h2>
                <p className="text-xs text-[#6B7A99] font-medium max-w-2xl leading-relaxed">{session.description}</p>
                <div className="flex items-center gap-4 text-xs text-[#6B7A99] pt-2 font-medium">
                  <span><strong>Subject:</strong> {session.subject}</span>
                  <span className="text-slate-300">|</span>
                  <span><strong>Platform:</strong> {session.platform}</span>
                  <span className="text-slate-300">|</span>
                  <span><strong>Language:</strong> {session.language}</span>
                </div>
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-[#E6EBF8] pt-4 md:pt-0 md:pl-6 flex flex-col justify-center min-w-[200px] text-left md:text-right space-y-1">
              <div className="text-[10px] uppercase font-bold text-text-muted">Rate / session</div>
              <div className="font-heading text-2xl font-extrabold text-[#1B3A6B]">
                ₹{session.price.toLocaleString()}
              </div>
              <div className="text-[10px] text-text-muted">{session.type === "Group" ? "per seat" : "per hour"}</div>
            </div>
          </div>

          {/* KPI Counters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm">
              <div className="w-[36px] h-[36px] rounded-xl bg-green-50 flex items-center justify-center text-green-700 mb-3">
                <IconCurrencyRupee className="w-5 h-5" />
              </div>
              <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Total Sales Revenue</div>
              <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">₹{totalSales.toLocaleString()}</div>
            </div>

            <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm">
              <div className="w-[36px] h-[36px] rounded-xl bg-blue-50 flex items-center justify-center text-[#2F7FE8] mb-3">
                <IconBookmark className="w-5 h-5" />
              </div>
              <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Total Bookings</div>
              <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">{totalBookings} slots</div>
            </div>

            <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm">
              <div className="w-[36px] h-[36px] rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 mb-3">
                <IconCheck className="w-5 h-5" />
              </div>
              <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Confirmed Bookings</div>
              <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">{activeBookings} confirmed</div>
            </div>
          </div>

          {/* Roster & Details Split grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Parameters Block */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">Session Specifications</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-[#1B3A6B]">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                    <span>{session.durationOptions}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Platform</span>
                    <span>{session.platform}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Schedule Days</span>
                    <span>{session.days}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reschedule Policy</span>
                    <span>{session.reschedulePolicy}</span>
                  </div>
                  {session.sessionDate && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session Date</span>
                      <span>{new Date(session.sessionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  )}
                  {session.sessionTime && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scheduled Time</span>
                      <span>{session.sessionTime} IST</span>
                    </div>
                  )}
                </div>

                {session.aboutSession && (
                  <div className="pt-4 border-t border-[#E6EBF8] space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">About the Session</span>
                    <p className="text-xs text-[#6B7A99] leading-relaxed whitespace-pre-wrap">{session.aboutSession}</p>
                  </div>
                )}
              </div>

              {/* Bookings Roster */}
              <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">Bookings Roster</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#E6EBF8]">
                        <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Booking ID</th>
                        <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Student Details</th>
                        <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Parent Details</th>
                        <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Booking Date</th>
                        <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Payment</th>
                        <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-[#E6EBF8]/50 hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-[10px] font-bold text-[#1B3A6B] truncate max-w-[80px]">{b.id}</td>
                          <td className="py-3 px-4">
                            <div className="text-xs font-bold text-[#1B3A6B]">{b.studentName}</div>
                            <div className="text-[9px] text-text-muted font-semibold mt-0.5">{b.studentEmail}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs font-bold text-[#1B3A6B]">{b.parentName}</div>
                            <div className="text-[9px] text-text-muted font-semibold mt-0.5">{b.parentEmail}</div>
                          </td>
                          <td className="py-3 px-4 text-xs text-text-muted font-medium">
                            {new Date(b.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              b.paymentStatus === "paid" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700"
                            }`}>
                              {b.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              b.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-slate-700"
                            }`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {bookings.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-xs text-text-muted italic">
                            No bookings recorded for this session yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Assigned Mentor Card */}
            <div className="space-y-6">
              <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">Assigned Mentor</h3>
                
                {session.mentor ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {session.mentor.avatarUrl ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#E6EBF8] shrink-0">
                          <Image src={session.mentor.avatarUrl} alt={session.mentor.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#1B3A6B] text-accent flex items-center justify-center font-heading text-sm font-bold shrink-0">
                          {session.mentor.name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#1B3A6B] truncate">{session.mentor.name}</h4>
                        <p className="text-[10px] text-text-muted truncate mt-0.5 font-semibold">{session.mentor.email}</p>
                      </div>
                    </div>

                    <div className="text-xs text-[#6B7A99] space-y-2 border-t border-[#E6EBF8]/60 pt-3.5 font-medium">
                      <div className="flex items-center gap-1.5"><IconSchool className="w-4 h-4 text-[#9BA8C0]" /> {session.mentor.qualification}</div>
                      <div className="flex items-center gap-1.5"><IconClock className="w-4 h-4 text-[#9BA8C0]" /> {session.mentor.experience} Years Experience</div>
                      <div className="flex items-center gap-1.5 text-accent"><IconStar className="w-4 h-4 fill-accent" /> {session.mentor.rating} Rating</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic text-center py-2">No mentor assigned to this session.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
