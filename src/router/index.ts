import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AdminDbView from '../views/AdminDbView.vue'
import CatalogView from '../views/CatalogView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import PlantDetailView from '../views/PlantDetailView.vue'
import SettingsView from '../views/SettingsView.vue'
import WaterGuideView from '../views/WaterGuideView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/', name: 'home', component: HomeView, meta: { tabIndex: 0 } },
    {
      path: '/plant/:id',
      name: 'plant-detail',
      component: PlantDetailView,
      meta: { overlay: true },
    },
    { path: '/catalog', name: 'catalog', component: CatalogView, meta: { tabIndex: 1 } },
    { path: '/water-guide', name: 'water-guide', component: WaterGuideView, meta: { tabIndex: 2 } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { tabIndex: 3 } },
    { path: '/admin/db', name: 'admin-db', component: AdminDbView, meta: { overlay: true } },
  ],
})

let resolveSessionReady: () => void
export const sessionReady = new Promise<void>((resolve) => {
  resolveSessionReady = resolve
})
export function markSessionReady() {
  resolveSessionReady()
}

router.beforeEach(async (to) => {
  await sessionReady
  const authStore = useAuthStore()
  if (to.meta.public) {
    // Already logged in — skip login page
    if (authStore.isLoggedIn) return { name: 'home' }
    return true
  }
  if (!authStore.isLoggedIn) return { name: 'login' }
})

export default router
