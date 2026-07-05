"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconStar,
  IconSchool,
  IconUsers,
  IconVideo,
  IconCurrencyRupee,
  IconCheck,
  IconLoader,
  IconBookmark,
} from "@tabler/icons-react";
import { getAdminSessionDetails } from "../../../actions";

interface Params {
  id: string;
}

export default function AdminSessionDetailPage({ params }: { params: React.ComponentProps<any>['params'] }) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve(params).then((resolvedParams: any) => {
      setSessionId(resolvedParams.id);
    });
  }, [params]);

  const [session, setSession] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    async function loadData() {
      try {
        const res = await getAdminSessionDetails(sessionId as string);
        setSession(res.session);
        setBookings(res.bookings || []);
      } catch (err) {
        console.error("Failed to load session details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [sessionId]);

  if (loading || !sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <IconLoader className="w-8 h-8 text-[#2F7FE8] animate-spin" />
        <p className="mt-3 text-xs font-semibold text-slate-500 font-sans">Loading Session Insights...</p>
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
      {/* Back Link */}
      <div>
        <Link
          href="/admin/sessions"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7A99] hover:text-[#1B3A6B] transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </div>

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
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-[#E6EBF8] shrink-0">
                      <img src={session.mentor.avatarUrl} alt={session.mentor.name} className="w-full h-full object-cover" />
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
    </div>
  );
}
