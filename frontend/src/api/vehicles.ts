import { supabase } from '@/lib/supabase'

export async function getVehicles() {
  return await supabase
    .from('vehicles')
    .select(`
      id,
      company_id,
      unit,
      make,
      model,
      year,
      plate,
      vin,
      odometer,
      odometer_unit,
      engine_hours,
      status,
      photo_url,
      vehicle_type_id,
      vehicle_types (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false })
}
