"use client";

import React, { useState, useEffect } from "react";
import {
  IconSearch,
  IconAdjustmentsHorizontal,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconStar,
  IconCheck,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandYoutube,
  IconSchool,
  IconUsers,
  IconBook,
} from "@tabler/icons-react";
import { getMentorsPageData } from "../actions";
import BookingModal from "@/components/BookingModal";

export default function MentorsPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentorForBooking, setSelectedMentorForBooking] = useState<any | null>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([]);
  const [minRate, setMinRate] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const [sortOption, setSortOption] = useState("Most popular");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getMentorsPageData();
        setMentors(res);
      } catch (err) {
        console.error("Failed to load mentors data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Sync subjects with tab selection
  const handleTabSelect = (tab: string) => {
    if (tab === "All mentors") {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(prev =>
        prev.includes(tab) ? prev.filter(s => s !== tab) : [...prev, tab]
      );
    }
    setCurrentPage(1);
  };

  const handleSubjectCheckbox = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
    setCurrentPage(1);
  };

  const handleExperienceCheckbox = (expRange: string) => {
    setSelectedExperiences(prev =>
      prev.includes(expRange) ? prev.filter(e => e !== expRange) : [...prev, expRange]
    );
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setSelectedSubjects([]);
    setSelectedExperiences([]);
    setMinRate("");
    setMaxRate("");
    setSelectedRating(null);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const removeSubjectFilter = (sub: string) => {
    setSelectedSubjects(prev => prev.filter(s => s !== sub));
  };

  const removeExperienceFilter = (exp: string) => {
    setSelectedExperiences(prev => prev.filter(e => e !== exp));
  };

  // Check if a mentor has experience within a range
  const matchesExperienceRange = (expYears: number, range: string) => {
    if (range === "1-3 years") return expYears >= 1 && expYears <= 3;
    if (range === "4-7 years") return expYears >= 4 && expYears <= 7;
    if (range === "8+ years") return expYears >= 8;
    return true;
  };

  // Filter Logic
  const filteredMentors = mentors.filter((m) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchBio = m.bio.toLowerCase().includes(q);
      const matchQual = m.qualification.toLowerCase().includes(q);
      const matchExpertise = m.expertise.some((s: string) => s.toLowerCase().includes(q));
      if (!matchName && !matchBio && !matchQual && !matchExpertise) return false;
    }

    // Subject/Category filter
    if (selectedSubjects.length > 0) {
      const matchesSubject = m.expertise.some((s: string) => selectedSubjects.includes(s));
      if (!matchesSubject) return false;
    }

    // Experience filter
    if (selectedExperiences.length > 0) {
      const matchesExp = selectedExperiences.some(range => matchesExperienceRange(m.experience, range));
      if (!matchesExp) return false;
    }

    // Rate filter
    if (minRate && m.rate < Number(minRate)) return false;
    if (maxRate && m.rate > Number(maxRate)) return false;

    // Rating filter
    if (selectedRating !== null && m.rating < selectedRating) return false;

    return true;
  });

  // Sorting Logic
  const sortedMentors = [...filteredMentors].sort((a, b) => {
    if (sortOption === "Hourly Rate: Low to High") return a.rate - b.rate;
    if (sortOption === "Hourly Rate: High to Low") return b.rate - a.rate;
    if (sortOption === "Highest rated") return b.rating - a.rating;
    if (sortOption === "Most experienced") return b.experience - a.experience;
    // Default: Most popular (student count)
    return b.students - a.students;
  });

  // Pagination Logic
  const totalItems = sortedMentors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentMentors = sortedMentors.slice(startIndex, endIndex);

  // Active filter count
  const activeFilterCount =
    selectedSubjects.length +
    selectedExperiences.length +
    (minRate || maxRate ? 1 : 0) +
    (selectedRating !== null ? 1 : 0);

  // Counts for checkboxes (calculated on raw active mentors list)
  const getCountBySubject = (sub: string) => mentors.filter(m => m.expertise.includes(sub)).length;
  const getCountByExperience = (range: string) => mentors.filter(m => matchesExperienceRange(m.experience, range)).length;



  return (
    <div className="w-full bg-white text-primary flex-1 min-h-screen flex flex-col font-sans">
      <title>Explore Mentors | Tutoboard</title>
      <meta name="description" content="Connect and learn 1-on-1 with verified educators and subject matter experts on Tutoboard." />
      
      {/* PAGE HEADER */}
      <header className="bg-surface px-6 md:px-12 py-8 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-xs text-text-muted mb-3 flex items-center gap-1.5 font-medium">
            <a href="/" className="hover:text-secondary transition-colors">Home</a>
            <span className="text-slate-300">/</span>
            <span className="text-primary font-semibold">Mentors</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="font-heading text-3xl font-extrabold text-primary mb-1">
                Explore Mentors
              </h1>
              <p className="text-xs md:text-sm text-text-muted">
                Connect and learn 1-on-1 with verified educators and subject matter experts
              </p>
            </div>

            {/* EXPANDABLE SEARCH & FILTER BUTTON */}
            <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
              <div className="flex items-center">
                <div className={`flex items-center overflow-hidden transition-all duration-300 ${isSearchExpanded ? "w-[240px] opacity-100 mr-2" : "w-0 opacity-0"}`}>
                  <div className="flex items-center bg-white border border-secondary rounded-xl overflow-hidden w-full h-10 px-3 shadow-sm">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search name, bio, subject..."
                      className="flex-1 text-xs outline-none text-primary"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-primary p-0.5">
                        <IconX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Search Toggle Button */}
                <button
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className="w-10 h-10 rounded-xl border border-border-subtle bg-white flex items-center justify-center cursor-pointer hover:border-secondary hover:bg-[#F0F6FF] transition-all focus:outline-none"
                  title="Search mentors"
                >
                  <IconSearch className="w-5 h-5 text-primary" />
                </button>
              </div>

              {/* Filter Button next to search button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className="relative w-10 h-10 rounded-xl border border-border-subtle bg-slate-50 flex items-center justify-center cursor-pointer hover:border-secondary hover:bg-[#F0F6FF] transition-all focus:outline-none"
                  title="Filters"
                >
                  <IconAdjustmentsHorizontal className="w-5 h-5 text-primary" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-extrabold flex items-center justify-center border border-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {showFilterPanel && (
                  <>
                    {/* Transparent overlay backdrop to capture clicks outside */}
                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowFilterPanel(false)} />
                    
                    {/* Floating popover modal */}
                    <div className="absolute right-0 top-12 mt-2 w-[320px] bg-white border border-border-subtle rounded-2xl shadow-xl z-50 p-5 origin-top-right animate-fade-in">
                      {/* Triangle pointer arrow */}
                      <div className="w-3 h-3 bg-white rotate-45 border-t border-l border-border-subtle absolute -top-1.5 right-3.5 z-10"></div>
                      
                      {/* Body */}
                      <div className="max-h-[350px] overflow-y-auto -mr-5 pr-4 space-y-6 premium-scrollbar relative z-20">
                        {/* Subjects Section */}
                        <div>
                          <div className="font-heading text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Subject
                          </div>
                          <div className="flex flex-col">
                            {["Mathematics", "Science", "Programming", "English", "Test Prep"].map((sub) => (
                              <div
                                key={sub}
                                onClick={() => handleSubjectCheckbox(sub)}
                                className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 cursor-pointer group"
                              >
                                <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center border transition-all ${
                                  selectedSubjects.includes(sub)
                                    ? "bg-secondary border-secondary text-white"
                                    : "bg-white border-slate-300 group-hover:border-secondary"
                                }`}>
                                  {selectedSubjects.includes(sub) && <IconCheck className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="text-[13px] font-semibold text-primary">{sub}</span>
                                <span className="ml-auto text-[11px] font-semibold text-slate-400">{getCountBySubject(sub)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Experience Section */}
                        <div>
                          <div className="font-heading text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Experience
                          </div>
                          <div className="flex flex-col">
                            {["1-3 years", "4-7 years", "8+ years"].map((range) => (
                              <div
                                key={range}
                                onClick={() => handleExperienceCheckbox(range)}
                                className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 cursor-pointer group"
                              >
                                <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center border transition-all ${
                                  selectedExperiences.includes(range)
                                    ? "bg-secondary border-secondary text-white"
                                    : "bg-white border-slate-300 group-hover:border-secondary"
                                }`}>
                                  {selectedExperiences.includes(range) && <IconCheck className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="text-[13px] font-semibold text-primary">{range}</span>
                                <span className="ml-auto text-[11px] font-semibold text-slate-400">{getCountByExperience(range)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Hourly Rate Range Section */}
                        <div>
                          <div className="font-heading text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Hourly Rate (₹)
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="number"
                              value={minRate}
                              onChange={(e) => {
                                setMinRate(e.target.value);
                                setCurrentPage(1);
                              }}
                              placeholder="Min"
                              className="w-full text-xs p-2.5 border border-border-subtle rounded-lg outline-none focus:border-secondary text-primary"
                            />
                            <span className="text-slate-300">—</span>
                            <input
                              type="number"
                              value={maxRate}
                              onChange={(e) => {
                                setMaxRate(e.target.value);
                                setCurrentPage(1);
                              }}
                              placeholder="Max"
                              className="w-full text-xs p-2.5 border border-border-subtle rounded-lg outline-none focus:border-secondary text-primary"
                            />
                          </div>
                        </div>

                        {/* Rating Section */}
                        <div>
                          <div className="font-heading text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Rating
                          </div>
                          <div className="space-y-1.5 pt-1">
                            {[4.5, 4.0, 3.0].map((rating) => (
                              <button
                                key={rating}
                                onClick={() => {
                                  setSelectedRating(selectedRating === rating ? null : rating);
                                  setCurrentPage(1);
                                }}
                                className={`flex items-center gap-2.5 text-xs w-full text-left py-2 px-3 rounded-lg border transition-colors cursor-pointer ${
                                  selectedRating === rating
                                    ? "bg-[#F0F6FF] border-secondary/50 text-secondary font-bold"
                                    : "bg-transparent border-transparent text-text-muted hover:bg-slate-50"
                                }`}
                              >
                                <span className="text-accent font-bold">★ {rating} & up</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex gap-3 mt-4 pt-3 border-t border-slate-100 relative z-20 flex-shrink-0">
                        <button
                          onClick={resetAllFilters}
                          className="flex-1 text-xs font-semibold py-2.5 border border-border-subtle rounded-xl text-primary bg-white hover:bg-slate-50 cursor-pointer text-center"
                        >
                          Clear all
                        </button>
                        <button
                          onClick={() => setShowFilterPanel(false)}
                          className="flex-1 text-xs font-bold py-2.5 bg-secondary text-white rounded-xl hover:bg-secondary/90 cursor-pointer text-center shadow-md"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="px-6 md:px-12 py-8 flex-1 max-w-7xl mx-auto w-full">
        {/* TOPBAR (Tabs & Sort) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto premium-scrollbar pb-2 sm:pb-0">
            {["All mentors", "Mathematics", "Science", "Programming", "English", "Test Prep"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabSelect(tab)}
                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                  (tab === "All mentors" ? selectedSubjects.length === 0 : selectedSubjects.includes(tab))
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-text-muted border-border-subtle hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <span className="text-xs text-text-muted font-medium">Sort by</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-border-subtle bg-white text-primary outline-none focus:border-secondary cursor-pointer"
            >
              <option>Most popular</option>
              <option>Highest rated</option>
              <option>Hourly Rate: Low to High</option>
              <option>Hourly Rate: High to Low</option>
              <option>Most experienced</option>
            </select>
          </div>
        </div>

        {/* SUBBAR (Active Filter Pills & Result Count) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 min-h-[32px]">
          <div className="flex flex-wrap items-center gap-2">
            {/* Subject pills */}
            {selectedSubjects.map((sub) => (
              <div key={sub} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                {sub}
                <button onClick={() => removeSubjectFilter(sub)} className="hover:text-red-600 transition-colors">
                  <IconX className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {/* Experience pills */}
            {selectedExperiences.map((exp) => (
              <div key={exp} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                {exp}
                <button onClick={() => removeExperienceFilter(exp)} className="hover:text-red-600 transition-colors">
                  <IconX className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Rate pills */}
            {(minRate || maxRate) && (
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                Rate: {minRate ? `₹${minRate}` : "0"} — {maxRate ? `₹${maxRate}` : "Max"}
                <button onClick={() => { setMinRate(""); setMaxRate(""); }} className="hover:text-red-600 transition-colors">
                  <IconX className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Rating pill */}
            {selectedRating !== null && (
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                Rating: ★ {selectedRating}+
                <button onClick={() => setSelectedRating(null)} className="hover:text-red-600 transition-colors">
                  <IconX className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Clear All Link */}
            {activeFilterCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="text-[11px] font-bold text-secondary hover:text-secondary/80 hover:underline ml-2"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="text-xs text-text-muted font-medium self-end sm:self-auto">
            Showing <strong className="text-primary font-bold">{totalItems === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of <strong className="text-primary font-bold">{totalItems}</strong> mentors
          </div>
        </div>

        {/* TOAST MESSAGE */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 bg-primary text-white border border-secondary text-xs px-4 py-3 rounded-xl shadow-xl z-50 animate-fade-in flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            {toastMessage}
          </div>
        )}

        {/* MENTORS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-border-subtle rounded-2xl overflow-hidden p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-100 animate-shimmer shrink-0"></div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="h-5 w-3/4 bg-slate-200 rounded animate-shimmer"></div>
                    <div className="h-4 w-full bg-slate-100 rounded animate-shimmer"></div>
                    <div className="h-3 w-1/3 bg-slate-100 rounded animate-shimmer"></div>
                  </div>
                </div>
                <div className="flex gap-1.5 pt-2">
                  <div className="h-4 w-16 bg-slate-100 rounded animate-shimmer"></div>
                  <div className="h-4 w-16 bg-slate-100 rounded animate-shimmer"></div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 w-full bg-slate-100 rounded animate-shimmer"></div>
                  <div className="h-3 w-5/6 bg-slate-100 rounded animate-shimmer"></div>
                </div>
                <div className="border-t border-border-subtle pt-4 flex items-center justify-between">
                  <div className="h-4 w-16 bg-slate-100 rounded animate-shimmer"></div>
                  <div className="h-6 w-16 bg-slate-200 rounded animate-shimmer"></div>
                </div>
                <div className="h-10 w-full bg-slate-250 rounded-lg animate-shimmer"></div>
              </div>
            ))}
          </div>
        ) : currentMentors.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 border border-dashed border-border-subtle rounded-2xl">
            <p className="text-sm text-text-muted mb-4 font-medium">No mentors match your filters.</p>
            <button
              onClick={resetAllFilters}
              className="text-xs font-semibold px-5 py-2.5 bg-primary text-white rounded-lg hover:shadow-md transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {currentMentors.map((m: any) => (
              <div
                key={m.id}
                className="bg-white border border-border-subtle rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Card Header Profile Block */}
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center font-heading text-xl font-bold text-accent shadow-inner shrink-0"
                        style={{ backgroundColor: m.avatarBg || "#1B3A6B" }}
                      >
                        {m.avatarText}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading text-base font-bold text-primary flex items-center gap-1.5 truncate">
                          {m.name}
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-150 shrink-0">
                            Verified
                          </span>
                        </h3>
                        <p className="text-xs text-text-muted truncate mt-0.5">
                          {m.qualification}
                        </p>
                        <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mt-0.5">
                          {m.experience} Years Exp
                        </p>
                      </div>
                    </div>

                    {/* Subject/Expertise Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {m.expertise.map((subject: string, idx: number) => (
                        <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                          {subject}
                        </span>
                      ))}
                    </div>

                    {/* Bio snippet */}
                    <p className="text-xs text-text-muted/85 leading-relaxed line-clamp-3 mb-4 min-h-[54px]">
                      {m.bio || `${m.name} is a verified Tutoboard educator specialized in ${m.subject} tutoring.`}
                    </p>
                  </div>

                  <div>
                    {/* Stats block */}
                    <div className="grid grid-cols-2 gap-2 py-3 border-t border-b border-border-subtle mb-4 text-center">
                      <div>
                        <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Students</div>
                        <div className="text-xs font-bold text-primary">{m.students}+</div>
                      </div>
                      <div className="border-l border-border-subtle">
                        <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Courses</div>
                        <div className="text-xs font-bold text-primary">{m.courses}+</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-accent flex items-center gap-0.5">
                        <IconStar className="w-3.5 h-3.5 fill-accent text-accent" /> {m.rating}
                      </span>
                      <div className="text-right">
                        <span className="text-[10px] text-text-muted font-medium block">Hourly rate</span>
                        <span className="font-heading font-extrabold text-primary text-base">
                          ₹{m.rate}/hr
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedMentorForBooking(m)}
                        className="flex-1 text-xs font-semibold py-2.5 rounded-lg bg-secondary text-white hover:bg-secondary/90 transition-colors cursor-pointer"
                      >
                        Book 1-on-1
                      </button>
                      <a
                        href={`/mentors/${m.id}`}
                        className="flex-1 text-xs font-semibold py-2.5 rounded-lg bg-transparent text-primary border border-primary hover:bg-primary/5 transition-colors cursor-pointer text-center"
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 border border-border-subtle rounded-lg flex items-center justify-center bg-white text-text-muted hover:border-secondary hover:text-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <IconChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-9 h-9 rounded-lg font-semibold text-xs border flex items-center justify-center cursor-pointer transition-all ${
                  currentPage === index + 1
                    ? "bg-secondary border-secondary text-white"
                    : "bg-white border-border-subtle text-text-muted hover:border-secondary hover:text-secondary"
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 border border-border-subtle rounded-lg flex items-center justify-center bg-white text-text-muted hover:border-secondary hover:text-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <IconChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0f2347] text-white py-12 mt-auto">
        <div className="px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="font-heading text-xl font-extrabold text-white mb-3">
                Tuto<span className="text-accent">board</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed max-w-[280px]">
                India's most trusted online tutoring platform. Learn at your pace, with the best mentors.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-4">
                Company
              </div>
              <ul className="space-y-2.5 text-xs text-white/60">
                <li>
                  <a href="/#about" className="hover:text-white transition-colors">About us</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Careers</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
            <p>&copy; 2026 Tutoboard. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">
                <IconBrandInstagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <IconBrandTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <IconBrandLinkedin className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <IconBrandYoutube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
      {selectedMentorForBooking && (
        <BookingModal
          isOpen={true}
          onClose={() => setSelectedMentorForBooking(null)}
          targetId={selectedMentorForBooking.id}
          targetType="mentor"
          title={`1-on-1 Session with ${selectedMentorForBooking.name}`}
          mentorName={selectedMentorForBooking.name}
          isLiveIndividual={true}
          price={selectedMentorForBooking.rate}
        />
      )}
    </div>
  );
}
