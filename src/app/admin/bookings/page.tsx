"use client";

import React, { useState, useEffect } from "react";
import {
  IconSearch,
  IconLayoutGrid,
  IconList,
} from "@tabler/icons-react";
import {
  getAdminData,
  cancelBooking,
} from "../../actions";
import { SkeletonCard } from "@/components/Skeleton";

interface Booking {
  id: string;
  parentName: string;
  parentEmail: string;
  studentName: string;
  bookingType: string;
  itemTitle: string;
  amountPaid: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // View States - default to card/grid
  const [bookingView, setBookingView] = useState<"grid" | "list">("list");

  // Search state
  const [bookingSearch, setBookingSearch] = useState("");

  // Selected booking details popup modal state
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  const loadData = async () => {
    try {
      const res = await getAdminData();
      setBookings(res.bookings || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelBooking = async (id: string) => {
    if (confirm("Are you sure you want to cancel this booking and all its scheduled classes?")) {
      try {
        await cancelBooking(id);
        await loadData();
      } catch (err: any) {
        alert("Failed to cancel booking: " + err.message);
      }
    }
  };

  // Filters application
  const filteredBookings = bookings.filter((b) => {
    const term = bookingSearch.toLowerCase();
    const parentName = b.parentName || "";
    const parentEmail = b.parentEmail || "";
    const studentName = b.studentName || "";
    const itemTitle = b.itemTitle || "";
    const bookingType = b.bookingType || "";
    return (
      parentName.toLowerCase().includes(term) ||
      parentEmail.toLowerCase().includes(term) ||
      studentName.toLowerCase().includes(term) ||
      itemTitle.toLowerCase().includes(term) ||
      bookingType.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Toolbar Skeleton */}
        <div className="flex items-center justify-between gap-3 flex-wrap animate-pulse">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="h-8 bg-slate-200 rounded-lg w-48"></div>
          </div>
        </div>
        {/* Bookings Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-lg flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search bookings by parent, student, or item..."
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-border-subtle rounded-lg bg-white outline-none font-semibold text-[#1B3A6B]"
            />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex border border-[#E6EBF8] rounded-lg overflow-hidden shrink-0 shadow-sm bg-white">
            <button
              onClick={() => setBookingView("grid")}
              className={`p-2 cursor-pointer transition-colors ${
                bookingView === "grid" ? "bg-[#EBF2FF] text-[#1B3A6B]" : "bg-white text-[#9BA8C0]"
              }`}
            >
              <IconLayoutGrid className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setBookingView("list")}
              className={`p-2 cursor-pointer transition-colors ${
                bookingView === "list" ? "bg-[#EBF2FF] text-[#1B3A6B]" : "bg-white text-[#9BA8C0]"
              }`}
            >
              <IconList className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* View Render */}
      {bookingView === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
          {filteredBookings.map((b) => {
            const isUnknownParent = !b.parentName || b.parentName === "Unknown Parent";
            const parentDisplayName = isUnknownParent ? b.parentEmail : b.parentName;

            return (
              <div
                key={b.id}
                className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-[#9BA8C0] font-bold block">
                        #{b.id.substring(0, 8)}
                      </span>
                      <h4 className="font-bold text-[#1B3A6B] text-xs mt-1.5 leading-snug">{b.itemTitle}</h4>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                      b.bookingType === "Course" 
                        ? "bg-purple-50 text-purple-600 border border-purple-100" 
                        : "bg-blue-50 text-blue-600 border border-blue-100"
                    }`}>
                      {b.bookingType}
                    </span>
                  </div>
                  <div className="text-xs text-[#6B7A99] space-y-1.5 mt-4 font-medium">
                    <div>
                      <strong>Parent Details:</strong> {parentDisplayName}
                    </div>
                    {!isUnknownParent && (
                      <div className="text-[9px] text-[#9BA8C0] font-semibold pl-1 border-l-2 border-[#E6EBF8]">
                        {b.parentEmail}
                      </div>
                    )}
                    <div><strong>Student Account:</strong> {b.studentName}</div>
                    <div><strong>Gross Amount:</strong> ₹{b.amountPaid.toLocaleString()}</div>
                    <div>
                      <strong>Booked Date:</strong>{" "}
                      {new Date(b.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <strong>Payment Status:</strong>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        b.paymentStatus === "paid" 
                          ? "bg-green-50 text-green-700 border border-green-200" 
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {b.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-[#E6EBF8] pt-3 mt-4">
                  <button
                    onClick={() => setSelectedBooking(b)}
                    className="flex-1 text-xs font-bold py-2 rounded-xl bg-[#EBF2FF] text-[#1B3A6B] hover:bg-[#2F7FE8] hover:text-white transition-all cursor-pointer text-center"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    disabled={b.status === "cancelled"}
                    className="px-3 text-xs py-2 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {b.status === "cancelled" ? "Cancelled" : "Cancel"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-4 shadow-sm overflow-x-auto font-sans">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-badge-bg/30 border-b border-[#E6EBF8]">
                <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left">Booking ID</th>
                <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left">Parent Details</th>
                <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left">Student</th>
                <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left">Booked Item</th>
                <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left">Type</th>
                <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left font-sans">Amount</th>
                <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left">Payment Status</th>
                <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left">Date</th>
                <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-xs text-text-muted italic">
                    No bookings found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isUnknownParent = !b.parentName || b.parentName === "Unknown Parent";
                  const parentDisplayName = isUnknownParent ? b.parentEmail : b.parentName;

                  return (
                    <tr key={b.id} className="border-b border-[#E6EBF8]/50 hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 text-xs font-mono text-primary font-bold">
                        #{b.id.substring(0, 8)}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-bold text-[#1B3A6B]">{parentDisplayName}</div>
                        {!isUnknownParent && (
                          <div className="text-[9px] text-[#9BA8C0] mt-0.5">{b.parentEmail}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-primary font-semibold">{b.studentName}</td>
                      <td className="py-3.5 px-4 text-xs font-bold text-[#1B3A6B]">{b.itemTitle}</td>
                      <td className="py-3.5 px-4 text-xs font-medium">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          b.bookingType === "Course" 
                            ? "bg-[#EBF2FF] text-[#1B3A6B] border border-blue-100" 
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}>
                          {b.bookingType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-primary">₹{b.amountPaid.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          b.paymentStatus === "paid" 
                            ? "bg-green-50 text-green-700 border border-green-200" 
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {b.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-text-muted font-medium">
                        {new Date(b.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="text-[10px] font-bold px-2.5 py-1 rounded border border-border-subtle bg-white text-primary hover:bg-slate-50 cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            disabled={b.status === "cancelled"}
                            className="text-[10px] font-bold px-2.5 py-1 rounded border border-red-200 bg-white text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-40"
                          >
                            {b.status === "cancelled" ? "Cancelled" : "Cancel"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* BOOKING DETAILS MODAL OVERLAY */}
      {selectedBooking && (
        <>
          <div
            onClick={() => setSelectedBooking(null)}
            className="fixed inset-0 bg-[#1B3A6B]/30 backdrop-blur-xs z-[202] transition-opacity duration-300 animate-fade-in"
          ></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-white rounded-3xl z-[203] shadow-2xl border border-border-subtle p-6 space-y-4 animate-scale-up font-sans">
            <header className="flex items-center justify-between pb-3 border-b border-[#E6EBF8]">
              <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B]">
                Booking Details
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-7 h-7 border border-[#E6EBF8] bg-surface hover:bg-badge-bg rounded-lg text-primary text-xs flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </header>

            <div className="space-y-3.5 text-xs text-[#6B7A99] font-medium">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[10px] text-text-muted font-bold uppercase pt-0.5">Booking ID:</span>
                <span className="col-span-2 font-mono text-[#1B3A6B] font-bold">#{selectedBooking.id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[10px] text-text-muted font-bold uppercase pt-0.5">Parent Name:</span>
                <span className="col-span-2 text-[#1B3A6B] font-bold">{selectedBooking.parentName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[10px] text-text-muted font-bold uppercase pt-0.5">Parent Email:</span>
                <span className="col-span-2 text-[#1B3A6B] font-semibold">{selectedBooking.parentEmail}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[10px] text-text-muted font-bold uppercase pt-0.5">Student Name:</span>
                <span className="col-span-2 text-[#1B3A6B] font-semibold">{selectedBooking.studentName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[10px] text-text-muted font-bold uppercase pt-0.5">Booked Item:</span>
                <span className="col-span-2 font-bold text-[#1B3A6B]">{selectedBooking.itemTitle}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[10px] text-text-muted font-bold uppercase pt-0.5">Type:</span>
                <span className="col-span-2 font-semibold">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    selectedBooking.bookingType === "Course" 
                      ? "bg-purple-50 text-purple-600 border border-purple-100" 
                      : "bg-blue-50 text-blue-600 border border-blue-100"
                  }`}>
                    {selectedBooking.bookingType}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[10px] text-text-muted font-bold uppercase pt-0.5">Amount Paid:</span>
                <span className="col-span-2 font-extrabold text-[#1B3A6B] font-sans">₹{selectedBooking.amountPaid.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[10px] text-text-muted font-bold uppercase pt-0.5">Payment:</span>
                <span className="col-span-2 font-semibold">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    selectedBooking.paymentStatus === "paid" 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {selectedBooking.paymentStatus.toUpperCase()}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[10px] text-text-muted font-bold uppercase pt-0.5">Status:</span>
                <span className="col-span-2 font-semibold">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    selectedBooking.status === "confirmed" 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {selectedBooking.status.toUpperCase()}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[10px] text-text-muted font-bold uppercase pt-0.5">Booked At:</span>
                <span className="col-span-2 text-text-muted font-semibold">
                  {new Date(selectedBooking.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
            </div>

            <footer className="pt-4 border-t border-[#E6EBF8] flex">
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full text-xs font-bold py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </footer>
          </div>
        </>
      )}
    </div>
  );
}
