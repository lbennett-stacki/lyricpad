"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface InspirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (inspiration: string) => Promise<void>;
  currentInspiration?: string;
  isLoading?: boolean;
}

export function InspirationModal({
  isOpen,
  onClose,
  onSave,
  currentInspiration = "",
  isLoading = false,
}: InspirationModalProps) {
  const [inspiration, setInspiration] = useState(currentInspiration);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setInspiration(currentInspiration);
  }, [currentInspiration]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    await onSave(inspiration);
    onClose();
  }, [inspiration, onSave, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isLoading) {
        e.preventDefault();
        handleSave();
      }
    },
    [onClose, handleSave, isLoading]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="mx-4 w-full max-w-md rounded-lg border border-foreground/[0.08] bg-background p-6 shadow-lg">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-foreground">
            Set Inspiration
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            Add inspiration to guide AI suggestions (e.g., &ldquo;Use lyrics
            similar to Bryson Tiller&rdquo;)
          </p>
        </div>

        <textarea
          ref={textareaRef}
          value={inspiration}
          onChange={(e) => setInspiration(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your inspiration..."
          className="block w-full resize-none rounded-md border border-foreground/[0.08] bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/20"
          rows={3}
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-foreground/70 hover:bg-foreground/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Enhancing..." : "Save"}
          </button>
        </div>

        <div className="mt-2 text-xs text-foreground/50">
          Press Cmd/Ctrl+Enter to save, Escape to cancel
        </div>
      </div>
    </div>
  );
}
