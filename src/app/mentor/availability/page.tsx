"use client";

import React, { useState, useEffect } from "react";
import { 
  IconClock, IconPlus, IconTrash, IconCalendar, 
  IconCheck, IconAlertCircle, IconLoader, IconX 
} from "@tabler/icons-react";
import { getMentorAvailability, updateMentorAvailability } from "@/app/actions";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIME_OPTIONS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", 
  "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"
];

function Skel({ className }: { className?: string }) {
  return <div className={`animate-shimmer bg-slate-100 rounded-xl ${className}`} />;
}

export default function MentorAvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Availability state: { [day]: [{ start, end }] }
  const [availability, setAvailability] = useState<Record<string, { start: string; end: string }[]>>({});
  const [activeDays, setActiveDays] = useState<Record<string, boolean>>({});

  const loadAvailability = async () => {
    try {
      const data = await getMentorAvailability();
      const initialActive: Record<string, boolean> = {};
      const initialSlots: Record<string, { start: string; end: string }[]> = {};

      // If data is empty or has no configured active days, default to Mon-Fri 9am-9pm
      const hasCustom = Object.keys(data).length > 0 && Object.values(data).some((arr: any) => arr.length > 0);

      DAYS_OF_WEEK.forEach((day) => {
        let slots = data[day] || [];
        if (!hasCustom) {
          if (day !== "Saturday" && day !== "Sunday") {
            slots = [{ start: "09:00 AM", end: "09:00 PM" }];
          } else {
            slots = [];
          }
        }
        initialSlots[day] = slots;
        initialActive[day] = slots.length > 0;
      });

      setAvailability(initialSlots);
      setActiveDays(initialActive);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load availability.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  const handleToggleDay = (day: string) => {
    if (!isEditing) return;
    const nextActive = !activeDays[day];
    setActiveDays({ ...activeDays, [day]: nextActive });
    
    if (nextActive && availability[day].length === 0) {
      // Add default slot when toggled active
      setAvailability({
        ...availability,
        [day]: [{ start: "09:00 AM", end: "05:00 PM" }]
      });
    } else if (!nextActive) {
      // Clear slots when deactivated
      setAvailability({
        ...availability,
        [day]: []
      });
    }
  };

  const handleAddSlot = (day: string) => {
    if (!isEditing) return;
    const slots = [...availability[day]];
    slots.push({ start: "09:00 AM", end: "05:00 PM" });
    setAvailability({ ...availability, [day]: slots });
  };

  const handleRemoveSlot = (day: string, idx: number) => {
    if (!isEditing) return;
    const slots = availability[day].filter((_, i) => i !== idx);
    setAvailability({ ...availability, [day]: slots });
    if (slots.length === 0) {
      setActiveDays({ ...activeDays, [day]: false });
    }
  };

  const handleSlotChange = (day: string, idx: number, field: "start" | "end", val: string) => {
    if (!isEditing) return;
    const slots = [...availability[day]];
    slots[idx] = { ...slots[idx], [field]: val };
    setAvailability({ ...availability, [day]: slots });
  };

  // Helper parser: converts "HH:MM AM/PM" to minutes from midnight
  const parseTimeToMinutes = (timeStr: string): number => {
    const match = timeStr.match(/^(\d+):?(\d*)\s*(AM|PM)$/i);
    if (!match) return -1;
    let h = parseInt(match[1], 10);
    const m = match[2] ? parseInt(match[2], 10) : 0;
    const meridiem = match[3].toUpperCase();
    if (meridiem === "PM" && h < 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: Record<string, any> = {};

      // Validate inputs for each active day
      for (const day of DAYS_OF_WEEK) {
        if (activeDays[day]) {
          const slots = availability[day] || [];
          if (slots.length === 0) {
            throw new Error(`Please add at least one time slot for ${day} or disable it.`);
          }

          // Check each slot interval and verify start < end
          for (let i = 0; i < slots.length; i++) {
            const startMin = parseTimeToMinutes(slots[i].start);
            const endMin = parseTimeToMinutes(slots[i].end);

            if (startMin === -1 || endMin === -1) {
              throw new Error(`Invalid time format on ${day}.`);
            }
            if (startMin >= endMin) {
              throw new Error(`On ${day}, the start time (${slots[i].start}) must be earlier than the end time (${slots[i].end}).`);
            }

            // Check for overlaps with all other slots on the same day
            for (let j = i + 1; j < slots.length; j++) {
              const otherStart = parseTimeToMinutes(slots[j].start);
              const otherEnd = parseTimeToMinutes(slots[j].end);

              if (startMin < otherEnd && otherStart < endMin) {
                throw new Error(`Overlapping time slots found on ${day}: ${slots[i].start}–${slots[i].end} and ${slots[j].start}–${slots[j].end}.`);
              }
            }
          }

          payload[day] = slots;
        } else {
          payload[day] = [];
        }
      }

      await updateMentorAvailability(payload);
      setSuccess("Availability updated successfully.");
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save availability.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[760px] w-full space-y-6 text-[#1B3A6B]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">
            Weekly Availability
          </h1>
          <p className="text-[13px] text-[#4A5A7A] mt-0.5">
            Configure the weekly days and time slots during which parents and students can book 1-on-1 private tutoring sessions with you.
          </p>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setError(null);
                    loadAvailability();
                  }}
                  className="px-4 py-2 border border-[#D0DCF5] text-[#4A5A7A] text-xs font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-[#1B3A6B] text-white text-xs font-bold rounded-xl hover:bg-[#2F7FE8] hover:shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {saving && <IconLoader className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-[#2F7FE8] text-white text-xs font-bold rounded-xl hover:bg-[#1B3A6B] hover:shadow-sm transition-all cursor-pointer"
              >
                Edit Availability
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        /* Availability Skeleton */
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border border-[#D0DCF5] rounded-2xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-6 min-h-[120px]">
              <div className="flex items-center justify-between w-full md:w-48 shrink-0">
                <div className="flex items-center gap-2">
                  <Skel className="h-4 w-4 rounded" />
                  <Skel className="h-4 w-20" />
                </div>
                <Skel className="h-6 w-11 rounded-full" />
              </div>
              <div className="flex-1 space-y-3">
                <Skel className="h-10 w-full max-w-md rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Availability Cards Stack (1 Day per Card, stacked vertically) */
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const isActive = activeDays[day];
            const slots = availability[day] || [];

            return (
              <div
                key={day}
                className={`bg-white border border-[#D0DCF5] rounded-2xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-6 transition-all duration-200 ${
                  !isActive && "opacity-65 border-dashed bg-slate-50/20"
                }`}
              >
                {/* Day Label & Toggle Switch */}
                <div className="flex items-center justify-between w-full md:w-48 shrink-0 mt-1">
                  <div className="flex items-center gap-2">
                    <IconCalendar className={`w-4.5 h-4.5 ${isActive ? "text-[#2F7FE8]" : "text-slate-400"}`} />
                    <span className="text-sm font-bold text-[#1B3A6B] font-heading">{day}</span>
                  </div>
                  <button
                    type="button"
                    disabled={!isEditing}
                    onClick={() => handleToggleDay(day)}
                    className={`w-11 h-6 rounded-full transition-colors relative border-none ${
                      isActive ? "bg-[#2F7FE8]" : "bg-slate-200"
                    } ${isEditing ? "cursor-pointer" : "cursor-default opacity-85"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Time Slots Editors Column */}
                <div className="flex-1 space-y-3">
                  {!isActive ? (
                    <p className="text-xs text-slate-400 italic py-1">Unavailable on this day</p>
                  ) : (
                    <div className="space-y-3">
                      {slots.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 animate-fade-in max-w-md">
                          <div className="flex items-center gap-2 border border-[#D0DCF5] rounded-xl px-3.5 py-2 bg-white flex-1 shadow-sm">
                            <IconClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <select
                              value={slot.start}
                              disabled={!isEditing}
                              onChange={(e) => handleSlotChange(day, idx, "start", e.target.value)}
                              className="text-xs font-semibold text-[#1B3A6B] bg-transparent border-none outline-none w-full disabled:cursor-default disabled:opacity-100 cursor-pointer"
                            >
                              {TIME_OPTIONS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            <span className="text-[10px] text-slate-400 font-bold shrink-0 px-1">&rarr;</span>
                            <select
                              value={slot.end}
                              disabled={!isEditing}
                              onChange={(e) => handleSlotChange(day, idx, "end", e.target.value)}
                              className="text-xs font-semibold text-[#1B3A6B] bg-transparent border-none outline-none w-full disabled:cursor-default disabled:opacity-100 cursor-pointer"
                            >
                              {TIME_OPTIONS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(day, idx)}
                              className="p-2.5 border border-[#D0DCF5] text-slate-400 hover:text-[#E24B4A] hover:border-red-200 rounded-xl hover:bg-red-50/30 transition-all cursor-pointer bg-white shrink-0"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Add Slot Trigger */}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleAddSlot(day)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7FE8] hover:text-[#1B3A6B] transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <IconPlus className="w-3.5 h-3.5" /> Add time slot
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast Warnings Stack in Bottom Right */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full sm:w-auto">
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-4 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in font-sans">
            <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1">{success}</span>
            <button onClick={() => setSuccess(null)} className="p-0.5 hover:bg-emerald-100 rounded cursor-pointer border-none bg-transparent text-emerald-800">
              <IconX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-4 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in font-sans">
            <IconAlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="p-0.5 hover:bg-rose-100 rounded cursor-pointer border-none bg-transparent text-rose-800">
              <IconX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
