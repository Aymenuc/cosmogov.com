/** Languages the translation helper offers. Shared by the server and the pages. */
export const HELPER_LANGUAGES = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ro: 'Romanian',
  uk: 'Ukrainian',
  tr: 'Turkish',
  ar: 'Arabic',
  hi: 'Hindi',
  zh: 'Chinese',
} as const;

export type HelperLanguage = keyof typeof HELPER_LANGUAGES;

export const HELPER_TYPES = [
  'summarizer',
  'consensus',
  'facilitator',
  'moderator',
  'accessibility',
  'translator',
] as const;

export type HelperType = (typeof HELPER_TYPES)[number];
