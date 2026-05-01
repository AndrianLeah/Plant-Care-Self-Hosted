<template>
  <!-- Decorative header -->
  <header class="relative px-6 pt-10 pb-20 overflow-hidden">
    <div
      class="absolute inset-0 bg-gradient-to-b from-white/50 via-white/20 to-transparent pointer-events-none"
    />
    <h1 class="text-4xl font-bold text-slate-900 relative">{{ t('settings.title') }}</h1>
    <p class="text-sm font-medium text-slate-500 mt-1 relative">{{ t('settings.subtitle') }}</p>
  </header>

  <main class="px-5 pt-2 space-y-4 -mt-12">
    <!-- Account -->
    <section class="card-glass rounded-2xl overflow-hidden">
      <div class="px-4 pt-3 pb-2">
        <p class="text-xs font-semibold text-slate-500">{{ t('settings.section_account') }}</p>
      </div>
      <div>
        <!-- Identity row -->
        <div class="px-4 py-3 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-base font-bold text-slate-800 truncate capitalize">
              {{ authStore.user?.name || t('settings.account_no_name') }}
            </p>
            <p class="text-xs text-slate-500 truncate">{{ authStore.user?.email }}</p>
          </div>
          <AppButton variant="glass" color="pink" size="sm" @click="handleLogout">
            <i class="mdi mdi-logout text-sm" />
            {{ t('settings.logout_btn') }}
          </AppButton>
        </div>

        <!-- Change credentials row -->
        <div>
          <button
            class="w-full px-4 py-3 flex items-center justify-between text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            @click="credOpen = !credOpen"
          >
            <span class="flex items-center gap-2">
              <i class="mdi mdi-lock-outline text-slate-400" />
              {{ t('settings.change_credentials') }}
            </span>
            <i
              class="mdi text-slate-400 transition-transform"
              :class="credOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            />
          </button>

          <Transition
            @before-enter="
              (el: Element) => {
                ;(el as HTMLElement).style.height = '0'
                ;(el as HTMLElement).style.overflow = 'hidden'
              }
            "
            @enter="
              (el: Element) => {
                const h = el as HTMLElement
                h.style.transition = 'height 0.25s ease'
                h.style.height = h.scrollHeight + 'px'
              }
            "
            @after-enter="
              (el: Element) => {
                ;(el as HTMLElement).style.height = ''
                ;(el as HTMLElement).style.overflow = ''
              }
            "
            @before-leave="
              (el: Element) => {
                const h = el as HTMLElement
                h.style.height = h.scrollHeight + 'px'
                h.style.overflow = 'hidden'
              }
            "
            @leave="
              (el: Element) => {
                const h = el as HTMLElement
                h.style.transition = 'height 0.25s ease'
                h.style.height = '0'
              }
            "
          >
            <div v-if="credOpen" class="px-4 pb-4 space-y-3">
              <p class="text-xs text-slate-400 pt-3">{{ t('settings.credentials_hint') }}</p>

              <!-- Current password (always required) -->
              <div>
                <label class="text-xs font-medium text-slate-500 block mb-1">
                  {{ t('settings.current_password') }}
                </label>
                <input
                  v-model="credForm.currentPassword"
                  type="password"
                  :placeholder="t('settings.password_placeholder')"
                  class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-shadow"
                  autocomplete="current-password"
                />
              </div>

              <!-- New email -->
              <div>
                <label class="text-xs font-medium text-slate-500 block mb-1">
                  {{ t('settings.new_email') }}
                </label>
                <input
                  v-model="credForm.newEmail"
                  type="email"
                  :placeholder="authStore.user?.email"
                  class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-shadow"
                  autocomplete="email"
                />
                <p class="text-xs text-slate-400 mt-1">{{ t('settings.new_email_hint') }}</p>
              </div>

              <!-- New password -->
              <div>
                <label class="text-xs font-medium text-slate-500 block mb-1">
                  {{ t('settings.new_password') }}
                </label>
                <input
                  v-model="credForm.newPassword"
                  type="password"
                  :placeholder="t('settings.new_password_placeholder')"
                  class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-shadow"
                  autocomplete="new-password"
                />
                <p class="text-xs text-slate-400 mt-1">{{ t('settings.new_password_hint') }}</p>
              </div>

              <!-- Feedback -->
              <Transition name="fade">
                <p
                  v-if="credMessage"
                  class="text-xs flex items-center gap-1.5 font-medium"
                  :class="credError ? 'text-red-500' : 'text-emerald-600'"
                >
                  <i
                    class="mdi"
                    :class="credError ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline'"
                  />
                  {{ credMessage }}
                </p>
              </Transition>

              <AppButton
                variant="glass"
                color="pink"
                size="sm"
                :disabled="!canSaveCred || credSaving"
                @click="saveCredentials"
              >
                <i v-if="credSaving" class="mdi mdi-loading mdi-spin text-sm" />
                {{ t('settings.save_credentials') }}
              </AppButton>
            </div>
          </Transition>
        </div>
      </div>
    </section>

    <!-- Language -->
    <section class="card-glass rounded-2xl overflow-hidden">
      <div class="px-4 pt-3 pb-2">
        <p class="text-xs font-semibold text-slate-500">
          {{ t('settings.section_general') }}
        </p>
      </div>
      <div class="px-4 py-4">
        <p class="text-sm font-semibold text-slate-700 mb-3">
          <i class="mdi mdi-translate mr-2 text-slate-400" />
          {{ t('settings.language') }}
        </p>
        <div class="flex gap-2">
          <AppButton
            v-for="lang in LANGUAGES"
            :key="lang.code"
            variant="custom"
            class="flex-1 py-3 text-sm font-semibold border-2 gap-2"
            :class="
              locale === lang.code
                ? 'border-pink-400 bg-pink-50 text-pink-900'
                : 'border-slate-200 bg-white/60 text-slate-500 hover:border-pink-200'
            "
            @click="setLocale(lang.code)"
          >
            <i class="mdi mdi-check text-pink-500" v-if="locale === lang.code" />
            {{ lang.label }}
          </AppButton>
        </div>
      </div>
    </section>

    <!-- Data: export / import -->
    <section class="card-glass rounded-2xl overflow-hidden">
      <div class="px-4 pt-3 pb-2">
        <p class="text-xs font-semibold text-slate-500">
          {{ t('settings.section_data') }}
        </p>
      </div>
      <div>
        <!-- Export -->
        <div class="px-4 py-4 flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-700">
              <i class="mdi mdi-download-outline mr-1.5 text-slate-400" />
              {{ t('settings.export_title') }}
            </p>
            <p class="text-xs text-slate-500 mt-0.5">{{ t('settings.export_desc') }}</p>
          </div>
          <AppButton variant="glass" color="pink" size="sm" @click="plantsStore.exportPlants()">
            <i class="mdi mdi-download text-sm" />
            {{ t('settings.export_btn') }}
          </AppButton>
        </div>
        <!-- Import -->
        <div class="px-4 py-4 flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-700">
              <i class="mdi mdi-upload-outline mr-1.5 text-slate-400" />
              {{ t('settings.import_title') }}
            </p>
            <p class="text-xs text-slate-500 mt-0.5">{{ t('settings.import_desc') }}</p>
          </div>
          <AppButton variant="glass" color="pink" size="sm" @click="triggerImport">
            <i class="mdi mdi-upload text-sm" />
            {{ t('settings.import_btn') }}
          </AppButton>
          <input
            ref="fileInput"
            type="file"
            accept=".json,application/json"
            class="hidden"
            @change="handleImport"
          />
        </div>
        <!-- Feedback message -->
        <Transition name="fade">
          <div
            v-if="importMessage"
            class="px-4 py-3 flex items-center gap-2 text-xs font-medium"
            :class="importError ? 'text-red-500' : 'text-emerald-600'"
          >
            <i
              class="mdi text-sm"
              :class="importError ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline'"
            />
            {{ importMessage }}
          </div>
        </Transition>
      </div>
    </section>

    <!-- About -->
    <section class="card-glass rounded-2xl overflow-hidden">
      <div class="px-4 pt-3 pb-2">
        <p class="text-xs font-semibold text-slate-500">
          {{ t('settings.section_about') }}
        </p>
      </div>
      <div>
        <div class="px-4 py-3 flex items-center justify-between">
          <span class="text-sm text-slate-700">{{ t('settings.app_name') }}</span>
          <span class="text-sm font-semibold text-slate-900">Plant Care Self-Hosted</span>
        </div>
        <div class="px-4 py-3 flex items-center justify-between">
          <span class="text-sm text-slate-700">{{ t('settings.version') }}</span>
          <span class="text-sm font-semibold text-slate-500">{{ pkg.version }}</span>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import pkg from '../../package.json'
import AppButton from '../components/AppButton.vue'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth'
import { usePlantsStore } from '../stores/plants'

const { t, locale } = useI18n()
const plantsStore = usePlantsStore()
const authStore = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

// ── Credentials change ───────────────────────────────────────────────────────

const credOpen = ref(false)
const credSaving = ref(false)
const credMessage = ref('')
const credError = ref(false)
let credTimer: ReturnType<typeof setTimeout> | null = null

const credForm = reactive({ currentPassword: '', newEmail: '', newPassword: '' })

const canSaveCred = computed(() => {
  if (!credForm.currentPassword) return false
  const hasNewEmail = credForm.newEmail.trim().length > 0
  const hasNewPassword = credForm.newPassword.length > 0
  if (!hasNewEmail && !hasNewPassword) return false
  if (hasNewPassword && credForm.newPassword.length < 8) return false
  return true
})

async function saveCredentials() {
  credSaving.value = true
  credMessage.value = ''
  try {
    const body: Record<string, string> = { currentPassword: credForm.currentPassword }
    if (credForm.newEmail.trim()) body.newEmail = credForm.newEmail.trim()
    if (credForm.newPassword) body.newPassword = credForm.newPassword
    const updated = await api.patch<{ email: string; name: string }>('/user/me/credentials', body)
    // Update auth store email if changed
    if (authStore.user && body.newEmail) authStore.user.email = updated.email
    credForm.currentPassword = ''
    credForm.newEmail = ''
    credForm.newPassword = ''
    showCredMessage(t('settings.credentials_saved'), false)
  } catch (e) {
    showCredMessage(e instanceof Error ? e.message : t('settings.credentials_error'), true)
  } finally {
    credSaving.value = false
  }
}

function showCredMessage(msg: string, isError: boolean) {
  credMessage.value = msg
  credError.value = isError
  if (credTimer) clearTimeout(credTimer)
  credTimer = setTimeout(() => {
    credMessage.value = ''
  }, 4000)
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
]

function setLocale(code: string) {
  locale.value = code
  dayjs.locale(code)
  localStorage.setItem('locale', code)
  api.patch('/user/me', { lang: code }).catch(() => {})
}

// ── Import / Export ─────────────────────────────────────────────────────────

const fileInput = ref<HTMLInputElement | null>(null)
const importMessage = ref('')
const importError = ref(false)
let messageTimer: ReturnType<typeof setTimeout> | null = null

function triggerImport() {
  fileInput.value?.click()
}

function handleImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return // Reset input so same file can be re-selected
  ;(event.target as HTMLInputElement).value = ''

  if (!confirm(t('settings.import_confirm'))) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const count = await plantsStore.importPlants(e.target?.result as string)
      showMessage(t('settings.import_success', { count }), false)
    } catch {
      showMessage(t('settings.import_error'), true)
    }
  }
  reader.readAsText(file)
}

function showMessage(msg: string, isError: boolean) {
  importMessage.value = msg
  importError.value = isError
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    importMessage.value = ''
  }, 4000)
}
</script>
