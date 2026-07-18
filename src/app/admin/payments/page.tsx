"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  IconSearch,
  IconCurrencyRupee,
  IconBook,
  IconClock,
  IconUsers,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconX,
  IconCheck,
} from "@tabler/icons-react";
import { getAdminData, recordBookingInstallment, getBookingPaymentLogs } from "../../actions";
import { SkeletonMetric } from "@/components/Skeleton";

export default function PaymentsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [trendOffset, setTrendOffset] = useState(0);

  // Installment Modal State
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [installmentAmount, setInstallmentAmount] = useState<number>(0);
  const [installmentMethod, setInstallmentMethod] = useState<string>("Cash");
  const [installmentRef, setInstallmentRef] = useState<string>("");
  const [installmentNotes, setInstallmentNotes] = useState<string>("");
  const [recording, setRecording] = useState(false);
  const [paymentLogs, setPaymentLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  async function loadData() {
    try {
      const res = await getAdminData();
      setBookings(res.bookings || []);
    } catch (err) {
      console.error("Failed to load payments ledger:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const openInstallmentModal = async (b: any) => {
    setSelectedBooking(b);
    setInstallmentAmount(b.remainingBalance || 0);
    setInstallmentMethod("Cash");
    setInstallmentRef("");
    setInstallmentNotes("");
    setLoadingLogs(true);
    try {
      const logs = await getBookingPaymentLogs(b.id);
      setPaymentLogs(logs);
    } catch (err) {
      console.error(err);
      setPaymentLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRecordInstallment = async () => {
    if (!selectedBooking || installmentAmount <= 0) return;
    setRecording(true);
    try {
      await recordBookingInstallment({
        bookingId: selectedBooking.id,
        amountPaid: installmentAmount,
        paymentMethod: installmentMethod,
        paymentReference: installmentRef || undefined,
        notes: installmentNotes || undefined,
      });
      await loadData();
      setSelectedBooking(null);
    } catch (err: any) {
      alert(err.message || "Failed to record installment");
    } finally {
      setRecording(false);
    }
  };

  // Filter paid & partially paid transactions
  const paidTransactions = useMemo(() => {
    return bookings.filter((b) => b.paymentStatus === "paid" || b.paymentStatus === "partially_paid");
  }, [bookings]);

  const filteredTransactions = useMemo(() => {
    const term = search.toLowerCase();
    return paidTransactions.filter((b) => {
      return (
        b.parentName.toLowerCase().includes(term) ||
        b.itemTitle.toLowerCase().includes(term) ||
        b.parentEmail.toLowerCase().includes(term) ||
        (b.bookingType && b.bookingType.toLowerCase().includes(term))
      );
    });
  }, [paidTransactions, search]);

  // Aggregate Category Revenues
  const metrics = useMemo(() => {
    const grossSales = paidTransactions.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
    
    const courseRevenue = paidTransactions
      .filter((b) => b.bookingType === "Course")
      .reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
      
    const sessionRevenue = paidTransactions
      .filter((b) => b.bookingType === "Session")
      .reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
      
    const oneOnOneRevenue = paidTransactions
      .filter((b) => b.bookingType === "1-on-1 Session")
      .reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);

    const totalCalculated = courseRevenue + sessionRevenue + oneOnOneRevenue || 1;
    const coursePct = Math.round((courseRevenue / totalCalculated) * 100);
    const sessionPct = Math.round((sessionRevenue / totalCalculated) * 100);
    const oneOnOnePct = Math.round((oneOnOneRevenue / totalCalculated) * 100);

    return {
      grossSales,
      courseRevenue,
      sessionRevenue,
      oneOnOneRevenue,
      coursePct,
      sessionPct,
      oneOnOnePct,
      courseCirc: Math.round((coursePct / 100) * 214),
      sessionCirc: Math.round((sessionPct / 100) * 214),
      oneOnOneCirc: Math.round((oneOnOnePct / 100) * 214),
    };
  }, [paidTransactions]);

  // Daily Trends for trailing 14 days (with trendOffset)
  const dailyRevenue14Days = useMemo(() => {
    const results = [];
    const now = new Date();
    const shiftDays = trendOffset * 14;

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - (i + shiftDays));
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const dateStr = d.toDateString();

      const dayRevenue = paidTransactions
        .filter((b) => new Date(b.createdAt).toDateString() === dateStr)
        .reduce((sum, b) => sum + (b.amountPaid || 0), 0);

      results.push({ label, amount: dayRevenue });
    }

    const maxRevenue = Math.max(...results.map((r) => r.amount), 1);
    return results.map((r) => ({
      ...r,
      pct: r.amount > 0 ? Math.max(18, Math.round((r.amount / maxRevenue) * 100)) : 0,
    }));
  }, [paidTransactions, trendOffset]);

  // Date Range Label for header (e.g. "21 Jun - 4 Jul")
  const dateRangeLabel = useMemo(() => {
    if (!dailyRevenue14Days || dailyRevenue14Days.length === 0) return "";
    const start = dailyRevenue14Days[0].label;
    const end = dailyRevenue14Days[dailyRevenue14Days.length - 1].label;
    return `${start} - ${end}`;
  }, [dailyRevenue14Days]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse font-sans">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonMetric />
          <SkeletonMetric />
          <SkeletonMetric />
          <SkeletonMetric />
        </div>
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm lg:col-span-2 h-56 bg-slate-100/50"></div>
          <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm h-56 bg-slate-100/50"></div>
        </div>
        {/* Table Skeleton */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-6 space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Financial Stats Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Sales */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="w-[36px] h-[36px] rounded-xl bg-green-50 flex items-center justify-center text-green-700 mb-3">
            <IconCurrencyRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Gross Sales (Total)</div>
            <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">₹{metrics.grossSales.toLocaleString()}</div>
          </div>
        </div>

        {/* Card 2: Course Sales */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="w-[36px] h-[36px] rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 mb-3">
            <IconBook className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Courses Revenue</div>
            <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">₹{metrics.courseRevenue.toLocaleString()}</div>
          </div>
        </div>

        {/* Card 3: Session Sales */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="w-[36px] h-[36px] rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 mb-3">
            <IconClock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Sessions Revenue</div>
            <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">₹{metrics.sessionRevenue.toLocaleString()}</div>
          </div>
        </div>

        {/* Card 4: Mentor 1-on-1 Private Booking Sales */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="w-[36px] h-[36px] rounded-xl bg-pink-50 flex items-center justify-center text-pink-700 mb-3">
            <IconUsers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Mentor 1-on-1</div>
            <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">₹{metrics.oneOnOneRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Visual Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart: Daily Revenue */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-xs font-bold text-[#1B3A6B] uppercase tracking-wider">
              DAILY REVENUE TRENDS {dateRangeLabel ? `(${dateRangeLabel})` : ""}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTrendOffset((prev) => prev + 1)}
                className="w-9 h-9 rounded-2xl border border-[#E6EBF8] bg-white flex items-center justify-center text-slate-800 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Previous period"
              >
                <IconChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => setTrendOffset((prev) => Math.max(0, prev - 1))}
                disabled={trendOffset === 0}
                className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-all shadow-xs ${
                  trendOffset === 0
                    ? "bg-slate-50/60 text-slate-300 border-[#E6EBF8]/50 cursor-not-allowed opacity-50"
                    : "bg-white text-slate-800 border-[#E6EBF8] hover:bg-slate-50 hover:border-slate-300 active:scale-95 cursor-pointer"
                }`}
                title="Next period"
              >
                <IconChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
          
          <div className="flex items-end gap-2.5 h-44 pt-4 px-2">
            {dailyRevenue14Days.map((bar, i) => (
              <div key={i} className="flex-1 h-full flex flex-col items-center justify-end group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap z-20">
                  ₹{bar.amount.toLocaleString()}
                </div>

                {/* Vertical Bar Track */}
                <div className="w-full flex-1 flex items-end justify-center pb-1">
                  <div
                    style={{ height: bar.amount > 0 ? `${bar.pct}%` : "4px" }}
                    className={`w-full rounded-t-md transition-all duration-300 cursor-pointer ${
                      bar.amount > 0
                        ? "bg-emerald-500 hover:bg-[#1B3A6B] shadow-sm"
                        : "bg-slate-200/80 hover:bg-slate-300"
                    }`}
                  ></div>
                </div>

                {/* Amount Label */}
                <span className={`text-[8px] font-bold mt-0.5 ${bar.amount > 0 ? "text-[#1B3A6B]" : "text-slate-400"}`}>
                  {bar.amount > 0 ? `₹${bar.amount}` : "0"}
                </span>

                {/* Date Label */}
                <span className="text-[8px] text-text-muted font-bold whitespace-nowrap overflow-hidden">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Source Breakdown Chart */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm flex flex-col items-center justify-between">
          <h3 className="font-heading text-xs font-bold text-[#1B3A6B] w-full text-left mb-4 uppercase tracking-wider">
            Revenue by Source
          </h3>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="34" fill="none" stroke="#E6F1FB" strokeWidth="10" />
              {metrics.courseCirc > 0 && (
                <circle
                  cx="45"
                  cy="45"
                  r="34"
                  fill="none"
                  stroke="#2F7FE8"
                  strokeWidth="10"
                  strokeDasharray={`${metrics.courseCirc} 214`}
                  strokeDashoffset="0"
                  transform="rotate(-90 45 45)"
                />
              )}
              {metrics.sessionCirc > 0 && (
                <circle
                  cx="45"
                  cy="45"
                  r="34"
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth="10"
                  strokeDasharray={`${metrics.sessionCirc} 214`}
                  strokeDashoffset={`-${metrics.courseCirc}`}
                  transform="rotate(-90 45 45)"
                />
              )}
              {metrics.oneOnOneCirc > 0 && (
                <circle
                  cx="45"
                  cy="45"
                  r="34"
                  fill="none"
                  stroke="#EC4899"
                  strokeWidth="10"
                  strokeDasharray={`${metrics.oneOnOneCirc} 214`}
                  strokeDashoffset={`-${metrics.courseCirc + metrics.sessionCirc}`}
                  transform="rotate(-90 45 45)"
                />
              )}
            </svg>
            <div className="absolute font-heading text-[10px] font-extrabold text-[#1B3A6B] text-center leading-tight">
              <div>Total</div>
              <div className="text-xs">₹{metrics.grossSales.toLocaleString()}</div>
            </div>
          </div>
          <div className="w-full space-y-1.5 mt-4">
            <div className="flex items-center text-[10px] text-text-muted font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2F7FE8] mr-2"></span>
              Courses
              <span className="ml-auto font-bold text-[#1B3A6B]">{metrics.coursePct}%</span>
            </div>
            <div className="flex items-center text-[10px] text-text-muted font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] mr-2"></span>
              Sessions
              <span className="ml-auto font-bold text-[#1B3A6B]">{metrics.sessionPct}%</span>
            </div>
            <div className="flex items-center text-[10px] text-text-muted font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899] mr-2"></span>
              Mentor 1-on-1
              <span className="ml-auto font-bold text-[#1B3A6B]">{metrics.oneOnOnePct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search payments by parent, email, type, or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-[#E6EBF8] rounded-lg bg-white outline-none font-semibold text-[#1B3A6B]"
            />
          </div>
        </div>
      </div>

      {/* Transaction Logs Table */}
      <div className="bg-white border border-[#E6EBF8] rounded-2xl p-4 shadow-sm overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-badge-bg/30 border-b border-[#E6EBF8]">
              <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Booking ID</th>
              <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Parent Details</th>
              <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Category</th>
              <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Booked Course/Session</th>
              <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Booked Course/Session</th>
              <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Paid / Total</th>
              <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Payment Status</th>
              <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((b) => {
              const isUnknownParent = !b.parentName || b.parentName === "Unknown Parent";
              const parentDisplayName = isUnknownParent ? b.parentEmail : b.parentName;
              const isPartial = b.paymentStatus === "partially_paid";

              return (
                <tr key={b.id} className="border-b border-[#E6EBF8]/50 hover:bg-slate-50/50">
                  <td className="py-3 px-3 text-xs font-mono text-primary font-bold">
                    #{b.id.substring(0, 8)}
                  </td>
                  <td className="py-3 px-3 text-xs">
                    <div className="font-bold text-[#1B3A6B]">{parentDisplayName}</div>
                    {!isUnknownParent && (
                      <div className="text-[9px] text-[#9BA8C0] mt-0.5">{b.parentEmail}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-xs">
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block ${
                        b.bookingType === "Course"
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : b.bookingType === "Session"
                          ? "bg-purple-50 text-purple-700 border border-purple-100"
                          : "bg-pink-50 text-pink-700 border border-pink-100"
                      }`}
                    >
                      {b.bookingType}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs font-bold text-[#1B3A6B] truncate max-w-[240px]" title={b.itemTitle}>{b.itemTitle}</td>
                  <td className="py-3 px-3 text-xs text-primary font-bold">
                    <span>₹{b.amountPaid.toLocaleString()}</span>
                    {b.totalAmount > b.amountPaid && (
                      <span className="text-[10px] text-slate-400 font-semibold block">of ₹{b.totalAmount.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-xs">
                    {isPartial ? (
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-block">
                          PARTIAL
                        </span>
                        <div className="text-[9px] font-bold text-amber-800">
                          Due: ₹{b.remainingBalance.toLocaleString()}
                          {b.dueDate && <span className="block text-[8px] text-amber-600 font-normal">by {b.dueDate}</span>}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                        FULL PAID
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => openInstallmentModal(b)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 ${
                        isPartial
                          ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isPartial ? <><IconPlus className="w-3 h-3" /> Record Dues</> : "History"}
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-text-muted italic">
                  No payment logs found matching search filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Record Installment & History Modal */}
      {selectedBooking && (
        <>
          <div onClick={() => setSelectedBooking(null)} className="fixed inset-0 bg-[#1B3A6B]/30 backdrop-blur-xs z-[202] animate-fade-in" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-h-[85vh] bg-white rounded-3xl z-[203] shadow-2xl border border-border-subtle overflow-hidden flex flex-col font-sans animate-scale-up">
            <header className="px-6 py-4 border-b border-[#E6EBF8] flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B]">
                  Payment Dues & Installment Branch
                </h3>
                <p className="text-[10px] text-text-muted font-semibold mt-0.5">
                  Booking #{selectedBooking.id.substring(0, 8)} · {selectedBooking.parentName}
                </p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="w-7 h-7 border border-[#E6EBF8] rounded-lg text-slate-500 flex items-center justify-center hover:bg-slate-50 cursor-pointer">
                <IconX className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 premium-scrollbar">
              {/* Payment Summary */}
              <div className="p-4 bg-slate-50 border border-[#E6EBF8] rounded-2xl grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Total Price</span>
                  <span className="font-heading text-xs font-bold text-[#1B3A6B]">₹{selectedBooking.totalAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Paid So Far</span>
                  <span className="font-heading text-xs font-bold text-green-700">₹{selectedBooking.amountPaid.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Remaining Due</span>
                  <span className="font-heading text-xs font-bold text-amber-700">₹{selectedBooking.remainingBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* Installments History Branch */}
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase text-text-muted tracking-wider">Installment History Logs</p>
                {loadingLogs ? (
                  <p className="text-xs text-text-muted italic">Loading payment branch logs...</p>
                ) : paymentLogs.length === 0 ? (
                  <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 text-[11px] text-slate-500 italic">
                    Initial payment recorded: ₹{selectedBooking.amountPaid.toLocaleString()} ({selectedBooking.paymentMethod || "Cash"})
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paymentLogs.map((log, idx) => (
                      <div key={log.id || idx} className="p-3 border border-[#E6EBF8] rounded-xl bg-white flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-[#1B3A6B]">₹{Number(log.amount).toLocaleString()} via {log.payment_method}</div>
                          {log.payment_reference && <div className="text-[10px] text-slate-500 font-mono">Ref: {log.payment_reference}</div>}
                          {log.notes && <div className="text-[10px] text-slate-400 italic">{log.notes}</div>}
                        </div>
                        <span className="text-[9px] font-semibold text-slate-400">
                          {new Date(log.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Record New Installment Form */}
              {selectedBooking.remainingBalance > 0 && (
                <div className="p-4 border border-amber-200 bg-amber-50/40 rounded-2xl space-y-3">
                  <p className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider">Record New Dues Payment</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-amber-800 block mb-1">Amount Dues (₹)</span>
                      <input
                        type="number"
                        min={1}
                        max={selectedBooking.remainingBalance}
                        value={installmentAmount}
                        onChange={(e) => setInstallmentAmount(Number(e.target.value))}
                        className="w-full text-xs p-2 border border-amber-300 rounded-lg bg-white outline-none font-bold text-amber-900"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-amber-800 block mb-1">Payment Method</span>
                      <select
                        value={installmentMethod}
                        onChange={(e) => setInstallmentMethod(e.target.value)}
                        className="w-full text-xs p-2 border border-amber-300 rounded-lg bg-white outline-none font-bold text-amber-900"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Card">Card</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Transaction ref / note (optional)"
                    value={installmentRef}
                    onChange={(e) => setInstallmentRef(e.target.value)}
                    className="w-full text-xs p-2 border border-amber-300 rounded-lg bg-white outline-none font-semibold text-amber-900 placeholder:text-amber-700/50"
                  />
                  <button
                    type="button"
                    onClick={handleRecordInstallment}
                    disabled={recording || installmentAmount <= 0}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {recording ? "Recording..." : <><IconCheck className="w-4 h-4" /> Save Installment Payment</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
