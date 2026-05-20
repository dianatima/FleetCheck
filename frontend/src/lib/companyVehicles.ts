import { supabase } from '@/lib/supabase'
import { normalizeSupabaseSchemaErrorMessage } from '@/lib/supabaseErrors'

export type CompanyVehicle = {
  id: string
  unit: string
  type: string
  make: string
  model: string
  year?: number | null
  plate: string
  vin?: string | null
  odometer?: number | null
  engine_hours?: number | null
  status: string
  photo_url?: string | null
}

type FetchCompanyVehiclesOptions = {
  assignedToAuthUserId?: string | null
}

export async function fetchCompanyVehicles(companyId: string, options: FetchCompanyVehiclesOptions = {}) {
  let assignedDriverId: string | null = null

  if (options.assignedToAuthUserId) {
    const { data: driverRecord, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('auth_user_id', options.assignedToAuthUserId)
      .maybeSingle()

    if (driverError) {
      throw new Error(normalizeSupabaseSchemaErrorMessage(driverError.message) || driverError.message)
    }

    assignedDriverId = driverRecord?.id || null

    if (!assignedDriverId) {
      return [] as CompanyVehicle[]
    }
  }

  let assignmentsQuery = supabase
    .from('vehicle_company_assignments')
    .select('vehicle_id')
    .eq('company_id', companyId)

  if (assignedDriverId) {
    assignmentsQuery = assignmentsQuery.eq('assigned_driver_id', assignedDriverId)
  }

  const { data: assignments, error: assignmentsError } = await assignmentsQuery

  if (assignmentsError) {
    throw new Error(normalizeSupabaseSchemaErrorMessage(assignmentsError.message) || assignmentsError.message)
  }

  const vehicleIds = (assignments || []).map((assignment) => assignment.vehicle_id)

  if (vehicleIds.length === 0) {
    return [] as CompanyVehicle[]
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select('id, unit, type, make, model, year, plate, vin, odometer, engine_hours, status, photo_url')
    .in('id', vehicleIds)
    .order('make', { ascending: true })

  if (error) {
    throw new Error(normalizeSupabaseSchemaErrorMessage(error.message) || error.message)
  }

  return (data || []) as CompanyVehicle[]
}