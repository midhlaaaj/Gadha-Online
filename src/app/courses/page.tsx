"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  IconSearch,
  IconAdjustmentsHorizontal,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconStar,
  IconMath,
  IconCode,
  IconFlask,
  IconPencil,
  IconMap,
  IconBook,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandYoutube,
  IconCheck,
} from "@tabler/icons-react";
import { getCoursesPageData, getSubjects } from "../actions";
import BookingModal from "@/components/BookingModal";


// Dynamic Icon Picker Helper
const getIconComponent = (name: string) => {
  switch (name) {
    case "math":
    case "calculator":
      return <IconMath className="w-12 h-12 text-secondary" />;
    case "code":
      return <IconCode className="w-12 h-12 text-green-700" />;
    case "flask":
    case "science":
      return <IconFlask className="w-12 h-12 text-yellow-700" />;
    case "writing":
    case "pencil":
      return <IconPencil className="w-12 h-12 text-purple-700" />;
    case "map":
      return <IconMap className="w-12 h-12 text-pink-700" />;
    default:
      return <IconBook className="w-12 h-12 text-primary" />;
  }
};

// Subject Color Class Mapper
const getSubjectBgColor = (subject: string) => {
  switch (subject) {
    case "Mathematics":
      return "bg-blue-50";
    case "Programming":
      return "bg-green-50";
    case "Science":
      return "bg-yellow-50";
    case "English":
      return "bg-purple-50";
    default:
      return "bg-slate-50";
  }
};

// Level determination helper based on title
function getCourseLevel(title: string) {
  const t = title.toLowerCase();
  if (t.includes("beginner") || t.includes("intro") || t.includes("basics") || t.includes("a1")) {
    return "Beginner";
  }
  if (t.includes("advanced") || t.includes("jee") || t.includes("neet") || t.includes("class 12") || t.includes("class 11")) {
    return "Advanced";
  }
  return "Intermediate";
}

function CoursesPageContent() {
  const [courses, setCourses] = useState<Awaited<ReturnType<typeof getCoursesPageData>>>([]);
  const [allSubjects, setAllSubjects] = useState<Awaited<ReturnType<typeof getSubjects>>>([]);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState<{
    id: string;
    type: "course" | "session";
    title: string;
    price: number;
    mentorName: string;
    isLiveIndividual?: boolean;
  } | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const mentorParam = searchParams.get("mentor") || "";

  const splitParam = (name: string) =>
    (searchParams.get(name) || "").split(",").map((s) => s.trim()).filter(Boolean);

  // Search: draft (what's typed) vs. applied (what's actually filtered/in the URL)
  const initialSearch = searchParams.get("q") || mentorParam || "";
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [appliedSearch, setAppliedSearch] = useState(initialSearch);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filters: draft (edited inside the panel) vs. applied (what's actually filtered/in the URL)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => splitParam("category"));
  const [selectedFormats, setSelectedFormats] = useState<string[]>(() => splitParam("format"));
  const [minPrice, setMinPrice] = useState(() => searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get("maxPrice") || "");
  const [selectedRating, setSelectedRating] = useState<number | null>(() => {
    const r = searchParams.get("rating");
    return r ? Number(r) : null;
  });
  const [selectedLevels, setSelectedLevels] = useState<string[]>(() => splitParam("level"));

  const [appliedCategories, setAppliedCategories] = useState<string[]>(() => splitParam("category"));
  const [appliedFormats, setAppliedFormats] = useState<string[]>(() => splitParam("format"));
  const [appliedMinPrice, setAppliedMinPrice] = useState(() => searchParams.get("minPrice") || "");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(() => searchParams.get("maxPrice") || "");
  const [appliedRating, setAppliedRating] = useState<number | null>(() => {
    const r = searchParams.get("rating");
    return r ? Number(r) : null;
  });
  const [appliedLevels, setAppliedLevels] = useState<string[]>(() => splitParam("level"));

  // Sourced from the shared subjects table so a subject shows up here as soon
  // as it's created — via the admin Subjects page or the "Create New
  // Subject..." option on a course/session — even before any course uses it.
  const categoriesList = useMemo(() => {
    const list = new Set<string>(allSubjects.map((s) => s.name));
    courses.forEach((c) => {
      if (c.subject) list.add(c.subject);
    });
    return Array.from(list);
  }, [allSubjects, courses]);


  const [sortOption, setSortOption] = useState(searchParams.get("sort") || "Most popular");
  const initialPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const itemsPerPage = 6;

  // Keep the URL in sync with whatever is actually applied (search, filters, sort, page)
  useEffect(() => {
    const params = new URLSearchParams();
    if (appliedSearch) params.set("q", appliedSearch);
    if (appliedCategories.length) params.set("category", appliedCategories.join(","));
    if (appliedFormats.length) params.set("format", appliedFormats.join(","));
    if (appliedMinPrice) params.set("minPrice", appliedMinPrice);
    if (appliedMaxPrice) params.set("maxPrice", appliedMaxPrice);
    if (appliedRating !== null) params.set("rating", String(appliedRating));
    if (appliedLevels.length) params.set("level", appliedLevels.join(","));
    if (sortOption !== "Most popular") params.set("sort", sortOption);
    if (currentPage > 1) params.set("page", String(currentPage));
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearch, appliedCategories, appliedFormats, appliedMinPrice, appliedMaxPrice, appliedRating, appliedLevels, sortOption, currentPage]);

  const commitSearch = () => {
    setAppliedSearch(searchInput.trim());
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setAppliedSearch("");
    setCurrentPage(1);
  };

  const openFilterPanel = () => {
    if (!showFilterPanel) {
      // Seed the draft with whatever is currently applied so the panel reflects reality
      setSelectedCategories(appliedCategories);
      setSelectedFormats(appliedFormats);
      setMinPrice(appliedMinPrice);
      setMaxPrice(appliedMaxPrice);
      setSelectedRating(appliedRating);
      setSelectedLevels(appliedLevels);
    }
    setShowFilterPanel((prev) => !prev);
  };

  const applyFilters = () => {
    setAppliedCategories(selectedCategories);
    setAppliedFormats(selectedFormats);
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setAppliedRating(selectedRating);
    setAppliedLevels(selectedLevels);
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedFormats([]);
    setMinPrice("");
    setMaxPrice("");
    setSelectedRating(null);
    setSelectedLevels([]);
    setAppliedCategories([]);
    setAppliedFormats([]);
    setAppliedMinPrice("");
    setAppliedMaxPrice("");
    setAppliedRating(null);
    setAppliedLevels([]);
    setCurrentPage(1);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [res, subjectsRes] = await Promise.all([getCoursesPageData(), getSubjects()]);
        setCourses(res);
        setAllSubjects(subjectsRes);
      } catch (err) {
        console.error("Failed to load courses page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Tab strip is a quick shortcut outside the filter panel, so it applies immediately
  // and keeps the panel's draft state in sync for whenever it's next opened.
  const handleTabSelect = (tab: string) => {
    const next = tab === "All courses"
      ? []
      : appliedCategories.includes(tab) ? appliedCategories.filter(c => c !== tab) : [...appliedCategories, tab];
    setAppliedCategories(next);
    setSelectedCategories(next);
    setCurrentPage(1);
  };

  const handleCategoryCheckbox = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleFormatCheckbox = (format: string) => {
    setSelectedFormats(prev =>
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const handleLevelCheckbox = (level: string) => {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const resetAllFilters = () => {
    clearFilters();
    clearSearch();
  };

  const removeCategoryFilter = (cat: string) => {
    setAppliedCategories(prev => prev.filter(c => c !== cat));
    setSelectedCategories(prev => prev.filter(c => c !== cat));
  };

  const removeFormatFilter = (form: string) => {
    setAppliedFormats(prev => prev.filter(f => f !== form));
    setSelectedFormats(prev => prev.filter(f => f !== form));
  };

  const removeLevelFilter = (lvl: string) => {
    setAppliedLevels(prev => prev.filter(l => l !== lvl));
    setSelectedLevels(prev => prev.filter(l => l !== lvl));
  };

  // Filter Logic — always operates on the applied (committed) search/filter state
  const filteredCourses = courses.filter((c) => {
    // Search filter
    if (appliedSearch) {
      const q = appliedSearch.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchMentor = c.mentor.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchMentor) return false;
    }

    // Category filter
    if (appliedCategories.length > 0) {
      if (!appliedCategories.includes(c.subject)) return false;
    }

    // Format filter
    if (appliedFormats.length > 0) {
      const formatMapped = c.format === "Recorded" ? "Recorded course" : c.format === "Hourly" ? "Hourly 1-on-1" : c.format;
      if (!appliedFormats.includes(formatMapped)) return false;
    }

    // Price range filter
    if (appliedMinPrice && c.price < Number(appliedMinPrice)) return false;
    if (appliedMaxPrice && c.price > Number(appliedMaxPrice)) return false;

    // Rating filter
    if (appliedRating !== null && c.rating < appliedRating) return false;

    // Level filter
    if (appliedLevels.length > 0) {
      const level = getCourseLevel(c.title);
      if (!appliedLevels.includes(level)) return false;
    }

    return true;
  });

  // Sorting Logic
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortOption === "Price: Low to High") return a.price - b.price;
    if (sortOption === "Price: High to Low") return b.price - a.price;
    if (sortOption === "Highest rated") return b.rating - a.rating;
    // Fallback/Default: Most popular (sort by student count desc)
    return b.students - a.students;
  });

  // Pagination Logic
  const totalItems = sortedCourses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentCourses = sortedCourses.slice(startIndex, endIndex);

  // Active Filter Count calculation (reflects what's actually applied, not in-progress draft edits)
  const activeFilterCount =
    appliedCategories.length +
    appliedFormats.length +
    (appliedMinPrice || appliedMaxPrice ? 1 : 0) +
    (appliedRating !== null ? 1 : 0) +
    appliedLevels.length;

  // Counts for checkboxes (calculated on raw active courses list)
  const getCountByCategory = (cat: string) => courses.filter(c => c.subject === cat).length;
  const getCountByFormat = (form: string) => courses.filter(c => {
    const formatMapped = c.format === "Recorded" ? "Recorded course" : c.format === "Hourly" ? "Hourly 1-on-1" : c.format;
    return formatMapped === form;
  }).length;
  const getCountByLevel = (lvl: string) => courses.filter(c => getCourseLevel(c.title) === lvl).length;



  return (
    <div className="w-full bg-white text-primary flex-1 min-h-screen flex flex-col font-sans">
      
      {/* PAGE HEADER */}
      <header className="bg-surface px-6 md:px-12 py-8 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-xs text-text-muted mb-3 flex items-center gap-1.5 font-medium">
            <Link href="/" className="hover:text-secondary transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            {appliedSearch ? (
              <>
                <Link href="/courses" className="hover:text-secondary transition-colors">Courses</Link>
                <span className="text-slate-300">/</span>
                <span className="text-primary font-semibold">{appliedSearch}</span>
              </>
            ) : (
              <span className="text-primary font-semibold">Courses</span>
            )}
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="font-heading text-3xl font-extrabold text-primary mb-1">
                {appliedSearch ? `Explore courses by ${appliedSearch}` : "Explore Courses"}
              </h1>
              <p className="text-xs md:text-sm text-text-muted">
                {appliedSearch
                  ? `Browse courses taught by ${appliedSearch}`
                  : "Browse 320+ courses and live batches taught by verified mentors"
                }
              </p>
            </div>

            {/* EXPANDABLE SEARCH & FILTER BUTTON (Placed right next to search icon) */}
            <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
              <div className="flex items-center">
                <div className={`flex items-center overflow-hidden transition-all duration-300 ${isSearchExpanded ? "w-[240px] opacity-100 mr-2" : "w-0 opacity-0"}`}>
                  <div className="flex items-center bg-white border border-secondary rounded-xl overflow-hidden w-full h-10 px-3 shadow-sm">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitSearch();
                      }}
                      placeholder="Search subject, mentor, keyword..."
                      className="flex-1 text-xs outline-none text-primary"
                    />
                    {searchInput && (
                      <button onClick={clearSearch} className="text-slate-400 hover:text-primary p-0.5">
                        <IconX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Toggle Button */}
                <button
                  onClick={() => {
                    if (isSearchExpanded) commitSearch();
                    setIsSearchExpanded(!isSearchExpanded);
                  }}
                  className="w-10 h-10 rounded-xl border border-border-subtle bg-white flex items-center justify-center cursor-pointer hover:border-secondary hover:bg-[#F0F6FF] transition-all focus:outline-none"
                  title="Search courses"
                >
                  <IconSearch className="w-5 h-5 text-primary" />
                </button>
              </div>

              {/* Filter Button next to search button */}
              <div className="relative">
                <button
                  onClick={openFilterPanel}
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
                    <div className="absolute right-0 top-12 mt-2 w-[90vw] max-w-[320px] max-h-[min(75vh,520px)] flex flex-col bg-white border border-border-subtle rounded-2xl shadow-xl z-50 p-5 origin-top-right animate-fade-in">
                      {/* Triangle pointer arrow pointing up at the filter button */}
                      <div className="w-3 h-3 bg-white rotate-45 border-t border-l border-border-subtle absolute -top-1.5 right-3.5 z-10"></div>

                      {/* Body */}
                      <div className="flex-1 min-h-0 overflow-y-auto -mr-5 pr-4 space-y-6 premium-scrollbar relative z-20">
                        {/* Category Section */}
                        <div>
                          <div className="font-heading text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Category
                          </div>
                          <div className="flex flex-col">
                            {categoriesList.map((cat) => (
                              <div
                                key={cat}
                                onClick={() => handleCategoryCheckbox(cat)}
                                className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 cursor-pointer group"
                              >
                                <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center border transition-all ${
                                  selectedCategories.includes(cat)
                                    ? "bg-secondary border-secondary text-white"
                                    : "bg-white border-slate-300 group-hover:border-secondary"
                                }`}>
                                  {selectedCategories.includes(cat) && <IconCheck className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="text-[13px] font-semibold text-primary">{cat}</span>
                                <span className="ml-auto text-[11px] font-semibold text-slate-400">{getCountByCategory(cat)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Format Section */}
                        <div>
                          <div className="font-heading text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Format
                          </div>
                          <div className="flex flex-col">
                            {["Live batch", "Recorded course", "Hourly 1-on-1"].map((form) => (
                              <div
                                key={form}
                                onClick={() => handleFormatCheckbox(form)}
                                className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 cursor-pointer group"
                              >
                                <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center border transition-all ${
                                  selectedFormats.includes(form)
                                    ? "bg-secondary border-secondary text-white"
                                    : "bg-white border-slate-300 group-hover:border-secondary"
                                }`}>
                                  {selectedFormats.includes(form) && <IconCheck className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="text-[13px] font-semibold text-primary">{form}</span>
                                <span className="ml-auto text-[11px] font-semibold text-slate-400">{getCountByFormat(form)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Price Range Section */}
                        <div>
                          <div className="font-heading text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Price range
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="number"
                              value={minPrice}
                              onChange={(e) => setMinPrice(e.target.value)}
                              placeholder="₹ Min"
                              className="w-full text-xs p-2.5 border border-border-subtle rounded-lg outline-none focus:border-secondary text-primary"
                            />
                            <span className="text-slate-300">—</span>
                            <input
                              type="number"
                              value={maxPrice}
                              onChange={(e) => setMaxPrice(e.target.value)}
                              placeholder="₹ Max"
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
                                onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
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

                        {/* Level Section */}
                        <div>
                          <div className="font-heading text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Level
                          </div>
                          <div className="flex flex-col">
                            {["Beginner", "Intermediate", "Advanced"].map((level) => (
                              <div
                                key={level}
                                onClick={() => handleLevelCheckbox(level)}
                                className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 cursor-pointer group"
                              >
                                <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center border transition-all ${
                                  selectedLevels.includes(level)
                                    ? "bg-secondary border-secondary text-white"
                                    : "bg-white border-slate-300 group-hover:border-secondary"
                                }`}>
                                  {selectedLevels.includes(level) && <IconCheck className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="text-[13px] font-semibold text-primary">{level}</span>
                                <span className="ml-auto text-[11px] font-semibold text-slate-400">{getCountByLevel(level)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions — persistent, always visible regardless of body scroll */}
                      <div className="flex gap-3 mt-4 pt-3 border-t border-slate-100 relative z-20 shrink-0">
                        <button
                          onClick={clearFilters}
                          className="flex-1 text-xs font-semibold py-2.5 border border-border-subtle rounded-xl text-primary bg-white hover:bg-slate-50 cursor-pointer text-center"
                        >
                          Clear all
                        </button>
                        <button
                          onClick={applyFilters}
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
            {["All courses", ...categoriesList].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabSelect(tab)}
                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                  (tab === "All courses" ? appliedCategories.length === 0 : appliedCategories.includes(tab))
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
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Highest rated</option>
            </select>
          </div>
        </div>

        {/* SUBBAR (Active Filter Pills & Result Count) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 min-h-[32px]">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category pills */}
            {appliedCategories.map((cat) => (
              <div key={cat} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                {cat}
                <button onClick={() => removeCategoryFilter(cat)} className="hover:text-red-600 transition-colors">
                  <IconX className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Format pills */}
            {appliedFormats.map((form) => (
              <div key={form} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                {form}
                <button onClick={() => removeFormatFilter(form)} className="hover:text-red-600 transition-colors">
                  <IconX className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Level pills */}
            {appliedLevels.map((lvl) => (
              <div key={lvl} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                {lvl}
                <button onClick={() => removeLevelFilter(lvl)} className="hover:text-red-600 transition-colors">
                  <IconX className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Price range pills */}
            {(appliedMinPrice || appliedMaxPrice) && (
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                Price: {appliedMinPrice ? `₹${appliedMinPrice}` : "0"} — {appliedMaxPrice ? `₹${appliedMaxPrice}` : "Max"}
                <button
                  onClick={() => {
                    setAppliedMinPrice(""); setAppliedMaxPrice("");
                    setMinPrice(""); setMaxPrice("");
                  }}
                  className="hover:text-red-600 transition-colors"
                >
                  <IconX className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Rating pill */}
            {appliedRating !== null && (
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                Rating: ★ {appliedRating}+
                <button
                  onClick={() => { setAppliedRating(null); setSelectedRating(null); }}
                  className="hover:text-red-600 transition-colors"
                >
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
            Showing <strong className="text-primary font-bold">{totalItems === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of <strong className="text-primary font-bold">{totalItems}</strong> courses
          </div>
        </div>

        {/* COURSES GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-border-subtle rounded-2xl overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="w-full h-36 bg-slate-100 animate-shimmer"></div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-[18px] w-14 bg-slate-100 rounded-full animate-shimmer"></div>
                      <div className="h-[18px] w-12 bg-slate-100 rounded-full animate-shimmer"></div>
                      <div className="h-[18px] w-16 bg-slate-100 rounded-full animate-shimmer"></div>
                    </div>
                    <div className="h-5 w-3/4 bg-slate-200 rounded animate-shimmer mb-1.5"></div>
                    <div className="h-3.5 w-1/3 bg-slate-100 rounded animate-shimmer mb-1.5"></div>
                    <div className="h-3 w-full bg-slate-100 rounded animate-shimmer mb-1.5"></div>
                    <div className="h-3 w-2/3 bg-slate-100 rounded animate-shimmer"></div>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <div className="flex items-center gap-2 border-t border-border-subtle pt-3 mb-4">
                    <div className="h-3.5 w-10 bg-slate-100 rounded animate-shimmer"></div>
                    <div className="h-5 w-16 bg-slate-200 rounded animate-shimmer ml-auto"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-9 bg-slate-200 rounded-lg animate-shimmer"></div>
                    <div className="flex-1 h-9 bg-slate-100 rounded-lg animate-shimmer"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : currentCourses.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 border border-dashed border-border-subtle rounded-2xl">
            <p className="text-sm text-text-muted mb-4 font-medium">No courses matches your filters.</p>
            <button
              onClick={resetAllFilters}
              className="text-xs font-semibold px-5 py-2.5 bg-primary text-white rounded-lg hover:shadow-md transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {currentCourses.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-border-subtle rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col justify-between"
              >
                {c.coverImageUrl ? (
                  <div className="w-full h-36 overflow-hidden relative">
                    {c.format === "Live batch" && (
                      <div className="absolute top-3 left-3 bg-primary text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 z-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                        LIVE
                      </div>
                    )}
                    <Image src={c.coverImageUrl} alt={c.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className={`w-full h-36 flex items-center justify-center relative ${getSubjectBgColor(c.subject)}`}>
                    {c.format === "Live batch" && (
                      <div className="absolute top-3 left-3 bg-primary text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                        LIVE
                      </div>
                    )}
                    {getIconComponent(c.iconName)}
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-badge-bg text-badge-text">
                        {c.subject}
                      </span>
                      {c.class_level && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {c.class_level}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        c.format === "Live batch"
                          ? "bg-green-50 text-green-700 border border-green-150"
                          : c.format === "Recorded"
                          ? "bg-amber-50 text-amber-700 border border-amber-150"
                          : "bg-purple-50 text-purple-700 border border-purple-150"
                      }`}>
                        {c.format}
                      </span>
                    </div>
                    
                    <h3 className="font-heading text-base font-bold text-primary mb-1 leading-tight">
                      {c.title}
                    </h3>
                    <p className="text-xs text-text-muted mb-1 font-medium">
                      Course by {c.mentor}
                    </p>
                    <p className="text-xs text-text-muted/85 leading-relaxed line-clamp-2 mb-4">
                      {c.description || `Structured course program in ${c.subject}.`}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 border-t border-border-subtle pt-3 mb-4">
                      <span className="text-xs font-bold text-accent flex items-center gap-0.5">
                        <IconStar className="w-3.5 h-3.5 fill-accent text-accent" /> {c.rating}
                      </span>
                      <span className="ml-auto font-heading font-extrabold text-primary text-lg">
                        ₹{c.price.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveBooking({
                          id: c.id,
                          type: "course",
                          title: c.title,
                          price: c.price,
                          mentorName: c.mentor,
                          isLiveIndividual: c.format === "Live individual"
                        })}
                        className="flex-1 text-xs font-semibold py-2.5 rounded-lg bg-secondary text-white hover:bg-secondary/90 transition-colors cursor-pointer"
                      >
                        Book now
                      </button>
                      <a href={`/courses/${c.id}`} className="flex-1 text-xs font-semibold py-2.5 rounded-lg bg-transparent text-primary border border-primary hover:bg-primary/5 transition-colors cursor-pointer text-center">
                        Details
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
              <div className="flex items-center gap-2 mb-3">
                <Image src="/logo.png" alt="Gadha Online" width={40} height={40} className="w-10 h-10 object-contain" />
                <span className="font-heading text-xl font-extrabold text-white">Gadha Online</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed max-w-[280px]">
                India&apos;s most trusted online tutoring platform. Learn at your pace, with the best mentors.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-4">
                Company
              </div>
              <ul className="space-y-2.5 text-xs text-white/60">
                <li>
                  <a href="/about" className="hover:text-white transition-colors">About us</a>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-4">
                Explore
              </div>
              <ul className="space-y-2.5 text-xs text-white/60">
                <li>
                  <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
                </li>
                <li>
                  <Link href="/sessions" className="hover:text-white transition-colors">Sessions</Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-4">
                Legal
              </div>
              <ul className="space-y-2.5 text-xs text-white/60">
                <li>
                  <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
            <p>&copy; 2026 Gadha Online. All rights reserved.</p>
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
      {activeBooking && (
        <BookingModal
          isOpen={!!activeBooking}
          onClose={() => setActiveBooking(null)}
          targetId={activeBooking.id}
          targetType={activeBooking.type}
          title={activeBooking.title}
          price={activeBooking.price}
          mentorName={activeBooking.mentorName}
          isLiveIndividual={!!activeBooking.isLiveIndividual}
        />
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] h-screen bg-[#F5F8FF] font-sans text-primary">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 animate-pulse">Loading Courses...</p>
      </div>
    }>
      <CoursesPageContent />
    </Suspense>
  );
}
