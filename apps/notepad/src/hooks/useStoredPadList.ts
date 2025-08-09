import { useCallback, useEffect, useState } from "react";
import type { SavedPad } from "../types";
import { PAD_PREFIX, CURRENT_PAD_KEY } from "../lib/storage";

export function useStoredPadList() {
  const [pads, setPads] = useState<SavedPad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPads = useCallback(() => {
    try {
      const list: SavedPad[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (!key || !key.startsWith(PAD_PREFIX)) continue;
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw) as SavedPad | string;
          if (typeof parsed === "string") {
            const id = key.slice(PAD_PREFIX.length);
            list.push({
              id,
              content: parsed,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } else if (
            parsed &&
            typeof parsed === "object" &&
            "content" in parsed
          ) {
            list.push({
              ...parsed,
              id: key.slice(PAD_PREFIX.length),
            } as SavedPad);
          }
        } catch {
          const id = key.slice(PAD_PREFIX.length);
          list.push({
            id,
            content: raw,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setPads(list);
      setError(null);
    } catch {
      setError("Unable to read from localStorage.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPads();
  }, [refreshPads]);

  const deletePad = useCallback((id: string) => {
    window.localStorage.removeItem(PAD_PREFIX + id);
    setPads((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const openPad = useCallback((padId: string) => {
    window.localStorage.setItem(CURRENT_PAD_KEY, padId);
  }, []);

  return {
    pads,
    loading,
    error,
    refreshPads,
    deletePad,
    openPad,
  };
}
