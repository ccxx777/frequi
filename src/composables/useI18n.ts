import { ref, watch } from 'vue';
import zhCNData from '@/locales/zh-CN.json';

const STORAGE_KEY = 'frequi_locale';
const defaultLocale = localStorage.getItem(STORAGE_KEY) || 'zh-CN';
const currentLocale = ref<string>(defaultLocale);

const translations: Record<string, string> = zhCNData;

export function useI18n() {
  const t = (key: string, defaultVal?: string): string => {
    if (currentLocale.value === 'en') {
      return defaultVal !== undefined ? defaultVal : key;
    }
    return translations[key] || defaultVal || key;
  };

  const setLocale = (locale: string) => {
    currentLocale.value = locale;
    localStorage.setItem(STORAGE_KEY, locale);
    window.dispatchEvent(new CustomEvent('frequi_locale_changed', { detail: locale }));
  };

  return {
    t,
    currentLocale,
    setLocale,
    translations,
  };
}
