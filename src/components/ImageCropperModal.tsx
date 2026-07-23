"use client";

import React, { useState, useEffect, useRef } from "react";
import { IconX, IconCheck, IconZoomIn, IconZoomOut } from "@tabler/icons-react";

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  aspectRatio?: number; // width / height ratio, e.g. 1 for square, 16/9, 4/3
  title?: string;
  onCropComplete: (croppedBlob: Blob, croppedUrl: string) => void;
}

export default function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  aspectRatio = 1,
  title = "Adjust Image",
  onCropComplete,
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const drawCanvas = (
    img: HTMLImageElement,
    currentZoom: number,
    currentPan: { x: number; y: number }
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas internal resolution to fixed size matching aspect ratio
    const width = 400;
    const height = 400 / aspectRatio;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // Center and apply scale and pan
    ctx.translate(width / 2 + currentPan.x, height / 2 + currentPan.y);
    ctx.scale(currentZoom, currentZoom);

    // Calculate object-cover scale
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    let renderW = width;
    let renderH = height;

    if (imgRatio > canvasRatio) {
      renderW = height * imgRatio;
    } else {
      renderH = width / imgRatio;
    }

    ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
    ctx.restore();
  };

  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate reset-on-reopen; modal stays mounted, crop state is cleared each time a new image is loaded
    setZoom(1);
    setPan({ x: 0, y: 0 });

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      drawCanvas(img, 1, { x: 0, y: 0 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawCanvas only closes over aspectRatio (a prop) and canvasRef; re-running on every render isn't needed
  }, [isOpen, imageSrc]);

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(1, Math.min(3, newZoom));
    setZoom(clamped);
    if (imageRef.current) {
      drawCanvas(imageRef.current, clamped, pan);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;
    const newPan = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setPan(newPan);
    drawCanvas(imageRef.current, zoom, newPan);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const croppedUrl = URL.createObjectURL(blob);
      onCropComplete(blob, croppedUrl);
      onClose();
    }, "image/jpeg", 0.92);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-primary/70 backdrop-blur-xs z-[999] flex items-center justify-center p-4 font-sans animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-5 py-4 border-b border-[#E6EBF8] flex items-center justify-between">
          <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B]">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-[#E6EBF8] hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <IconX className="w-4 h-4" />
          </button>
        </header>

        {/* Canvas Workspace */}
        <div className="p-6 flex flex-col items-center gap-4 bg-slate-900/5">
          <p className="text-[11px] font-semibold text-slate-500">
            Drag to pan position • Use slider to zoom
          </p>

          <div
            className="relative rounded-2xl overflow-hidden border-2 border-[#2F7FE8] shadow-lg cursor-grab active:cursor-grabbing bg-slate-900 select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas ref={canvasRef} className="block max-w-full h-auto" />
          </div>

          {/* Zoom Slider */}
          <div className="w-full flex items-center gap-3 px-4 pt-2">
            <button
              onClick={() => handleZoomChange(zoom - 0.2)}
              className="text-slate-500 hover:text-primary cursor-pointer"
            >
              <IconZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="flex-1 accent-[#2F7FE8] cursor-pointer"
            />
            <button
              onClick={() => handleZoomChange(zoom + 0.2)}
              className="text-slate-500 hover:text-primary cursor-pointer"
            >
              <IconZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-5 py-4 border-t border-[#E6EBF8] flex gap-3">
          <button
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#E6EBF8] text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveCrop}
            className="flex-1 text-xs font-bold py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <IconCheck className="w-4 h-4" /> Apply & Save Crop
          </button>
        </footer>
      </div>
    </div>
  );
}
