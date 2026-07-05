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
  IconBook,
  IconCurrencyRupee,
  IconMail,
  IconCheck,
  IconLoader,
  IconBookmark,
  IconEye,
} from "@tabler/icons-react";
import { getAdminCourseDetails } from "../../../actions";

interface Params {
  id: string;
}

export default function AdminCourseDetailPage({ params }: { params: React.ComponentProps<any>['params'] }) {
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve(params).then((resolvedParams: any) => {
      setCourseId(resolvedParams.id);
    });
  }, [params]);

  const [course, setCourse] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    async function loadData() {
      try {
        const res = await getAdminCourseDetails(courseId as string);
        setCourse(res.course);
        setBookings(res.bookings || []);
      } catch (err) {
        console.error("Failed to load course details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [courseId]);

  if (loading || !courseId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <IconLoader className="w-8 h-8 text-[#2F7FE8] animate-spin" />
        <p className="mt-3 text-xs font-semibold text-slate-500 font-sans">Loading Course Insights...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-white border border-[#E6EBF8] rounded-2xl p-6 text-center space-y-4 font-sans">
        <p className="text-sm text-text-muted font-semibold">Course details not found.</p>
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7FE8] hover:underline"
        >
          <IconArrowLeft className="w-4 h-4" /> Back to Courses List
        </Link>
      </div>
    );
  }

  // Calculate gross metrics
  const totalSales = bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <div className="space-y-6 font-sans">
      {/* Back Link */}
      <div>
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7A99] hover:text-[#1B3A6B] transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </div>

      {/* Course Main Summary Header */}
      <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-stretch">
        <div className="flex flex-col md:flex-row gap-5 items-start flex-1">
          {course.coverImageUrl ? (
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-[#E6EBF8] shrink-0">
              <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-[#EBF2FF] flex items-center justify-center text-[#2F7FE8] shrink-0 border border-[#D0DCF5]">
              <IconBook className="w-10 h-10" />
            </div>
          )}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-extrabold uppercase bg-blue-50 text-[#2F7FE8] border border-blue-100 px-2 py-0.5 rounded-full">
                {course.format}
              </span>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                course.status === "Active" ? "bg-green-50 text-green-700 border border-green-100" : "bg-gray-100 text-gray-700"
              }`}>
                {course.status}
              </span>
            </div>
            <h2 className="font-heading text-xl font-extrabold text-[#1B3A6B] leading-snug">{course.title}</h2>
            <p className="text-xs text-[#6B7A99] font-medium max-w-2xl leading-relaxed">{course.description}</p>
            <div className="flex items-center gap-4 text-xs text-[#6B7A99] pt-2 font-medium">
              <span><strong>Subject:</strong> {course.subject}</span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1"><IconStar className="w-3.5 h-3.5 fill-accent text-accent" /> {course.rating || 5.0} Rating</span>
              <span className="text-slate-300">|</span>
              <span><strong>Languages:</strong> {course.languages.join(", ")}</span>
            </div>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-[#E6EBF8] pt-4 md:pt-0 md:pl-6 flex flex-col justify-center min-w-[200px] text-left md:text-right space-y-1">
          <div className="text-[10px] uppercase font-bold text-text-muted">Course Price</div>
          <div className="font-heading text-2xl font-extrabold text-[#1B3A6B]">
            ₹{course.price.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#2F7FE8] font-bold">One-time payment</div>
        </div>
      </div>

      {/* KPI Stats Counter Grid */}
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
          <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Total Enrollments</div>
          <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">{totalBookings} booked</div>
        </div>

        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm">
          <div className="w-[36px] h-[36px] rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 mb-3">
            <IconCheck className="w-5 h-5" />
          </div>
          <div className="text-[10px] text-text-muted mb-0.5 uppercase font-bold tracking-wider">Active Confirmed Users</div>
          <div className="font-heading text-xl font-extrabold text-[#1B3A6B]">{activeBookings} active</div>
        </div>
      </div>

      {/* Two-Column split details layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Details Parameters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Syllabus & Course Overview parameters */}
          <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">Course Schedule & Duration</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-[#1B3A6B]">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                <span className="text-[#1B3A6B]">{course.durationDays || 30} Days</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sessions</span>
                <span>{course.totalSessions || 10} classes</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weekly Frequency</span>
                <span>{course.sessionsPerWeek || 2} sessions / wk</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Days</span>
                <span>{course.classDays || "Self-Paced / Recorded"}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timing</span>
                <span>{course.classTiming || "TBA"}</span>
              </div>
            </div>
            
            {course.aboutCourse && (
              <div className="pt-4 border-t border-[#E6EBF8] space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">About the Course</span>
                <p className="text-xs text-[#6B7A99] leading-relaxed whitespace-pre-wrap">{course.aboutCourse}</p>
              </div>
            )}
          </div>

          {/* Student Bookings Roster */}
          <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">Student Enrollment Roster</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E6EBF8]">
                    <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Booking ID</th>
                    <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Student Details</th>
                    <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Parent Details</th>
                    <th className="text-[9px] font-bold text-text-muted py-3 px-4 text-left uppercase">Enrolled Date</th>
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
                        No students enrolled in this course yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Assigned Mentor details */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] border-b border-[#E6EBF8] pb-3">Assigned Mentor</h3>
            
            {course.mentor ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {course.mentor.avatarUrl ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-[#E6EBF8] shrink-0">
                      <img src={course.mentor.avatarUrl} alt={course.mentor.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#1B3A6B] text-accent flex items-center justify-center font-heading text-sm font-bold shrink-0">
                      {course.mentor.name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#1B3A6B] truncate">{course.mentor.name}</h4>
                    <p className="text-[10px] text-text-muted truncate mt-0.5 font-semibold">{course.mentor.email}</p>
                  </div>
                </div>

                <div className="text-xs text-[#6B7A99] space-y-2 border-t border-[#E6EBF8]/60 pt-3.5 font-medium">
                  <div className="flex items-center gap-1.5"><IconSchool className="w-4 h-4 text-[#9BA8C0]" /> {course.mentor.qualification}</div>
                  <div className="flex items-center gap-1.5"><IconClock className="w-4 h-4 text-[#9BA8C0]" /> {course.mentor.experience} Years Experience</div>
                  <div className="flex items-center gap-1.5 text-accent"><IconStar className="w-4 h-4 fill-accent" /> {course.mentor.rating} Rating</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted italic text-center py-2">No mentor assigned to this course.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
