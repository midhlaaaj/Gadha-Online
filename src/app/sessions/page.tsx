"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  IconCalculator,
  IconBook,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandYoutube,
  IconCheck,
} from "@tabler/icons-react";
import { getSessionsPageData } from "../actions";

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

function SessionsPageContent() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const mentorParam = searchParams.get("mentor") || "";

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState(mentorParam);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  
  const [sortOption, setSortOption] = useState("Most popular");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getSessionsPageData();
        setSessions(res);
      } catch (err) {
        console.error("Failed to load sessions page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync Categories with Tab Strip
  const handleTabSelect = (tab: string) => {
    if (tab === "All sessions") {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(prev => 
        prev.includes(tab) ? prev.filter(c => c !== tab) : [...prev, tab]
      );
    }
    setCurrentPage(1);
  };

  const handleCategoryCheckbox = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
    setCurrentPage(1);
  };

  const handleTypeCheckbox = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setSelectedCategories([]);
    setSelectedTypes([]);
    setMinPrice("");
    setMaxPrice("");
    setSelectedRating(null);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const removeCategoryFilter = (cat: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== cat));
  };

  const removeTypeFilter = (type: string) => {
    setSelectedTypes(prev => prev.filter(t => t !== type));
  };

  // Filter Logic
  const filteredSessions = sessions.filter((s) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchDesc = s.description.toLowerCase().includes(q);
      const matchMentor = s.mentor.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchMentor) return false;
    }

    // Category filter
    if (selectedCategories.length > 0) {
      if (!selectedCategories.includes(s.subject)) return false;
    }

    // Type filter
    if (selectedTypes.length > 0) {
      if (!selectedTypes.includes(s.type)) return false;
    }

    // Price range filter
    if (minPrice && s.price < Number(minPrice)) return false;
    if (maxPrice && s.price > Number(maxPrice)) return false;

    // Rating filter (simulated fallback to 5.0 for default reviews)
    if (selectedRating !== null && 5.0 < selectedRating) return false;

    return true;
  });

  // Sorting Logic
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (sortOption === "Price: Low to High") return a.price - b.price;
    if (sortOption === "Price: High to Low") return b.price - a.price;
    // Fallback/Default: Most popular / Highest Rated (sort by bookings count desc)
    return b.bookings - a.bookings;
  });

  // Pagination Logic
  const totalItems = sortedSessions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentSessions = sortedSessions.slice(startIndex, endIndex);

  // Active Filter Count calculation
  const activeFilterCount = 
    selectedCategories.length +
    selectedTypes.length +
    (minPrice || maxPrice ? 1 : 0) +
    (selectedRating !== null ? 1 : 0);

  // Counts for checkboxes
  const getCountByCategory = (cat: string) => sessions.filter(s => s.subject === cat).length;
  const getCountByType = (type: string) => sessions.filter(s => s.type === type).length;



  return (
    <div className="w-full bg-white text-primary flex-1 min-h-screen flex flex-col font-sans">

      {/* PAGE HEADER */}
      <header className="bg-surface px-6 md:px-12 py-8 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-xs text-text-muted mb-3 flex items-center gap-1.5 font-medium">
            <a href="/" className="hover:text-secondary transition-colors">Home</a>
            <span className="text-slate-300">/</span>
            {mentorParam ? (
              <>
                <a href="/sessions" className="hover:text-secondary transition-colors">Sessions</a>
                <span className="text-slate-300">/</span>
                <span className="text-primary font-semibold">{mentorParam}</span>
              </>
            ) : (
              <span className="text-primary font-semibold">Sessions</span>
            )}
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="font-heading text-3xl font-extrabold text-primary mb-1">
                {mentorParam ? `Explore sessions by ${mentorParam}` : "Explore Hourly Sessions"}
              </h1>
              <p className="text-xs md:text-sm text-text-muted">
                {mentorParam 
                  ? `Browse hourly sessions conducted by ${mentorParam}`
                  : "Book flexible 1-on-1 private lessons or group review sessions on your own schedule"
                }
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
                      placeholder="Search subject, mentor, topic..."
                      className="flex-1 text-xs outline-none text-primary"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-primary p-0.5 animate-fade-in">
                        <IconX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Search Toggle Button */}
                <button
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className="w-10 h-10 rounded-xl border border-border-subtle bg-white flex items-center justify-center cursor-pointer hover:border-secondary hover:bg-[#F0F6FF] transition-all focus:outline-none"
                  title="Search sessions"
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
                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowFilterPanel(false)} />
                    
                    <div className="absolute right-0 top-12 mt-2 w-[320px] bg-white border border-border-subtle rounded-2xl shadow-xl z-50 p-5 origin-top-right animate-fade-in">
                      <div className="w-3 h-3 bg-white rotate-45 border-t border-l border-border-subtle absolute -top-1.5 right-3.5 z-10"></div>
                      
                      <div className="max-h-[350px] overflow-y-auto -mr-5 pr-4 space-y-6 premium-scrollbar relative z-20">
                        {/* Category Section */}
                        <div>
                          <div className="font-heading text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Category
                          </div>
                          <div className="flex flex-col">
                            {["Mathematics", "Science", "Programming", "English"].map((cat) => (
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

                        {/* Type Section */}
                        <div>
                          <div className="font-heading text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Session Type
                          </div>
                          <div className="flex flex-col">
                            {["1-on-1", "Group"].map((type) => (
                              <div
                                key={type}
                                onClick={() => handleTypeCheckbox(type)}
                                className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 cursor-pointer group"
                              >
                                <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center border transition-all ${
                                  selectedTypes.includes(type)
                                    ? "bg-secondary border-secondary text-white"
                                    : "bg-white border-slate-300 group-hover:border-secondary"
                                }`}>
                                  {selectedTypes.includes(type) && <IconCheck className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="text-[13px] font-semibold text-primary">{type}</span>
                                <span className="ml-auto text-[11px] font-semibold text-slate-400">{getCountByType(type)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Price Range Section */}
                        <div>
                          <div className="font-heading text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Hourly Rate
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="number"
                              value={minPrice}
                              onChange={(e) => {
                                setMinPrice(e.target.value);
                                setCurrentPage(1);
                              }}
                              placeholder="₹ Min"
                              className="w-full text-xs p-2.5 border border-border-subtle rounded-lg outline-none focus:border-secondary text-primary"
                            />
                            <span className="text-slate-300">—</span>
                            <input
                              type="number"
                              value={maxPrice}
                              onChange={(e) => {
                                setMaxPrice(e.target.value);
                                setCurrentPage(1);
                              }}
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
            {["All sessions", "Mathematics", "Science", "Programming", "English"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabSelect(tab)}
                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                  (tab === "All sessions" ? selectedCategories.length === 0 : selectedCategories.includes(tab))
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
            </select>
          </div>
        </div>

        {/* SUBBAR (Active Filter Pills & Result Count) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 min-h-[32px]">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category pills */}
            {selectedCategories.map((cat) => (
              <div key={cat} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                {cat}
                <button onClick={() => removeCategoryFilter(cat)} className="hover:text-red-600 transition-colors">
                  <IconX className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {/* Type pills */}
            {selectedTypes.map((type) => (
              <div key={type} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                {type}
                <button onClick={() => removeTypeFilter(type)} className="hover:text-red-600 transition-colors">
                  <IconX className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Price range pills */}
            {(minPrice || maxPrice) && (
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                Price: {minPrice ? `₹${minPrice}` : "0"} — {maxPrice ? `₹${maxPrice}` : "Max"}
                <button onClick={() => { setMinPrice(""); setMaxPrice(""); }} className="hover:text-red-600 transition-colors">
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
            Showing <strong className="text-primary font-bold">{totalItems === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of <strong className="text-primary font-bold">{totalItems}</strong> sessions
          </div>
        </div>

        {/* SESSIONS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-border-subtle rounded-2xl overflow-hidden p-5 space-y-4">
                <div className="w-full h-32 bg-slate-100 rounded-xl animate-shimmer"></div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 bg-slate-100 rounded animate-shimmer"></div>
                  <div className="h-4 w-16 bg-slate-100 rounded animate-shimmer"></div>
                </div>
                <div className="h-6 w-3/4 bg-slate-200 rounded animate-shimmer"></div>
                <div className="h-4 w-1/2 bg-slate-100 rounded animate-shimmer"></div>
                <div className="border-t border-border-subtle pt-3 flex items-center justify-between">
                  <div className="h-4 w-16 bg-slate-100 rounded animate-shimmer"></div>
                  <div className="h-6 w-16 bg-slate-200 rounded animate-shimmer"></div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-grow h-10 bg-slate-200 rounded-lg animate-shimmer"></div>
                  <div className="flex-grow h-10 bg-slate-100 rounded-lg animate-shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        ) : currentSessions.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 border border-dashed border-border-subtle rounded-2xl">
            <p className="text-sm text-text-muted mb-4 font-medium">No sessions match your filters.</p>
            <button
              onClick={resetAllFilters}
              className="text-xs font-semibold px-5 py-2.5 bg-primary text-white rounded-lg hover:shadow-md transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {currentSessions.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-border-subtle rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col justify-between"
              >
                <div className={`w-full h-32 flex items-center justify-center ${getSubjectBgColor(s.subject)}`}>
                  {getIconComponent(s.iconName)}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 mb-3 inline-block">
                      {s.type} Session
                    </span>
                    <h3 className="font-heading text-base font-bold text-primary mb-1 leading-tight">
                      {s.title}
                    </h3>
                    <p className="text-xs text-text-muted mb-1 font-medium">
                      Led by {s.mentor}
                    </p>
                    <p className="text-xs text-text-muted/85 leading-relaxed line-clamp-2 mb-4">
                      {s.description || `1-on-1 private lesson in ${s.subject}.`}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 border-t border-border-subtle pt-3 mb-4">
                      <span className="text-xs font-bold text-accent flex items-center gap-0.5">
                        <IconStar className="w-3.5 h-3.5 fill-accent text-accent" /> 5.0
                      </span>
                      <span className="text-[10px] text-text-muted font-medium">({s.bookings} reviews)</span>
                      <span className="ml-auto font-heading font-extrabold text-primary text-lg">
                        ₹{s.price.toLocaleString("en-IN")}/hr
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 text-xs font-semibold py-2.5 rounded-lg bg-secondary text-white hover:bg-secondary/90 transition-colors cursor-pointer">
                        Book now
                      </button>
                      <a
                        href={`/sessions/${s.id}`}
                        className="flex-1 text-xs font-semibold py-2.5 rounded-lg bg-transparent text-primary border border-primary hover:bg-primary/5 transition-colors cursor-pointer text-center"
                      >
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

    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] h-screen bg-[#F5F8FF] font-sans text-primary">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 animate-pulse">Loading Sessions...</p>
      </div>
    }>
      <CoursesPageContentWrapper />
    </Suspense>
  );
}

// Rename CoursesPageContentWrapper to match component or just write SessionsPageContent
function CoursesPageContentWrapper() {
  return <SessionsPageContent />;
}
