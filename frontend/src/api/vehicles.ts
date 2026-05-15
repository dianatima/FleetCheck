import { supabase } from '@/lib/supabase'

export async function getVehicles() {
  return await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false })
}