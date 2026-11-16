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

    // Build lowercase dictionary for case-insensitive fallback matching
    const lowerTranslations = new Map<string, string>();
    for (const [k, v] of Object.entries(translations)) {
      lowerTranslations.set(k.toLowerCase(), v);
    }

    function lookup(text: string): string | undefined {
      if (!text) return undefined;
      const trimmed = text.trim();
      if (!trimmed) return undefined;
      return translations[trimmed] || lowerTranslations.get(trimmed.toLowerCase());
    }

    const processedNodes = new WeakSet<Node>();
    const originalTextMap = new WeakMap<Node, string>();
    const originalAttrMap = new WeakMap<Element, Record<string, string>>();

    function translateTextNode(node: Node) {
      if (node.nodeType !== Node.TEXT_NODE) return;
      if (processedNodes.has(node) && currentLocale.value === 'zh-CN') return;

      const text = node.nodeValue;
      if (!text) return;

      const trimmed = text.trim();
      if (!trimmed || trimmed.length < 2) return;

      if (currentLocale.value === 'zh-CN') {
        const translated = lookup(trimmed);
        if (translated && trimmed !== translated) {
          if (!originalTextMap.has(node)) {
            originalTextMap.set(node, text);
          }
          const leading = text.match(/^\s*/)?.[0] || '';
          const trailing = text.match(/\s*$/)?.[0] || '';
          node.nodeValue = leading + translated + trailing;
          processedNodes.add(node);
        }
      } else if (currentLocale.value === 'en') {
        if (originalTextMap.has(node)) {
          node.nodeValue = originalTextMap.get(node)!;
          processedNodes.delete(node);
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
          const translated = lookup(trimmed);
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

    function processSubtree(root: Node) {
      if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root);
        return;
      }
      if (root.nodeType === Node.ELEMENT_NODE) {
        const el = root as Element;
        const tag = el.tagName.toLowerCase();
        // Skip code, script, style, svg, canvas
        if (['script', 'style', 'svg', 'canvas', 'code', 'pre'].includes(tag)) return;

        translateAttributes(el);

        for (let i = 0; i < el.childNodes.length; i++) {
          processSubtree(el.childNodes[i]);
        }
      }
    }

    let observer: MutationObserver | null = null;
    let pendingNodes: Node[] = [];
    let rafId: number | null = null;

    function flushPending() {
      rafId = null;
      if (pendingNodes.length === 0) return;

      const nodesToProcess = pendingNodes;
      pendingNodes = [];

      // Temporarily disconnect observer to avoid self-triggering
      if (observer) observer.disconnect();

      try {
        for (const node of nodesToProcess) {
          processSubtree(node);
        }
      } finally {
        if (observer) {
          observer.observe(document.body, { childList: true, subtree: true });
        }
      }
    }

    function queueNode(node: Node) {
      pendingNodes.push(node);
      if (rafId === null) {
        rafId = window.requestAnimationFrame(flushPending);
      }
    }

    function startObserver() {
      if (observer) observer.disconnect();

      observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'childList') {
            for (let i = 0; i < m.addedNodes.length; i++) {
              queueNode(m.addedNodes[i]);
            }
          }
        }
      });

      // Initial run
      processSubtree(document.body);

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => startObserver(), { once: true });
    } else {
      setTimeout(() => startObserver(), 0);
    }

    window.addEventListener('frequi_locale_changed', () => {
      if (observer) observer.disconnect();
      processSubtree(document.body);
      if (observer) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    });
  },
};
