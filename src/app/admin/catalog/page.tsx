"use client";

import React from "react";
import Link from "next/link";
import { IconBook, IconClock, IconArrowRight } from "@tabler/icons-react";

export default function CatalogHubPage() {
  return (
    <div className="space-y-6 font-sans">
      <div className="max-w-xl">
        <h2 className="font-heading text-lg font-extrabold text-[#1B3A6B]">
          Catalog Management
        </h2>
        <p className="text-xs text-text-muted mt-1 font-medium">
          Select a catalog inventory section below to create, update, and manage subjects, classes, pricing, and enrollments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Card 1: Courses */}
        <Link
          href="/admin/courses"
          className="group bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[220px]"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#2F7FE8] group-hover:scale-110 transition-transform duration-200">
              <IconBook className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading text-base font-extrabold text-[#1B3A6B] group-hover:text-[#2F7FE8] transition-colors">
                Courses Catalog
              </h3>
              <p className="text-xs text-text-muted font-semibold leading-relaxed">
                Manage structured multi-unit programs, self-paced recorded lecture paths, live batches, student course registrations, and syllabus updates.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2F7FE8] pt-4 mt-auto">
            <span>Manage Courses</span>
            <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Sessions */}
        <Link
          href="/admin/sessions"
          className="group bg-white border border-[#E6EBF8] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[220px]"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-200">
              <IconClock className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading text-base font-extrabold text-[#1B3A6B] group-hover:text-purple-600 transition-colors">
                Sessions Catalog
              </h3>
              <p className="text-xs text-text-muted font-semibold leading-relaxed">
                Manage standalone lessons, 1-on-1 private tutoring configurations, masterclasses, group workshop slots, and scheduling rules.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 pt-4 mt-auto">
            <span>Manage Sessions</span>
            <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
