"use client";

import React, { useEffect, useState } from "react";
import { IconX, IconSearch, IconUserPlus, IconCheck } from "@tabler/icons-react";
import {
  searchAdminCustomers,
  getAdminParentChildren,
  createManualStudentAccount,
  createManualBooking,
} from "../../../actions";
import type { getAdminData } from "../../../actions";

type AdminData = Awaited<ReturnType<typeof getAdminData>>;
type SearchResult = Awaited<ReturnType<typeof searchAdminCustomers>>[number];
type ParentChild = Awaited<ReturnType<typeof getAdminParentChildren>>[number];

const TIME_SLOTS = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"];

function getDayOfWeekName(dateStr: string): string {
  if (!dateStr) return "Mon";
  const d = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[d.getDay()];
}

function getTomorrowDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  courses: AdminData["courses"];
  sessions: AdminData["sessions"];
}

type CustomerMode = "existing" | "new";
type TargetType = "course" | "session";

export default function NewBookingModal({ isOpen, onClose, onCreated, courses, sessions }: NewBookingModalProps) {
  const [customerMode, setCustomerMode] = useState<CustomerMode>("existing");

  // Existing-customer search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedParent, setSelectedParent] = useState<SearchResult | null>(null);
  const [parentChildren, setParentChildren] = useState<ParentChild[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [resolvedCustomer, setResolvedCustomer] = useState<{ studentId: string; parentId: string | null; label: string; email: string } | null>(null);

  // New-student fields
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentName, setNewStudentName] = useState("");

  // Target selection
  const [targetType, setTargetType] = useState<TargetType>("course");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [duration, setDuration] = useState(60);
  const [selectedDate, setSelectedDate] = useState(getTomorrowDateString());
  const [selectedTime, setSelectedTime] = useState("10:00 AM");

  // Payment
  type PaymentMode = "full" | "partial" | "none";
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("none");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [amountCollected, setAmountCollected] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCourses = courses.filter((c) => c.status === "Active");
  const activeSessions = sessions.filter((s) => s.status === "Active");

  const selectedCourse = activeCourses.find((c) => c.id === selectedTargetId);
  const selectedSession = activeSessions.find((s) => s.id === selectedTargetId);

  // Calculate base total price of selected item
  let calculatedTotal = 0;
  if (targetType === "course" && selectedCourse) {
    calculatedTotal = Number(selectedCourse.price);
  } else if (targetType === "session" && selectedSession) {
    calculatedTotal = Number(selectedSession.price) * (duration === 90 && selectedSession.type === "1-on-1" ? 1.5 : 1);
  }
  calculatedTotal = Math.round(calculatedTotal);

  const needsSlot =
    (targetType === "course" && selectedCourse?.format === "Live individual") ||
    (targetType === "session" && (selectedSession?.type === "1-on-1" || selectedSession?.isRepeatable));

  const needsDurationOnly = targetType === "session" && selectedSession?.type === "1-on-1";

  // Reset everything whenever the modal opens fresh
  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the whole form when the modal is reopened; the modal stays mounted (isOpen just toggles visibility) so this can't be done via a `key` remount
    setCustomerMode("existing");
    setSearchTerm("");
    setSearchResults([]);
    setSelectedParent(null);
    setParentChildren([]);
    setResolvedCustomer(null);
    setNewStudentEmail("");
    setNewStudentName("");
    setTargetType("course");
    setSelectedTargetId("");
    setDuration(60);
    setSelectedDate(getTomorrowDateString());
    setSelectedTime("10:00 AM");
    setPaymentMode("none");
    setPaymentMethod("Cash");
    setPaymentReference("");
    setAmountCollected(0);
    setDueDate("");
    setAdminNotes("");
    setError(null);
  }, [isOpen]);

  // Debounced customer search
  useEffect(() => {
    if (customerMode !== "existing" || selectedParent) return;
    if (searchTerm.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears stale results when the query becomes too short to search
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const res = await searchAdminCustomers(searchTerm);
        setSearchResults(res);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [searchTerm, customerMode, selectedParent]);

  // Auto-fill amount collected based on payment mode
  useEffect(() => {
    if (paymentMode === "full") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- keeps the editable amount field's default in sync with both payment mode and the computed total; amount is still user-editable afterward
      setAmountCollected(calculatedTotal);
    } else if (paymentMode === "partial") {
      setAmountCollected(Math.round(calculatedTotal / 2));
    } else {
      setAmountCollected(0);
    }
  }, [paymentMode, calculatedTotal]);

  if (!isOpen) return null;

  const handlePickCustomer = async (result: SearchResult) => {
    if (result.role === "parent") {
      setSelectedParent(result);
      setLoadingChildren(true);
      try {
        const kids = await getAdminParentChildren(result.id);
        setParentChildren(kids);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingChildren(false);
      }
    } else {
      setResolvedCustomer({ studentId: result.id, parentId: null, label: result.fullName, email: result.email });
    }
  };

  const handlePickChild = (child: ParentChild) => {
    if (!selectedParent) return;
    setResolvedCustomer({ studentId: child.id, parentId: selectedParent.id, label: `${child.name} (child of ${selectedParent.fullName})`, email: child.email || selectedParent.email });
  };

  const resetCustomerSelection = () => {
    setSelectedParent(null);
    setParentChildren([]);
    setResolvedCustomer(null);
    setSearchTerm("");
    setSearchResults([]);
  };

  const canSubmit =
    (customerMode === "existing" ? !!resolvedCustomer : newStudentEmail.trim().length > 3) &&
    !!selectedTargetId &&
    !submitting;

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      let studentId: string;
      let parentId: string | null;

      if (customerMode === "new") {
        const created = await createManualStudentAccount(newStudentEmail, newStudentName);
        studentId = created.studentId;
        parentId = null;
      } else {
        if (!resolvedCustomer) throw new Error("Select a customer first.");
        studentId = resolvedCustomer.studentId;
        parentId = resolvedCustomer.parentId;
      }

      await createManualBooking({
        targetId: selectedTargetId,
        targetType,
        studentId,
        parentId,
        durationMinutes: needsDurationOnly ? duration : undefined,
        selectedSlot: needsSlot ? { day: getDayOfWeekName(selectedDate), time: selectedTime } : undefined,
        selectedDate: needsSlot ? selectedDate : undefined,
        paymentMode,
        paymentDone: paymentMode === "full",
        paymentMethod: paymentMode !== "none" ? paymentMethod : undefined,
        paymentReference: paymentMode !== "none" ? (paymentReference || undefined) : undefined,
        amountCollected: paymentMode !== "none" ? Number(amountCollected) : 0,
        totalAmount: calculatedTotal,
        dueDate: paymentMode === "partial" ? (dueDate || undefined) : undefined,
        adminNotes: adminNotes || undefined,
      });

      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-[#1B3A6B]/30 backdrop-blur-xs z-[202] transition-opacity duration-300 animate-fade-in" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-h-[88vh] bg-white rounded-3xl z-[203] shadow-2xl border border-border-subtle overflow-hidden flex flex-col animate-scale-up font-sans">
        {/* Sticky Header */}
        <header className="px-6 py-4 border-b border-[#E6EBF8] flex items-center justify-between bg-white shrink-0 z-10">
          <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B]">New Manual Booking</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 border border-[#E6EBF8] bg-white hover:bg-slate-100 rounded-xl text-primary text-xs flex items-center justify-center cursor-pointer transition-colors"
          >
            <IconX className="w-4 h-4 text-slate-600" />
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 premium-scrollbar">
          {/* STEP 1: CUSTOMER */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">1. Customer</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setCustomerMode("existing"); resetCustomerSelection(); }}
                className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${customerMode === "existing" ? "bg-primary text-white border-primary" : "bg-white text-text-muted border-slate-200"}`}
              >
                Existing customer
              </button>
              <button
                type="button"
                onClick={() => { setCustomerMode("new"); resetCustomerSelection(); }}
                className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${customerMode === "new" ? "bg-primary text-white border-primary" : "bg-white text-text-muted border-slate-200"}`}
              >
                New student
              </button>
            </div>

            {customerMode === "existing" ? (
              resolvedCustomer ? (
                <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50/40 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-green-800 truncate">{resolvedCustomer.label}</p>
                    <p className="text-[10px] text-green-700 truncate">{resolvedCustomer.email}</p>
                  </div>
                  <button type="button" onClick={resetCustomerSelection} className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer shrink-0 ml-2">Change</button>
                </div>
              ) : selectedParent ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border border-slate-200 bg-slate-50 rounded-xl">
                    <p className="text-xs font-bold text-primary">Parent: {selectedParent.fullName}</p>
                    <button type="button" onClick={resetCustomerSelection} className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer">Change</button>
                  </div>
                  <p className="text-[10px] font-bold text-text-muted uppercase">Select which child</p>
                  {loadingChildren ? (
                    <p className="text-xs text-text-muted">Loading children...</p>
                  ) : parentChildren.length === 0 ? (
                    <p className="text-xs text-text-muted italic">This parent has no registered children yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {parentChildren.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => handlePickChild(child)}
                          className="w-full flex items-center justify-between p-2.5 border border-slate-200 rounded-lg hover:border-secondary hover:bg-[#F5F8FF] cursor-pointer text-left"
                        >
                          <span className="text-xs font-semibold text-primary">{child.name}</span>
                          <span className="text-[10px] text-text-muted">{child.grade}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg outline-none font-semibold text-primary"
                    />
                  </div>
                  {searching && <p className="text-[10px] text-text-muted px-1">Searching...</p>}
                  {searchResults.length > 0 && (
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto premium-scrollbar">
                      {searchResults.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handlePickCustomer(r)}
                          className="w-full flex items-center justify-between p-2.5 border border-slate-200 rounded-lg hover:border-secondary hover:bg-[#F5F8FF] cursor-pointer text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-primary truncate">{r.fullName}</p>
                            <p className="text-[10px] text-text-muted truncate">{r.email}</p>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase shrink-0 ml-2">
                            {r.role}{r.role === "parent" ? ` · ${r.childrenCount}` : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                  <IconUserPlus className="w-3.5 h-3.5 shrink-0" />
                  Creates a new independent student account (no parent link).
                </div>
                <input
                  type="email"
                  placeholder="Student email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none font-semibold text-primary"
                />
                <input
                  type="text"
                  placeholder="Full name (optional)"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none font-semibold text-primary"
                />
              </div>
            )}
          </div>

          {/* STEP 2: ITEM */}
          <div className="space-y-2.5 border-t border-[#E6EBF8] pt-4">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">2. What are they booking?</p>
            <div className="grid grid-cols-2 gap-2">
              {(["course", "session"] as TargetType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTargetType(t); setSelectedTargetId(""); }}
                  className={`py-2 text-xs font-bold rounded-lg border capitalize transition-all cursor-pointer ${targetType === t ? "bg-primary text-white border-primary" : "bg-white text-text-muted border-slate-200"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none bg-white text-primary font-semibold"
            >
              <option value="">Select a {targetType}...</option>
              {targetType === "course" && activeCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.title} — ₹{c.price} ({c.format})</option>
              ))}
              {targetType === "session" && activeSessions.map((s) => (
                <option key={s.id} value={s.id}>{s.title} — ₹{s.price} ({s.type})</option>
              ))}
            </select>

            {needsDurationOnly && (
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none bg-white text-primary font-semibold"
              >
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            )}

            {needsSlot && (
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs p-2.5 border border-slate-200 rounded-lg outline-none bg-white text-primary"
                />
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="text-xs p-2.5 border border-slate-200 rounded-lg outline-none bg-white text-primary"
                >
                  {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* STEP 3: PAYMENT */}
          <div className="space-y-3 border-t border-[#E6EBF8] pt-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">3. Payment Status</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentMode("full")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-all ${paymentMode === "full" ? "bg-green-600 text-white border-green-600 shadow-xs" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  Full Paid
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("partial")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-all ${paymentMode === "partial" ? "bg-amber-500 text-white border-amber-500 shadow-xs" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  Partial Paid
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("none")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-all ${paymentMode === "none" ? "bg-slate-700 text-white border-slate-700 shadow-xs" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  Unpaid
                </button>
              </div>
            </div>

            {paymentMode !== "none" && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-xs p-2.5 border border-slate-200 rounded-lg outline-none bg-white text-primary font-semibold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Other">Other</option>
                  </select>
                  <div>
                    <input
                      type="number"
                      min={0}
                      value={amountCollected}
                      onChange={(e) => setAmountCollected(Number(e.target.value))}
                      placeholder="Amount collected (₹)"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none bg-white text-primary font-bold"
                    />
                    {paymentMode === "partial" && (
                      <span className="text-[9px] text-slate-400 block mt-0.5">Total item price: ₹{calculatedTotal.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                {paymentMode === "partial" && (
                  <div className="grid grid-cols-2 gap-2.5 p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                    <div>
                      <span className="text-[9px] uppercase font-extrabold text-amber-800 block mb-1">Remaining Dues</span>
                      <div className="font-heading text-sm font-extrabold text-amber-900">
                        ₹{Math.max(0, calculatedTotal - amountCollected).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-extrabold text-amber-800 block mb-1">Due Date</span>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full text-xs p-1.5 border border-amber-300 rounded-lg bg-white outline-none font-bold text-amber-900"
                      />
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Reference / transaction note (optional)"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none bg-white text-primary font-semibold"
                />

                {paymentMode === "full" && (
                  <p className="text-[10px] text-green-700 bg-green-50/50 border border-green-100 rounded-lg p-2 font-medium">
                    This booking will be created as <strong>Confirmed & Fully Paid</strong>. Student & mentor will be notified.
                  </p>
                )}

                {paymentMode === "partial" && (
                  <p className="text-[10px] text-amber-800 bg-amber-50/50 border border-amber-200/60 rounded-lg p-2 font-medium">
                    This booking will be created as <strong>Confirmed & Partially Paid</strong>. Student can access classes immediately while dues are scheduled for due date.
                  </p>
                )}
              </div>
            )}

            {paymentMode === "none" && (
              <p className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg p-2 font-medium">
                This booking will be created as <strong>Pending</strong> — confirm and collect payment later from the bookings ledger.
              </p>
            )}

            <textarea
              rows={2}
              placeholder="Admin notes (optional)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none bg-white text-primary resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-lg text-center">
              {error}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <footer className="p-6 pt-3 border-t border-[#E6EBF8] bg-white flex gap-2 shrink-0 z-10">
          <button
            onClick={onClose}
            className="flex-1 text-xs font-bold py-2.5 rounded-xl border border-slate-200 bg-white text-primary hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-[1.5] text-xs font-bold py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {submitting ? "Creating..." : <><IconCheck className="w-4 h-4" /> Create Booking</>}
          </button>
        </footer>
      </div>
    </>
  );
}
