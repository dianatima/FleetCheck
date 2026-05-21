import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: () => import('../views/LandingPage.vue') },
{ path: '/login', name: 'login', component: () => import('../views/LoginPage.vue') },
    { path: '/register/company', name: 'company-register', component: () => import('../views/CompanyRegister.vue') },
    { path: '/register/driver', name: 'driver-register', component: () => import('../views/DriverRegister.vue') },
    { path: '/password-setup', name: 'password-setup', component: () => import('../views/PasswordSetup.vue') },
    { path: '/pending', name: 'pending-approval', component: () => import('../views/PendingApproval.vue') },
    { path: '/inactive', name: 'inactive-access', component: () => import('../views/InactiveAccess.vue') },
    { path: '/dashboard', name: 'manager-dashboard', component: () => import('../views/ManagerDashboard.vue') },
    { path: '/driver', name: 'driver-dashboard', component: () => import('../views/DriverDashboard.vue') },
    { path: '/driver/vehicles', name: 'driver-vehicles', component: () => import('../views/DriverVehicles.vue') },
    { path: '/driver/reports', name: 'driver-reports', component: () => import('../views/DriverReports.vue') },
    { path: '/drivers', name: 'drivers', component: () => import('../views/DriversPage.vue') },
    { path: '/drivers/:id', name: 'driver-detail', component: () => import('../views/DriverDetail.vue') },
    { path: '/vehicles', name: 'vehicles', component: () => import('../views/VehicleList.vue') },
    { path: '/vehicles/:id', name: 'vehicle-detail', component: () => import('../views/VehicleDetail.vue') },
    { path: '/inspect/pre', name: 'pre-trip', component: () => import('../views/PreTripInspection.vue') },
    { path: '/inspect/post', name: 'post-trip', component: () => import('../views/PreTripInspection.vue'), props: { isPostTrip: true } },
    { path: '/inspect/result', name: 'inspection-result', component: () => import('../views/InspectionResult.vue') },
    { path: '/repairs', name: 'repairs', component: () => import('../views/RepairRequest.vue') },
    { path: '/reports', name: 'reports', component: () => import('../views/Reports.vue') },
    { path: '/issues', name: 'issues', component: () => import('../views/IssuesList.vue') },
    { path: '/issues/:id', name: 'issue-detail', component: () => import('../views/IssueDetail.vue') },
    { path: '/settings', name: 'settings', component: () => import('../views/Settings.vue') },
    { path: '/auth/callback', component: () => import('@/views/AuthCallback.vue')},
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const driverIsBlocked =
    authStore.profile?.role === 'driver' &&
    (!authStore.passwordSetAt || authStore.profile.status !== 'active')
  const blockedDriverRouteName =
    !authStore.passwordSetAt
      ? 'password-setup'
      : authStore.profile?.status === 'inactive'
      ? 'inactive-access'
      : 'pending-approval'
  const blockedDriverRouteNames = ['login', blockedDriverRouteName]

  if (driverIsBlocked && !blockedDriverRouteNames.includes(String(to.name))) {
    return { name: blockedDriverRouteName }
  }

  if (
    !driverIsBlocked &&
    ['password-setup', 'pending-approval', 'inactive-access'].includes(String(to.name)) &&
    authStore.isAuthenticated
  ) {
    return authStore.redirectPath
  }
})

export default router
