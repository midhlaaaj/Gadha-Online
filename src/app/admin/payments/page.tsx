"use client";

import React, { useState, useEffect } from "react";
import { IconSearch, IconCreditCard, IconCurrencyRupee, IconSparkles } from "@tabler/icons-react";
import { getAdminData } from "../../actions";
import { SkeletonMetric } from "@/components/Skeleton";

export default function PaymentsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
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
    loadData();
  }, []);

  // Filter paid transactions
  const paidTransactions = bookings.filter((b) => b.paymentStatus === "paid");

  const filteredTransactions = paidTransactions.filter((b) => {
    const term = search.toLowerCase();
    return (
      b.parentName.toLowerCase().includes(term) ||
      b.itemTitle.toLowerCase().includes(term) ||
      b.parentEmail.toLowerCase().includes(term)
    );
  });

  // Calculate gross sales and platform fees
  const grossSales = paidTransactions.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  const platformCommissionRate = 0.15; // 15% platform commission
  const platformRevenue = Math.round(grossSales * platformCommissionRate);
  const mentorPayouts = grossSales - platformRevenue;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonMetric />
          <SkeletonMetric />
          <SkeletonMetric />
        </div>
        {/* Toolbar Skeleton */}
        <div className="h-8 bg-slate-200 rounded-lg w-48"></div>
        {/* Table Skeleton */}
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-6 space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Financial Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-sm">
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm">
          <div className="w-[36px] h-[36px] rounded-xl bg-green-50 flex items-center justify-center text-green-700 mb-3">
            <IconCurrencyRupee className="w-5 h-5" />
          </div>
          <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Gross Sales (Paid)</div>
          <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">₹{grossSales.toLocaleString()}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search payments by parent, email, or course..."
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
              <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Booked Course/Session</th>
              <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Gross Paid</th>
              <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((b) => {
              const isUnknownParent = !b.parentName || b.parentName === "Unknown Parent";
              const parentDisplayName = isUnknownParent ? b.parentEmail : b.parentName;

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
                  <td className="py-3 px-3 text-xs font-bold text-[#1B3A6B]">{b.itemTitle}</td>
                  <td className="py-3 px-3 text-xs text-primary font-bold">₹{b.amountPaid.toLocaleString()}</td>
                  <td className="py-3 px-3 text-xs">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                      SUCCESS
                    </span>
                  </td>
                </tr>
              );
            })}

            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-text-muted italic">
                  No payment logs found matching search filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
