"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStoredPadList } from "../../hooks/useStoredPadList";
import type { SavedPad } from "../../types";
import { derivePreview, deriveTitle } from "./utils";
import { computeWordCount } from "~/lib/word-count";

export default function HistoryPage() {
  const router = useRouter();
  const { pads, loading, error, deletePad, openPad } = useStoredPadList();

  const handleOpen = useCallback(
    (pad: SavedPad) => {
      openPad(pad.id);
      router.push(`/?pad=${pad.id}`);
    },
    [router, openPad]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deletePad(id);
    },
    [deletePad]
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto w-full max-w-3xl px-6 sm:px-10 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-lg sm:text-xl font-medium tracking-tight">
            History
          </h1>
          <button
            onClick={() => router.push("/")}
            className="rounded-full border border-foreground/[0.08] bg-background/70 px-3 py-1.5 text-sm text-foreground/80 shadow-sm backdrop-blur hover:bg-foreground/5"
          >
            Back to Editor
          </button>
        </div>

        {loading ? (
          <div className="text-foreground/60 text-sm">Loading…</div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : pads.length === 0 ? (
          <div className="text-foreground/60 text-sm">No saved pads yet.</div>
        ) : (
          <ul className="space-y-3">
            {pads.map((pad) => {
              const title = deriveTitle(pad.content);
              const preview = derivePreview(pad.content);
              const words = computeWordCount(pad.content);
              const updated = new Date(pad.updatedAt);
              const updatedLabel = isNaN(updated.getTime())
                ? pad.updatedAt
                : updated.toLocaleString();
              return (
                <li
                  key={pad.id}
                  className="group rounded-lg border border-foreground/[0.08] bg-background/60 p-4 shadow-sm backdrop-blur"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium tracking-tight">
                        {title}
                      </div>
                      <div className="mt-1 truncate text-xs text-foreground/70">
                        {preview || "(empty)"}
                      </div>
                      {pad.inspiration && (
                        <div className="mt-1 truncate text-xs text-foreground/50 italic">
                          Inspiration: {pad.inspiration}
                        </div>
                      )}
                      <div className="mt-2 text-[11px] text-foreground/50">
                        {words} words • Updated {updatedLabel}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 opacity-90">
                      <button
                        className="rounded-full border border-foreground/[0.08] px-3 py-1 text-xs hover:bg-foreground/5"
                        onClick={() => handleOpen(pad)}
                        aria-label="Open pad in editor"
                      >
                        Open
                      </button>
                      <button
                        className="rounded-full border border-foreground/[0.08] px-3 py-1 text-xs text-red-500 hover:bg-red-500/5"
                        onClick={() => handleDelete(pad.id)}
                        aria-label="Delete pad"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
