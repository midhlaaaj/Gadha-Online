"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  IconEye,
  IconPhotoUp,
  IconCheck,
  IconTrash,
} from "@tabler/icons-react";
import { getAdminData, updateHeroSettings, uploadHeroImage } from "../../actions";
import ImageCropperModal from "@/components/ImageCropperModal";

const DEFAULT_HERO = {
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

export default function HeroPage() {
  const [heroCopy, setHeroCopy] = useState(DEFAULT_HERO);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image Cropper State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState("");

  const loadData = async () => {
    try {
      const res = await getAdminData();
      if (res.settings) {
        setHeroCopy({
          headline: res.settings.headline || DEFAULT_HERO.headline,
          accentedText: res.settings.accented_text || DEFAULT_HERO.accentedText,
          subheading: res.settings.subheading || DEFAULT_HERO.subheading,
          primaryCta: res.settings.primary_cta || DEFAULT_HERO.primaryCta,
          primaryLink: res.settings.primary_link || DEFAULT_HERO.primaryLink,
          secondaryCta: res.settings.secondary_cta || DEFAULT_HERO.secondaryCta,
          secondaryLink: res.settings.secondary_link || DEFAULT_HERO.secondaryLink,
          c1: res.settings.c1 || DEFAULT_HERO.c1,
          cl1: res.settings.cl1 || DEFAULT_HERO.cl1,
          c2: res.settings.c2 || DEFAULT_HERO.c2,
          cl2: res.settings.cl2 || DEFAULT_HERO.cl2,
          c3: res.settings.c3 || DEFAULT_HERO.c3,
          cl3: res.settings.cl3 || DEFAULT_HERO.cl3,
          c4: res.settings.c4 || DEFAULT_HERO.c4,
          cl4: res.settings.cl4 || DEFAULT_HERO.cl4,
        });
        if (res.settings.hero_image_url) {
          setHeroImageUrl(res.settings.hero_image_url);
        }
      }
    } catch (err) {
      console.error("Failed to load hero configurations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-on-mount; setState fires after the awaited request resolves, not synchronously
    loadData();
  }, []);

  const handleHeroImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropperSrc(reader.result);
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploadingImage(true);
    try {
      const file = new File([croppedBlob], `hero-${Date.now()}.jpg`, { type: "image/jpeg" });
      const fd = new FormData();
      fd.append("file", file);
      const { publicUrl } = await uploadHeroImage(fd);
      setHeroImageUrl(publicUrl);
    } catch (err) {
      console.error("Error uploading hero image:", err);
      alert("Couldn't upload the image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const saveHeroChanges = async () => {
    setSaving(true);
    try {
      await updateHeroSettings({
        headline: heroCopy.headline,
        accented_text: heroCopy.accentedText,
        subheading: heroCopy.subheading,
        primary_cta: heroCopy.primaryCta,
        primary_link: heroCopy.primaryLink,
        secondary_cta: heroCopy.secondaryCta,
        secondary_link: heroCopy.secondaryLink,
        hero_image_url: heroImageUrl,
        c1: heroCopy.c1,
        cl1: heroCopy.cl1,
        c2: heroCopy.c2,
        cl2: heroCopy.cl2,
        c3: heroCopy.c3,
        cl3: heroCopy.cl3,
        c4: heroCopy.c4,
        cl4: heroCopy.cl4,
      });
      alert("Hero section updated and published to homepage!");
      await loadData();
    } catch (err) {
      console.error("Error saving hero settings:", err);
      alert("Couldn't save these settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
        <span className="text-[#2F7FE8]">{phrase}</span>
        {parts[1]}
      </>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans animate-pulse">
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-6 h-96 space-y-4">
          <div className="h-6 w-32 bg-slate-200 rounded" />
          <div className="h-40 bg-slate-100 rounded-xl" />
        </div>
        <div className="bg-white border border-[#E6EBF8] rounded-2xl p-6 h-96 space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-24 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start font-sans">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleHeroImageFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Left: Preview */}
      <div className="lg:sticky lg:top-4 space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7FE8] bg-[#EBF2FF] px-3.5 py-1 rounded-full">
          <IconEye className="w-4 h-4" />
          Live preview
        </div>
        {/* Browser shell container mockup */}
        <div className="bg-[#F5F8FF] border border-border-subtle rounded-2xl overflow-hidden shadow-md">
          {/* Mock Navbar */}
          <div className="bg-white border-b border-border-subtle px-4 h-9 flex items-center justify-between">
            <div className="font-heading text-xs font-extrabold text-primary">
              Gadha Online
            </div>
            <div className="flex gap-2">
              <div className="w-12 h-2.5 rounded bg-slate-200" />
              <div className="w-12 h-2.5 rounded bg-slate-200" />
            </div>
          </div>
          {/* Mock Hero content */}
          <div className="p-6">
            <div className="max-w-md space-y-3">
              <h2 className="font-heading text-lg font-extrabold text-primary leading-tight">
                {renderPrevHeadline()}
              </h2>
              <p className="text-[11px] text-text-muted leading-relaxed line-clamp-3">
                {heroCopy.subheading}
              </p>

              {/* Hero Image Preview */}
              {heroImageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-[#E6EBF8] h-36 bg-slate-100 my-3">
                  <Image src={heroImageUrl} alt="Hero visual" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setHeroImageUrl("")}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer"
                    title="Remove image"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-secondary text-white">
                  {heroCopy.primaryCta || "CTA 1"}
                </span>
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-border-subtle bg-white text-primary">
                  {heroCopy.secondaryCta || "CTA 2"}
                </span>
              </div>
            </div>

            {/* Mock Stats bar */}
            <div className="mt-6 pt-4 border-t border-slate-200/60 grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="font-heading text-xs font-extrabold text-primary">{heroCopy.c1}</div>
                <div className="text-[8px] text-text-muted truncate">{heroCopy.cl1}</div>
              </div>
              <div>
                <div className="font-heading text-xs font-extrabold text-primary">{heroCopy.c2}</div>
                <div className="text-[8px] text-text-muted truncate">{heroCopy.cl2}</div>
              </div>
              <div>
                <div className="font-heading text-xs font-extrabold text-primary">{heroCopy.c3}</div>
                <div className="text-[8px] text-text-muted truncate">{heroCopy.cl3}</div>
              </div>
              <div>
                <div className="font-heading text-xs font-extrabold text-primary">{heroCopy.c4}</div>
                <div className="text-[8px] text-text-muted truncate">{heroCopy.cl4}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form controls */}
      <div className="bg-white border border-border-subtle rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <h3 className="font-heading text-sm font-extrabold text-primary">Hero content settings</h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-border-subtle hover:bg-slate-50 text-secondary flex items-center gap-1.5 cursor-pointer"
          >
            <IconPhotoUp className="w-3.5 h-3.5" />
            {uploadingImage ? "Uploading..." : "Crop & Upload Image"}
          </button>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Headline text</label>
            <input
              type="text"
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
              value={heroCopy.headline}
              onChange={(e) => setHeroCopy({ ...heroCopy, headline: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Accented text highlight</label>
            <input
              type="text"
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
              value={heroCopy.accentedText}
              onChange={(e) => setHeroCopy({ ...heroCopy, accentedText: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Subheading body</label>
            <textarea
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] resize-none h-20"
              value={heroCopy.subheading}
              onChange={(e) => setHeroCopy({ ...heroCopy, subheading: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Primary CTA label</label>
              <input
                type="text"
                className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                value={heroCopy.primaryCta}
                onChange={(e) => setHeroCopy({ ...heroCopy, primaryCta: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Secondary CTA label</label>
              <input
                type="text"
                className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                value={heroCopy.secondaryCta}
                onChange={(e) => setHeroCopy({ ...heroCopy, secondaryCta: e.target.value })}
              />
            </div>
          </div>

          {/* Stats Bar Configuration */}
          <div className="border-t border-border-subtle pt-3 space-y-3">
            <span className="text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider block">Stats row counters</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Stat 1 Value"
                  className="text-xs p-2 border border-border-subtle rounded-lg w-full font-bold text-primary"
                  value={heroCopy.c1}
                  onChange={(e) => setHeroCopy({ ...heroCopy, c1: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Stat 1 Label"
                  className="text-xs p-2 border border-border-subtle rounded-lg w-full text-text-muted"
                  value={heroCopy.cl1}
                  onChange={(e) => setHeroCopy({ ...heroCopy, cl1: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Stat 2 Value"
                  className="text-xs p-2 border border-border-subtle rounded-lg w-full font-bold text-primary"
                  value={heroCopy.c2}
                  onChange={(e) => setHeroCopy({ ...heroCopy, c2: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Stat 2 Label"
                  className="text-xs p-2 border border-border-subtle rounded-lg w-full text-text-muted"
                  value={heroCopy.cl2}
                  onChange={(e) => setHeroCopy({ ...heroCopy, cl2: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-3 border-t border-border-subtle">
          <button
            onClick={saveHeroChanges}
            disabled={saving}
            className="w-full text-xs font-bold py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <IconCheck className="w-4 h-4" />
            {saving ? "Saving changes..." : "Publish changes"}
          </button>
        </div>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={cropperSrc}
        aspectRatio={16 / 9}
        title="Crop Hero Image"
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
