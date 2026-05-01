<template>
  <Teleport to="body">
    <Transition name="fade-fast">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        @click.self="$emit('update:modelValue', false)"
      >
        <div class="absolute inset-0 bg-black/50" @click="$emit('update:modelValue', false)" />

        <div class="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div class="px-6 pt-6 pb-2 flex items-start gap-4">
            <div
              class="flex-shrink-0 w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center"
            >
              <i class="mdi mdi-trash-can-outline text-red-400 text-2xl" />
            </div>
            <div>
              <h2 class="text-lg font-extrabold text-slate-900">
                {{ t('detail.delete_title', { name: plantName }) }}
              </h2>
              <p class="text-sm text-slate-500 mt-1">{{ t('detail.delete_body') }}</p>
            </div>
          </div>

          <div class="px-6 pt-4 pb-6 flex gap-3">
            <AppButton
              variant="outline"
              color="slate"
              size="md"
              full-width
              @click="$emit('update:modelValue', false)"
            >
              {{ t('detail.cancel') }}
            </AppButton>
            <AppButton variant="primary" color="red" size="md" full-width @click="$emit('confirm')">
              <i class="mdi mdi-trash-can-outline" />
              {{ t('detail.remove') }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppButton from './AppButton.vue'

defineProps<{ modelValue: boolean; plantName: string }>()
defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm'): void
}>()

const { t } = useI18n()
</script>
