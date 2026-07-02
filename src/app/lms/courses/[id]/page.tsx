"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconVideo, IconClock, IconCheck, IconChevronLeft,
  IconPlayerPlay, IconArrowRight, IconSparkles, IconLoader,
} from "@tabler/icons-react";
import {
  getStudentCourseDetails,
  getCourseUnitsForStudent,
  getVideoProgress,
  updateVideoProgress,
} from "@/app/actions";

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export default function RecordedCourseViewerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, { watch_percentage: number; completed: boolean }>>({});
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);

  const playerRef = useRef<any>(null);
  const progressTimerRef = useRef<any>(null);
  const apiLoadedRef = useRef(false);

  // Load basic course + units + initial progress
  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      getStudentCourseDetails(courseId),
      getCourseUnitsForStudent(courseId),
      getVideoProgress(courseId),
    ])
      .then(([c, u, p]) => {
        setCourse(c);
        setUnits(u);
        setProgress(p || {});
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [courseId]);

  // Load YouTube Player API script
  useEffect(() => {
    if (loading || units.length === 0 || apiLoadedRef.current) return;
    apiLoadedRef.current = true;

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, [loading, units]);

  const currentUnit = units[currentUnitIndex];

  // Initialize/recreate player when current video ID changes
  useEffect(() => {
    if (!currentUnit?.video_id) return;

    const setupPlayer = () => {
      if (playerRef.current) {
        playerRef.current.loadVideoById(currentUnit.video_id);
        return;
      }

      playerRef.current = new window.YT.Player("recorded-youtube-player", {
        height: "100%",
        width: "100%",
        videoId: currentUnit.video_id,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: handlePlayerStateChange,
        },
      });
    };

    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      window.onYouTubeIframeAPIReady = setupPlayer;
    }

    return () => {
      stopProgressTracking();
    };
  }, [currentUnit, loading]);

  const startProgressTracking = () => {
    stopProgressTracking();
    progressTimerRef.current = setInterval(async () => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== "function") return;
      
      const currentTime = playerRef.current.getCurrentTime();
      const totalTime = playerRef.current.getDuration();
      if (!totalTime || totalTime <= 0) return;

      const pct = Math.min(100, Math.round((currentTime / totalTime) * 100));
      
      // Update progress if it is higher than before
      const currentProgress = progress[currentUnit.id]?.watch_percentage || 0;
      const isAlreadyCompleted = progress[currentUnit.id]?.completed || false;

      if (pct > currentProgress && !isAlreadyCompleted) {
        // Save local state optimization
        setProgress((prev) => ({
          ...prev,
          [currentUnit.id]: { watch_percentage: pct, completed: pct >= 80 },
        }));

        // Send to backend
        try {
          const res = await updateVideoProgress(currentUnit.id, pct);
          if (res.completed && !isAlreadyCompleted) {
            // Re-fetch progress to stay aligned
            const freshProgress = await getVideoProgress(courseId);
            setProgress(freshProgress);
          }
        } catch (err) {
          console.error("Failed to sync progress:", err);
        }
      }
    }, 2000);
  };

  const stopProgressTracking = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const handlePlayerStateChange = (event: any) => {
    // YT.PlayerState.PLAYING is 1
    if (event.data === 1) {
      startProgressTracking();
    } else {
      stopProgressTracking();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <IconLoader className="w-8 h-8 text-[#2F7FE8] animate-spin" />
        <p className="text-[12px] font-bold text-[#4A5A7A]">Loading Recorded Viewer...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-bold text-red-500">Course details not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-xs font-bold text-[#2F7FE8] hover:underline">
          Go back
        </button>
      </div>
    );
  }

  // Calculate course completion
  const totalUnits = units.length;
  const completedCount = units.filter((u) => progress[u.id]?.completed).length;
  const courseComplete = totalUnits > 0 && completedCount === totalUnits;
  const overallPercentage = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4A5A7A] hover:text-[#1B3A6B] transition-colors cursor-pointer"
      >
        <IconChevronLeft className="w-4 h-4" /> Back to Classes
      </button>

      {/* Header card with completion state */}
      <div className="bg-white rounded-3xl border border-[#D0DCF5] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
            Recorded Course Viewer
          </span>
          <h1 className="text-[20px] font-extrabold font-heading text-[#1B3A6B] mt-2 leading-tight">
            {course.title}
          </h1>
          <p className="text-[12px] text-[#4A5A7A] mt-1 font-semibold">
            Subject: {course.subject} · Instructor: {course.mentorName}
          </p>
        </div>
        
        {/* Completion Progress ring / stats */}
        <div className="flex items-center gap-4 shrink-0 bg-slate-50 p-4 rounded-2xl border border-[#E6EBF8]">
          <div className="text-right">
            <p className="text-[11px] text-[#4A5A7A] font-bold uppercase">Course Progress</p>
            <p className="text-[13px] font-extrabold text-[#1B3A6B] mt-0.5">
              {completedCount} / {totalUnits} Units Completed ({overallPercentage}%)
            </p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-[#EBF2FF] relative flex items-center justify-center">
            <span className="text-[10px] font-extrabold text-[#2F7FE8]">{overallPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Course complete banner */}
      {courseComplete && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 flex items-center gap-4 shadow-sm animate-scale-up">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <IconSparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-[14px] font-extrabold text-emerald-800">Course Fully Completed!</h4>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">
              Congratulations! You have completed all the video units in this course successfully.
            </p>
          </div>
        </div>
      )}

      {/* Player and Playlist section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Player */}
        <div className="lg:col-span-2 space-y-4">
          {currentUnit ? (
            <div className="space-y-4">
              {/* YouTube Player Wrapper */}
              <div className="aspect-video bg-black rounded-3xl border border-[#D0DCF5] overflow-hidden shadow-lg relative">
                <div id="recorded-youtube-player" className="w-full h-full"></div>
              </div>

              {/* Current Unit Details */}
              <div className="bg-white rounded-3xl border border-[#D0DCF5] p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">
                    Unit {currentUnitIndex + 1}: {currentUnit.title}
                  </h2>
                  {progress[currentUnit.id]?.completed && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-200">
                      <IconCheck className="w-3.5 h-3.5" /> Completed
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[#4A5A7A] leading-relaxed">
                  {currentUnit.description || "No description provided for this unit."}
                </p>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-slate-900 rounded-3xl flex items-center justify-center">
              <p className="text-white/60 text-xs font-semibold">No video unit selected</p>
            </div>
          )}
        </div>

        {/* Right 1/3: Video units checklist */}
        <div className="bg-white rounded-3xl border border-[#D0DCF5] p-5 space-y-4 h-fit">
          <h3 className="text-[13px] font-bold text-[#1B3A6B] uppercase tracking-wider pb-2 border-b border-[#F0F3FB]">
            Units Playlist
          </h3>

          <div className="space-y-2 max-h-[450px] overflow-y-auto premium-scrollbar pr-1">
            {units.map((u, index) => {
              const isActive = index === currentUnitIndex;
              const isCompleted = progress[u.id]?.completed;
              const watchPct = progress[u.id]?.watch_percentage || 0;

              return (
                <button
                  key={u.id}
                  onClick={() => setCurrentUnitIndex(index)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative overflow-hidden ${
                    isActive
                      ? "border-[#2F7FE8] bg-[#EBF2FF]/30 shadow-xs"
                      : "border-[#D0DCF5] bg-white hover:bg-slate-50/50"
                  }`}
                >
                  {/* Progress completion check indicator */}
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-slate-300 bg-white"
                  }`}>
                    {isCompleted && <IconCheck className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-[12px] font-bold truncate ${isActive ? "text-[#1B3A6B]" : "text-[#4A5A7A]"}`}>
                      {index + 1}. {u.title}
                    </p>
                    <p className="text-[10px] text-[#9BA8C0] mt-1 flex items-center gap-1.5 font-semibold">
                      <IconClock className="w-3.5 h-3.5" />
                      {Math.round((u.duration_seconds || 0) / 60)} mins
                      {watchPct > 0 && !isCompleted && (
                        <span className="text-[#2F7FE8] ml-1">({watchPct}% watched)</span>
                      )}
                    </p>
                  </div>

                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#2F7FE8]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
