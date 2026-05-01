<template>
  <!-- Floating pill nav: sits above safe area -->
  <div class="fixed bottom-0 inset-x-0 z-50 flex justify-center pb-safe px-4">
    <nav
      class="flex items-center gap-1 bg-white/70 backdrop-blur-2xl rounded-full px-2 py-2 mb-5 shadow-[0_8px_32px_rgba(0,0,0,0.10)] ring-1 ring-white/60"
    >
      <button
        v-for="item in navItems"
        :key="item.to"
        class="flex flex-row items-center justify-center gap-1.5 px-4 py-2 rounded-full transition-all duration-200 text-[11px] font-semibold"
        :class="
          route.path === item.to
            ? [item.activeClass, 'shadow-sm']
            : 'text-slate-500 hover:text-slate-600 hover:bg-slate-100'
        "
        @click="router.push(item.to)"
      >
        <i :class="`mdi ${item.icon} text-[18px]`" />
        <span
          class="whitespace-nowrap overflow-hidden transition-opacity duration-150"
          :class="route.path === item.to ? 'opacity-100' : 'w-0 opacity-0 sm:w-auto sm:opacity-100'"
        >
          {{ item.label }}
        </span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const navItems = computed(() => [
  {
    to: '/',
    icon: 'mdi-sprout',
    label: t('nav.plants'),
    activeClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    to: '/catalog',
    icon: 'mdi-book-open-variant',
    label: t('nav.catalog'),
    activeClass: 'bg-teal-100 text-teal-700',
  },
  {
    to: '/water-guide',
    icon: 'mdi-water-outline',
    label: t('nav.water'),
    activeClass: 'bg-sky-100 text-sky-700',
  },
  {
    to: '/settings',
    icon: 'mdi-cog-outline',
    label: t('nav.settings'),
    activeClass: 'bg-pink-100 text-pink-700',
  },
])
</script>
