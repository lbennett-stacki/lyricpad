"use client";

import { useEffect, useRef, useState } from "react";
import { countLineSyllables } from "../lib/syllables";

interface LineOverlayProps {
  content: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

interface LineInfo {
  syllables: number;
  top: number;
  height: number;
}

export function LineOverlay({ content, textareaRef }: LineOverlayProps) {
  const [lines, setLines] = useState<LineInfo[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textareaRef.current || !overlayRef.current) return;

    const textarea = textareaRef.current;
    const computedStyle = window.getComputedStyle(textarea);

    const measureElement = document.createElement("div");
    measureElement.style.position = "absolute";
    measureElement.style.visibility = "hidden";
    measureElement.style.whiteSpace = "pre-wrap";
    measureElement.style.wordWrap = "break-word";
    measureElement.style.font = computedStyle.font;
    measureElement.style.fontSize = computedStyle.fontSize;
    measureElement.style.lineHeight = computedStyle.lineHeight;
    measureElement.style.fontFamily = computedStyle.fontFamily;
    measureElement.style.letterSpacing = computedStyle.letterSpacing;
    measureElement.style.width = `${
      textarea.clientWidth -
      parseInt(computedStyle.paddingLeft) -
      parseInt(computedStyle.paddingRight)
    }px`;

    document.body.appendChild(measureElement);

    measureElement.textContent = "M\nM";
    const actualLineHeight = measureElement.offsetHeight / 2;

    const textLines = content.split("\n");
    const lineInfos: LineInfo[] = [];
    let currentTop = 0;

    textLines.forEach((line) => {
      const syllables = countLineSyllables(line);

      measureElement.textContent = line || " ";
      const lineVisualHeight = measureElement.offsetHeight;
      const numberOfVisualLines = Math.round(
        lineVisualHeight / actualLineHeight
      );

      lineInfos.push({
        syllables,
        top: currentTop + (numberOfVisualLines - 1) * actualLineHeight,
        height: actualLineHeight,
      });

      currentTop += lineVisualHeight;
    });

    document.body.removeChild(measureElement);
    setLines(lineInfos);
  }, [content, textareaRef]);

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
    };

    updatePosition();

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    textarea.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      textarea.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [textareaRef]);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none z-10"
      style={{
        overflow: "hidden",
      }}
    >
      {lines.map((line, index) => (
        <div
          key={index}
          className="absolute right-0 flex items-start justify-end pr-2"
          style={{
            top: `${line.top}px`,
            height: `${line.height}px`,
            paddingTop: "2px",
          }}
        >
          {line.syllables > 0 && (
            <span className="text-xs text-foreground/30 tabular-nums bg-background/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
              {line.syllables}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
