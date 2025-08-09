"use client";

import { useEffect, useRef, useState } from "react";
import { getContentBeforeCursor } from "~/lib/cursor";

interface SuggestionOverlayProps {
  content: string;
  suggestion: string;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

function getCursorPosition(textarea: HTMLTextAreaElement) {
  const cursorPos = textarea.selectionStart;
  const textBeforeCursor = getContentBeforeCursor(textarea.value, cursorPos);

  const tempDiv = document.createElement("div");
  const computedStyle = window.getComputedStyle(textarea);

  tempDiv.style.position = "absolute";
  tempDiv.style.visibility = "hidden";
  tempDiv.style.whiteSpace = "pre-wrap";
  tempDiv.style.wordWrap = "break-word";
  tempDiv.style.fontSize = computedStyle.fontSize;
  tempDiv.style.fontFamily = computedStyle.fontFamily;
  tempDiv.style.lineHeight = computedStyle.lineHeight;
  tempDiv.style.letterSpacing = computedStyle.letterSpacing;
  tempDiv.style.width =
    textarea.clientWidth -
    parseFloat(computedStyle.paddingLeft) -
    parseFloat(computedStyle.paddingRight) +
    "px";

  document.body.appendChild(tempDiv);

  // First, get the vertical position using the full text
  tempDiv.textContent = textBeforeCursor;
  const fullRect = tempDiv.getBoundingClientRect();
  const height = fullRect.height;

  // Now get the horizontal position by measuring just the last line
  const lines = textBeforeCursor.split("\n");
  const lastLine = lines[lines.length - 1];

  // Remove width constraint to get actual text width
  tempDiv.style.width = "auto";
  tempDiv.style.whiteSpace = "nowrap";
  tempDiv.textContent = lastLine + " ";
  const lastLineRect = tempDiv.getBoundingClientRect();
  const left = lastLineRect.width;

  document.body.removeChild(tempDiv);

  return {
    height,
    left,
    lineHeight:
      parseFloat(computedStyle.lineHeight) ||
      parseFloat(computedStyle.fontSize) * 1.2,
  };
}

export function SuggestionOverlay({
  content,
  suggestion,
  isLoading,
  textareaRef,
}: SuggestionOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });

  const contentBeforeCursor = getContentBeforeCursor(
    content,
    textareaRef.current?.selectionStart ?? 0
  );
  const currentLine = contentBeforeCursor.split("\n").pop();
  const isPartial = currentLine !== "";

  useEffect(() => {
    if (!textareaRef.current || !overlayRef.current) return;

    const textarea = textareaRef.current;
    const overlay = overlayRef.current;

    const updatePosition = () => {
      const computedStyle = window.getComputedStyle(textarea);

      overlay.style.position = "absolute";
      overlay.style.left = "0";
      overlay.style.top = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.paddingLeft = computedStyle.paddingLeft;
      overlay.style.paddingRight = computedStyle.paddingRight;
      overlay.style.paddingTop = computedStyle.paddingTop;
      overlay.style.paddingBottom = computedStyle.paddingBottom;
      overlay.style.fontSize = computedStyle.fontSize;
      overlay.style.fontFamily = computedStyle.fontFamily;
      overlay.style.lineHeight = computedStyle.lineHeight;
      overlay.style.letterSpacing = computedStyle.letterSpacing;

      const cursorPos = getCursorPosition(textarea);
      const paddingTop = parseFloat(computedStyle.paddingTop);
      const scrollTop = textarea.scrollTop;

      setCursorPosition({
        top:
          cursorPos.height +
          paddingTop -
          scrollTop -
          (isPartial ? cursorPos.lineHeight : 0),
        left: cursorPos.left,
      });
    };

    updatePosition();

    const handleUpdate = () => updatePosition();

    textarea.addEventListener("scroll", handleUpdate);
    textarea.addEventListener("input", handleUpdate);
    textarea.addEventListener("click", handleUpdate);
    textarea.addEventListener("keyup", handleUpdate);
    window.addEventListener("resize", handleUpdate);

    return () => {
      textarea.removeEventListener("scroll", handleUpdate);
      textarea.removeEventListener("input", handleUpdate);
      textarea.removeEventListener("click", handleUpdate);
      textarea.removeEventListener("keyup", handleUpdate);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [textareaRef, content, suggestion, isPartial]);

  if (!suggestion && !isLoading) return null;

  const formatSuggestion = (suggestion: string) => {
    const startingWhitespace = suggestion.match(/^\s*/)?.[0];
    return (
      startingWhitespace +
      suggestion.trim().replace(new RegExp(`^${currentLine?.trim()}`), "")
    );
  };

  return (
    <div ref={overlayRef} className="pointer-events-none z-5">
      <div
        className="absolute whitespace-pre-wrap break-words"
        style={{
          top: `${cursorPosition.top}px`,
          left: `${cursorPosition.left}px`,
          right: "0",
          wordWrap: "break-word",
        }}
      >
        {isLoading && content ? (
          <span className="text-foreground/40 animate-pulse">Thinking...</span>
        ) : (
          suggestion && (
            <span className="text-foreground/40">
              {formatSuggestion(suggestion)}
              <span className="text-xs ml-2 bg-foreground/10 px-2 py-0.5 rounded whitespace-nowrap">
                Press Tab to accept
              </span>
            </span>
          )
        )}
      </div>
    </div>
  );
}
