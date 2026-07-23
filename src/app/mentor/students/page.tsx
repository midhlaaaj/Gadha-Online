"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { IconSearch, IconUsers, IconMail, IconPhone, IconCalendar } from "@tabler/icons-react";
import { getMentorStudents } from "@/app/actions";

type StudentInfo = Awaited<ReturnType<typeof getMentorStudents>>[number];

function StudentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
      <div className="bg-white rounded-2xl border border-[#D0DCF5] overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-5 border-b border-[#F0F3FB] last:border-0 flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 bg-slate-100 rounded" />
              <div className="h-2 w-24 bg-slate-100 rounded" />
            </div>
            <div className="w-24 h-4 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MentorStudentsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getMentorStudents()
      .then((data) => setStudents(data || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      s.parentName.toLowerCase().includes(term) ||
      s.subject.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">Students Directory</h1>
        <p className="text-[13px] text-[#4A5A7A] mt-0.5">Directory of students enrolled in your sessions and batches.</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BA8C0]" />
        <input
          type="text"
          placeholder="Search student, parent, or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D0DCF5] bg-white text-[13px] font-semibold text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8] placeholder-[#9BA8C0]"
        />
      </div>

      {/* List / Table */}
      {loading ? (
        <StudentsSkeleton />
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-2xl border border-dashed border-[#D0DCF5]">
          <IconUsers className="w-10 h-10 text-[#D0DCF5]" />
          <h2 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">No Students Found</h2>
          <p className="text-[13px] text-[#4A5A7A] max-w-xs">
            {search ? "No students matches your search criteria." : "You do not have any enrolled students yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#D0DCF5] overflow-hidden">
          <div className="overflow-x-auto premium-scrollbar">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#D0DCF5] bg-[#F5F8FF]">
                  <th className="px-6 py-4 text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider">Grade & School</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider">Subject Enrolled</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider">Parent Contact</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider text-center">Attendance</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3FB]">
                {filteredStudents.map((s) => {
                  const attendanceRate = s.totalClasses > 0 ? Math.round((s.attendedClasses / s.totalClasses) * 100) : null;
                  const initials = s.name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();

                  return (
                    <tr key={s.id} className="hover:bg-[#F5F8FF]/50 transition-colors">
                      {/* Student info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {s.avatarUrl ? (
                            <Image src={s.avatarUrl} alt={s.name} width={36} height={36} className="w-9 h-9 rounded-full bg-slate-100 object-cover border border-[#D0DCF5]" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#EBF2FF] flex items-center justify-center font-heading text-xs font-bold text-[#2F7FE8] border border-[#D0DCF5]">
                              {initials}
                            </div>
                          )}
                          <div>
                            <p className="text-[13px] font-bold text-[#1B3A6B]">{s.name}</p>
                            <p className="text-[11px] text-[#9BA8C0]">{s.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Grade & School */}
                      <td className="px-6 py-4">
                        <p className="text-[12px] font-semibold text-[#1B3A6B]">{s.grade}</p>
                        <p className="text-[11px] text-[#9BA8C0] truncate max-w-[150px]" title={s.school}>{s.school}</p>
                      </td>

                      {/* Subject */}
                      <td className="px-6 py-4">
                        <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EBF2FF] text-[#2F7FE8]">
                          {s.subject}
                        </span>
                      </td>

                      {/* Parent details */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-[12px] font-bold text-[#1B3A6B]">{s.parentName}</p>
                          <div className="flex flex-col gap-0.5 text-[10px] text-[#4A5A7A]">
                            <span className="flex items-center gap-1"><IconMail className="w-3 h-3 text-[#9BA8C0]" /> {s.email}</span>
                            <span className="flex items-center gap-1"><IconPhone className="w-3 h-3 text-[#9BA8C0]" /> {s.parentPhone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className="px-6 py-4 text-center">
                        {attendanceRate !== null ? (
                          <div className="inline-flex flex-col items-center">
                            <span className={`text-[12px] font-extrabold ${attendanceRate >= 80 ? "text-green-600" : attendanceRate >= 60 ? "text-amber-500" : "text-red-500"}`}>
                              {attendanceRate}%
                            </span>
                            <span className="text-[9px] text-[#9BA8C0]">({s.attendedClasses}/{s.totalClasses} classes)</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#9BA8C0] font-semibold">No record</span>
                        )}
                      </td>

                      {/* Enrolled date */}
                      <td className="px-6 py-4 text-[11px] font-semibold text-[#4A5A7A]">
                        <span className="flex items-center gap-1.5"><IconCalendar className="w-3.5 h-3.5 text-[#9BA8C0]" /> {s.enrolledAt}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
