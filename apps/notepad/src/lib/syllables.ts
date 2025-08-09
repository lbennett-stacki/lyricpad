export function countSyllables(text: string): number {
  const word = text.toLowerCase().replace(/[^a-z]/g, "");

  if (word.length === 0) return 0;
  if (word.length <= 3) return 1;

  let syllables = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const isVowel = /[aeiouy]/.test(char);

    if (isVowel && !previousWasVowel) {
      syllables++;
    }

    previousWasVowel = isVowel;
  }

  if (word.endsWith("e") && syllables > 1) {
    syllables--;
  }

  if (
    word.endsWith("le") &&
    word.length > 2 &&
    !/[aeiouy]/.test(word[word.length - 3])
  ) {
    syllables++;
  }

  return Math.max(syllables, 1);
}

export function countLineSyllables(line: string): number {
  const words = line
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  return words.reduce((total, word) => total + countSyllables(word), 0);
}
