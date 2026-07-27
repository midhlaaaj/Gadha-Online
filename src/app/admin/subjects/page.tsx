"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconPlus,
  IconTrash,
  IconMath,
  IconCode,
  IconFlask,
  IconPencil,
  IconMap,
  IconBook,
  IconChevronRight,
} from "@tabler/icons-react";
import { getSubjects, ensureSubjectExists, deleteSubject } from "../../actions";

type Subject = Awaited<ReturnType<typeof getSubjects>>[number];

const getIconComponent = (name: string) => {
  switch (name) {
    case "math":
    case "calculator":
      return <IconMath className="w-6 h-6" />;
    case "code":
      return <IconCode className="w-6 h-6" />;
    case "flask":
    case "science":
      return <IconFlask className="w-6 h-6" />;
    case "writing":
    case "pencil":
      return <IconPencil className="w-6 h-6" />;
    case "map":
      return <IconMap className="w-6 h-6" />;
    default:
      return <IconBook className="w-6 h-6" />;
  }
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubjects = async () => {
    try {
      const data = await getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error("Failed to load subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function load() {
      await loadSubjects();
    }
    load();
  }, []);

  const handleAddSubject = async () => {
    const name = newSubjectName.trim();
    if (!name) {
      setError("Subject name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await ensureSubjectExists(name);
      setNewSubjectName("");
      setShowAddModal(false);
      await loadSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add subject");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This won't affect existing courses/sessions already tagged with this subject.`)) return;
    try {
      await deleteSubject(id);
      await loadSubjects();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete subject");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6B7A99] font-medium max-w-lg">
          Subjects created here (or via the &quot;Create New Subject...&quot; option when adding a course or session) automatically appear in the filters on the public Courses, Sessions, and Mentors pages.
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-[#1B3A6B] text-white hover:bg-[#1B3A6B]/90 transition-all cursor-pointer shrink-0"
        >
          <IconPlus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-[#E6EBF8] rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-[#E6EBF8] rounded-2xl">
          <p className="text-sm text-[#6B7A99] mb-4">No subjects yet.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs font-bold px-5 py-2.5 bg-[#1B3A6B] text-white rounded-lg hover:shadow-md transition-all cursor-pointer"
          >
            Add your first subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="group relative bg-white border border-[#E6EBF8] rounded-2xl p-5 hover:shadow-md hover:border-[#2F7FE8]/30 transition-all"
            >
              <Link href={`/admin/subjects/${encodeURIComponent(s.name)}`} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EBF2FF] text-[#2F7FE8] flex items-center justify-center shrink-0">
                  {getIconComponent(s.iconName)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-sm font-bold text-[#1B3A6B] truncate pr-6">{s.name}</h3>
                  <p className="text-[11px] text-[#9BA8C0] font-semibold mt-1">
                    {s.courseCount} course{s.courseCount !== 1 ? "s" : ""} · {s.sessionCount} session{s.sessionCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <IconChevronRight className="w-4 h-4 text-[#9BA8C0] shrink-0 mt-1" />
              </Link>
              <button
                onClick={() => handleDelete(s.id, s.name)}
                title="Delete subject"
                className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-[#9BA8C0] opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
              >
                <IconTrash className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-heading text-base font-bold text-[#1B3A6B] mb-4">Add New Subject</h3>
            <input
              type="text"
              autoFocus
              value={newSubjectName}
              onChange={(e) => { setNewSubjectName(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddSubject(); }}
              placeholder="e.g. Geography"
              className="w-full text-sm p-3 border border-[#E6EBF8] rounded-xl outline-none focus:border-[#2F7FE8] text-[#1B3A6B] mb-2"
            />
            {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowAddModal(false); setNewSubjectName(""); setError(null); }}
                className="flex-1 text-xs font-semibold py-2.5 border border-[#E6EBF8] rounded-xl text-[#1B3A6B] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubject}
                disabled={saving}
                className="flex-1 text-xs font-bold py-2.5 bg-[#1B3A6B] text-white rounded-xl hover:bg-[#1B3A6B]/90 cursor-pointer disabled:opacity-60"
              >
                {saving ? "Adding..." : "Add Subject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
