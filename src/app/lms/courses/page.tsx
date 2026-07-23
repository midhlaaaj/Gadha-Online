"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconVideo,
  IconChevronRight,
  IconBook,
} from "@tabler/icons-react";
import { getStudentBookingsAction } from "@/app/actions";

type Booking = Awaited<ReturnType<typeof getStudentBookingsAction>>[number];

function CoursesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#D0DCF5] p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl animate-shimmer shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-3.5 w-3/4 rounded animate-shimmer" />
              <div className="h-2.5 w-1/2 rounded animate-shimmer" />
            </div>
          </div>
          <div className="h-4 w-4 rounded animate-shimmer shrink-0" />
        </div>
      ))}
    </div>
  );
}

export default function StudentCoursesListPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentBookingsAction()
      .then((b) => {
        setBookings(b || []);
      })
      .catch((e) => console.error("Error loading bookings:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">My Courses & Sessions</h1>
          <p className="text-[13px] text-[#4A5A7A] mt-1">
            Access all your registered live classes, interactive mentoring slots, and recorded courses.
          </p>
        </div>
        <CoursesSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">My Courses & Sessions</h1>
        <p className="text-[13px] text-[#4A5A7A] mt-1">
          Access all your registered live classes, interactive mentoring slots, and recorded courses.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#D0DCF5] p-12 text-center space-y-4 max-w-md mx-auto mt-8">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-[#9BA8C0] mx-auto border border-[#E6EBF8]">
            <IconBook className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">No Enrolled Courses</h3>
            <p className="text-[12px] text-[#4A5A7A] mt-1.5 leading-relaxed">
              You haven&apos;t enrolled in any courses or booked any hourly slots yet. Discover and book courses to get started!
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-block mt-2 px-5 py-2.5 bg-[#2F7FE8] text-white text-[12px] font-bold rounded-full hover:bg-[#1B3A6B] transition-colors"
          >
            Explore Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((b) => {
            const isRecorded = b.bookingType === "Course" && b.courseFormat === "Recorded";
            const targetUrl = isRecorded ? `/lms/courses/${b.courseId}` : `/lms/bookings/${b.id}`;

            return (
              <Link key={b.id} href={targetUrl} className="block group">
                <div className="bg-white rounded-2xl border border-[#D0DCF5] p-5 flex items-center justify-between gap-4 hover:shadow-md hover:border-[#2F7FE8] transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isRecorded ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-purple-50 text-purple-600 border border-purple-100"
                    }`}>
                      <IconVideo className="w-5.5 h-5.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[13.5px] font-bold text-[#1B3A6B] truncate group-hover:text-[#2F7FE8] transition-colors">
                          {b.itemTitle}
                        </h3>
                        {b.status === "pending" && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 shrink-0">
                            Pending Confirmation
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#9BA8C0] mt-1 font-semibold">
                        Format: {b.courseFormat || b.bookingType} · Mentor: {b.mentorName}
                      </p>
                    </div>
                  </div>
                  <IconChevronRight className="w-4 h-4 text-[#9BA8C0] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
