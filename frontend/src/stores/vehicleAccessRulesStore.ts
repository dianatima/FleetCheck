import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export type VehicleAccessRulePayload = {
  license_class: string
  vehicle_type_ids: string[]
}

export const useVehicleAccessRulesStore = defineStore('vehicleAccessRules', () => {
  const authStore = useAuthStore()
  const rules = ref<any[]>([])
  const vehicleTypes = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const groupedRules = computed(() => {
    const groups = new Map<string, any>()

    for (const rule of rules.value) {
      const key = rule.license_class
      const group = groups.get(key) || {
        license_class: key,
        rule_ids: [],
        vehicle_type_ids: [],
        vehicle_types: [],
      }

      group.rule_ids.push(rule.id)
      group.vehicle_type_ids.push(rule.vehicle_type_id)
      if (rule.vehicle_types) group.vehicle_types.push(rule.vehicle_types)
      groups.set(key, group)
    }

    return [...groups.values()].map((group) => ({
      ...group,
      vehicle_types: group.vehicle_types.sort((a: any, b: any) =>
        String(a.name).localeCompare(String(b.name))
      ),
    }))
  })

  async function fetchVehicleTypes() {
    const { data, error: vehicleTypesError } = await supabase
      .from('vehicle_types')
      .select('id, name')
      .order('name', { ascending: true })

    if (vehicleTypesError) {
      error.value = vehicleTypesError.message
      vehicleTypes.value = []
      return false
    }

    vehicleTypes.value = data || []
    return true
  }

  async function fetchRules() {
    loading.value = true
    error.value = null

    if (!authStore.companyId) {
      rules.value = []
      loading.value = false
      return
    }

    const { data, error: rulesError } = await supabase
      .from('license_vehicle_type_rules')
      .select(`
        id,
        company_id,
        license_class,
        vehicle_type_id,
        vehicle_types (
          id,
          name
        )
      `)
      .eq('company_id', authStore.companyId)
      .order('license_class', { ascending: true })

    if (rulesError) {
      error.value = rulesError.message
      rules.value = []
    } else {
      rules.value = data || []
    }

    loading.value = false
  }

  async function createRules(payload: VehicleAccessRulePayload) {
    return saveRules(null, payload)
  }

  async function updateRules(
    originalLicenseClass: string,
    payload: VehicleAccessRulePayload
  ) {
    return saveRules(originalLicenseClass, payload)
  }

  async function saveRules(
    originalLicenseClass: string | null,
    payload: VehicleAccessRulePayload
  ) {
    error.value = null
    const licenseClass = payload.license_class.trim()
    const vehicleTypeIds = [...new Set(payload.vehicle_type_ids.filter(Boolean))]

    if (!authStore.companyId || !licenseClass || !vehicleTypeIds.length) {
      error.value = 'License class and at least one vehicle type are required'
      return false
    }

    loading.value = true
    const duplicate = rules.value.find((rule) => {
      if (originalLicenseClass && rule.license_class === originalLicenseClass) {
        return false
      }

      return (
        normalizedClass(rule.license_class) === normalizedClass(licenseClass) &&
        vehicleTypeIds.includes(rule.vehicle_type_id)
      )
    })

    if (duplicate) {
      error.value = 'That license class already allows one of the selected vehicle types'
      loading.value = false
      return false
    }

    if (originalLicenseClass) {
      const { error: removeError } = await supabase
        .from('license_vehicle_type_rules')
        .delete()
        .eq('company_id', authStore.companyId)
        .eq('license_class', originalLicenseClass)

      if (removeError) {
        error.value = removeError.message
        loading.value = false
        return false
      }
    }

    const { error: insertError } = await supabase
      .from('license_vehicle_type_rules')
      .insert(
        vehicleTypeIds.map((vehicleTypeId) => ({
          company_id: authStore.companyId,
          license_class: licenseClass,
          vehicle_type_id: vehicleTypeId,
        }))
      )

    if (insertError) {
      error.value = insertError.message
      loading.value = false
      await fetchRules()
      return false
    }

    await fetchRules()
    loading.value = false
    return true
  }

  async function deleteRules(licenseClass: string) {
    loading.value = true
    error.value = null

    if (!authStore.companyId) {
      error.value = 'Company ID is missing'
      loading.value = false
      return false
    }

    const { error: deleteError } = await supabase
      .from('license_vehicle_type_rules')
      .delete()
      .eq('company_id', authStore.companyId)
      .eq('license_class', licenseClass)

    if (deleteError) {
      error.value = deleteError.message
      loading.value = false
      return false
    }

    await fetchRules()
    loading.value = false
    return true
  }

  function normalizedClass(value: string) {
    return value.trim().toLowerCase()
  }

  return {
    rules,
    groupedRules,
    vehicleTypes,
    loading,
    error,
    fetchRules,
    fetchVehicleTypes,
    createRules,
    updateRules,
    deleteRules,
  }
})
