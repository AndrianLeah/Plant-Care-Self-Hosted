<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 px-5">
    <div class="w-full max-w-sm">
      <!-- Logo / title -->
      <div class="text-center mb-8">
        <i class="mdi mdi-leaf text-5xl text-leaf-500" />
        <h1 class="text-2xl font-bold text-slate-900 mt-2">Plant Care</h1>
        <p class="text-sm text-slate-500 mt-1">
          {{ isRegister ? t('login.subtitle_register') : t('login.subtitle_login') }}
        </p>
      </div>

      <!-- Card -->
      <div class="card-glass rounded-3xl p-6 space-y-4">
        <!-- Name field (register only) -->
        <div v-if="isRegister">
          <label class="text-sm font-medium text-slate-600 block mb-1.5">
            {{ t('login.name') }}
          </label>
          <input
            v-model="form.name"
            type="text"
            :placeholder="t('login.name_placeholder')"
            class="w-full bg-white border rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-leaf-300 focus:border-transparent transition-shadow"
            :class="fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'"
            autocomplete="name"
          />
          <p v-if="fieldErrors.name" class="text-xs text-red-500 mt-1 flex items-center gap-1">
            <i class="mdi mdi-alert-circle-outline" />
            {{ fieldErrors.name }}
          </p>
        </div>

        <!-- Email -->
        <div>
          <label class="text-sm font-medium text-slate-600 block mb-1.5">
            {{ t('login.email') }}
          </label>
          <input
            v-model="form.email"
            type="email"
            :placeholder="t('login.email_placeholder')"
            class="w-full bg-white border rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-leaf-300 focus:border-transparent transition-shadow"
            :class="fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'"
            autocomplete="email"
          />
          <p v-if="fieldErrors.email" class="text-xs text-red-500 mt-1 flex items-center gap-1">
            <i class="mdi mdi-alert-circle-outline" />
            {{ fieldErrors.email }}
          </p>
        </div>

        <!-- Password -->
        <div>
          <label class="text-sm font-medium text-slate-600 block mb-1.5">
            {{ t('login.password') }}
          </label>
          <input
            v-model="form.password"
            type="password"
            :placeholder="t('login.password_placeholder')"
            class="w-full bg-white border rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-leaf-300 focus:border-transparent transition-shadow"
            :class="fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'"
            autocomplete="current-password"
            @keydown.enter="submit"
          />
          <p v-if="fieldErrors.password" class="text-xs text-red-500 mt-1 flex items-center gap-1">
            <i class="mdi mdi-alert-circle-outline" />
            {{ fieldErrors.password }}
          </p>
          <p v-else-if="isRegister" class="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <i class="mdi mdi-information-outline" />
            {{ t('login.password_hint') }}
          </p>
        </div>

        <!-- Error -->
        <p v-if="errorMsg" class="text-sm text-red-500 flex items-center gap-1.5">
          <i class="mdi mdi-alert-circle-outline" />
          {{ errorMsg }}
        </p>

        <!-- Submit -->
        <AppButton
          variant="primary"
          color="leaf"
          size="md"
          full-width
          :disabled="loading || !isFormValid"
          @click="submit"
        >
          <i v-if="loading" class="mdi mdi-loading mdi-spin" />
          {{ isRegister ? t('login.register_btn') : t('login.login_btn') }}
        </AppButton>
      </div>

      <!-- Toggle mode -->
      <p class="text-center text-sm text-slate-500 mt-4">
        {{ isRegister ? t('login.already_have_account') : t('login.no_account') }}
        <button
          class="text-leaf-600 font-semibold hover:underline ml-1"
          @click="isRegister = !isRegister"
        >
          {{ isRegister ? t('login.login_link') : t('login.register_link') }}
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppButton from '../components/AppButton.vue'
import { useAuthStore } from '../stores/auth'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const isRegister = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
})

const fieldErrors = reactive({ name: '', email: '', password: '' })

const isFormValid = computed(() => {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  const passwordOk = isRegister.value ? form.password.length >= 8 : form.password.length > 0
  return emailOk && passwordOk
})

// Clear field errors when mode switches
watch(isRegister, () => {
  fieldErrors.name = ''
  fieldErrors.email = ''
  fieldErrors.password = ''
  errorMsg.value = ''
})

function validate(): boolean {
  fieldErrors.name = ''
  fieldErrors.email = ''
  fieldErrors.password = ''

  let valid = true

  if (!form.email) {
    fieldErrors.email = t('login.error_email_required')
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    fieldErrors.email = t('login.error_email_invalid')
    valid = false
  }

  if (!form.password) {
    fieldErrors.password = t('login.error_password_required')
    valid = false
  } else if (isRegister.value && form.password.length < 8) {
    fieldErrors.password = t('login.error_password_min')
    valid = false
  }

  return valid
}

async function submit() {
  errorMsg.value = ''
  if (!validate()) return
  loading.value = true
  try {
    if (isRegister.value) {
      await authStore.register(form.email, form.password, form.name)
    } else {
      await authStore.login(form.email, form.password)
    }
    router.push('/')
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : t('login.error_generic')
  } finally {
    loading.value = false
  }
}
</script>
