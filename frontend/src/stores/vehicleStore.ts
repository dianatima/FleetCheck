import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useVehicleStore = defineStore('vehicles', () => {
  const vehicles = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchVehicles() {
    loading.value = true
    error.value = null

    const { data, error: supabaseError } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('FETCH DATA', data)
    console.log('FETCH ERROR', supabaseError)

    if (supabaseError) {
      error.value = supabaseError.message
    } else {
      vehicles.value = data || []
    }

    loading.value = false
  }

  async function createVehicle(vehicle: any) {
    const { data, error: supabaseError } = await supabase
      .from('vehicles')
      .insert(vehicle)
      .select()

    console.log('CREATE DATA', data)
    console.log('CREATE ERROR', supabaseError)

    if (supabaseError) {
      error.value = supabaseError.message
      return
    }

    await fetchVehicles()
  }

  async function updateVehicle(id: string, vehicle: any) {
    const { data, error: supabaseError } = await supabase
      .from('vehicles')
      .update(vehicle)
      .eq('id', id)
      .select()

    console.log('UPDATE DATA', data)
    console.log('UPDATE ERROR', supabaseError)

    if (supabaseError) {
      error.value = supabaseError.message
      return
    }

    await fetchVehicles()
  }

  async function deleteVehicle(id: string) {
    const { data, error: supabaseError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .select()

    console.log('DELETE DATA', data)
    console.log('DELETE ERROR', supabaseError)

    if (supabaseError) {
      error.value = supabaseError.message
      return
    }

    await fetchVehicles()
  }
    
  const selectedVehicle = ref<any | null>(null)

  async function fetchVehicleById(id: string) {
    loading.value = true
    error.value = null
  
    const { data, error: supabaseError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single()
  
    if (supabaseError) {
      error.value = supabaseError.message
      console.error(supabaseError)
    } else {
      selectedVehicle.value = data
    }
  
    loading.value = false
  }  

  return {
    vehicles,
    loading,
    error,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    selectedVehicle,
    fetchVehicleById,
  }
})