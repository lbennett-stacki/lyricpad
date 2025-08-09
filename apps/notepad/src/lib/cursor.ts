export const getContentBeforeCursor = (
  content: string,
  cursorPosition: number
) => {
  const textBeforeCursor = content.slice(0, cursorPosition);
  return textBeforeCursor;
};

export const getContentAfterCursor = (
  content: string,
  cursorPosition: number
) => {
  const textAfterCursor = content.slice(cursorPosition);
  return textAfterCursor;
};
