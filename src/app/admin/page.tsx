"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  IconLayoutDashboard,
  IconHome,
  IconBook,
  IconClock,
  IconUsers,
  IconQuote,
  IconSettings,
  IconBell,
  IconSearch,
  IconEdit,
  IconTrash,
  IconPlus,
  IconEye,
  IconPhoto,
  IconPhotoUp,
  IconList,
  IconLayoutGrid,
  IconCurrencyRupee,
  IconUserCheck,
  IconUser,
  IconSparkles,
  IconMath,
  IconCode,
  IconFlask,
  IconPencil,
  IconDna,
  IconStar,
} from "@tabler/icons-react";

import {
  getAdminData,
  updateHeroSettings,
  upsertCourse,
  deleteCourse as apiDeleteCourse,
  toggleCourseStatus as apiToggleCourseStatus,
  upsertSession,
  deleteSession as apiDeleteSession,
  toggleSessionStatus as apiToggleSessionStatus,
  upsertMentor,
  deleteMentor as apiDeleteMentor,
  upsertTestimonial,
  deleteTestimonial as apiDeleteTestimonial,
  toggleTestimonialStatus as apiToggleTestimonialStatus,
  syncMockDataToBackend,
  uploadCourseCover,
} from "../actions";

// Mock Data Types
interface Course {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  subject: "Mathematics" | "Science" | "Programming" | "English";
  format: "Live batch" | "Recorded" | "Hourly";
  price: number;
  mentor: string;
  students: number;
  rating: number;
  status: "Active" | "Draft";
  colorBg: string;
  iconName: string;
}

interface Session {
  id: string;
  title: string;
  mentor: string;
  mentorAvatar: string;
  mentorColor: string;
  type: "1-on-1" | "Group";
  description: string;
  bookings: number;
  subject: string;
  price: number;
  status: "Active" | "Inactive";
  colorBg: string;
  iconName: string;
}

interface Mentor {
  id: string;
  name: string;
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
}

interface Testimonial {
  id: string;
  studentName: string;
  role: string;
  quote: string;
  rating: number;
  showOnSite: boolean;
  avatarBg: string;
  avatarText: string;
}

// Default fallback hero structure for clean state initiation
const DEFAULT_HERO = {
  badgeText: "#1 online tutoring platform",
  headline: "Learn faster with expert mentors by your side",
  accentedText: "expert mentors",
  subheading: "Connect with top-rated tutors for 1-on-1 sessions, structured courses, and hourly lessons — all tailored to your pace and goals.",
  primaryCta: "Find a mentor",
  primaryLink: "/mentors",
  secondaryCta: "Browse courses",
  secondaryLink: "/courses",
  c1: "12,400+",
  cl1: "Students enrolled",
  c2: "840+",
  cl2: "Expert mentors",
  c3: "320+",
  cl3: "Courses available",
  c4: "98%",
  cl4: "Satisfaction rate",
};

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "hero" | "courses" | "sessions" | "mentors" | "testimonials"
  >("dashboard");

  // Core Data States
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [heroCopy, setHeroCopy] = useState(DEFAULT_HERO);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load backend data
  const loadData = async () => {
    try {
      const res = await getAdminData();
      setCourses(res.courses);
      setSessions(res.sessions);
      setMentors(res.mentors);
      setTestimonials(res.testimonials);
      if (res.settings) {
        setHeroCopy({
          badgeText: res.settings.badge_text,
          headline: res.settings.headline,
          accentedText: res.settings.accented_text,
          subheading: res.settings.subheading,
          primaryCta: res.settings.primary_cta,
          primaryLink: res.settings.primary_link,
          secondaryCta: res.settings.secondary_cta,
          secondaryLink: res.settings.secondary_link,
          c1: res.settings.c1,
          cl1: res.settings.cl1,
          c2: res.settings.c2,
          cl2: res.settings.cl2,
          c3: res.settings.c3,
          cl3: res.settings.cl3,
          c4: res.settings.c4,
          cl4: res.settings.cl4,
        });
      }
    } catch (err) {
      console.error("Failed to load admin panel data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncMockData = async () => {
    setSyncing(true);
    try {
      await syncMockDataToBackend();
      alert("Successfully seeded all mock data to the backend!");
      await loadData();
    } catch (err: any) {
      alert("Seeding failed: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  // View States
  const [courseView, setCourseView] = useState<"grid" | "list">("grid");
  const [sessionView, setSessionView] = useState<"grid" | "list">("grid");

  // Search & Filter States
  const [courseSearch, setCourseSearch] = useState("");
  const [courseFormatFilter, setCourseFormatFilter] = useState("All formats");
  const [courseSubjectFilter, setCourseSubjectFilter] = useState("All subjects");

  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionSubjectFilter, setSessionSubjectFilter] = useState("All subjects");
  const [sessionTypeFilter, setSessionTypeFilter] = useState("All types");

  const [mentorSearch, setMentorSearch] = useState("");
  const [mentorSubjectFilter, setMentorSubjectFilter] = useState("All subjects");
  const [mentorStatusFilter, setMentorStatusFilter] = useState("All statuses");

  const [testimonialSearch, setTestimonialSearch] = useState("");
  const [testimonialFilter, setTestimonialFilter] = useState("All");

  // Drawer modal state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<
    "course" | "session" | "mentor" | "testimonial" | null
  >(null);
  const [drawerEditId, setDrawerEditId] = useState<string | null>(null);
  const [drawerForm, setDrawerForm] = useState<any>({});
  const [showMoreCourseDetails, setShowMoreCourseDetails] = useState(false);
  const [showMoreSessionDetails, setShowMoreSessionDetails] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadCourseCover(formData);
      setDrawerForm((prev: any) => ({ ...prev, coverImageUrl: res.publicUrl }));
    } catch (err: any) {
      alert("Image upload failed: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Helper: Open Drawer for Add/Edit
  const openDrawer = (
    mode: "course" | "session" | "mentor" | "testimonial",
    id: string | null = null
  ) => {
    setDrawerMode(mode);
    setDrawerEditId(id);
    
    if (id) {
      // Find item to edit
      if (mode === "course") {
        const item = courses.find((x) => x.id === id);
        setDrawerForm({ ...item });
      } else if (mode === "session") {
        const item = sessions.find((x) => x.id === id);
        setDrawerForm({ ...item });
      } else if (mode === "mentor") {
        const item = mentors.find((x) => x.id === id);
        setDrawerForm({ ...item });
      } else if (mode === "testimonial") {
        const item = testimonials.find((x) => x.id === id);
        setDrawerForm({ ...item });
      }
    } else {
      // Setup default form values
      if (mode === "course") {
        setDrawerForm({
          title: "",
          description: "",
          coverImageUrl: "",
          subject: "Mathematics",
          format: "Live batch",
          price: 0,
          mentor: mentors[0]?.name || "Arjun Kapoor",
          students: 0,
          rating: 5.0,
          status: "Draft",
        });
      } else if (mode === "session") {
        setDrawerForm({
          title: "",
          description: "",
          subject: "Mathematics",
          mentor: mentors[0]?.name || "Arjun Kapoor",
          price: 0,
          type: "1-on-1",
          status: "Active",
          aboutSession: "",
          whatsCovered: [],
          inclusions: ["", "", "", "", ""],
          durationOptions: "60 or 90 min",
          platform: "Zoom",
          language: "English / Hindi",
          days: "Mon – Sat",
          reschedulePolicy: "Up to 4 hrs before",
        });
      } else if (mode === "mentor") {
        setDrawerForm({
          name: "",
          subject: "Mathematics",
          rate: 0,
          bio: "",
          experience: 1,
          qualification: "",
          verified: false,
        });
      } else if (mode === "testimonial") {
        setDrawerForm({
          studentName: "",
          role: "",
          quote: "",
          rating: 5,
          showOnSite: true,
        });
      }
    }
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerMode(null);
    setDrawerEditId(null);
    setShowMoreCourseDetails(false);
    setShowMoreSessionDetails(false);
  };

  // CRUD Save changes
  const saveDrawerData = async () => {
    try {
      if (drawerMode === "course") {
        await upsertCourse(drawerForm);
      } else if (drawerMode === "session") {
        await upsertSession(drawerForm);
      } else if (drawerMode === "mentor") {
        await upsertMentor(drawerForm);
      } else if (drawerMode === "testimonial") {
        await upsertTestimonial(drawerForm);
      }
      closeDrawer();
      await loadData();
    } catch (err: any) {
      alert("Error saving data: " + err.message);
    }
  };

  // CRUD Delete
  const deleteItem = async (
    mode: "course" | "session" | "mentor" | "testimonial",
    id: string
  ) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        if (mode === "course") {
          await apiDeleteCourse(id);
        } else if (mode === "session") {
          await apiDeleteSession(id);
        } else if (mode === "mentor") {
          await apiDeleteMentor(id);
        } else if (mode === "testimonial") {
          await apiDeleteTestimonial(id);
        }
        await loadData();
      } catch (err: any) {
        alert("Error deleting item: " + err.message);
      }
    }
  };

  // Inline Toggles
  const toggleCourseStatus = async (id: string) => {
    const item = courses.find((x) => x.id === id);
    if (!item) return;
    try {
      await apiToggleCourseStatus(id, item.status);
      await loadData();
    } catch (err: any) {
      alert("Error toggling course status: " + err.message);
    }
  };

  const toggleSessionStatus = async (id: string) => {
    const item = sessions.find((x) => x.id === id);
    if (!item) return;
    try {
      await apiToggleSessionStatus(id, item.status);
      await loadData();
    } catch (err: any) {
      alert("Error toggling session status: " + err.message);
    }
  };

  const toggleTestiStatus = async (id: string) => {
    const item = testimonials.find((x) => x.id === id);
    if (!item) return;
    try {
      await apiToggleTestimonialStatus(id, item.showOnSite);
      await loadData();
    } catch (err: any) {
      alert("Error toggling testimonial visibility: " + err.message);
    }
  };

  // Hero Section Editor Settings publisher
  const saveHeroChanges = async () => {
    try {
      await updateHeroSettings(heroCopy);
      alert("Hero settings saved and published successfully!");
      await loadData();
    } catch (err: any) {
      alert("Error publishing hero settings: " + err.message);
    }
  };

  // Dynamic Metrics (Computed from state)
  const dashboardStats = useMemo(() => {
    const totalStudents = courses.reduce((acc, curr) => acc + curr.students, 0) + 12000; // base offset
    const activeMentors = mentors.length + 837; // base offset
    const totalCourses = courses.length + 319;
    return { totalStudents, activeMentors, totalCourses };
  }, [courses, mentors]);

  // Filters application
  const filteredCourses = courses.filter((x) => {
    const matchSearch = x.title.toLowerCase().includes(courseSearch.toLowerCase());
    const matchFormat =
      courseFormatFilter === "All formats" || x.format === courseFormatFilter;
    const matchSubject =
      courseSubjectFilter === "All subjects" || x.subject === courseSubjectFilter;
    return matchSearch && matchFormat && matchSubject;
  });

  const filteredSessions = sessions.filter((x) => {
    const matchSearch = x.title.toLowerCase().includes(sessionSearch.toLowerCase());
    const matchSubject =
      sessionSubjectFilter === "All subjects" || x.subject === sessionSubjectFilter;
    const matchType =
      sessionTypeFilter === "All types" || x.type === sessionTypeFilter;
    return matchSearch && matchSubject && matchType;
  });

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

  const filteredTestimonials = testimonials.filter((x) => {
    const matchSearch = x.studentName.toLowerCase().includes(testimonialSearch.toLowerCase());
    const matchStatus =
      testimonialFilter === "All" ||
      (testimonialFilter === "Visible" ? x.showOnSite : !x.showOnSite);
    return matchSearch && matchStatus;
  });

  // Dynamic helper: Headline highlights builder
  const renderPrevHeadline = () => {
    const text = heroCopy.headline;
    const phrase = heroCopy.accentedText;
    if (!phrase || !text.includes(phrase)) {
      return text;
    }
    const parts = text.split(phrase);
    return (
      <>
        {parts[0]}
        <span className="text-secondary">{phrase}</span>
        {parts[1]}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F4FA] font-sans text-primary">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 animate-pulse">Loading Admin Panel...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen min-h-[600px] overflow-hidden bg-[#F0F4FA] font-sans text-primary">
      {/* SIDEBAR */}
      <aside className="w-[200px] shrink-0 bg-primary flex flex-col overflow-hidden">
        <div className="py-[18px] px-5 font-heading text-lg font-extrabold text-white border-b border-white/10 shrink-0">
          Tuto<span className="text-accent">board</span>
        </div>
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-4">
          <div>
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-1.5">
              Main
            </div>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === "dashboard"
                  ? "bg-secondary text-white"
                  : "text-white/65 hover:bg-white/8 hover:text-white"
              }`}
            >
              <IconLayoutDashboard className="w-4 h-4 shrink-0" />
              Dashboard
            </button>
          </div>

          <div>
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-1.5">
              Content
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTab("hero")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === "hero"
                    ? "bg-secondary text-white"
                    : "text-white/65 hover:bg-white/8 hover:text-white"
                }`}
              >
                <IconHome className="w-4 h-4 shrink-0" />
                Hero Section
              </button>
              <button
                onClick={() => setActiveTab("courses")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === "courses"
                    ? "bg-secondary text-white"
                    : "text-white/65 hover:bg-white/8 hover:text-white"
                }`}
              >
                <IconBook className="w-4 h-4 shrink-0" />
                Courses
              </button>
              <button
                onClick={() => setActiveTab("sessions")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === "sessions"
                    ? "bg-secondary text-white"
                    : "text-white/65 hover:bg-white/8 hover:text-white"
                }`}
              >
                <IconClock className="w-4 h-4 shrink-0" />
                Sessions
              </button>
              <button
                onClick={() => setActiveTab("mentors")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === "mentors"
                    ? "bg-secondary text-white"
                    : "text-white/65 hover:bg-white/8 hover:text-white"
                }`}
              >
                <IconUsers className="w-4 h-4 shrink-0" />
                Mentors
              </button>
              <button
                onClick={() => setActiveTab("testimonials")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === "testimonials"
                    ? "bg-secondary text-white"
                    : "text-white/65 hover:bg-white/8 hover:text-white"
                }`}
              >
                <IconQuote className="w-4 h-4 shrink-0" />
                Testimonials
              </button>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-1.5">
              System
            </div>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/65 hover:bg-white/8 hover:text-white transition-colors cursor-pointer">
              <IconSettings className="w-4 h-4 shrink-0" />
              Settings
            </button>
          </div>
        </nav>
        <div className="p-3 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-heading text-xs font-bold text-accent shrink-0">
              AD
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">Admin User</div>
              <div className="text-[10px] text-white/45">Super Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOPBAR */}
        <header className="h-[54px] bg-white border-b border-border-subtle flex items-center justify-between px-6 shrink-0">
          <div className="font-heading text-base font-extrabold text-primary capitalize">
            {activeTab === "hero" ? "Hero Section" : activeTab}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-border-subtle bg-surface flex items-center justify-center cursor-pointer relative">
              <IconBell className="w-4 h-4 text-text-muted" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500"></div>
            </div>
            <div className="w-8 h-8 rounded-lg border border-border-subtle bg-surface flex items-center justify-center cursor-pointer">
              <IconSearch className="w-4 h-4 text-text-muted" />
            </div>
            {["courses", "sessions", "mentors", "testimonials"].includes(activeTab) && (
              <button
                onClick={() =>
                  openDrawer(
                    activeTab.slice(0, -1) as "course" | "session" | "mentor" | "testimonial"
                  )
                }
                className="text-xs font-bold px-4 py-2 rounded-lg bg-secondary text-white hover:bg-secondary/90 transition-colors cursor-pointer flex items-center gap-1"
              >
                <IconPlus className="w-3.5 h-3.5" />
                Add new
              </button>
            )}
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* 1. DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {courses.length === 0 && sessions.length === 0 && mentors.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="flex gap-3 items-start">
                    <IconSparkles className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading text-sm font-bold text-amber-800">Database tables are empty!</h4>
                      <p className="text-xs text-amber-700/80 leading-relaxed mt-0.5">
                        Your PostgreSQL database schema is deployed, but has no records. Click below to bulk sync all the website design mockup data (courses, sessions, mentors, testimonials) into the backend tables.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSyncMockData}
                    disabled={syncing}
                    className="text-xs font-bold px-5 py-2.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {syncing ? "Syncing to Database..." : "Populate Database Data"}
                  </button>
                </div>
              )}

              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-border-subtle rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div className="w-[38px] h-[38px] rounded-xl bg-badge-bg flex items-center justify-center text-secondary mb-3">
                    <IconUsers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted mb-0.5">Total Students</div>
                    <div className="font-heading text-2xl font-extrabold text-primary">
                      {dashboardStats.totalStudents.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-2 font-medium">
                    &uarr; 8.2% this month
                  </div>
                </div>

                <div className="bg-white border border-border-subtle rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div className="w-[38px] h-[38px] rounded-xl bg-green-50 flex items-center justify-center text-green-700 mb-3">
                    <IconUserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted mb-0.5">Active Mentors</div>
                    <div className="font-heading text-2xl font-extrabold text-primary">
                      {dashboardStats.activeMentors.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-2 font-medium">
                    &uarr; 3.1% this month
                  </div>
                </div>

                <div className="bg-white border border-border-subtle rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div className="w-[38px] h-[38px] rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-700 mb-3">
                    <IconBook className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted mb-0.5">Total Courses</div>
                    <div className="font-heading text-2xl font-extrabold text-primary">
                      {dashboardStats.totalCourses}
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-2 font-medium">
                    &uarr; 12 new this week
                  </div>
                </div>

                <div className="bg-white border border-border-subtle rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div className="w-[38px] h-[38px] rounded-xl bg-pink-50 flex items-center justify-center text-pink-700 mb-3">
                    <IconCurrencyRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted mb-0.5">Revenue (June)</div>
                    <div className="font-heading text-2xl font-extrabold text-primary">
                      ₹4.2L
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-2 font-medium">
                    &uarr; 18.4% vs last month
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-border-subtle rounded-2xl p-5 shadow-sm lg:col-span-2">
                  <h3 className="font-heading text-xs font-bold text-primary mb-6">
                    Student signups &mdash; last 7 days
                  </h3>
                  <div className="flex items-end gap-3 h-28">
                    {[
                      { l: "Mon", h: 40 },
                      { l: "Tue", h: 65 },
                      { l: "Wed", h: 50 },
                      { l: "Thu", h: 80 },
                      { l: "Fri", h: 95, a: true },
                      { l: "Sat", h: 70 },
                      { l: "Sun", h: 55 },
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div
                          style={{ height: `${bar.h}%` }}
                          className={`w-full rounded-t-sm min-h-[4px] transition-all duration-500 ${
                            bar.a ? "bg-accent" : "bg-secondary"
                          }`}
                        ></div>
                        <span className="text-[9px] text-text-muted">{bar.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-border-subtle rounded-2xl p-5 shadow-sm flex flex-col items-center justify-between">
                  <h3 className="font-heading text-xs font-bold text-primary w-full text-left mb-4">
                    Courses by format
                  </h3>
                  {/* SVG Donut representation */}
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg width="90" height="90" viewBox="0 0 90 90">
                      <circle
                        cx="45"
                        cy="45"
                        r="34"
                        fill="none"
                        stroke="#E6F1FB"
                        strokeWidth="12"
                      />
                      <circle
                        cx="45"
                        cy="45"
                        r="34"
                        fill="none"
                        stroke="#2F7FE8"
                        strokeWidth="12"
                        strokeDasharray="107 107"
                        strokeDashoffset="0"
                        transform="rotate(-90 45 45)"
                      />
                      <circle
                        cx="45"
                        cy="45"
                        r="34"
                        fill="none"
                        stroke="#FFC107"
                        strokeWidth="12"
                        strokeDasharray="64 150"
                        strokeDashoffset="-107"
                        transform="rotate(-90 45 45)"
                      />
                      <circle
                        cx="45"
                        cy="45"
                        r="34"
                        fill="none"
                        stroke="#2ECC71"
                        strokeWidth="12"
                        strokeDasharray="42 172"
                        strokeDashoffset="-171"
                        transform="rotate(-90 45 45)"
                      />
                    </svg>
                    <div className="absolute font-heading text-xs font-extrabold text-primary">
                      {dashboardStats.totalCourses}
                    </div>
                  </div>
                  <div className="w-full space-y-1.5 mt-4">
                    <div className="flex items-center text-[10px] text-text-muted">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary mr-2"></span>
                      Live batches
                      <span className="ml-auto font-bold text-primary">50%</span>
                    </div>
                    <div className="flex items-center text-[10px] text-text-muted">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent mr-2"></span>
                      Recorded
                      <span className="ml-auto font-bold text-primary">30%</span>
                    </div>
                    <div className="flex items-center text-[10px] text-text-muted">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span>
                      Hourly
                      <span className="ml-auto font-bold text-primary">20%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Tables Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-border-subtle rounded-2xl p-5 shadow-sm overflow-x-auto">
                  <h3 className="font-heading text-xs font-bold text-primary mb-4">
                    Recent signups
                  </h3>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-badge-bg/40 border-b border-border-subtle">
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Student</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Course</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testimonials.slice(0, 4).map((testi, i) => (
                        <tr key={i} className="border-b border-border-subtle/50 hover:bg-surface/30">
                          <td className="py-2 px-3 text-xs text-primary flex items-center gap-2">
                            <div
                              style={{ backgroundColor: testi.avatarBg }}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-accent font-heading"
                            >
                              {testi.avatarText}
                            </div>
                            {testi.studentName}
                          </td>
                          <td className="py-2 px-3 text-xs text-text-muted">
                            {courses.length > 0 ? courses[i % courses.length].title.split(" ")[0] : "N/A"}
                          </td>
                          <td className="py-2 px-3 text-xs text-text-muted">
                            {i < 2 ? "Today" : "Yesterday"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white border border-border-subtle rounded-2xl p-5 shadow-sm overflow-x-auto">
                  <h3 className="font-heading text-xs font-bold text-primary mb-4">
                    Live sessions today
                  </h3>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-badge-bg/40 border-b border-border-subtle">
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Session</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Mentor</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.slice(0, 4).map((sess, i) => (
                        <tr key={i} className="border-b border-border-subtle/50 hover:bg-surface/30">
                          <td className="py-2 px-3 text-xs text-primary font-semibold">
                            {sess.title.split(" ")[0]}
                          </td>
                          <td className="py-2 px-3 text-xs text-text-muted">
                            {sess.mentor}
                          </td>
                          <td className="py-2 px-3 text-xs text-text-muted">
                            {`${5 + i}:00 PM`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. HERO PAGE EDIT TAB */}
          {activeTab === "hero" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left: Preview */}
              <div className="lg:sticky lg:top-4 space-y-3">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary bg-badge-bg px-3.5 py-1 rounded-full">
                  <IconEye className="w-4 h-4" />
                  Live preview
                </div>
                {/* Browser shell container mockup */}
                <div className="bg-[#F5F8FF] border border-border-subtle rounded-2xl overflow-hidden shadow-md">
                  {/* Mock Navbar */}
                  <div className="bg-white border-b border-border-subtle px-4 h-9 flex items-center justify-between">
                    <div className="font-heading text-xs font-extrabold text-primary">
                      Tuto<span className="text-secondary">board</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-9 h-1 rounded-full bg-border-subtle"></div>
                      <div className="w-9 h-1 rounded-full bg-border-subtle"></div>
                      <div className="w-9 h-1 rounded-full bg-border-subtle"></div>
                      <div className="w-10 h-4 bg-secondary rounded-sm"></div>
                    </div>
                  </div>
                  {/* Mock Hero Copy */}
                  <div className="p-5 flex flex-col gap-2.5">
                    <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-badge-bg text-badge-text border border-badge-border w-fit">
                      <IconSparkles className="w-2.5 h-2.5" />
                      {heroCopy.badgeText}
                    </div>
                    <h2 className="font-heading text-base font-extrabold text-primary leading-snug max-w-[280px]">
                      {renderPrevHeadline()}
                    </h2>
                    <p className="text-[9px] text-text-muted leading-relaxed max-w-[260px]">
                      {heroCopy.subheading}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button className="text-[9px] font-bold px-3 py-1 rounded bg-primary text-white">
                        {heroCopy.primaryCta}
                      </button>
                      <button className="text-[9px] font-bold px-3 py-1 rounded bg-transparent text-primary border border-primary">
                        {heroCopy.secondaryCta}
                      </button>
                    </div>
                  </div>
                  {/* Mock stats counters */}
                  <div className="bg-primary grid grid-cols-4 py-2.5 px-4">
                    <div className="text-center border-r border-white/12">
                      <div className="font-heading text-xs font-bold text-accent">{heroCopy.c1}</div>
                      <div className="text-[7px] text-white/60">{heroCopy.cl1}</div>
                    </div>
                    <div className="text-center border-r border-white/12">
                      <div className="font-heading text-xs font-bold text-accent">{heroCopy.c2}</div>
                      <div className="text-[7px] text-white/60">{heroCopy.cl2}</div>
                    </div>
                    <div className="text-center border-r border-white/12">
                      <div className="font-heading text-xs font-bold text-accent">{heroCopy.c3}</div>
                      <div className="text-[7px] text-white/60">{heroCopy.cl3}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-heading text-xs font-bold text-accent">{heroCopy.c4}</div>
                      <div className="text-[7px] text-white/60">{heroCopy.cl4}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Form panel */}
              <div className="bg-white border border-border-subtle rounded-2xl p-5 shadow-sm space-y-5">
                <div className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border-subtle pb-2">
                  Hero copy editor
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Badge text</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none focus:border-secondary"
                      type="text"
                      value={heroCopy.badgeText}
                      onChange={(e) => setHeroCopy({ ...heroCopy, badgeText: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Headline</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none focus:border-secondary"
                      type="text"
                      value={heroCopy.headline}
                      onChange={(e) => setHeroCopy({ ...heroCopy, headline: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">
                      Accented phrase <span className="text-text-muted font-normal">(blue text)</span>
                    </label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none focus:border-secondary"
                      type="text"
                      value={heroCopy.accentedText}
                      onChange={(e) => setHeroCopy({ ...heroCopy, accentedText: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Subheading</label>
                    <textarea
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none focus:border-secondary resize-none h-20"
                      value={heroCopy.subheading}
                      onChange={(e) => setHeroCopy({ ...heroCopy, subheading: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase">Primary CTA</label>
                      <input
                        className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none focus:border-secondary"
                        type="text"
                        value={heroCopy.primaryCta}
                        onChange={(e) => setHeroCopy({ ...heroCopy, primaryCta: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase">Primary link</label>
                      <input
                        className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none focus:border-secondary"
                        type="text"
                        value={heroCopy.primaryLink}
                        onChange={(e) => setHeroCopy({ ...heroCopy, primaryLink: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase">Secondary CTA</label>
                      <input
                        className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none focus:border-secondary"
                        type="text"
                        value={heroCopy.secondaryCta}
                        onChange={(e) => setHeroCopy({ ...heroCopy, secondaryCta: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase">Secondary link</label>
                      <input
                        className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none focus:border-secondary"
                        type="text"
                        value={heroCopy.secondaryLink}
                        onChange={(e) => setHeroCopy({ ...heroCopy, secondaryLink: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border-subtle pb-2 pt-2">
                  Counter values
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary">Stat 1 value</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg"
                      type="text"
                      value={heroCopy.c1}
                      onChange={(e) => setHeroCopy({ ...heroCopy, c1: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary">Stat 1 label</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg"
                      type="text"
                      value={heroCopy.cl1}
                      onChange={(e) => setHeroCopy({ ...heroCopy, cl1: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary">Stat 2 value</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg"
                      type="text"
                      value={heroCopy.c2}
                      onChange={(e) => setHeroCopy({ ...heroCopy, c2: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary">Stat 2 label</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg"
                      type="text"
                      value={heroCopy.cl2}
                      onChange={(e) => setHeroCopy({ ...heroCopy, cl2: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary">Stat 3 value</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg"
                      type="text"
                      value={heroCopy.c3}
                      onChange={(e) => setHeroCopy({ ...heroCopy, c3: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary">Stat 3 label</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg"
                      type="text"
                      value={heroCopy.cl3}
                      onChange={(e) => setHeroCopy({ ...heroCopy, cl3: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary">Stat 4 value</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg"
                      type="text"
                      value={heroCopy.c4}
                      onChange={(e) => setHeroCopy({ ...heroCopy, c4: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary">Stat 4 label</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg"
                      type="text"
                      value={heroCopy.cl4}
                      onChange={(e) => setHeroCopy({ ...heroCopy, cl4: e.target.value })}
                    />
                  </div>
                </div>

                <div className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border-subtle pb-2 pt-2">
                  Hero Image
                </div>
                <div className="border border-dashed border-border-subtle rounded-2xl p-6 text-center cursor-pointer bg-badge-bg/30 hover:bg-badge-bg/50 transition-colors">
                  <IconPhotoUp className="w-8 h-8 mx-auto text-text-muted mb-2" />
                  <p className="text-xs text-text-muted">Upload hero image</p>
                  <p className="text-[10px] text-text-muted/70 mt-1">PNG, JPG up to 4MB</p>
                </div>

                <div className="flex gap-3 pt-3 border-t border-border-subtle">
                  <button
                    onClick={saveHeroChanges}
                    className="text-xs font-semibold px-6 py-2.5 rounded-lg bg-secondary text-white hover:bg-secondary/90 transition-colors"
                  >
                    Publish changes
                  </button>
                  <button
                    onClick={loadData}
                    className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-transparent text-primary border border-border-subtle hover:bg-surface/50"
                  >
                    Revert
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. COURSES TAB */}
          {activeTab === "courses" && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 max-w-lg flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 border border-border-subtle rounded-lg bg-white outline-none"
                    />
                  </div>
                  <select
                    value={courseFormatFilter}
                    onChange={(e) => setCourseFormatFilter(e.target.value)}
                    className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer"
                  >
                    <option>All formats</option>
                    <option>Live batch</option>
                    <option>Recorded</option>
                    <option>Hourly</option>
                  </select>
                  <select
                    value={courseSubjectFilter}
                    onChange={(e) => setCourseSubjectFilter(e.target.value)}
                    className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer"
                  >
                    <option>All subjects</option>
                    <option>Mathematics</option>
                    <option>Science</option>
                    <option>Programming</option>
                    <option>English</option>
                  </select>
                </div>
                <div className="flex border border-border-subtle rounded-lg overflow-hidden shrink-0">
                  <button
                    onClick={() => setCourseView("grid")}
                    className={`p-2 cursor-pointer transition-colors ${
                      courseView === "grid" ? "bg-secondary text-white" : "bg-white text-text-muted"
                    }`}
                  >
                    <IconLayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCourseView("list")}
                    className={`p-2 cursor-pointer transition-colors ${
                      courseView === "list" ? "bg-secondary text-white" : "bg-white text-text-muted"
                    }`}
                  >
                    <IconList className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* View Render */}
              {courseView === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCourses.map((c) => {
                    let IconComponent = IconBook;
                    if (c.iconName === "math") IconComponent = IconMath;
                    else if (c.iconName === "code") IconComponent = IconCode;
                    else if (c.iconName === "flask") IconComponent = IconFlask;
                    else if (c.iconName === "writing") IconComponent = IconPencil;
                    else if (c.iconName === "dna") IconComponent = IconDna;

                    return (
                      <div
                        key={c.id}
                        className="bg-white border border-border-subtle rounded-2xl overflow-hidden hover:shadow-md transition-shadow group relative"
                      >
                        <div
                          style={{ backgroundColor: c.colorBg }}
                          className="w-full h-24 flex items-center justify-center relative"
                        >
                          <IconComponent className="w-10 h-10 text-primary/80" />
                          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openDrawer("course", c.id)}
                              className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg cursor-pointer text-text-muted"
                            >
                              <IconEdit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteItem("course", c.id)}
                              className="w-7 h-7 rounded-lg border border-red-200 bg-white flex items-center justify-center hover:bg-red-50 text-red-600 cursor-pointer"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <span
                            className={`text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-2.5 ${
                              c.format === "Live batch"
                                ? "bg-badge-bg text-badge-text"
                                : c.format === "Recorded"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {c.format}
                          </span>
                          <h3 className="font-heading text-xs font-bold text-primary mb-1 truncate">
                            {c.title}
                          </h3>
                          <div className="text-[10px] text-text-muted flex items-center gap-1.5 mb-3">
                            <span>{c.subject}</span>
                            <span className="text-border-subtle">&middot;</span>
                            <span>⭐ {c.rating} ({c.students} students)</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-border-subtle/50 pt-3">
                            <span className="font-heading text-sm font-extrabold text-primary">
                              ₹{c.price.toLocaleString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  c.status === "Active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {c.status}
                              </span>
                              <div
                                onClick={() => toggleCourseStatus(c.id)}
                                className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors duration-200 ${
                                  c.status === "Active" ? "bg-green-500" : "bg-border-subtle"
                                }`}
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${
                                    c.status === "Active" ? "left-4" : "left-0.5"
                                  }`}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div
                    onClick={() => openDrawer("course")}
                    className="border-2 border-dashed border-border-subtle bg-badge-bg/10 rounded-2xl flex flex-col items-center justify-center min-h-[190px] cursor-pointer hover:border-secondary hover:bg-badge-bg/30 transition-colors"
                  >
                    <IconPlus className="w-8 h-8 text-text-muted/60 mb-2" />
                    <span className="text-xs font-bold text-text-muted">Add new course</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-border-subtle rounded-2xl p-4 shadow-sm overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-badge-bg/30 border-b border-border-subtle">
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Course</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Subject</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Format</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Price</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Students</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Status</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Active</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.map((c) => (
                        <tr key={c.id} className="border-b border-border-subtle/50 hover:bg-surface/30">
                          <td className="py-2.5 px-3 text-xs text-primary font-bold">{c.title}</td>
                          <td className="py-2.5 px-3 text-xs text-text-muted">{c.subject}</td>
                          <td className="py-2.5 px-3 text-xs">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                c.format === "Live batch"
                                  ? "bg-badge-bg text-badge-text"
                                  : c.format === "Recorded"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {c.format}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-primary font-semibold">
                            ₹{c.price.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-text-muted">{c.students}</td>
                          <td className="py-2.5 px-3 text-xs">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                c.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-xs">
                            <div
                              onClick={() => toggleCourseStatus(c.id)}
                              className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors duration-200 ${
                                c.status === "Active" ? "bg-green-500" : "bg-border-subtle"
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${
                                  c.status === "Active" ? "left-4" : "left-0.5"
                                }`}
                              ></div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex gap-1.5 justify-center">
                              <button
                                onClick={() => openDrawer("course", c.id)}
                                className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg text-text-muted cursor-pointer"
                              >
                                <IconEdit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteItem("course", c.id)}
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
                  <div className="flex justify-between items-center mt-4 text-[10px] text-text-muted">
                    <div>Showing {filteredCourses.length} of {courses.length} courses</div>
                    <div className="flex gap-1">
                      <button className="px-2 py-1 border border-border-subtle bg-white rounded-md font-bold text-primary active:bg-badge-bg/40">1</button>
                      <button className="px-2 py-1 border border-border-subtle bg-white rounded-md text-text-muted">2</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. SESSIONS TAB */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 max-w-lg flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search sessions..."
                      value={sessionSearch}
                      onChange={(e) => setSessionSearch(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 border border-border-subtle rounded-lg bg-white outline-none"
                    />
                  </div>
                  <select
                    value={sessionSubjectFilter}
                    onChange={(e) => setSessionSubjectFilter(e.target.value)}
                    className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer"
                  >
                    <option>All subjects</option>
                    <option>Mathematics</option>
                    <option>Science</option>
                    <option>English</option>
                    <option>Programming</option>
                  </select>
                  <select
                    value={sessionTypeFilter}
                    onChange={(e) => setSessionTypeFilter(e.target.value)}
                    className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer"
                  >
                    <option>All types</option>
                    <option>1-on-1</option>
                    <option>Group</option>
                  </select>
                </div>
                <div className="flex border border-border-subtle rounded-lg overflow-hidden shrink-0">
                  <button
                    onClick={() => setSessionView("grid")}
                    className={`p-2 cursor-pointer transition-colors ${
                      sessionView === "grid" ? "bg-secondary text-white" : "bg-white text-text-muted"
                    }`}
                  >
                    <IconLayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSessionView("list")}
                    className={`p-2 cursor-pointer transition-colors ${
                      sessionView === "list" ? "bg-secondary text-white" : "bg-white text-text-muted"
                    }`}
                  >
                    <IconList className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* View Render */}
              {sessionView === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSessions.map((s) => (
                    <div
                      key={s.id}
                      className={`bg-white border border-border-subtle rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative ${
                        s.status === "Inactive" ? "opacity-75" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-heading text-xs font-bold text-primary truncate max-w-[160px]">
                          {s.title}
                        </h3>
                        <span
                          className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                            s.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          style={{ backgroundColor: s.mentorColor }}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-accent font-heading"
                        >
                          {s.mentorAvatar}
                        </div>
                        <span className="text-[10px] text-text-muted font-medium">{s.mentor}</span>
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 ml-auto">
                          {s.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted leading-relaxed mb-4 h-12 overflow-hidden text-ellipsis">
                        {s.description}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] text-text-muted mb-4 border-b border-border-subtle/30 pb-3">
                        <div>
                          <strong className="text-xs text-primary font-bold block leading-tight">
                            {s.bookings}
                          </strong>
                          bookings
                        </div>
                        <div>
                          <strong className="text-xs text-primary font-bold block leading-tight">
                            {s.subject}
                          </strong>
                          subject
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-heading text-base font-extrabold text-primary">
                          ₹{s.price}
                          <span className="text-[10px] text-text-muted font-normal">/hr</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            onClick={() => toggleSessionStatus(s.id)}
                            className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors duration-200 ${
                              s.status === "Active" ? "bg-green-500" : "bg-border-subtle"
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${
                                s.status === "Active" ? "left-4" : "left-0.5"
                              }`}
                            ></div>
                          </div>
                          <button
                            onClick={() => openDrawer("session", s.id)}
                            className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg text-text-muted cursor-pointer"
                          >
                            <IconEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteItem("session", s.id)}
                            className="w-7 h-7 rounded-lg border border-red-200 bg-white flex items-center justify-center hover:bg-red-50 text-red-600 cursor-pointer"
                          >
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div
                    onClick={() => openDrawer("session")}
                    className="border-2 border-dashed border-border-subtle bg-badge-bg/10 rounded-2xl flex flex-col items-center justify-center min-h-[190px] cursor-pointer hover:border-secondary hover:bg-badge-bg/30 transition-colors"
                  >
                    <IconPlus className="w-8 h-8 text-text-muted/60 mb-2" />
                    <span className="text-xs font-bold text-text-muted">Add new session</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-border-subtle rounded-2xl p-4 shadow-sm overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-badge-bg/30 border-b border-border-subtle">
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Session</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Mentor</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Subject</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Price/hr</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Bookings</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Status</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Active</th>
                        <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((s) => (
                        <tr key={s.id} className="border-b border-border-subtle/50 hover:bg-surface/30">
                          <td className="py-2.5 px-3 text-xs text-primary font-bold">{s.title}</td>
                          <td className="py-2.5 px-3 text-xs text-text-muted">
                            <div className="flex items-center gap-1.5">
                              <div
                                style={{ backgroundColor: s.mentorColor }}
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-accent font-heading"
                              >
                                {s.mentorAvatar}
                              </div>
                              {s.mentor}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-text-muted">{s.subject}</td>
                          <td className="py-2.5 px-3 text-xs text-primary font-semibold">₹{s.price}</td>
                          <td className="py-2.5 px-3 text-xs text-text-muted">{s.bookings}</td>
                          <td className="py-2.5 px-3 text-xs">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                s.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-xs">
                            <div
                              onClick={() => toggleSessionStatus(s.id)}
                              className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors duration-200 ${
                                s.status === "Active" ? "bg-green-500" : "bg-border-subtle"
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${
                                  s.status === "Active" ? "left-4" : "left-0.5"
                                }`}
                              ></div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex gap-1.5 justify-center">
                              <button
                                onClick={() => openDrawer("session", s.id)}
                                className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg text-text-muted cursor-pointer"
                              >
                                <IconEdit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteItem("session", s.id)}
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
            </div>
          )}

          {/* 5. MENTORS TAB */}
          {activeTab === "mentors" && (
            <div className="bg-white border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 max-w-lg">
                  <div className="relative flex-1">
                    <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search mentors..."
                      value={mentorSearch}
                      onChange={(e) => setMentorSearch(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 border border-border-subtle rounded-lg outline-none"
                    />
                  </div>
                  <select
                    value={mentorSubjectFilter}
                    onChange={(e) => setMentorSubjectFilter(e.target.value)}
                    className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer"
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
                    className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer"
                  >
                    <option>All statuses</option>
                    <option>Verified</option>
                    <option>Unverified</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-badge-bg/30 border-b border-border-subtle">
                      <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Mentor</th>
                      <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Subject</th>
                      <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Rating</th>
                      <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Students</th>
                      <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Courses</th>
                      <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Rate/hr</th>
                      <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Verified</th>
                      <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMentors.map((m) => (
                      <tr key={m.id} className="border-b border-border-subtle/50 hover:bg-surface/30">
                        <td className="py-3 px-3 text-xs text-primary flex items-center gap-2.5">
                          <div
                            style={{ backgroundColor: m.avatarBg }}
                            className="w-8 h-8 rounded-full flex items-center justify-center font-heading text-xs font-bold text-accent"
                          >
                            {m.avatarText}
                          </div>
                          <div>
                            <div className="font-bold text-primary leading-tight">{m.name}</div>
                            <div className="text-[9px] text-text-muted">
                              {m.qualification} &middot; {m.experience} yrs exp
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-text-muted">{m.subject}</td>
                        <td className="py-3 px-3 text-xs text-accent font-semibold">⭐ {m.rating}</td>
                        <td className="py-3 px-3 text-xs text-text-muted">{m.students}</td>
                        <td className="py-3 px-3 text-xs text-text-muted">{m.courses}</td>
                        <td className="py-3 px-3 text-xs text-primary font-semibold">₹{m.rate}</td>
                        <td className="py-3 px-3 text-xs">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              m.verified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {m.verified ? "Verified" : "Unverified"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex gap-1.5 justify-center">
                            <button
                              onClick={() => openDrawer("mentor", m.id)}
                              className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg text-text-muted cursor-pointer"
                            >
                              <IconEdit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteItem("mentor", m.id)}
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
            </div>
          )}

          {/* 6. TESTIMONIALS TAB */}
          {activeTab === "testimonials" && (
            <div className="bg-white border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search testimonials..."
                      value={testimonialSearch}
                      onChange={(e) => setTestimonialSearch(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 border border-border-subtle rounded-lg outline-none"
                    />
                  </div>
                  <select
                    value={testimonialFilter}
                    onChange={(e) => setTestimonialFilter(e.target.value)}
                    className="text-xs p-2 border border-border-subtle rounded-lg bg-white cursor-pointer"
                  >
                    <option>All</option>
                    <option>Visible</option>
                    <option>Hidden</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-badge-bg/30 border-b border-border-subtle">
                      <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Student</th>
                      <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Role / Achievement</th>
                      <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Quote</th>
                      <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Rating</th>
                      <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-left">Show on Site</th>
                      <th className="text-[9px] font-bold text-text-muted py-2 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTestimonials.map((t) => (
                      <tr key={t.id} className="border-b border-border-subtle/50 hover:bg-surface/30">
                        <td className="py-3 px-3 text-xs text-primary flex items-center gap-2">
                          <div
                            style={{ backgroundColor: t.avatarBg }}
                            className="w-7 h-7 rounded-full flex items-center justify-center font-heading text-[10px] font-bold text-accent"
                          >
                            {t.avatarText}
                          </div>
                          <span className="font-bold">{t.studentName}</span>
                        </td>
                        <td className="py-3 px-3 text-xs text-text-muted">{t.role}</td>
                        <td className="py-3 px-3 text-xs text-text-muted max-w-[180px] truncate">
                          &ldquo;{t.quote}&rdquo;
                        </td>
                        <td className="py-3 px-3 text-xs text-accent select-none">
                          {"★".repeat(t.rating)}
                        </td>
                        <td className="py-3 px-3 text-xs">
                          <div
                            onClick={() => toggleTestiStatus(t.id)}
                            className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors duration-200 ${
                              t.showOnSite ? "bg-green-500" : "bg-border-subtle"
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${
                                t.showOnSite ? "left-4" : "left-0.5"
                              }`}
                            ></div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex gap-1.5 justify-center">
                            <button
                              onClick={() => openDrawer("testimonial", t.id)}
                              className="w-7 h-7 rounded-lg border border-border-subtle bg-white flex items-center justify-center hover:bg-badge-bg text-text-muted cursor-pointer"
                            >
                              <IconEdit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteItem("testimonial", t.id)}
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
            </div>
          )}
        </main>
      </div>

      {/* DRAWER MODAL OVERLAY */}
      {drawerOpen && (
        <>
          <div
            onClick={closeDrawer}
            className="fixed inset-0 bg-primary/40 backdrop-blur-xs z-[200] transition-opacity duration-300"
          ></div>
          <div className="fixed top-0 right-0 w-[420px] h-full bg-white z-[201] shadow-2xl flex flex-col transition-transform duration-300 animate-slide-in">
            <header className="px-6 py-4.5 border-b border-border-subtle flex items-center justify-between shrink-0">
              <h3 className="font-heading text-sm font-extrabold text-primary">
                {drawerEditId ? "Edit " : "Add new "}
                {drawerMode}
              </h3>
              <button
                onClick={closeDrawer}
                className="w-7 h-7 border border-border-subtle bg-surface hover:bg-badge-bg rounded-lg text-primary text-sm flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Form 1: Course */}
              {drawerMode === "course" && (
                <>
                  {/* Basic Details (Visible by default) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Course title</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                      type="text"
                      placeholder="e.g. Advanced Calculus & Algebra"
                      value={drawerForm.title || ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, title: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Short Description</label>
                    <textarea
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none resize-none h-18"
                      placeholder="Enter course details, syllabus preview or overview..."
                      value={drawerForm.description || ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, description: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Subject</label>
                    <select
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer"
                      value={drawerForm.subject || "Mathematics"}
                      onChange={(e) => setDrawerForm({ ...drawerForm, subject: e.target.value })}
                    >
                      <option>Mathematics</option>
                      <option>Science</option>
                      <option>Programming</option>
                      <option>English</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase">Format</label>
                      <select
                        className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer"
                        value={drawerForm.format || "Live batch"}
                        onChange={(e) => setDrawerForm({ ...drawerForm, format: e.target.value })}
                      >
                        <option>Live batch</option>
                        <option>Recorded</option>
                        <option>Hourly</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase">Price (₹)</label>
                      <input
                        className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                        type="number"
                        value={drawerForm.price || 0}
                        onChange={(e) => setDrawerForm({ ...drawerForm, price: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Assign Mentor</label>
                    <select
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer"
                      value={drawerForm.mentor || "Arjun Kapoor"}
                      onChange={(e) => setDrawerForm({ ...drawerForm, mentor: e.target.value })}
                    >
                      {mentors.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Direct File Cover Image Upload */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Cover Image</label>
                    {drawerForm.coverImageUrl ? (
                      <div className="relative border border-border-subtle rounded-lg p-2 flex items-center gap-3 bg-surface">
                        <img src={drawerForm.coverImageUrl} className="w-12 h-12 rounded object-cover" alt="Cover Preview" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-semibold text-primary truncate">{drawerForm.coverImageUrl}</p>
                          <button
                            type="button"
                            onClick={() => setDrawerForm({ ...drawerForm, coverImageUrl: "" })}
                            className="text-[9px] text-red-600 font-bold hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative border border-dashed border-border-subtle hover:border-secondary hover:bg-badge-bg/10 rounded-lg p-4 text-center transition-colors cursor-pointer min-h-[50px] flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingImage}
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <span className="text-[11px] text-text-muted font-bold">
                          {uploadingImage ? "Uploading Image..." : "Upload Cover from Device"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Status</label>
                    <select
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer"
                      value={drawerForm.status || "Draft"}
                      onChange={(e) => setDrawerForm({ ...drawerForm, status: e.target.value })}
                    >
                      <option>Draft</option>
                      <option>Active</option>
                    </select>
                  </div>

                  {/* Advanced Options Toggler */}
                  <button
                    type="button"
                    onClick={() => setShowMoreCourseDetails(!showMoreCourseDetails)}
                    className="w-full text-xs font-bold py-2 border border-secondary rounded-lg text-secondary hover:bg-[#F0F6FF] transition-colors mt-2 cursor-pointer"
                  >
                    {showMoreCourseDetails ? "Hide Details" : "Show More"}
                  </button>

                  {/* Advanced Custom Fields (Outcomes, Syllabus, Inclusions, Timings) */}
                  {showMoreCourseDetails && (
                    <div className="space-y-4 border-t border-border-subtle pt-4 mt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-primary uppercase">About details description</label>
                        <textarea
                          className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none resize-none h-20"
                          placeholder="e.g. This is a fully live batch... (overwrites default about text)"
                          value={drawerForm.aboutCourse || ""}
                          onChange={(e) => setDrawerForm({ ...drawerForm, aboutCourse: e.target.value })}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-primary uppercase">What you'll learn (one item per line)</label>
                        <textarea
                          className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none resize-none h-20"
                          placeholder="e.g. Master differentiation and integration&#10;Solve complex limit and continuity problems"
                          value={drawerForm.learningOutcomes ? drawerForm.learningOutcomes.join("\n") : ""}
                          onChange={(e) => setDrawerForm({ ...drawerForm, learningOutcomes: e.target.value.split("\n").filter(Boolean) })}
                        />
                      </div>

                      {/* Course format specific forms */}
                      {drawerForm.format === "Live batch" && (
                        <>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-primary uppercase">Live Inclusions (5 items)</label>
                            {[0, 1, 2, 3, 4].map((idx) => {
                              const defaults = [
                                "16 live sessions, 2x weekly",
                                "Live on Zoom — join via browser/app",
                                "Live doubt-solving every class",
                                "7-day replay for missed classes",
                                "Certificate on batch completion"
                              ];
                              const currentVal = drawerForm.inclusions?.[idx] !== undefined ? drawerForm.inclusions[idx] : "";
                              return (
                                <input
                                  key={idx}
                                  className="text-xs p-2 border border-border-subtle rounded-lg outline-none mb-1"
                                  type="text"
                                  placeholder={defaults[idx]}
                                  value={currentVal}
                                  onChange={(e) => {
                                    const newInc = [...(drawerForm.inclusions || ["", "", "", "", ""])];
                                    newInc[idx] = e.target.value;
                                    setDrawerForm({ ...drawerForm, inclusions: newInc });
                                  }}
                                />
                              );
                            })}
                          </div>

                          <div className="font-semibold text-[10px] text-text-muted uppercase tracking-wider mt-2 border-b border-border-subtle pb-1">
                            Live Batch Timings
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-primary uppercase">Batch Start Date</label>
                              <input
                                className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                                type="text"
                                placeholder="22 Jun 2026"
                                value={drawerForm.batchStartDate || ""}
                                onChange={(e) => setDrawerForm({ ...drawerForm, batchStartDate: e.target.value })}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-primary uppercase">Batch End Date</label>
                              <input
                                className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                                type="text"
                                placeholder="14 Aug 2026"
                                value={drawerForm.batchEndDate || ""}
                                onChange={(e) => setDrawerForm({ ...drawerForm, batchEndDate: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-primary uppercase">Class Days</label>
                              <input
                                className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                                type="text"
                                placeholder="Mon & Thu"
                                value={drawerForm.classDays || ""}
                                onChange={(e) => setDrawerForm({ ...drawerForm, classDays: e.target.value })}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-primary uppercase">Class Timing</label>
                              <input
                                className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                                type="text"
                                placeholder="6:00–7:30 PM IST"
                                value={drawerForm.classTiming || ""}
                                onChange={(e) => setDrawerForm({ ...drawerForm, classTiming: e.target.value })}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {drawerForm.format === "Recorded" && (
                        <>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-primary uppercase">Recorded Inclusions (5 items)</label>
                            {[0, 1, 2, 3, 4].map((idx) => {
                              const defaults = [
                                "32 hours of content",
                                "Access on mobile & desktop",
                                "Certificate of completion",
                                "Lifetime access",
                                "Weekly live Q&A with mentor"
                              ];
                              const currentVal = drawerForm.inclusions?.[idx] !== undefined ? drawerForm.inclusions[idx] : "";
                              return (
                                <input
                                  key={idx}
                                  className="text-xs p-2 border border-border-subtle rounded-lg outline-none mb-1"
                                  type="text"
                                  placeholder={defaults[idx]}
                                  value={currentVal}
                                  onChange={(e) => {
                                    const newInc = [...(drawerForm.inclusions || ["", "", "", "", ""])];
                                    newInc[idx] = e.target.value;
                                    setDrawerForm({ ...drawerForm, inclusions: newInc });
                                  }}
                                />
                              );
                            })}
                          </div>

                          <div className="flex flex-col gap-2 mt-2">
                            <label className="text-[10px] font-bold text-primary uppercase">Course Curriculum Syllabus</label>
                            <div className="space-y-3 p-3 bg-surface rounded-xl border border-border-subtle">
                              {(drawerForm.curriculum || []).map((mod: any, mIdx: number) => (
                                <div key={mIdx} className="border border-border-subtle bg-white rounded-lg p-2.5 space-y-2 relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newCurr = [...drawerForm.curriculum];
                                      newCurr.splice(mIdx, 1);
                                      setDrawerForm({ ...drawerForm, curriculum: newCurr });
                                    }}
                                    className="absolute top-2 right-2 text-xs text-red-600 font-bold hover:underline cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                  
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-bold text-slate-400">Module Name</span>
                                    <input
                                      className="text-xs p-1.5 border border-border-subtle rounded-md outline-none"
                                      type="text"
                                      placeholder="Module 1 — Limits"
                                      value={mod.name || ""}
                                      onChange={(e) => {
                                        const newCurr = [...drawerForm.curriculum];
                                        newCurr[mIdx] = { ...mod, name: e.target.value };
                                        setDrawerForm({ ...drawerForm, curriculum: newCurr });
                                      }}
                                    />
                                  </div>

                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-bold text-slate-400">Module Metadata</span>
                                    <input
                                      className="text-xs p-1.5 border border-border-subtle rounded-md outline-none"
                                      type="text"
                                      placeholder="5 lessons · 6h 20m"
                                      value={mod.meta || ""}
                                      onChange={(e) => {
                                        const newCurr = [...drawerForm.curriculum];
                                        newCurr[mIdx] = { ...mod, meta: e.target.value };
                                        setDrawerForm({ ...drawerForm, curriculum: newCurr });
                                      }}
                                    />
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-slate-400">Lessons</span>
                                    {(mod.lessons || []).map((les: string, lIdx: number) => (
                                      <div key={lIdx} className="flex items-center gap-1.5 mb-1">
                                        <input
                                          className="text-[11px] p-1.5 border border-border-subtle rounded-md outline-none flex-1"
                                          type="text"
                                          placeholder={`Lesson ${lIdx + 1}`}
                                          value={les}
                                          onChange={(e) => {
                                            const newLessons = [...mod.lessons];
                                            newLessons[lIdx] = e.target.value;
                                            const newCurr = [...drawerForm.curriculum];
                                            newCurr[mIdx] = { ...mod, lessons: newLessons };
                                            setDrawerForm({ ...drawerForm, curriculum: newCurr });
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newLessons = [...mod.lessons];
                                            newLessons.splice(lIdx, 1);
                                            const newCurr = [...drawerForm.curriculum];
                                            newCurr[mIdx] = { ...mod, lessons: newLessons };
                                            setDrawerForm({ ...drawerForm, curriculum: newCurr });
                                          }}
                                          className="text-red-600 text-xs px-1 hover:underline cursor-pointer"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newLessons = [...(mod.lessons || []), ""];
                                        const newCurr = [...drawerForm.curriculum];
                                        newCurr[mIdx] = { ...mod, lessons: newLessons };
                                        setDrawerForm({ ...drawerForm, curriculum: newCurr });
                                      }}
                                      className="text-[10px] font-semibold text-secondary hover:underline self-start mt-1 cursor-pointer"
                                    >
                                      + Add Lesson
                                    </button>
                                  </div>
                                </div>
                              ))}
                              
                              <button
                                type="button"
                                onClick={() => {
                                  const newCurr = [...(drawerForm.curriculum || []), { name: "", meta: "", lessons: [""] }];
                                  setDrawerForm({ ...drawerForm, curriculum: newCurr });
                                }}
                                className="w-full text-xs font-semibold py-2 border border-dashed border-border-subtle rounded-lg text-primary hover:border-secondary hover:text-secondary transition-colors mt-2 cursor-pointer"
                              >
                                + Add Module
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Form 2: Session */}
              {drawerMode === "session" && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Session title</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                      type="text"
                      placeholder="e.g. Statistics & Probability"
                      value={drawerForm.title || ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, title: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Description</label>
                    <textarea
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none resize-none h-16"
                      placeholder="What will the session cover?"
                      value={drawerForm.description || ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase">Subject</label>
                      <select
                        className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer"
                        value={drawerForm.subject || "Mathematics"}
                        onChange={(e) => setDrawerForm({ ...drawerForm, subject: e.target.value })}
                      >
                        <option>Mathematics</option>
                        <option>Science</option>
                        <option>English</option>
                        <option>Programming</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase">Type</label>
                      <select
                        className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer"
                        value={drawerForm.type || "1-on-1"}
                        onChange={(e) => setDrawerForm({ ...drawerForm, type: e.target.value })}
                      >
                        <option>1-on-1</option>
                        <option>Group</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase">Price per hour (₹)</label>
                      <input
                        className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                        type="number"
                        value={drawerForm.price || 0}
                        onChange={(e) => setDrawerForm({ ...drawerForm, price: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase">Assign Mentor</label>
                      <select
                        className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer"
                        value={drawerForm.mentor || "Arjun Kapoor"}
                        onChange={(e) => setDrawerForm({ ...drawerForm, mentor: e.target.value })}
                      >
                        {mentors.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Status</label>
                    <select
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer"
                      value={drawerForm.status || "Active"}
                      onChange={(e) => setDrawerForm({ ...drawerForm, status: e.target.value })}
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>

                  {/* Advanced Options Toggler */}
                  <button
                    type="button"
                    onClick={() => setShowMoreSessionDetails(!showMoreSessionDetails)}
                    className="w-full text-xs font-bold py-2 border border-secondary rounded-lg text-secondary hover:bg-[#F0F6FF] transition-colors mt-2 cursor-pointer"
                  >
                    {showMoreSessionDetails ? "Hide Details" : "Show More"}
                  </button>

                  {/* Advanced Custom Fields */}
                  {showMoreSessionDetails && (
                    <div className="space-y-4 border-t border-border-subtle pt-4 mt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-primary uppercase">About Session description</label>
                        <textarea
                          className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none resize-none h-20"
                          placeholder="e.g. A focused 1-on-1 session covering..."
                          value={drawerForm.aboutSession || ""}
                          onChange={(e) => setDrawerForm({ ...drawerForm, aboutSession: e.target.value })}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-primary uppercase">What's Covered (one item per line)</label>
                        <textarea
                          className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none resize-none h-20"
                          placeholder="e.g. Confidence intervals & margin of error&#10;Hypothesis testing"
                          value={drawerForm.whatsCovered ? drawerForm.whatsCovered.join("\n") : ""}
                          onChange={(e) => setDrawerForm({ ...drawerForm, whatsCovered: e.target.value.split("\n").filter(Boolean) })}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-primary uppercase">Inclusions (5 items)</label>
                        {[0, 1, 2, 3, 4].map((idx) => {
                          const defaults = [
                            "Live on Zoom — any device",
                            "Summary notes after session",
                            "Free reschedule up to 4 hrs before",
                            "Pre-session topic form",
                            "Secure payment via Razorpay"
                          ];
                          const currentVal = drawerForm.inclusions?.[idx] !== undefined ? drawerForm.inclusions[idx] : "";
                          return (
                            <input
                              key={idx}
                              className="text-xs p-2 border border-border-subtle rounded-lg outline-none mb-1"
                              type="text"
                              placeholder={defaults[idx]}
                              value={currentVal}
                              onChange={(e) => {
                                const newInc = [...(drawerForm.inclusions || ["", "", "", "", ""])];
                                newInc[idx] = e.target.value;
                                setDrawerForm({ ...drawerForm, inclusions: newInc });
                              }}
                            />
                          );
                        })}
                      </div>

                      <div className="font-semibold text-[10px] text-text-muted uppercase tracking-wider mt-2 border-b border-border-subtle pb-1">
                        Session Timing & Details Parameters
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-primary uppercase">Duration Options</label>
                          <input
                            className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                            type="text"
                            placeholder="60 or 90 min"
                            value={drawerForm.durationOptions || ""}
                            onChange={(e) => setDrawerForm({ ...drawerForm, durationOptions: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-primary uppercase">Platform</label>
                          <input
                            className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                            type="text"
                            placeholder="Zoom"
                            value={drawerForm.platform || ""}
                            onChange={(e) => setDrawerForm({ ...drawerForm, platform: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-primary uppercase">Language</label>
                          <input
                            className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                            type="text"
                            placeholder="English / Hindi"
                            value={drawerForm.language || ""}
                            onChange={(e) => setDrawerForm({ ...drawerForm, language: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-primary uppercase">Days</label>
                          <input
                            className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                            type="text"
                            placeholder="Mon – Sat"
                            value={drawerForm.days || ""}
                            onChange={(e) => setDrawerForm({ ...drawerForm, days: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-primary uppercase">Reschedule Policy</label>
                        <input
                          className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                          type="text"
                          placeholder="Up to 4 hrs before"
                          value={drawerForm.reschedulePolicy || ""}
                          onChange={(e) => setDrawerForm({ ...drawerForm, reschedulePolicy: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Form 3: Mentor */}
              {drawerMode === "mentor" && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Full name</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                      type="text"
                      placeholder="e.g. Arjun Kapoor"
                      value={drawerForm.name || ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase">Specialty</label>
                      <input
                        className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                        type="text"
                        placeholder="e.g. Maths & Physics"
                        value={drawerForm.subject || ""}
                        onChange={(e) => setDrawerForm({ ...drawerForm, subject: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase">Hourly Rate (₹)</label>
                      <input
                        className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                        type="number"
                        value={drawerForm.rate || 0}
                        onChange={(e) => setDrawerForm({ ...drawerForm, rate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Bio</label>
                    <textarea
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none resize-none h-16"
                      placeholder="Biography..."
                      value={drawerForm.bio || ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, bio: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase">Exp (years)</label>
                      <input
                        className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                        type="number"
                        value={drawerForm.experience || 0}
                        onChange={(e) => setDrawerForm({ ...drawerForm, experience: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase">Qualification</label>
                      <input
                        className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                        type="text"
                        placeholder="e.g. IIT Delhi"
                        value={drawerForm.qualification || ""}
                        onChange={(e) => setDrawerForm({ ...drawerForm, qualification: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Verified</label>
                    <select
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer"
                      value={drawerForm.verified ? "Yes" : "No"}
                      onChange={(e) => setDrawerForm({ ...drawerForm, verified: e.target.value === "Yes" })}
                    >
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                </>
              )}

              {/* Form 4: Testimonial */}
              {drawerMode === "testimonial" && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Student name</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                      type="text"
                      placeholder="e.g. Rohan Agarwal"
                      value={drawerForm.studentName || ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, studentName: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Role / Achievement</label>
                    <input
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                      type="text"
                      placeholder="e.g. AIR 412"
                      value={drawerForm.role || ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, role: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Quote</label>
                    <textarea
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none resize-none h-20"
                      placeholder="What did the student say?"
                      value={drawerForm.quote || ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, quote: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Rating</label>
                    <div className="flex gap-1.5 select-none pt-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          onClick={() => setDrawerForm({ ...drawerForm, rating: n })}
                          className={`text-2xl cursor-pointer transition-colors ${
                            n <= (drawerForm.rating || 5) ? "text-accent" : "text-border-subtle"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase">Show on website</label>
                    <select
                      className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white cursor-pointer"
                      value={drawerForm.showOnSite ? "Yes" : "No"}
                      onChange={(e) => setDrawerForm({ ...drawerForm, showOnSite: e.target.value === "Yes" })}
                    >
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <footer className="px-6 py-4 border-t border-border-subtle flex gap-3 shrink-0">
              <button
                onClick={closeDrawer}
                className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-transparent text-primary border border-border-subtle hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={saveDrawerData}
                className="flex-1 text-xs font-bold py-2.5 rounded-lg bg-secondary text-white hover:bg-secondary/90 transition-colors"
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
