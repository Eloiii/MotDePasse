import { createRequire } from 'node:module'

/** Lowercase, strip accents and surrounding spaces so "Éléphant " matches "elephant". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .trim()
    .replace(/\s+/g, ' ')
}

// ~336,000 French words including plurals and conjugations (MIT, npm "an-array-of-french-words").
// Stored normalized, so accents are optional when typing.
const words: string[] = createRequire(import.meta.url)('an-array-of-french-words')
const dictionary = new Set(words.map(normalize))

/** True if every word of `text` (split on spaces) is a known French word. */
export function isFrenchWord(text: string): boolean {
  const parts = normalize(text).split(' ')
  return parts.every((part) => part !== '' && dictionary.has(part))
}
