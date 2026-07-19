"use client";

import React from "react";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "constructive";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "constructive",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const isDestructive = variant === "destructive";

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 bg-[#1B3A6B]/40 backdrop-blur-xs z-[300] flex items-center justify-center p-4 font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDestructive ? "bg-red-50 text-red-600" : "bg-[#EBF2FF] text-[#2F7FE8]"
            }`}
          >
            {isDestructive ? (
              <IconAlertTriangle className="w-5 h-5" />
            ) : (
              <IconCheck className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B]">{title}</h3>
            <p className="text-xs text-text-muted leading-relaxed mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onCancel}
            className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-transparent text-primary border border-border-subtle hover:bg-surface cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`text-xs font-bold px-4 py-2.5 rounded-lg text-white transition-colors cursor-pointer ${
              isDestructive ? "bg-red-600 hover:bg-red-700" : "bg-[#2F7FE8] hover:bg-[#1B3A6B]"
            }`}
          >
            {confirmLabel || (isDestructive ? "Delete" : "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
