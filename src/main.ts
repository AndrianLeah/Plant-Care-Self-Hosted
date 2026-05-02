import '@mdi/font/css/materialdesignicons.css'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/it'
import { createPinia } from 'pinia'
import { createApp, watch } from 'vue'
import App from './App.vue'
import i18n from './i18n'
import router, { markSessionReady } from './router'
import { useAuthStore } from './stores/auth'
import { useCatalogStore } from './stores/catalog'
import { usePlantsStore } from './stores/plants'
import { useWaterProfileStore } from './stores/waterProfile'
import './style.css'

dayjs.locale(localStorage.getItem('locale') ?? 'en')

const pinia = createPinia()
const app = createApp(App)
app.use(pinia).use(router).use(i18n)

// Bootstrap: restore session BEFORE mounting so the router guard sees correct auth state
const authStore = useAuthStore()
const catalogStore = useCatalogStore()
const plantsStore = usePlantsStore()
const waterProfileStore = useWaterProfileStore()

function fetchAppData() {
  Promise.all([
    catalogStore.fetchCatalog().catch(() => {}),
    plantsStore.init().catch(() => {}),
    waterProfileStore.fetchPresets().catch(() => {}),
  ])
}

authStore.restoreSession().then(() => {
  // Unblock the router guard NOW — auth state is known
  markSessionReady()
  app.mount('#app')
  // Fetch data in the background after mount, errors here don't affect auth
  if (authStore.isLoggedIn) {
    fetchAppData()
  }
})

// Re-fetch all data whenever the user logs in (e.g. after login/register)
watch(
  () => authStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) fetchAppData()
  },
)
