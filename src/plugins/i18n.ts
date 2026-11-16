import type { App, Plugin } from 'vue';
import { useI18n } from '@/composables/useI18n';

export const i18nPlugin: Plugin = {
  install(app: App) {
    const { t, currentLocale, translations } = useI18n();

    // Register $t globally for templates
    app.config.globalProperties.$t = t;
    app.provide('i18n', { t, currentLocale });

    if (typeof window === 'undefined') {
      return;
    }

    const originalTextMap = new WeakMap<Node, string>();
    const originalAttrMap = new WeakMap<Element, Record<string, string>>();

    function translateTextNode(node: Node) {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const text = node.nodeValue;
      if (!text) return;

      const trimmed = text.trim();
      if (!trimmed) return;

      if (currentLocale.value === 'zh-CN') {
        const translated = translations[trimmed];
        if (translated && trimmed !== translated) {
          if (!originalTextMap.has(node)) {
            originalTextMap.set(node, text);
          }
          // Preserve leading and trailing whitespaces
          const leading = text.match(/^\s*/)?.[0] || '';
          const trailing = text.match(/\s*$/)?.[0] || '';
          node.nodeValue = leading + translated + trailing;
        }
      } else if (currentLocale.value === 'en') {
        if (originalTextMap.has(node)) {
          node.nodeValue = originalTextMap.get(node)!;
        }
      }
    }

    function translateAttributes(el: Element) {
      const attrs = ['placeholder', 'title', 'aria-label'];
      for (const attr of attrs) {
        const val = el.getAttribute(attr);
        if (!val) continue;

        const trimmed = val.trim();
        if (currentLocale.value === 'zh-CN') {
          const translated = translations[trimmed];
          if (translated && trimmed !== translated) {
            let map = originalAttrMap.get(el);
            if (!map) {
              map = {};
              originalAttrMap.set(el, map);
            }
            if (!(attr in map)) {
              map[attr] = val;
            }
            el.setAttribute(attr, translated);
          }
        } else if (currentLocale.value === 'en') {
          const map = originalAttrMap.get(el);
          if (map && attr in map) {
            el.setAttribute(attr, map[attr]);
          }
        }
      }
    }

    function walkAndTranslate(root: Node) {
      if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root);
        return;
      }

      if (root.nodeType === Node.ELEMENT_NODE) {
        // Skip script and style tags
        const tag = (root as Element).tagName.toLowerCase();
        if (tag === 'script' || tag === 'style') return;

        translateAttributes(root as Element);
      }

      for (let i = 0; i < root.childNodes.length; i++) {
        walkAndTranslate(root.childNodes[i]);
      }
    }

    let observer: MutationObserver | null = null;
    let isProcessing = false;

    function startObserver() {
      if (observer) observer.disconnect();

      observer = new MutationObserver((mutations) => {
        if (isProcessing) return;
        isProcessing = true;

        try {
          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              for (let i = 0; i < mutation.addedNodes.length; i++) {
                walkAndTranslate(mutation.addedNodes[i]);
              }
            } else if (mutation.type === 'characterData') {
              translateTextNode(mutation.target);
            }
          }
        } finally {
          isProcessing = false;
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      // Initial pass
      walkAndTranslate(document.body);
    }

    // Start observer once DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => startObserver(), { once: true });
    } else {
      setTimeout(() => startObserver(), 0);
    }

    window.addEventListener('frequi_locale_changed', () => {
      walkAndTranslate(document.body);
    });
  },
};
