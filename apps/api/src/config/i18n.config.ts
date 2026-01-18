export const i18nConfig = {
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'fr'] as const,
  fallbackLanguage: 'en',
};

export type SupportedLanguage = (typeof i18nConfig.supportedLanguages)[number];

export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return i18nConfig.supportedLanguages.includes(lang as SupportedLanguage);
}

export function getLanguageOrDefault(lang?: string): SupportedLanguage {
  if (lang && isValidLanguage(lang)) {
    return lang;
  }
  return i18nConfig.defaultLanguage;
}
