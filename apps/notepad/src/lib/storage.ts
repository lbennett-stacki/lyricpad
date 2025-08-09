export const PAD_PREFIX = "lyrics-notepad-pad:";
export const CURRENT_PAD_KEY = "lyrics-notepad-current-pad-id";

export function generatePadId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
