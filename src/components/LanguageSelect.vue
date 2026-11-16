<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';

withDefaults(defineProps<{ showText?: boolean }>(), { showText: false });

const { currentLocale, setLocale } = useI18n();

function toggleLanguage() {
  setLocale(currentLocale.value === 'zh-CN' ? 'en' : 'zh-CN');
}
</script>

<template>
  <UButton
    variant="link"
    :title="currentLocale === 'zh-CN' ? '当前：中文 (点击切换为 English)' : 'Current: English (Click to switch to Chinese)'"
    color="neutral"
    :label="showText ? (currentLocale === 'zh-CN' ? 'English' : '简体中文') : (currentLocale === 'zh-CN' ? '中' : 'EN')"
    @click="toggleLanguage"
    icon="i-mdi-translate"
  />
</template>
