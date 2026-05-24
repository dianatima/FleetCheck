import { fetchCompanyVehicles } from '@/lib/companyVehicles'
import { fetchInspectionReports, type InspectionReportRecord } from '@/lib/inspectionReports'
import { supabase } from '@/lib/supabase'
import { normalizeSupabaseSchemaErrorMessage } from '@/lib/supabaseErrors'

export type ManagerDashboardWeekBucket = {
  label: string
  count: number
}

export type ManagerDashboardIssueCategory = {
  label: string
  count: number
  pct: number
  color: string
}

export type ManagerDashboardStatusItem = {
  label: string
  count: number
  pct: number
  color: string
}

export type ManagerDashboardData = {
  vehicleCount: number
  driverCount: number
  needsReviewCount: number
  inspectionCount: number
  failedInspectionCount: number
  inRepairVehicleCount: number
  blockedVehicleCount: number
  weekBuckets: ManagerDashboardWeekBucket[]
  currentWeekTotal: number
  weekTrendPercent: number
  weekTrendDirection: 'up' | 'down' | 'flat'
  issueCategories: ManagerDashboardIssueCategory[]
  pendingInspections: InspectionReportRecord[]
  fleetStatus: ManagerDashboardStatusItem[]
}

type InspectionAnalyticsRow = {
  created_at: string
  responses: unknown
}

const issueCategoryColors = ['bg-orange-400', 'bg-yellow-400', 'bg-red-400', 'bg-blue-400', 'bg-gray-400']

function getLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function countFailedResponses(responses: unknown) {
  if (!Array.isArray(responses)) {
    return 0
  }

  return responses.filter((response: any) => response?.state === 'fail').length
}

function createWeekBuckets(locale: string) {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))

    return {
      label: formatter.format(date),
      key: getLocalDateKey(date),
      count: 0,
    }
  })
}

function buildWeekSummary(inspectionRows: InspectionAnalyticsRow[], locale: string) {
  const weekBuckets = createWeekBuckets(locale)
  const weekBucketMap = new Map(weekBuckets.map((bucket) => [bucket.key, bucket]))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const currentWeekStart = new Date(today)
  currentWeekStart.setDate(today.getDate() - 6)

  const previousWeekStart = new Date(today)
  previousWeekStart.setDate(today.getDate() - 13)

  let previousWeekTotal = 0

  for (const inspection of inspectionRows) {
    const createdAt = new Date(inspection.created_at)
    createdAt.setHours(0, 0, 0, 0)

    const currentBucket = weekBucketMap.get(getLocalDateKey(createdAt))

    if (currentBucket) {
      currentBucket.count += 1
      continue
    }

    if (createdAt >= previousWeekStart && createdAt < currentWeekStart) {
      previousWeekTotal += 1
    }
  }

  const currentWeekTotal = weekBuckets.reduce((total, bucket) => total + bucket.count, 0)

  if (previousWeekTotal === 0) {
    return {
      weekBuckets,
      currentWeekTotal,
      weekTrendPercent: currentWeekTotal > 0 ? 100 : 0,
      weekTrendDirection: currentWeekTotal > 0 ? 'up' as const : 'flat' as const,
    }
  }

  const weekTrendPercent = Math.round(((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100)

  return {
    weekBuckets,
    currentWeekTotal,
    weekTrendPercent,
    weekTrendDirection: weekTrendPercent > 0 ? 'up' as const : weekTrendPercent < 0 ? 'down' as const : 'flat' as const,
  }
}

function buildIssueCategories(inspectionRows: InspectionAnalyticsRow[]) {
  const categoryMap = new Map<string, number>()

  for (const inspection of inspectionRows) {
    if (!Array.isArray(inspection.responses)) {
      continue
    }

    for (const response of inspection.responses as any[]) {
      if (response?.state !== 'fail') {
        continue
      }

      const label = typeof response?.section === 'string' && response.section.trim()
        ? response.section.trim()
        : typeof response?.label === 'string' && response.label.trim()
          ? response.label.trim()
          : 'Other'

      categoryMap.set(label, (categoryMap.get(label) || 0) + 1)
    }
  }

  const topCategories = [...categoryMap.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)

  const maxCount = topCategories[0]?.[1] || 0

  return topCategories.map(([label, count], index) => ({
    label,
    count,
    pct: maxCount > 0 ? Math.max(12, Math.round((count / maxCount) * 100)) : 0,
    color: issueCategoryColors[index % issueCategoryColors.length],
  }))
}

export async function fetchManagerDashboardData(companyId: string, locale = 'en-US'): Promise<ManagerDashboardData> {
  const analyticsStart = new Date()
  analyticsStart.setHours(0, 0, 0, 0)
  analyticsStart.setDate(analyticsStart.getDate() - 29)

  const [vehicles, inspectionReports, driverMembershipsResult, inspectionAnalyticsResult] = await Promise.all([
    fetchCompanyVehicles(companyId),
    fetchInspectionReports(companyId),
    supabase
      .from('company_memberships')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('role', 'driver'),
    supabase
      .from('inspections')
      .select('created_at, responses')
      .eq('company_id', companyId)
      .gte('created_at', analyticsStart.toISOString())
      .order('created_at', { ascending: false }),
  ])

  if (driverMembershipsResult.error) {
    throw new Error(normalizeSupabaseSchemaErrorMessage(driverMembershipsResult.error.message) || driverMembershipsResult.error.message)
  }

  if (inspectionAnalyticsResult.error) {
    throw new Error(normalizeSupabaseSchemaErrorMessage(inspectionAnalyticsResult.error.message) || inspectionAnalyticsResult.error.message)
  }

  const inspectionAnalytics = (inspectionAnalyticsResult.data || []) as InspectionAnalyticsRow[]
  const driverIds = new Set((driverMembershipsResult.data || []).map((membership: any) => membership.user_id).filter(Boolean))
  const pendingInspections = inspectionReports
    .filter((inspection) => inspection.reviewStatus === 'needs-review')
    .slice(0, 5)

  const weekSummary = buildWeekSummary(inspectionAnalytics, locale)
  const issueCategories = buildIssueCategories(inspectionAnalytics)

  const fleetStatusBase = [
    { label: 'active', count: vehicles.filter((vehicle) => vehicle.status === 'active').length, color: 'bg-green-500' },
    { label: 'needs-attention', count: vehicles.filter((vehicle) => vehicle.status === 'needs-attention').length, color: 'bg-orange-500' },
    { label: 'blocked', count: vehicles.filter((vehicle) => vehicle.status === 'blocked').length, color: 'bg-red-500' },
    { label: 'in-repair', count: vehicles.filter((vehicle) => vehicle.status === 'in-repair').length, color: 'bg-gray-500' },
  ]

  const fleetStatusTotal = fleetStatusBase.reduce((total, status) => total + status.count, 0)
  const fleetStatus = fleetStatusBase.map((status) => ({
    ...status,
    pct: fleetStatusTotal > 0 ? Math.round((status.count / fleetStatusTotal) * 100) : 0,
  }))

  return {
    vehicleCount: vehicles.length,
    driverCount: driverIds.size,
    needsReviewCount: inspectionReports.filter((inspection) => inspection.reviewStatus === 'needs-review').length,
    inspectionCount: inspectionReports.length,
    failedInspectionCount: inspectionReports.filter((inspection) => inspection.result === 'fail').length,
    inRepairVehicleCount: fleetStatusBase.find((status) => status.label === 'in-repair')?.count || 0,
    blockedVehicleCount: fleetStatusBase.find((status) => status.label === 'blocked')?.count || 0,
    weekBuckets: weekSummary.weekBuckets.map((bucket) => ({ label: bucket.label, count: bucket.count })),
    currentWeekTotal: weekSummary.currentWeekTotal,
    weekTrendPercent: weekSummary.weekTrendPercent,
    weekTrendDirection: weekSummary.weekTrendDirection,
    issueCategories,
    pendingInspections,
    fleetStatus,
  }
}