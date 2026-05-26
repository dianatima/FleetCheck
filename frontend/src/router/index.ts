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
    { path: '/driver/vehicles', name: 'driver-vehicles', component: () => import('../views/DriverVehiclesPage.vue') },
    { path: '/driver/vehicles/:id', name: 'driver-vehicle-detail', component: () => import('../views/DriverVehicleDetail.vue') },
    { path: '/driver/reports', name: 'driver-reports', component: () => import('../views/DriverReports.vue') },
    { path: '/driver/reports/:inspectionId', name: 'driver-report-detail', component: () => import('../views/DriverReportDetail.vue') },
    { path: '/drivers', name: 'drivers', component: () => import('../views/DriversPage.vue') },
    { path: '/drivers/:id', name: 'driver-detail', component: () => import('../views/DriverDetail.vue') },
    { path: '/vehicles', name: 'vehicles', component: () => import('../views/VehicleList.vue') },
    { path: '/vehicles/:id', name: 'vehicle-detail', component: () => import('../views/VehicleDetail.vue') },
    { path: '/inspection-templates', redirect: '/settings?tab=inspection-templates' },
    { path: '/inspection-templates/:id', redirect: to => `/settings/inspection-templates/${to.params.id}` },
    { path: '/settings/inspection-templates/:id', name: 'inspection-template-detail', component: () => import('../views/InspectionTemplateDetail.vue') },
    { path: '/driver/inspections', redirect: '/driver/vehicles' },
    { path: '/driver/inspections/:id', redirect: '/driver/vehicles' },
    { path: '/inspections', redirect: '/driver/vehicles' },
    { path: '/inspect/pre', name: 'pre-trip', component: () => import('../views/PreTripInspection.vue') },
    { path: '/inspect/post', name: 'post-trip', component: () => import('../views/PreTripInspection.vue'), props: { isPostTrip: true } },
    { path: '/inspect/result', name: 'inspection-result', component: () => import('../views/InspectionResult.vue') },
    { path: '/repairs', name: 'repairs', component: () => import('../views/RepairRequest.vue') },
    { path: '/repairs/:id', name: 'repair-detail', component: () => import('../views/RepairRequest.vue') },
    { path: '/reports', name: 'reports', component: () => import('../views/Reports.vue') },
    { path: '/reports/:inspectionId', name: 'report-detail', component: () => import('../views/DriverReportDetail.vue') },
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
  const isDriver = authStore.profile?.role === 'driver' || authStore.role === 'driver'

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

  const managerOnlyRoutes = [
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
  ]

  if (isDriver && managerOnlyRoutes.includes(String(to.name))) {
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

  const driverIsBlocked =
    isDriver &&
    (!authStore.passwordSetAt || authStore.profile?.status !== 'active')
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
