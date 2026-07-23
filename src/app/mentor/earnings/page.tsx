"use client";

import { useEffect, useState } from "react";
import { IconCoin, IconCalendar, IconTrendingUp, IconSearch } from "@tabler/icons-react";
import { getMentorEarnings } from "@/app/actions";

type EarningsData = Awaited<ReturnType<typeof getMentorEarnings>>;

function EarningsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#D0DCF5] p-6 space-y-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-slate-100" />
            <div className="h-6 w-32 bg-slate-100 rounded" />
            <div className="h-3 w-40 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 h-60 animate-pulse" />
    </div>
  );
}

export default function MentorEarningsPage() {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getMentorEarnings()
      .then((data) => setEarnings(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filteredTransactions = (earnings?.transactions || []).filter((tx) => {
    const term = search.toLowerCase();
    return (
      tx.studentName.toLowerCase().includes(term) ||
      tx.title.toLowerCase().includes(term) ||
      tx.subject.toLowerCase().includes(term) ||
      tx.type.toLowerCase().includes(term)
    );
  });

  const maxAmount = earnings?.chartData && earnings.chartData.length > 0 
    ? Math.max(...earnings.chartData.map((d) => d.amount)) 
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">Earnings Ledger</h1>
        <p className="text-[13px] text-[#4A5A7A] mt-0.5">Track your overall revenue, monthly earnings, and transaction details.</p>
      </div>

      {loading ? (
        <EarningsSkeleton />
      ) : !earnings ? (
        <div className="text-center py-10">Failed to load earnings data.</div>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Earnings Card */}
            <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                <IconCoin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#9BA8C0] uppercase tracking-wider">Total Earnings</p>
                <h3 className="text-[28px] font-extrabold font-heading text-[#1B3A6B] leading-tight mt-1">
                  ₹{earnings.totalEarnings.toLocaleString("en-IN")}
                </h3>
                <p className="text-[11px] text-green-600 font-semibold mt-1 flex items-center gap-0.5">
                  <IconTrendingUp className="w-3.5 h-3.5" /> All-time completed payouts
                </p>
              </div>
            </div>

            {/* This Month Earnings Card */}
            <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EBF2FF] flex items-center justify-center text-[#2F7FE8] shrink-0">
                <IconCalendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#9BA8C0] uppercase tracking-wider">This Month&apos;s Revenue</p>
                <h3 className="text-[28px] font-extrabold font-heading text-[#1B3A6B] leading-tight mt-1">
                  ₹{earnings.thisMonthEarnings.toLocaleString("en-IN")}
                </h3>
                <p className="text-[11px] text-[#2F7FE8] font-semibold mt-1">
                  Accumulated since 1st of this month
                </p>
              </div>
            </div>
          </div>

          {/* Custom Monthly Performance Chart */}
          {earnings.chartData && earnings.chartData.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#D0DCF5] p-6 space-y-4">
              <h3 className="text-[14px] font-bold text-[#1B3A6B]">Monthly Growth Performance</h3>
              <div className="h-48 flex items-end gap-5 pt-6 px-4 border-b border-[#F0F3FB]">
                {earnings.chartData.map((d) => {
                  const pct = Math.max(10, (d.amount / maxAmount) * 100);
                  return (
                    <div key={d.name} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      {/* Tooltip on hover */}
                      <span className="text-[10px] font-bold text-[#1B3A6B] bg-[#EBF2FF] px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{d.amount.toLocaleString("en-IN")}
                      </span>
                      {/* Bar */}
                      <div
                        className="w-full bg-[#EBF2FF] hover:bg-[#2F7FE8] transition-all rounded-t-lg"
                        style={{ height: `${pct * 0.7}%` }} // Scaling it down to leave space for tooltip
                      />
                      {/* Label */}
                      <span className="text-[10px] font-bold text-[#9BA8C0] mt-1 shrink-0">
                        {d.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transactions Ledger */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-[15px] font-extrabold text-[#1B3A6B]">Transaction Ledger</h3>
              {/* Search */}
              <div className="relative w-full sm:max-w-xs">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BA8C0]" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D0DCF5] bg-white text-[12px] font-semibold text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8]"
                />
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-10 bg-white border border-[#D0DCF5] rounded-2xl text-[13px] text-[#9BA8C0]">
                No transactions logged.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#D0DCF5] overflow-hidden">
                <div className="overflow-x-auto premium-scrollbar">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#D0DCF5] bg-[#F5F8FF]">
                        <th className="px-6 py-4 text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider">Title & Subject</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider">Booking Type</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F3FB]">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#F5F8FF]/50 transition-colors">
                          <td className="px-6 py-4 text-[12px] font-semibold text-[#4A5A7A]">
                            {tx.date}
                          </td>
                          <td className="px-6 py-4 text-[13px] font-bold text-[#1B3A6B]">
                            {tx.studentName}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[12px] font-bold text-[#1B3A6B]">{tx.title}</p>
                            <p className="text-[10px] text-[#9BA8C0]">{tx.subject}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6F1FB] text-[#2F7FE8]">
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[13px] font-extrabold text-[#0F6E56] text-right">
                            +₹{tx.amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
