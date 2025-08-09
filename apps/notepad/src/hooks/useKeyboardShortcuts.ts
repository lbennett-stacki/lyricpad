import { useEffect } from "react";

export function useKeyboardShortcuts(onSave: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        onSave();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSave]);
}
