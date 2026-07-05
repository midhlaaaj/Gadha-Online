"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconSearch,
  IconLayoutGrid,
  IconList,
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
} from "@tabler/icons-react";
import {
  getAdminData,
  upsertMentor,
  deleteMentor as apiDeleteMentor,
} from "../../actions";
import { SkeletonCard } from "@/components/Skeleton";

interface Mentor {
  id: string;
  name: string;
  email?: string;
  subject: string;
  rating: number;
  students: number;
  courses: number;
  rate: number;
  verified: boolean;
  avatarText: string;
  avatarBg: string;
  qualification: string;
  experience: number;
  bio: string;
  isInvitation?: boolean;
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  // View States - default to card/grid
  const [mentorView, setMentorView] = useState<"grid" | "list">("grid");

  // Search & Filter States
  const [mentorSearch, setMentorSearch] = useState("");
  const [mentorSubjectFilter, setMentorSubjectFilter] = useState("All subjects");
  const [mentorStatusFilter, setMentorStatusFilter] = useState("All statuses");

  // Drawer modal state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEditId, setDrawerEditId] = useState<string | null>(null);
  const [drawerForm, setDrawerForm] = useState<any>({});

  const loadData = async () => {
    try {
      const res = await getAdminData();
      setMentors(res.mentors);
    } catch (err) {
      console.error("Failed to load mentors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDrawer = (id: string | null = null) => {
    setDrawerEditId(id);
    if (id) {
      const item = mentors.find((x) => x.id === id);
      setDrawerForm({ ...item });
    } else {
      setDrawerForm({
        name: "",
        email: "",
        subject: "Mathematics",
        rate: 0,
        bio: "",
        experience: 1,
        qualification: "",
        verified: false,
      });
    }
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerEditId(null);
  };

  const saveDrawerData = async () => {
    try {
      await upsertMentor(drawerForm);
      closeDrawer();
      await loadData();
    } catch (err: any) {
      alert("Error saving mentor: " + err.message);
    }
  };

  const deleteItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this mentor?")) {
      try {
        await apiDeleteMentor(id);
        await loadData();
      } catch (err: any) {
        alert("Error deleting mentor: " + err.message);
      }
    }
  };

  // Filters application
  const filteredMentors = mentors.filter((x) => {
    const matchSearch =
      x.name.toLowerCase().includes(mentorSearch.toLowerCase()) ||
      x.qualification.toLowerCase().includes(mentorSearch.toLowerCase());
    const matchSubject =
      mentorSubjectFilter === "All subjects" || x.subject.includes(mentorSubjectFilter.split(" ")[0]);
    const matchStatus =
      mentorStatusFilter === "All statuses" ||
      (mentorStatusFilter === "Verified" ? x.verified : !x.verified);
    return matchSearch && matchSubject && matchStatus;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Toolbar Skeleton */}
        <div className="flex items-center justify-between gap-3 flex-wrap animate-pulse">
          <div className="flex items-center gap-2 flex-1 max-w-xl flex-wrap">
            <div className="h-8 bg-slate-200 rounded-lg w-48"></div>
            <div className="h-8 bg-slate-200 rounded-lg w-28"></div>
            <div className="h-8 bg-slate-200 rounded-lg w-28"></div>
          </div>
          <div className="h-8 bg-slate-200 rounded-lg w-24"></div>
        </div>
        {/* Course Cards Grid Skeleton */}
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
        <div className="flex items-center gap-2 flex-1 max-w-xl flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search mentors..."
              value={mentorSearch}
              onChange={(e) => setMentorSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-border-subtle rounded-lg bg-white outline-none font-semibold text-[#1B3A6B]"
            />
          </div>
          <select
            value={mentorSubjectFilter}
            onChange={(e) => setMentorSubjectFilter(e.target.value)}
            className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer font-semibold text-[#1B3A6B]"
          >
            <option>All subjects</option>
            <option>Mathematics</option>
            <option>Science</option>
            <option>English</option>
            <option>Programming</option>
          </select>
          <select
            value={mentorStatusFilter}
            onChange={(e) => setMentorStatusFilter(e.target.value)}
            className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer font-semibold text-[#1B3A6B]"
          >
            <option>All statuses</option>
            <option>Verified</option>
            <option>Unverified</option>
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex border border-[#E6EBF8] rounded-lg overflow-hidden shrink-0 shadow-sm bg-white">
            <button
              onClick={() => setMentorView("grid")}
              className={`p-2 cursor-pointer transition-colors ${
                mentorView === "grid" ? "bg-[#EBF2FF] text-[#1B3A6B]" : "bg-white text-[#9BA8C0]"
              }`}
            >
              <IconLayoutGrid className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setMentorView("list")}
              className={`p-2 cursor-pointer transition-colors ${
                mentorView === "list" ? "bg-[#EBF2FF] text-[#1B3A6B]" : "bg-white text-[#9BA8C0]"
              }`}
            >
              <IconList className="w-4.5 h-4.5" />
            </button>
          </div>

          <button
            onClick={() => openDrawer()}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <IconPlus className="w-4 h-4" /> Invite mentor
          </button>
        </div>
      </div>

      {/* View Render */}
      {mentorView === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
          {filteredMentors.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: m.avatarBg }}
                    className="w-12 h-12 rounded-full flex items-center justify-center font-heading text-sm font-bold text-accent shrink-0"
                  >
                    {m.avatarText}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#1B3A6B] truncate leading-snug">{m.name}</h4>
                    <p className="text-[10px] text-text-muted mt-0.5 truncate font-semibold">{m.email}</p>
                  </div>
                </div>
                <div className="text-xs text-[#6B7A99] space-y-1 mt-4 font-medium">
                  <div><strong>Specialty:</strong> {m.subject || "Pending completion"}</div>
                  <div><strong>Qualification:</strong> {m.qualification || "Pending completion"}</div>
                  <div><strong>Experience:</strong> {m.experience ? `${m.experience} years` : "Pending"}</div>
                  <div><strong>Hourly Rate:</strong> {m.rate ? `₹${m.rate}/hr` : "Pending"}</div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <strong>Status:</strong>
                    {m.isInvitation ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                        Pending Invite
                      </span>
                    ) : (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        m.verified ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                      }`}>
                        {m.verified ? "Verified" : "Unverified"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-[#E6EBF8] pt-3 mt-4">
                {!m.isInvitation && (
                  <Link
                    href={`/admin/mentors/${m.id}`}
                    className="flex-1 text-[11px] font-bold py-2 rounded-xl bg-[#EBF2FF] text-[#1B3A6B] hover:bg-[#2F7FE8] hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <IconEye className="w-3.5 h-3.5" /> View Stats
                  </Link>
                )}
                <button
                  onClick={() => openDrawer(m.id)}
                  className="px-3 text-xs py-2 rounded-xl border border-border-subtle bg-white text-[#6B7A99] hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                >
                  <IconEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteItem(m.id)}
                  className="px-3 text-xs py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-4 shadow-sm overflow-x-auto font-sans">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-badge-bg/30 border-b border-[#E6EBF8]">
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Mentor</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Subject</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Rating</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Students</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Courses</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Rate/hr</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-left">Verified</th>
                <th className="text-[9px] font-bold text-text-muted py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMentors.map((m) => (
                <tr key={m.id} className="border-b border-[#E6EBF8]/50 hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-xs text-primary flex items-center gap-2.5">
                    <div
                      style={{ backgroundColor: m.avatarBg }}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-heading text-xs font-bold text-accent"
                    >
                      {m.avatarText}
                    </div>
                    <div>
                      <div className="font-bold text-[#1B3A6B] leading-tight">{m.name}</div>
                      <div className="text-[9px] text-text-muted font-semibold mt-0.5">
                        {m.email} &middot; {m.qualification || "Pending Setup"} &middot; {m.experience || 0} yrs exp
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-text-muted font-medium">{m.subject || "Pending"}</td>
                  <td className="py-2.5 px-3 text-xs text-accent font-semibold">⭐ {m.rating}</td>
                  <td className="py-2.5 px-3 text-xs text-text-muted font-semibold">{m.students}</td>
                  <td className="py-2.5 px-3 text-xs text-text-muted font-semibold">{m.courses}</td>
                  <td className="py-2.5 px-3 text-xs text-[#1B3A6B] font-bold">₹{m.rate}</td>
                  <td className="py-2.5 px-3 text-xs">
                    {m.isInvitation ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                        Pending Invite
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          m.verified ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        {m.verified ? "Verified" : "Unverified"}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex gap-1.5 justify-center">
                      {!m.isInvitation && (
                        <Link
                          href={`/admin/mentors/${m.id}`}
                          className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-slate-50 text-[#1B3A6B] cursor-pointer"
                        >
                          <IconEye className="w-4 h-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => openDrawer(m.id)}
                        className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg text-[#6B7A99] cursor-pointer"
                      >
                        <IconEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteItem(m.id)}
                        className="w-7 h-7 rounded-lg border border-red-200 bg-white flex items-center justify-center hover:bg-red-50 text-red-600 cursor-pointer"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DRAWER MODAL OVERLAY */}
      {drawerOpen && (
        <>
          <div
            onClick={closeDrawer}
            className="fixed inset-0 bg-[#1B3A6B]/30 backdrop-blur-xs z-[200] transition-opacity duration-300"
          ></div>
          <div className="fixed top-0 right-0 w-[420px] h-full bg-white z-[201] shadow-2xl flex flex-col transition-transform duration-300 animate-slide-in">
            <header className="px-6 py-4.5 border-b border-[#E6EBF8] flex items-center justify-between shrink-0">
              <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B]">
                {drawerEditId ? "Edit Mentor Basic Details" : "Invite new mentor"}
              </h3>
              <button
                onClick={closeDrawer}
                className="w-7 h-7 border border-[#E6EBF8] bg-surface hover:bg-badge-bg rounded-lg text-primary text-sm flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Full name</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="text"
                  placeholder="e.g. Arjun Kapoor"
                  value={drawerForm.name || ""}
                  onChange={(e) => setDrawerForm({ ...drawerForm, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Email Address</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="email"
                  placeholder="e.g. arjun@tutoboard.com"
                  value={drawerForm.email || ""}
                  onChange={(e) => setDrawerForm({ ...drawerForm, email: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Verified</label>
                <select
                  className="text-xs p-2.5 border border-[#E6EBF8] rounded-lg outline-none bg-white cursor-pointer font-semibold text-[#1B3A6B]"
                  value={drawerForm.verified ? "Yes" : "No"}
                  onChange={(e) => setDrawerForm({ ...drawerForm, verified: e.target.value === "Yes" })}
                >
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-[#E6EBF8] flex gap-3 shrink-0">
              <button
                onClick={closeDrawer}
                className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-transparent text-primary border border-border-subtle hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={saveDrawerData}
                className="flex-1 text-xs font-bold py-2.5 rounded-lg bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors"
              >
                Save changes
              </button>
            </footer>
          </div>
        </>
      )}
    </div>
  );
}
