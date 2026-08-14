"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconPlus,
  IconUserPlus,
  IconTrash,
  IconEdit,
  IconMail,
  IconCheck,
  IconCalendarEvent,
  IconClipboardList,
  IconInfoCircle,
  IconX,
  IconCameraPlus,
  IconArrowRight,
  IconAlertCircle,
} from "@tabler/icons-react";
import {
  getParentChildren,
  inviteChild,
  updateChild,
  deleteChild,
  resendChildInvitation,
} from "../actions";
import { validateName, validateEmail, validateGrade, sanitizeText } from "@/lib/validate";

// NOTE: getParentChildren() currently always returns recentActivity: [] (hardcoded
// empty array, never populated server-side), so the "Recent Activity" feed rendered
// below is always empty in practice. Typed here as it's intended to be shaped, not
// as `any`, to satisfy lint without papering over the gap.
interface ChildActivity {
  type: "upcoming" | "due" | "completed";
  text: string;
  meta: string;
}
type Child = Omit<Awaited<ReturnType<typeof getParentChildren>>[number], "recentActivity"> & { recentActivity: ChildActivity[] };

export default function MyChildrenPage() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  // NOTE: pre-existing — captured on edit-open but never consulted by
  // handleAddOrEditChild, which currently only performs the "add" flow via
  // inviteChild() and fakes a success message for "edit" without persisting
  // changes. Kept as-is (not in scope) but retyped to satisfy lint.
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedIsInvite, setSelectedIsInvite] = useState(false);

  // Form State
  const [inputName, setInputName] = useState("");
  const [inputClass, setInputClass] = useState("");
  const [inputEmail, setInputEmail] = useState("");

  const loadChildren = async () => {
    try {
      setLoading(true);
      const data = await getParentChildren();
      setChildren(data);
    } catch (err) {
      console.error("Failed to load children list:", err);
      setError("Failed to load children list. Please sign in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-on-mount; setState fires after the awaited request resolves, not synchronously
    loadChildren();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedChildId(null);
    setInputName("");
    setInputClass("");
    setInputEmail("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (child: Child) => {
    setModalMode("edit");
    setSelectedChildId(child.id);
    setSelectedIsInvite(!child.joined);
    setInputName(child.name);
    setInputClass(child.grade);
    setInputEmail(child.email);
    setIsModalOpen(true);
  };

  const handleAddOrEditChild = async () => {
    setError(null);
    setSuccess(null);

    const nameCheck = validateName(inputName);
    if (!nameCheck.valid) { setError(nameCheck.error!); return; }

    const emailCheck = validateEmail(inputEmail);
    if (!emailCheck.valid) { setError(emailCheck.error!); return; }

    const gradeCheck = validateGrade(inputClass);
    if (!gradeCheck.valid) { setError(gradeCheck.error!); return; }

    try {
      if (modalMode === "add") {
        await inviteChild({
          name: sanitizeText(inputName).trim(),
          email: inputEmail.trim(),
          grade: sanitizeText(inputClass).trim(),
        });
        setSuccess(`Child ${inputName} added successfully.`);
      } else if (selectedChildId) {
        await updateChild(selectedChildId, selectedIsInvite, {
          name: sanitizeText(inputName).trim(),
          grade: sanitizeText(inputClass).trim(),
          email: selectedIsInvite ? inputEmail.trim() : undefined,
        });
        setSuccess(`Child profile changes for ${inputName} saved.`);
      }
      setIsModalOpen(false);
      await loadChildren();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add/update child profile.");
    }
  };

  const handleDelete = async (childId: string, isInvite: boolean) => {
    if (!window.confirm("Are you sure you want to remove this child profile?")) return;
    setError(null);
    setSuccess(null);
    try {
      await deleteChild(childId, isInvite);
      setSuccess("Child profile removed successfully.");
      await loadChildren();
    } catch (err) {
      console.error("Failed to remove child profile:", err);
      setError("Failed to remove child profile. Please try again.");
    }
  };

  const handleResendInvite = async (e: React.MouseEvent, inviteId: string) => {
    e.stopPropagation();
    setError(null);
    setSuccess(null);
    try {
      await resendChildInvitation(inviteId);
      setSuccess("Dashboard invitation link resent successfully.");
    } catch (err) {
      console.error("Failed to resend invitation:", err);
      setError("Failed to resend invitation. Please try again.");
    }
  };

  const getChildColorBg = (name: string) => {
    const hash = name.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const colors = ["bg-[#2F7FE8]", "bg-[#993556]", "bg-[#0F6E56]", "bg-[#534AB7]"];
    return colors[hash % colors.length];
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col font-sans text-[#1B3A6B]">
      {/* PAGE HEADER */}
      <header className="bg-[#f5f8ff] px-6 md:px-12 py-8 border-b border-[#d0dcf5]">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* Breadcrumb */}
            <nav className="text-[11px] text-slate-400 mb-3 flex items-center gap-1.5 font-medium">
              <Link href="/" className="hover:text-[#2F7FE8] transition-colors">Home</Link>
              <span className="text-slate-300">/</span>
              <span className="text-[#1B3A6B] font-semibold">My children</span>
            </nav>
            
            <h1 className="font-heading text-3xl font-extrabold text-[#1B3A6B] mb-1">
              My children
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Manage your children&apos;s profiles and view their recent activity
            </p>
          </div>
          
          <button
            onClick={handleOpenAddModal}
            className="text-xs font-semibold px-5 py-3 bg-[#1B3A6B] hover:bg-[#2F7FE8] text-white rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-sm self-start sm:self-auto"
          >
            <IconPlus className="w-4 h-4 stroke-[3]" />
            <span>Add a child</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="max-w-[1000px] mx-auto w-full px-6 py-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#d0dcf5] rounded-2xl overflow-hidden shadow-sm animate-pulse flex flex-col justify-between"
              >
                {/* Top section */}
                <div className="p-5 flex gap-4 items-start">
                  <div className="w-13 h-13 rounded-full bg-slate-200 flex-shrink-0" style={{ width: 52, height: 52 }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-32" />
                    <div className="h-3 bg-slate-100 rounded w-20" />
                    <div className="h-3 bg-slate-100 rounded w-40" />
                    <div className="h-5 bg-green-100 rounded-full w-28" />
                  </div>
                </div>

                <div className="h-px bg-slate-100 mx-5" />

                {/* Activity feed skeleton */}
                <div className="px-5 py-4 space-y-3">
                  <div className="h-3 bg-slate-100 rounded w-24" />
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3.5 bg-slate-200 rounded w-4/5" />
                        <div className="h-2.5 bg-slate-100 rounded w-24" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-[#d0dcf5] bg-slate-50 flex items-center justify-between">
                  <div className="h-3.5 bg-slate-200 rounded w-24" />
                  <div className="h-3.5 bg-blue-100 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error && children.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md shadow-sm">
            <IconAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="font-heading text-lg font-bold text-red-700 mb-2">Access Denied</h3>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-semibold px-6 py-3 bg-[#1B3A6B] text-white rounded-lg hover:bg-[#2F7FE8] transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-[1000px] mx-auto w-full px-6 py-8 flex-1">

          {/* CHILDREN GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-white border border-[#d0dcf5] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                {/* Top Section */}
                <div className="p-5 flex gap-4 items-start relative">
                  <div className={`w-13 h-13 rounded-full text-white flex items-center justify-center font-heading text-base font-extrabold flex-shrink-0 shadow-inner ${getChildColorBg(child.name)}`}>
                    {child.avatarText}
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h4 className="font-heading text-sm font-bold text-[#1B3A6B] truncate">{child.name}</h4>
                    <p className="text-[11px] text-slate-400 font-semibold">{child.grade}</p>
                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 truncate">
                      <IconMail className="w-3.5 h-3.5 text-slate-350" />
                      {child.email}
                    </p>

                    {/* Joined Status Badge */}
                    {child.joined && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-150 mt-1">
                        <IconCheck className="w-3 h-3 stroke-[3]" />
                        Ready to sign in
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 absolute top-4 right-4">
                    {!child.joined && (
                      <button
                        onClick={(e) => handleResendInvite(e, child.id)}
                        className="w-7.5 h-7.5 border border-[#d0dcf5] hover:border-[#1B3A6B] bg-white text-slate-500 hover:text-[#1B3A6B] rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                        title="Resend invitation email"
                      >
                        <IconMail className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditModal(child)}
                      className="w-7.5 h-7.5 border border-[#d0dcf5] hover:border-[#1B3A6B] bg-white text-slate-500 hover:text-[#1B3A6B] rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      title="Edit child profile"
                    >
                      <IconEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(child.id, !child.joined)}
                      className="w-7.5 h-7.5 border border-[#d0dcf5] hover:border-red-500 bg-white text-slate-500 hover:text-red-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      title="Remove child"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="h-px bg-slate-100 mx-5"></div>

                {/* Activity Feed */}
                <div className="px-5 py-4 space-y-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Recent Activity</span>
                  {child.recentActivity && child.recentActivity.length > 0 ? (
                    child.recentActivity.map((act, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          act.type === "upcoming" ? "bg-blue-50 text-[#2F7FE8]" : act.type === "due" ? "bg-purple-50 text-[#534AB7]" : "bg-green-50 text-[#085041]"
                        }`}>
                          {act.type === "upcoming" ? (
                            <IconCalendarEvent className="w-4 h-4" />
                          ) : act.type === "due" ? (
                            <IconClipboardList className="w-4 h-4" />
                          ) : (
                            <IconCheck className="w-4 h-4 stroke-[3]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="text-[11px] text-[#1B3A6B] font-semibold truncate leading-tight">
                            {act.type === "upcoming" ? "Next: " : act.type === "due" ? "Essay draft " : "Attended "}
                            <strong className="font-bold">{act.text.replace("Next: ", "").replace("Essay draft ", "").replace("Attended ", "")}</strong>
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium">{act.meta}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 font-medium italic">No activity yet</p>
                  )}
                </div>

                {/* Card Footer stats and link */}
                <div className="px-5 py-3 border-t border-[#d0dcf5] bg-slate-50 flex items-center justify-between text-xs">
                  <div className="text-slate-500 font-medium">
                    Attendance:{" "}
                    {child.attendance !== null && child.attendance !== undefined ? (
                      <strong className="text-[#1B3A6B] font-bold">{child.attendance}%</strong>
                    ) : (
                      <span className="text-slate-400 font-semibold">—</span>
                    )}
                  </div>
                  <a
                    href={`/bookings`}
                    className="text-[#2F7FE8] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    View bookings
                    <IconArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}

            {/* ADD A CHILD TILE */}
            <div
              onClick={handleOpenAddModal}
              className="border-2 border-dashed border-[#d0dcf5] hover:border-[#2F7FE8] bg-[#F9FBFF] hover:bg-[#E6F1FB] rounded-2xl flex items-center justify-center min-h-[260px] cursor-pointer transition-all group"
            >
              <div className="text-center text-slate-400 group-hover:text-[#2F7FE8]">
                <IconUserPlus className="w-8 h-8 mx-auto mb-2 transition-transform duration-200 group-hover:scale-105" />
                <span className="text-xs font-semibold">Add another child</span>
              </div>
            </div>
          </div>

          {/* EXPLAINER BOX */}
          <div className="mt-8 bg-[#E6F1FB] border border-[#b5d4f4] rounded-2xl p-4 flex gap-3">
            <IconInfoCircle className="w-5 h-5 text-[#2F7FE8] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#0C447C] leading-relaxed">
              <strong>How it works:</strong> Once you add a child, they can create their student account on the LMS login page using the exact email you registered for them here. Once registered, they get full access to join classes, view course materials and submit assignments.
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CHILD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1B3A6B]/45 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[480px] overflow-hidden border border-slate-100 shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-heading text-base font-bold text-[#1B3A6B]">
                {modalMode === "add" ? "Add a child" : "Edit child"}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 border border-[#d0dcf5] hover:border-[#1B3A6B] rounded-lg flex items-center justify-center text-slate-500 hover:text-[#1B3A6B] transition-colors cursor-pointer"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4.5">
              {error && (
                <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 text-[11px] font-semibold">
                  {error}
                </div>
              )}

              {/* Photo Upload area (static design display) */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#d0dcf5] bg-slate-50 flex items-center justify-center text-slate-350 hover:border-[#2F7FE8] hover:text-[#2F7FE8] cursor-pointer transition-colors">
                  <IconCameraPlus className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-slate-400">Upload photo (optional)</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500">Child&apos;s name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Kumar"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="border border-[#d0dcf5] rounded-xl px-4 py-2.5 text-xs text-[#1B3A6B] font-medium outline-none focus:border-[#2F7FE8] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500">Class / Grade</label>
                <input
                  type="text"
                  placeholder="e.g. Class 10"
                  value={inputClass}
                  onChange={(e) => setInputClass(e.target.value)}
                  className="border border-[#d0dcf5] rounded-xl px-4 py-2.5 text-xs text-[#1B3A6B] font-medium outline-none focus:border-[#2F7FE8] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500">Child&apos;s email</label>
                <input
                  type="email"
                  placeholder="child@email.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  disabled={modalMode === "edit" && !selectedIsInvite}
                  className="border border-[#d0dcf5] rounded-xl px-4 py-2.5 text-xs text-[#1B3A6B] font-medium outline-none focus:border-[#2F7FE8] transition-colors disabled:bg-slate-50 disabled:text-slate-400"
                />
                <span className="text-[9px] text-slate-400 font-medium mt-0.5 leading-normal">
                  {modalMode === "edit" && !selectedIsInvite
                    ? "This is your child's active sign-in email and can't be changed here — contact support if it needs to change."
                    : "Your child must use this exact email when signing up on the LMS login page to link their profile."}
                </span>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 flex gap-3">
              <button
                onClick={handleAddOrEditChild}
                className="flex-1 text-xs font-semibold py-3 bg-[#1B3A6B] text-white rounded-xl hover:bg-[#2F7FE8] transition-colors cursor-pointer border-none"
              >
                {modalMode === "add" ? "Add child" : "Save changes"}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 text-xs font-semibold py-3 border border-[#d0dcf5] text-[#1B3A6B] rounded-xl hover:border-[#1B3A6B] transition-colors cursor-pointer bg-transparent"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {success && (
        <div className="fixed bottom-5 right-5 bg-[#1B3A6B] text-white border border-[#2F7FE8] text-xs px-4 py-3 rounded-xl shadow-xl z-50 animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-450 animate-pulse"></span>
          {success}
        </div>
      )}
    </div>
  );
}
