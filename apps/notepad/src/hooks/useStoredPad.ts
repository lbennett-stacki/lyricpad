import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SavedPad, SaveState } from "../types";
import { PAD_PREFIX, CURRENT_PAD_KEY, generatePadId } from "../lib/storage";

export function useStoredPad() {
  const searchParams = useSearchParams();
  const [content, setContent] = useState<string>("");
  const [inspiration, setInspiration] = useState<string>("");
  const [currentPadId, setCurrentPadId] = useState<string>("");
  const [saveState, setSaveState] = useState<SaveState>("saved");

  const saveTimerRef = useRef<number | null>(null);
  const savedBadgeTimerRef = useRef<number | null>(null);

  // Load pad content and set current pad ID
  useEffect(() => {
    try {
      // Check if we should load a specific pad from URL params
      const padId = searchParams.get("pad");

      if (padId) {
        // Load specific pad
        const padData = window.localStorage.getItem(PAD_PREFIX + padId);
        if (padData) {
          try {
            const parsed = JSON.parse(padData) as SavedPad;
            setContent(parsed.content);
            setInspiration(parsed.inspiration || "");
            setCurrentPadId(padId);
            window.localStorage.setItem(CURRENT_PAD_KEY, padId);
            return;
          } catch {
            // Fallback to treating as plain content
            setContent(padData);
            setInspiration("");
            setCurrentPadId(padId);
            window.localStorage.setItem(CURRENT_PAD_KEY, padId);
            return;
          }
        }
      }

      // Check for current pad ID
      const savedCurrentId = window.localStorage.getItem(CURRENT_PAD_KEY);
      if (savedCurrentId) {
        const padData = window.localStorage.getItem(
          PAD_PREFIX + savedCurrentId
        );
        if (padData) {
          try {
            const parsed = JSON.parse(padData) as SavedPad;
            setContent(parsed.content);
            setInspiration(parsed.inspiration || "");
            setCurrentPadId(savedCurrentId);
            return;
          } catch {
            // Fallback to treating as plain content
            setContent(padData);
            setInspiration("");
            setCurrentPadId(savedCurrentId);
            return;
          }
        }
      }

      // No existing pad found, create new one
      const newId = generatePadId();
      setCurrentPadId(newId);
      window.localStorage.setItem(CURRENT_PAD_KEY, newId);
    } catch {
      // Fallback to new pad
      const newId = generatePadId();
      setCurrentPadId(newId);
    }
  }, [searchParams]);

  const persist = useCallback(
    (value: string, inspirationValue: string, padId: string) => {
      if (!padId) return;

      try {
        const now = new Date().toISOString();
        const padData: SavedPad = {
          id: padId,
          content: value,
          inspiration: inspirationValue,
          createdAt: now, // This will be overwritten if pad already exists
          updatedAt: now,
        };

        // Check if pad already exists to preserve createdAt
        const existing = window.localStorage.getItem(PAD_PREFIX + padId);
        if (existing) {
          try {
            const existingPad = JSON.parse(existing) as SavedPad;
            padData.createdAt = existingPad.createdAt || now;
          } catch {
            // Ignore parsing errors, use new timestamp
          }
        }

        window.localStorage.setItem(
          PAD_PREFIX + padId,
          JSON.stringify(padData)
        );
        setSaveState("saved");
        if (savedBadgeTimerRef.current) {
          window.clearTimeout(savedBadgeTimerRef.current);
        }
        savedBadgeTimerRef.current = window.setTimeout(() => {
          setSaveState("idle");
        }, 1500);
      } catch {
        // ignore
      }
    },
    []
  );

  // Debounced autosave
  useEffect(() => {
    if (!currentPadId) return; // Always save when pad ID exists

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    setSaveState("saving");
    saveTimerRef.current = window.setTimeout(
      () => persist(content, inspiration, currentPadId),
      500
    );
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [content, inspiration, currentPadId, persist]);

  const save = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    if (currentPadId) {
      persist(content, inspiration, currentPadId);
    }
  }, [content, inspiration, currentPadId, persist]);

  const createNewPad = useCallback(() => {
    const newId = generatePadId();
    setCurrentPadId(newId);
    setContent("");
    setInspiration("");
    window.localStorage.setItem(CURRENT_PAD_KEY, newId);
    return newId;
  }, []);

  return {
    content,
    setContent,
    inspiration,
    setInspiration,
    currentPadId,
    saveState,
    save,
    createNewPad,
  };
}
