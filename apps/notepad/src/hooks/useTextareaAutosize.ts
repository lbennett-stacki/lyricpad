import { useCallback, useEffect, useRef } from "react";

export function useTextareaAutosize(content: string) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const autoSize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    autoSize();
  }, [content, autoSize]);

  return { textareaRef, autoSize };
}
