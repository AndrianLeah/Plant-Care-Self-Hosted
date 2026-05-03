<template>
  <div class="min-h-screen font-sans">
    <router-view v-slot="{ Component, route: r }">
      <transition :name="transitionName">
        <div :key="r.path" :class="['min-h-screen', showNav ? 'pb-24' : '']">
          <component :is="Component" />
        </div>
      </transition>
    </router-view>

    <BottomNav v-if="showNav" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import { useAppTheme } from './composables/useAppTheme'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const router = useRouter()

useAppTheme()

const transitionName = ref('')

router.beforeEach((to, from) => {
  if (to.meta.overlay) {
    transitionName.value = 'slide-up'
  } else if (from.meta.overlay) {
    transitionName.value = 'slide-down'
  } else {
    const toIndex = (to.meta.tabIndex as number) ?? -1
    const fromIndex = (from.meta.tabIndex as number) ?? -1
    transitionName.value = toIndex >= fromIndex ? 'slide-left' : 'slide-right'
  }
})

const authStore = useAuthStore()

const showNav = computed(() => authStore.isLoggedIn && !route.meta.overlay)
</script>
