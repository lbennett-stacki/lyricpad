"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStoredPad } from "../hooks/useStoredPad";
import { useTextareaAutosize } from "../hooks/useTextareaAutosize";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { LineOverlay } from "../components/LineOverlay";
import { SuggestionOverlay } from "../components/SuggestionOverlay";
import { InspirationModal } from "../components/InspirationModal";
import { computeWordCount } from "~/lib/word-count";
import { getContentAfterCursor, getContentBeforeCursor } from "~/lib/cursor";

export default function Home() {
  const router = useRouter();
  const {
    content,
    setContent,
    inspiration,
    setInspiration,
    saveState,
    save,
    createNewPad,
  } = useStoredPad();
  const { textareaRef } = useTextareaAutosize(content);
  const [suggestion, setSuggestion] = useState<string>("");
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [isLoadingInspiration, setIsLoadingInspiration] = useState(false);
  const [isInspirationModalOpen, setIsInspirationModalOpen] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useKeyboardShortcuts(save);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const wordCount = useMemo(() => computeWordCount(content), [content]);

  const fetchSuggestion = useCallback(
    async (contentBeforeCursor: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoadingSuggestion(true);
      try {
        const response = await fetch("/api/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: contentBeforeCursor,
            inspiration,
          }),
          signal: abortController.signal,
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestion(data.suggestion);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Failed to fetch suggestion:", error);
        }
      } finally {
        if (abortControllerRef.current === abortController) {
          setIsLoadingSuggestion(false);
          abortControllerRef.current = null;
        }
      }
    },
    [inspiration]
  );

  const fetchInspirationContext = useCallback(
    async (inspirationText: string) => {
      setIsLoadingInspiration(true);
      try {
        const response = await fetch("/api/inspiration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inspiration: inspirationText,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.suggestion; // This contains the enhanced inspiration with lyrics
        } else {
          console.error("Failed to fetch inspiration context");
          return inspirationText; // Return original inspiration if API fails
        }
      } catch (error) {
        console.error("Error fetching inspiration context:", error);
        return inspirationText; // Return original inspiration if API fails
      } finally {
        setIsLoadingInspiration(false);
      }
    },
    []
  );

  const acceptSuggestion = useCallback(() => {
    if (!suggestion) {
      return;
    }

    let newSuggestion = suggestion;

    const textBeforeCursor = getContentBeforeCursor(
      content,
      textareaRef.current?.selectionStart ?? 0
    );

    const lastLine = textBeforeCursor.split("\n").pop();
    const isPartial = lastLine !== "";

    if (isPartial) {
      newSuggestion = newSuggestion
        .trim()
        .replace(new RegExp(`^${lastLine?.trim()}`), "");
    }

    const textAfterCursor = getContentAfterCursor(
      content,
      textareaRef.current?.selectionStart ?? 0
    );

    const newContent =
      (isPartial ? textBeforeCursor.trim() : textBeforeCursor) +
      newSuggestion +
      textAfterCursor;
    setContent(newContent);
    setSuggestion("");
  }, [content, suggestion, setContent, textareaRef]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const contentBeforeCursor = getContentBeforeCursor(
          content + (content.endsWith("\n") ? "" : "\n"),
          textareaRef.current?.selectionStart
            ? textareaRef.current.selectionStart + 1
            : 0
        );
        fetchSuggestion(contentBeforeCursor);
        return;
      }

      if (e.key === "i" && e.metaKey) {
        e.preventDefault();
        const contentBeforeCursor = getContentBeforeCursor(
          content,
          textareaRef.current?.selectionStart ?? 0
        );
        fetchSuggestion(contentBeforeCursor);
        return;
      }

      if (e.key === "Tab" && suggestion) {
        e.preventDefault();
        acceptSuggestion();
        return;
      }

      if (e.key === "Escape" && suggestion) {
        e.preventDefault();
        setSuggestion("");
        return;
      }
    },
    [content, fetchSuggestion, suggestion, acceptSuggestion, textareaRef]
  );

  const handleNewPad = useCallback(() => {
    createNewPad();
    setSuggestion("");
    router.push("/");
  }, [createNewPad, router]);

  const handleViewHistory = useCallback(() => {
    router.push("/history");
  }, [router]);

  const handleNewInspiration = useCallback(() => {
    setIsInspirationModalOpen(true);
  }, []);

  const handleInspirationSave = useCallback(
    async (newInspiration: string) => {
      if (newInspiration.trim()) {
        const enhancedInspiration = await fetchInspirationContext(
          newInspiration
        );
        setInspiration(newInspiration + "\n\n" + enhancedInspiration);
      }
    },
    [setInspiration, fetchInspirationContext]
  );

  useEffect(() => {
    if (!content && !suggestion && inspiration) {
      fetchSuggestion("");
    }
  }, [content, suggestion, fetchSuggestion, inspiration]);

  useEffect(() => {
    if (inspiration) {
      setSuggestion("");
    }
  }, [inspiration, fetchSuggestion]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="flex items-center justify-end gap-2 z-10 p-4">
        <button
          onClick={handleViewHistory}
          className="rounded-full border border-foreground/[0.08] bg-background/70 px-3 py-1.5 text-xs text-foreground/80 shadow-sm backdrop-blur hover:bg-foreground/5"
        >
          History
        </button>
        <button
          onClick={handleNewPad}
          className="rounded-full border border-foreground/[0.08] bg-background/70 px-3 py-1.5 text-xs text-foreground/80 shadow-sm backdrop-blur hover:bg-foreground/5"
        >
          New Pad
        </button>
        <button
          onClick={handleNewInspiration}
          className="rounded-full border border-foreground/[0.08] bg-background/70 px-3 py-1.5 text-xs text-foreground/80 shadow-sm backdrop-blur hover:bg-foreground/5"
        >
          New Inspiration
        </button>
      </div>

      <main className="mx-auto w-full max-w-3xl  relative">
        <textarea
          ref={textareaRef}
          aria-label="Lyrics notepad"
          spellCheck={false}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setHasFocus(true)}
          onBlur={() => setHasFocus(false)}
          placeholder={
            !hasFocus || content || !suggestion
              ? "Start writing your lyrics…"
              : ""
          }
          className="block w-full resize-none bg-transparent outline-none border-0 placeholder:opacity-40 caret-foreground text-[16px] sm:text-[18px] leading-relaxed tracking-[-0.005em] selection:bg-foreground/10"
        />
        <LineOverlay content={content} textareaRef={textareaRef} />
        {hasFocus && (
          <SuggestionOverlay
            content={content}
            suggestion={suggestion}
            isLoading={isLoadingSuggestion}
            textareaRef={textareaRef}
          />
        )}
      </main>

      <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full border border-foreground/[0.08] bg-background/70 px-3 py-1.5 text-xs text-foreground/70 shadow-sm backdrop-blur">
        <span className="inline-flex items-center gap-1">
          {saveState === "saving" ? (
            <>
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/40" />
              Saving…
            </>
          ) : (
            <>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground/30" />
              Saved
            </>
          )}
        </span>
        <span className="mx-1 h-3 w-px bg-foreground/10" />
        <span className="tabular-nums">{wordCount} words</span>
        <span className="mx-1 h-3 w-px bg-foreground/10" />
        <span className="opacity-70">
          {suggestion ? "Tab to accept • " : ""}
          {isLoadingSuggestion ? "Loading… • " : "Enter for AI • "}
          Cmd/Ctrl+S
        </span>
      </div>

      <InspirationModal
        isOpen={isInspirationModalOpen}
        onClose={() => setIsInspirationModalOpen(false)}
        onSave={handleInspirationSave}
        currentInspiration={inspiration}
        isLoading={isLoadingInspiration}
      />
    </div>
  );
}
