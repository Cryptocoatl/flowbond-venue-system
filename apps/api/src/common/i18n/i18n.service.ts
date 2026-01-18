import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SupportedLanguage, getLanguageOrDefault } from '../../config/i18n.config';

type TranslationParams = Record<string, string | number>;

interface Translations {
  [key: string]: string | Translations;
}

@Injectable()
export class I18nService {
  private translations: Map<SupportedLanguage, Translations> = new Map();

  constructor() {
    this.loadTranslations();
  }

  private loadTranslations() {
    const languages: SupportedLanguage[] = ['en', 'es', 'fr'];
    const localesPath = join(__dirname, '..', '..', 'locales');

    for (const lang of languages) {
      try {
        const filePath = join(localesPath, `${lang}.json`);
        const content = readFileSync(filePath, 'utf-8');
        this.translations.set(lang, JSON.parse(content));
      } catch (error) {
        console.warn(`Failed to load translations for ${lang}:`, error);
        this.translations.set(lang, {});
      }
    }
  }

  translate(key: string, language?: string, params?: TranslationParams): string {
    const lang = getLanguageOrDefault(language);
    const translation = this.getNestedValue(this.translations.get(lang) || {}, key);

    if (!translation) {
      // Fallback to English
      const fallback = this.getNestedValue(this.translations.get('en') || {}, key);
      return fallback ? this.interpolate(fallback, params) : key;
    }

    return this.interpolate(translation, params);
  }

  private getNestedValue(obj: Translations, path: string): string | undefined {
    const keys = path.split('.');
    let current: string | Translations | undefined = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  }

  private interpolate(template: string, params?: TranslationParams): string {
    if (!params) return template;

    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return params[key]?.toString() || `{{${key}}}`;
    });
  }

  t(key: string, language?: string, params?: TranslationParams): string {
    return this.translate(key, language, params);
  }
}
