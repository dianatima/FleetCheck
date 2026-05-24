import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

let authSessionLoaded = false

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: () => import('../views/LandingPage.vue') },
{ path: '/login', name: 'login', component: () => import('../views/LoginPage.vue') },
    { path: '/register/company', name: 'company-register', component: () => import('../views/CompanyRegister.vue') },
    { path: '/register/driver', name: 'driver-register', component: () => import('../views/DriverRegister.vue') },
    { path: '/pending', name: 'pending-approval', component: () => import('../views/PendingApproval.vue'), meta: { requiresAuth: true } },
    { path: '/dashboard', name: 'manager-dashboard', component: () => import('../views/ManagerDashboard.vue'), meta: { requiresAuth: true } },
    { path: '/driver', name: 'driver-dashboard', component: () => import('../views/DriverDashboard.vue'), meta: { requiresAuth: true } },
    { path: '/driver/profile', name: 'driver-profile', component: () => import('../views/DriverProfile.vue'), meta: { requiresAuth: true } },
    { path: '/driver/vehicles', name: 'driver-vehicles', component: () => import('../views/DriverVehicles.vue'), meta: { requiresAuth: true } },
    { path: '/driver/reports', name: 'driver-reports', component: () => import('../views/DriverReports.vue'), meta: { requiresAuth: true } },
    { path: '/drivers', name: 'drivers', component: () => import('../views/DriversPage.vue'), meta: { requiresAuth: true } },
    { path: '/drivers/:id', name: 'driver-detail', component: () => import('../views/DriverDetail.vue'), meta: { requiresAuth: true } },
    { path: '/vehicles', name: 'vehicles', component: () => import('../views/VehicleList.vue'), meta: { requiresAuth: true } },
    { path: '/vehicles/:id', name: 'vehicle-detail', component: () => import('../views/VehicleDetail.vue'), meta: { requiresAuth: true } },
    { path: '/operations/start', name: 'operation-launcher', component: () => import('../views/OperationLauncher.vue'), meta: { requiresAuth: true } },
    { path: '/inspect/pre', name: 'pre-trip', component: () => import('../views/PreTripInspection.vue'), meta: { requiresAuth: true } },
    { path: '/inspect/post', name: 'post-trip', component: () => import('../views/PreTripInspection.vue'), props: { isPostTrip: true }, meta: { requiresAuth: true } },
    { path: '/inspect/result', name: 'inspection-result', component: () => import('../views/InspectionResult.vue'), meta: { requiresAuth: true } },
    { path: '/repairs', name: 'repairs', component: () => import('../views/RepairRequest.vue'), meta: { requiresAuth: true } },
    { path: '/reports', name: 'reports', component: () => import('../views/Reports.vue'), meta: { requiresAuth: true } },
    { path: '/issues', name: 'issues', component: () => import('../views/IssuesList.vue'), meta: { requiresAuth: true } },
    { path: '/issues/:id', name: 'issue-detail', component: () => import('../views/IssueDetail.vue'), meta: { requiresAuth: true } },
    { path: '/settings', name: 'settings', component: () => import('../views/Settings.vue'), meta: { requiresAuth: true } },
    { path: '/auth/callback', component: () => import('@/views/AuthCallback.vue')},
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  if (!to.matched.some((record) => record.meta.requiresAuth)) {
    return true
  }

  const authStore = useAuthStore()

  if (!authSessionLoaded) {
    await authStore.loadSession()
    authSessionLoaded = true
  }

  if (authStore.profile?.role === 'driver' && authStore.profile?.status === 'pending' && to.path !== '/pending') {
    return {
      path: '/pending',
    }
  }

  if (authStore.isAuthenticated) {
    return true
  }

  return {
    path: '/login',
    query: {
      redirect: to.fullPath,
    },
  }
})

export default router
