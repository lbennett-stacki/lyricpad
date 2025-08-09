export type SavedPad = {
  id: string;
  createdAt: string;
  updatedAt: string;
  content: string;
  inspiration?: string;
};

export type SaveState = "idle" | "saving" | "saved";
