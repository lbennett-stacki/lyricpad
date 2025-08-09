export function deriveTitle(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const title = firstLine.trim();
  return title || "Untitled";
}

export function derivePreview(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > 140 ? compact.slice(0, 140) + "…" : compact;
}
