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
    :title="currentLocale === 'zh-CN' ? '切换语言 (Switch to English)' : 'Switch Language (切换为中文)'"
    color="neutral"
    :label="showText ? (currentLocale === 'zh-CN' ? 'English' : '简体中文') : (currentLocale === 'zh-CN' ? '中' : 'EN')"
    @click="toggleLanguage"
    icon="i-mdi-translate"
  />
</template>
