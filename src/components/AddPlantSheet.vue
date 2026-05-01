<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="model" class="fixed inset-0 z-[100] flex flex-col justify-end">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" @click="model = false" />

        <!-- Sheet -->
        <div
          class="relative bg-white rounded-t-3xl shadow-2xl max-h-[92dvh] flex flex-col"
          style="padding-bottom: env(safe-area-inset-bottom)"
        >
          <!-- Handle -->
          <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div class="w-10 h-1 rounded-full bg-slate-200" />
          </div>

          <!-- Header -->
          <div class="px-5 pt-2 pb-3 flex-shrink-0">
            <h3 class="text-lg font-bold text-slate-900">
              {{ editId ? t('add.edit_title') : t('add.title') }}
            </h3>
            <div
              v-if="editId && selectedSpecies"
              class="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5"
            >
              <i class="mdi mdi-leaf text-leaf-500 text-sm" />
              <span>{{ selectedSpecies.name }}</span>
              <em class="text-slate-400">· {{ selectedSpecies.scientificName }}</em>
            </div>
          </div>

          <!-- Scrollable form -->
          <div class="px-5 overflow-y-auto flex-1 space-y-4 pb-2">
            <!-- Species combobox (add mode only) -->
            <div v-if="!editId">
              <label class="block text-sm font-medium text-slate-500 mb-1.5">
                {{ t('add.plant_type') }} *
              </label>
              <SpeciesCombobox v-model="form.speciesId" />
              <p v-if="errors.speciesId" class="text-xs text-red-600 mt-2">
                {{ errors.speciesId }}
              </p>
            </div>

            <!-- Nickname -->
            <div>
              <label class="block text-sm font-medium text-slate-500 mb-1.5">
                {{ t('add.nickname') }} *
              </label>
              <input
                v-model="form.nickname"
                type="text"
                :placeholder="t('add.nickname_placeholder')"
                class="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none transition-shadow placeholder-slate-400"
                :class="
                  errors.nickname
                    ? 'bg-red-50 border border-red-300 focus:ring-2 focus:ring-red-300 focus:border-transparent'
                    : 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-leaf-400 focus:border-transparent'
                "
              />
              <p v-if="errors.nickname" class="text-xs text-red-600 mt-2">
                {{ errors.nickname }}
              </p>
            </div>

            <!-- Location -->
            <div>
              <label class="block text-sm font-medium text-slate-500 mb-1.5">
                {{ t('add.location') }}
              </label>
              <input
                v-model="form.location"
                type="text"
                :placeholder="t('add.location_placeholder')"
                class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-leaf-400 focus:border-transparent transition-shadow placeholder-slate-400"
              />
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-slate-500 mb-1.5">
                {{ t('add.notes') }}
              </label>
              <textarea
                v-model="form.notes"
                :placeholder="t('add.notes_placeholder')"
                rows="3"
                class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-leaf-400 focus:border-transparent transition-shadow placeholder-slate-400 resize-none"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 px-5 pt-3 pb-5 flex-shrink-0 border-t border-slate-100">
            <AppButton variant="outline" color="leaf" size="md" full-width @click="model = false">
              {{ t('add.cancel') }}
            </AppButton>
            <AppButton
              variant="primary"
              color="emerald"
              size="md"
              full-width
              :disabled="(!editId && !form.speciesId) || !form.nickname.trim()"
              @click="submit"
            >
              {{ editId ? t('add.edit_submit') : t('add.submit') }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCatalogStore } from '../stores/catalog'
import { usePlantsStore } from '../stores/plants'
import AppButton from './AppButton.vue'
import SpeciesCombobox from './SpeciesCombobox.vue'

const props = defineProps<{
  modelValue: boolean
  editId?: string
  speciesId?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const { t } = useI18n()
const store = usePlantsStore()
const catalogStore = useCatalogStore()

const form = reactive({ speciesId: '', nickname: '', location: '', notes: '' })
const errors = reactive<Record<string, string>>({})

const editPlant = computed(() => (props.editId ? store.getPlantById(props.editId) : undefined))
const selectedSpecies = computed(() => catalogStore.getById(form.speciesId) ?? null)

// Reset form whenever the sheet opens
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    errors.speciesId = ''
    errors.nickname = ''
    if (props.editId && editPlant.value) {
      form.speciesId = editPlant.value.speciesId
      form.nickname = editPlant.value.nickname
      form.location = editPlant.value.location ?? ''
      form.notes = editPlant.value.notes ?? ''
    } else {
      form.speciesId = props.speciesId ?? ''
      form.nickname = ''
      form.location = ''
      form.notes = ''
    }
  },
)

function validate(): boolean {
  errors.nickname = form.nickname.trim() ? '' : t('add.error_nickname')
  if (!props.editId) errors.speciesId = form.speciesId ? '' : t('add.error_species')
  return !errors.nickname && !errors.speciesId
}

async function submit() {
  if (!validate()) return
  if (props.editId) {
    await store.updatePlant(props.editId, {
      nickname: form.nickname.trim(),
      location: form.location.trim(),
      notes: form.notes.trim() || undefined,
    })
  } else {
    await store.addPlant({
      speciesId: form.speciesId,
      nickname: form.nickname.trim(),
      location: form.location.trim(),
      notes: form.notes.trim() || undefined,
    })
  }
  model.value = false
}
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}
.sheet-enter-active .relative,
.sheet-leave-active .relative {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .relative,
.sheet-leave-to .relative {
  transform: translateY(100%);
}
</style>
