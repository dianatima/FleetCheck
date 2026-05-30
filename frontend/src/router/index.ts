import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const publicRoute = (route: RouteRecordRaw): RouteRecordRaw => ({
  ...route,
  meta: { ...(route.meta || {}), public: true },
})

const protectedRoute = (route: RouteRecordRaw): RouteRecordRaw => ({
  ...route,
  meta: { ...(route.meta || {}), requiresAuth: true },
})

const router = createRouter({
  history: createWebHistory(),
  routes: [
    publicRoute({ path: '/', name: 'landing', component: () => import('../views/LandingPage.vue') }),
    publicRoute({ path: '/login', name: 'login', component: () => import('../views/LoginPage.vue') }),
    publicRoute({ path: '/register/company', name: 'company-register', component: () => import('../views/CompanyRegister.vue') }),
    publicRoute({ path: '/register/driver', name: 'driver-register', component: () => import('../views/DriverRegister.vue') }),
    publicRoute({ path: '/auth/callback', name: 'auth-callback', component: () => import('@/views/AuthCallback.vue') }),

    publicRoute({ path: '/set-password', name: 'set-password', component: () => import('../views/PasswordSetup.vue') }),
    publicRoute({ path: '/auth/set-password', redirect: '/set-password' }),
    publicRoute({ path: '/password-setup', redirect: '/set-password' }),
    protectedRoute({ path: '/pending', name: 'pending-approval', component: () => import('../views/PendingApproval.vue') }),
    protectedRoute({ path: '/inactive', name: 'inactive-access', component: () => import('../views/InactiveAccess.vue') }),
    protectedRoute({ path: '/dashboard', name: 'manager-dashboard', component: () => import('../views/ManagerDashboard.vue') }),
    protectedRoute({ path: '/driver', name: 'driver-dashboard', component: () => import('../views/DriverDashboard.vue') }),
    protectedRoute({ path: '/driver/vehicles', name: 'driver-vehicles', component: () => import('../views/DriverVehiclesPage.vue') }),
    protectedRoute({ path: '/driver/vehicles/:id', name: 'driver-vehicle-detail', component: () => import('../views/DriverVehicleDetail.vue') }),
    protectedRoute({ path: '/driver/reports', name: 'driver-reports', component: () => import('../views/DriverReports.vue') }),
    protectedRoute({ path: '/driver/reports/:inspectionId', name: 'driver-report-detail', component: () => import('../views/DriverReportDetail.vue') }),
    protectedRoute({ path: '/drivers', name: 'drivers', component: () => import('../views/DriversPage.vue') }),
    protectedRoute({ path: '/drivers/:id', name: 'driver-detail', component: () => import('../views/DriverDetail.vue') }),
    protectedRoute({ path: '/vehicles', name: 'vehicles', component: () => import('../views/VehicleList.vue') }),
    protectedRoute({ path: '/vehicles/:id', name: 'vehicle-detail', component: () => import('../views/VehicleDetail.vue') }),
    protectedRoute({ path: '/inspection-templates', redirect: '/settings?tab=inspection-templates' }),
    protectedRoute({ path: '/inspection-templates/:id', redirect: to => `/settings/inspection-templates/${to.params.id}` }),
    protectedRoute({ path: '/settings/inspection-templates/:id', name: 'inspection-template-detail', component: () => import('../views/InspectionTemplateDetail.vue') }),
    protectedRoute({ path: '/driver/inspections', redirect: '/driver/vehicles' }),
    protectedRoute({ path: '/driver/inspections/:id', redirect: '/driver/vehicles' }),
    protectedRoute({ path: '/inspections', redirect: '/driver/vehicles' }),
    protectedRoute({ path: '/inspect/pre', name: 'pre-trip', component: () => import('../views/PreTripInspection.vue') }),
    protectedRoute({ path: '/inspect/post', name: 'post-trip', component: () => import('../views/PreTripInspection.vue'), props: { isPostTrip: true } }),
    protectedRoute({ path: '/inspect/result', name: 'inspection-result', component: () => import('../views/InspectionResult.vue') }),
    protectedRoute({ path: '/repairs', name: 'repairs', component: () => import('../views/RepairRequest.vue') }),
    protectedRoute({ path: '/repairs/:id', name: 'repair-detail', component: () => import('../views/RepairRequest.vue') }),
    protectedRoute({ path: '/reports', name: 'reports', component: () => import('../views/Reports.vue') }),
    protectedRoute({ path: '/reports/:inspectionId', name: 'report-detail', component: () => import('../views/DriverReportDetail.vue') }),
    protectedRoute({ path: '/issues', name: 'issues', component: () => import('../views/IssuesList.vue') }),
    protectedRoute({ path: '/issues/:id', name: 'issue-detail', component: () => import('../views/IssueDetail.vue') }),
    protectedRoute({ path: '/settings', name: 'settings', component: () => import('../views/Settings.vue') }),
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

const managerOnlyRoutes = new Set([
  'drivers',
  'driver-detail',
  'vehicles',
  'vehicle-detail',
  'reports',
  'report-detail',
  'issues',
  'issue-detail',
  'repairs',
  'repair-detail',
  'settings',
  'inspection-template-detail',
])

function requiresAuth(to: any) {
  return to.matched.some((record: RouteRecordRaw) => record.meta?.requiresAuth)
}

function authCallbackParams(to: any) {
  const hashParams = new URLSearchParams(String(to.hash || '').replace(/^#/, ''))
  const query = to.query || {}

  return {
    type: String(query.type || hashParams.get('type') || ''),
    tokenHash: String(query.token_hash || hashParams.get('token_hash') || ''),
    accessToken: String(query.access_token || hashParams.get('access_token') || ''),
    refreshToken: String(query.refresh_token || hashParams.get('refresh_token') || ''),
    code: String(query.code || hashParams.get('code') || ''),
    driverInvite: query.driver_invite === '1' || hashParams.get('driver_invite') === '1',
  }
}

function isInviteOrRecoveryCallback(to: any) {
  const params = authCallbackParams(to)

  return (
    params.driverInvite ||
    ['invite', 'recovery'].includes(params.type) ||
    Boolean(params.tokenHash && ['invite', 'recovery'].includes(params.type))
  )
}

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const needsAuth = requiresAuth(to)
  const isPasswordSetupRoute = to.name === 'set-password'
  const isAuthCallbackRoute = to.name === 'auth-callback'
  const isInviteCallback = isAuthCallbackRoute && isInviteOrRecoveryCallback(to)
  const shouldValidateAuth =
    !isAuthCallbackRoute &&
    !isPasswordSetupRoute &&
    ((needsAuth && !isInviteCallback) ||
      to.name === 'login' ||
      Boolean(authStore.session))
  const authReady = shouldValidateAuth
    ? await authStore.ensureAuthenticated()
    : false

  if (!authReady) {
    if (needsAuth) {
      return {
        name: 'login',
        query: to.fullPath ? { redirect: to.fullPath } : undefined,
      }
    }

    return undefined
  }

  if (
    to.name === 'login' &&
    authStore.isAuthenticated &&
    authStore.redirectPath !== '/login'
  ) {
    return authStore.redirectPath
  }

  const isDriver = authStore.profile?.role === 'driver'

  const driverIsBlocked =
    isDriver &&
    (!authStore.passwordSetAt || authStore.profile?.status !== 'active')
  const blockedDriverRouteName =
    !authStore.passwordSetAt
      ? 'set-password'
      : authStore.profile?.status === 'inactive'
      ? 'inactive-access'
      : 'pending-approval'

  if (
    driverIsBlocked &&
    !['auth-callback', blockedDriverRouteName].includes(String(to.name))
  ) {
    return { name: blockedDriverRouteName }
  }

  if (
    !driverIsBlocked &&
    ['set-password', 'pending-approval', 'inactive-access'].includes(String(to.name)) &&
    authStore.isAuthenticated
  ) {
    return authStore.redirectPath
  }

  if (
    isDriver &&
    (
      to.path.startsWith('/settings/inspection-templates') ||
      (to.path === '/settings' && to.query.tab === 'inspection-templates')
    )
  ) {
    return { name: 'driver-vehicles' }
  }

  if (isDriver && to.name === 'manager-dashboard') {
    return { name: 'driver-dashboard' }
  }

  if (isDriver && managerOnlyRoutes.has(String(to.name))) {
    return { name: 'driver-dashboard' }
  }

  const isDriverAreaRoute = to.path === '/driver' || to.path.startsWith('/driver/')

  if (!isDriver && authStore.isAuthenticated && isDriverAreaRoute) {
    return { name: 'manager-dashboard' }
  }

  if (
    isDriver &&
    ['pre-trip', 'post-trip'].includes(String(to.name)) &&
    !to.query.inspectionId
  ) {
    return { name: 'driver-vehicles' }
  }

  return undefined
})

export default router
