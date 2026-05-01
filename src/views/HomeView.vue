<template>
  <!-- Empty state: full-screen centered layout -->
  <div
    v-if="store.sortedPlants.length === 0"
    class="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-5"
  >
    <i class="mdi mdi-sprout text-leaf-300" style="font-size: 5rem" />
    <div>
      <h2 class="text-2xl font-bold text-slate-900 mb-2">{{ t('home.empty_title') }}</h2>
      <p class="text-sm text-slate-500 max-w-[220px] mx-auto">{{ t('home.empty_body') }}</p>
    </div>
    <button
      class="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-full shadow-md transition-all active:scale-95"
      @click="showAddSheet = true"
    >
      <i class="mdi mdi-plus text-lg" />
      {{ t('home.add_plant') }}
    </button>
  </div>

  <!-- Normal layout when plants exist -->
  <template v-else>
    <!-- App bar -->
    <header class="relative px-6 pt-10 pb-20 overflow-hidden">
      <div
        class="absolute inset-0 bg-gradient-to-b from-white/50 via-white/20 to-transparent pointer-events-none"
      />
      <p class="text-sm font-medium text-slate-500 mb-1 tracking-wide relative">
        {{ t('home.greeting', { time: t('home.time_' + greeting) }) }}
      </p>
      <h1 class="text-4xl font-extrabold tracking-tight text-slate-900 relative">
        {{ t('home.title') }}
      </h1>
    </header>

    <main class="px-5 pt-2 -mt-12">
      <div
        class="grid gap-3 mb-3"
        style="grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))"
      >
        <PlantCard v-for="plant in store.sortedPlants" :key="plant.id" :plant="plant" />

        <!-- Add plant cell -->
        <button
          class="card-glass rounded-2xl flex flex-col items-center justify-center gap-2 py-10 text-slate-400 hover:text-emerald-600 hover:bg-white/50 transition-all active:scale-[0.98] group border-2 border-dashed border-white/70 hover:border-emerald-300/60 bg-transparent"
          @click="showAddSheet = true"
        >
          <div
            class="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 group-hover:border-emerald-400 flex items-center justify-center transition-colors"
          >
            <i class="mdi mdi-plus text-xl" />
          </div>
          <span class="text-sm font-semibold">{{ t('home.add_plant') }}</span>
        </button>
      </div>
    </main>
  </template>

  <AddPlantSheet v-model="showAddSheet" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AddPlantSheet from '../components/AddPlantSheet.vue'
import PlantCard from '../components/PlantCard.vue'
import { usePlantsStore } from '../stores/plants'

const { t } = useI18n()
const store = usePlantsStore()
const showAddSheet = ref(false)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
})
</script>
