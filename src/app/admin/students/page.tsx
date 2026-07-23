"use client";

import React, { useState, useEffect } from "react";
import { IconSearch, IconUserMinus } from "@tabler/icons-react";
import { getAdminData } from "../../actions";
import { SkeletonCard } from "@/components/Skeleton";

type AdminBooking = Awaited<ReturnType<typeof getAdminData>>["bookings"][number];

export default function StudentsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAdminData();
        setBookings(res.bookings || []);
      } catch (err) {
        console.error("Failed to load students list:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // De-duplicate parents and students from bookings table to populate the directory catalog
  interface StudentEntry {
    studentName: string;
    parentName: string;
    parentEmail: string;
    bookingCount: number;
    grade: string;
    registeredAt: string;
  }

  const studentMap = new Map<string, StudentEntry>();
  bookings.forEach((b) => {
    const key = `${b.studentName}-${b.parentEmail}`.toLowerCase();
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        studentName: b.studentName,
        parentName: b.parentName && b.parentName !== "Unknown Parent" ? b.parentName : b.parentEmail,
        parentEmail: b.parentEmail,
        bookingCount: 1,
        grade: "Grade 10", // Default grade fallback
        registeredAt: b.createdAt,
      });
    } else {
      const existing = studentMap.get(key)!;
      existing.bookingCount += 1;
    }
  });

  const studentsList = Array.from(studentMap.values());

  const filteredStudents = studentsList.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.studentName.toLowerCase().includes(term) ||
      s.parentName.toLowerCase().includes(term) ||
      s.parentEmail.toLowerCase().includes(term)
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
        {/* Students Cards Grid Skeleton */}
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
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search students or parents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-border-subtle rounded-lg bg-white outline-none font-semibold text-[#1B3A6B]"
            />
          </div>
        </div>
      </div>

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
        {filteredStudents.map((s, idx) => (
          <div key={idx} className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EBF2FF] text-[#2F7FE8] flex items-center justify-center font-heading text-xs font-bold shrink-0">
                  {s.studentName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-[#1B3A6B] text-xs leading-snug">{s.studentName}</h4>
                  <p className="text-[9px] text-[#2F7FE8] font-bold mt-0.5">{s.grade}</p>
                </div>
              </div>

              <div className="text-xs text-[#6B7A99] space-y-1.5 pt-2 border-t border-[#E6EBF8] font-medium">
                <div><strong>Parent Account:</strong> {s.parentName}</div>
                <div><strong>Parent Email:</strong> {s.parentEmail}</div>
                <div><strong>Total Bookings:</strong> {s.bookingCount}</div>
                <div>
                  <strong>Enrolled At:</strong>{" "}
                  {new Date(s.registeredAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-[#E6EBF8] mt-4 font-sans">
              <button
                onClick={() => alert(`Showing profile insights for ${s.studentName}`)}
                className="flex-1 text-xs font-bold py-2 rounded-xl bg-[#EBF2FF] text-[#1B3A6B] hover:bg-[#2F7FE8] hover:text-white transition-all cursor-pointer"
              >
                View Analytics
              </button>
              <button
                onClick={() => alert("Suspend user account provisionally")}
                className="px-3 text-xs py-2 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 cursor-pointer flex items-center justify-center"
              >
                <IconUserMinus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <div className="col-span-full bg-white border border-[#E6EBF8] rounded-2xl p-6 text-center text-xs text-text-muted italic">
            No registered parents or students found.
          </div>
        )}
      </div>
    </div>
  );
}
