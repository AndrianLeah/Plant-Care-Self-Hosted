<template>
  <header class="relative px-6 pt-8 pb-12 overflow-hidden">
    <div
      class="absolute inset-0 bg-gradient-to-b from-white/60 via-white/25 to-transparent pointer-events-none"
    />
    <div class="relative flex items-center justify-between gap-3">
      <div class="min-w-0">
        <h1 class="text-3xl font-bold text-slate-900">{{ t('db_browser.title') }}</h1>
        <p class="text-sm font-medium text-slate-500 mt-1">
          {{ t('db_browser.subtitle') }}
        </p>
      </div>
      <AppButton variant="glass" color="slate" size="sm" @click="router.push('/settings')">
        <i class="mdi mdi-arrow-left text-sm" />
        {{ t('db_browser.back') }}
      </AppButton>
    </div>
  </header>

  <main class="px-5 pt-2 pb-10 space-y-4 -mt-8">
    <section class="card-glass rounded-2xl overflow-hidden">
      <div class="px-4 pt-3 pb-2">
        <p class="text-xs font-semibold text-slate-500">{{ t('db_browser.access') }}</p>
      </div>
      <div class="px-4 pb-4 space-y-3">
        <label class="text-xs font-medium text-slate-500 block">
          {{ t('db_browser.secret_label') }}
        </label>
        <input
          v-model="adminSecret"
          type="password"
          :placeholder="t('db_browser.secret_placeholder')"
          class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent transition-shadow"
          autocomplete="off"
        />
        <label class="inline-flex items-center gap-2 text-xs text-slate-500 select-none">
          <input
            v-model="rememberSecret"
            type="checkbox"
            class="rounded border-slate-300 text-cyan-500 focus:ring-cyan-300"
          />
          {{ t('db_browser.remember_secret') }}
        </label>
        <div class="flex items-center gap-2">
          <AppButton
            variant="glass"
            color="cyan"
            size="sm"
            :disabled="opening || !adminSecret.trim()"
            @click="openSqliteGui"
          >
            <i v-if="opening" class="mdi mdi-loading mdi-spin text-sm" />
            <i v-else class="mdi mdi-open-in-new text-sm" />
            {{ t('db_browser.open_gui') }}
          </AppButton>
        </div>
      </div>
    </section>

    <Transition name="fade">
      <p
        v-if="errorMessage"
        class="card-glass rounded-xl px-4 py-3 text-xs font-medium text-red-500 flex items-center gap-2"
      >
        <i class="mdi mdi-alert-circle-outline text-sm" />
        {{ errorMessage }}
      </p>
    </Transition>

    <section class="card-glass rounded-2xl overflow-hidden">
      <div class="px-4 py-4">
        <p class="text-sm text-slate-600">
          {{ t('db_browser.warning') }}
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppButton from '../components/AppButton.vue'
import { ApiError, apiFetch } from '../lib/api'

const ADMIN_SECRET_STORAGE_KEY = 'admin_db_secret'

const router = useRouter()
const { t } = useI18n()

const adminSecret = ref(localStorage.getItem(ADMIN_SECRET_STORAGE_KEY) ?? '')
const rememberSecret = ref(adminSecret.value.length > 0)
const opening = ref(false)
const errorMessage = ref('')

interface DbSessionPayload {
  ok: boolean
  url: string
}

function saveSecretPreference(secret: string): void {
  if (rememberSecret.value) {
    localStorage.setItem(ADMIN_SECRET_STORAGE_KEY, secret)
    return
  }
  localStorage.removeItem(ADMIN_SECRET_STORAGE_KEY)
}

function mapError(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return t('db_browser.generic_error')
}

async function openSqliteGui() {
  const secret = adminSecret.value.trim()
  if (!secret) {
    errorMessage.value = t('db_browser.secret_required')
    return
  }

  opening.value = true
  errorMessage.value = ''

  try {
    const payload = await apiFetch<DbSessionPayload>('/admin/db/session', {
      method: 'POST',
      headers: { 'X-Admin-Secret': secret },
      credentials: 'include',
    })
    saveSecretPreference(secret)
    window.location.href = payload.url
  } catch (error) {
    errorMessage.value = mapError(error)
  } finally {
    opening.value = false
  }
}
</script>
