import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export type TemplateItemDraft = {
  id?: string
  title: string
  description: string | null
  category_id: string
  is_required: boolean
  requires_photo: boolean
  sort_order: number
}

export type InspectionTemplatePayload = {
  name: string
  description: string | null
  vehicle_type_id: string
  is_default: boolean
}

const templateSelect = `
  id,
  company_id,
  name,
  description,
  vehicle_type_id,
  is_default,
  created_at,
  vehicle_types (
    id,
    name
  ),
  inspection_template_items (
    id,
    title,
    description,
    category_id,
    is_required,
    requires_photo,
    sort_order,
    inspection_item_categories (
      id,
      name,
      severity
    )
  )
`

export const useInspectionTemplateStore = defineStore('inspectionTemplates', () => {
  const authStore = useAuthStore()
  const templates = ref<any[]>([])
  const selectedTemplate = ref<any | null>(null)
  const vehicleTypes = ref<any[]>([])
  const itemCategories = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const search = ref('')
  const vehicleTypeFilter = ref('all')
  const defaultFilter = ref('all')
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(total.value / pageSize.value))
  )

  async function fetchVehicleTypes() {
    const { data, error: typesError } = await supabase
      .from('vehicle_types')
      .select('id, name')
      .order('name', { ascending: true })

    if (typesError) {
      error.value = typesError.message
      vehicleTypes.value = []
      return false
    }

    vehicleTypes.value = data || []
    return true
  }

  async function fetchItemCategories() {
    const { data, error: categoriesError } = await supabase
      .from('inspection_item_categories')
      .select('id, name, severity, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (categoriesError) {
      error.value = categoriesError.message
      itemCategories.value = []
      return false
    }

    itemCategories.value = data || []
    return true
  }

  async function fetchTemplates() {
    loading.value = true
    error.value = null

    if (!authStore.companyId) {
      templates.value = []
      total.value = 0
      loading.value = false
      return
    }

    const from = (page.value - 1) * pageSize.value
    const to = from + pageSize.value - 1
    let query = supabase
      .from('inspection_templates')
      .select(templateSelect, { count: 'exact' })
      .eq('company_id', authStore.companyId)
      .order('created_at', { ascending: false })

    if (vehicleTypeFilter.value !== 'all') {
      query = query.eq('vehicle_type_id', vehicleTypeFilter.value)
    }

    if (defaultFilter.value !== 'all') {
      query = query.eq('is_default', defaultFilter.value === 'default')
    }

    const searchValue = search.value.trim()

    if (searchValue) {
      query = query.or(
        `name.ilike.%${searchValue}%,description.ilike.%${searchValue}%`
      )
    }

    const { data, count, error: templatesError } = await query.range(from, to)

    if (templatesError) {
      error.value = templatesError.message
      templates.value = []
      total.value = 0
    } else {
      templates.value = (data || []).map(sortTemplateItems)
      total.value = count || 0
    }

    loading.value = false
  }

  async function fetchTemplateById(id: string) {
    loading.value = true
    error.value = null

    if (!authStore.companyId) {
      selectedTemplate.value = null
      loading.value = false
      return
    }

    const { data, error: templateError } = await supabase
      .from('inspection_templates')
      .select(templateSelect)
      .eq('id', id)
      .eq('company_id', authStore.companyId)
      .single()

    if (templateError) {
      error.value = templateError.message
      selectedTemplate.value = null
    } else {
      selectedTemplate.value = sortTemplateItems(data)
    }

    loading.value = false
  }

  async function createTemplate(payload: InspectionTemplatePayload) {
    loading.value = true
    error.value = null

    if (!authStore.companyId || !payload.vehicle_type_id) {
      error.value = 'Template name and vehicle type are required'
      loading.value = false
      return null
    }

    if (!itemCategories.value.length) {
      await fetchItemCategories()
    }

    const defaultCategoryId = itemCategories.value[0]?.id

    if (!defaultCategoryId) {
      error.value = 'Create an inspection item category before creating a template'
      loading.value = false
      return null
    }

    if (payload.is_default) {
      await clearDefaultTemplate(payload.vehicle_type_id)
    }

    const { data, error: createError } = await supabase
      .from('inspection_templates')
      .insert({
        ...payload,
        company_id: authStore.companyId,
      })
      .select('id')
      .single()

    if (createError || !data) {
      error.value = createError?.message || 'Template could not be created'
      loading.value = false
      return null
    }

    const { error: itemError } = await supabase
      .from('inspection_template_items')
      .insert({
        template_id: data.id,
        title: 'General condition',
        description: 'Inspect the vehicle and note any visible concerns.',
        category_id: defaultCategoryId,
        is_required: true,
        requires_photo: false,
        sort_order: 1,
      })

    if (itemError) {
      await supabase.from('inspection_templates').delete().eq('id', data.id)
      error.value = itemError.message
      loading.value = false
      return null
    }

    await fetchTemplates()
    loading.value = false
    return data.id as string
  }

  async function updateTemplate(id: string, payload: InspectionTemplatePayload) {
    loading.value = true
    error.value = null

    if (!authStore.companyId || !payload.vehicle_type_id) {
      error.value = 'Template name and vehicle type are required'
      loading.value = false
      return false
    }

    if (payload.is_default) {
      await clearDefaultTemplate(payload.vehicle_type_id, id)
    }

    const { error: updateError } = await supabase
      .from('inspection_templates')
      .update(payload)
      .eq('id', id)
      .eq('company_id', authStore.companyId)

    if (updateError) {
      error.value = updateError.message
      loading.value = false
      return false
    }

    await fetchTemplates()
    if (selectedTemplate.value?.id === id) await fetchTemplateById(id)
    loading.value = false
    return true
  }

  async function saveTemplateItems(templateId: string, items: TemplateItemDraft[]) {
    error.value = null

    const normalized = items.map((item, index) => ({
      ...item,
      title: item.title.trim(),
      description: item.description?.trim() || null,
      category_id: item.category_id,
      sort_order: index + 1,
    }))

    if (
      !normalized.length ||
      normalized.some((item) => !item.title || !item.category_id)
    ) {
      error.value = 'Each checklist item needs a title and category'
      return false
    }

    loading.value = true
    const currentIds = new Set(
      normalized.map((item) => item.id).filter(Boolean) as string[]
    )
    const removedIds = (selectedTemplate.value?.inspection_template_items || [])
      .map((item: any) => item.id)
      .filter((id: string) => !currentIds.has(id))

    if (removedIds.length) {
      const { error: deleteError } = await supabase
        .from('inspection_template_items')
        .delete()
        .in('id', removedIds)
        .eq('template_id', templateId)

      if (deleteError) {
        error.value = deleteError.message
        loading.value = false
        return false
      }
    }

    for (const item of normalized) {
      const row = {
        template_id: templateId,
        title: item.title,
        description: item.description,
        category_id: item.category_id,
        is_required: item.is_required,
        requires_photo: item.requires_photo,
        sort_order: item.sort_order,
      }
      const result = item.id
        ? await supabase
            .from('inspection_template_items')
            .update(row)
            .eq('id', item.id)
            .eq('template_id', templateId)
        : await supabase.from('inspection_template_items').insert(row)

      if (result.error) {
        error.value = result.error.message
        loading.value = false
        return false
      }
    }

    await fetchTemplateById(templateId)
    await fetchTemplates()
    loading.value = false
    return true
  }

  async function deleteTemplate(id: string) {
    loading.value = true
    error.value = null

    if (!authStore.companyId) {
      error.value = 'Company ID is missing'
      loading.value = false
      return false
    }

    const { error: deleteError } = await supabase
      .from('inspection_templates')
      .delete()
      .eq('id', id)
      .eq('company_id', authStore.companyId)

    if (deleteError) {
      error.value = deleteError.message
      loading.value = false
      return false
    }

    if (selectedTemplate.value?.id === id) selectedTemplate.value = null
    await fetchTemplates()
    loading.value = false
    return true
  }

  async function clearDefaultTemplate(vehicleTypeId: string, exceptId?: string) {
    if (!authStore.companyId) return

    let query = supabase
      .from('inspection_templates')
      .update({ is_default: false })
      .eq('company_id', authStore.companyId)
      .eq('vehicle_type_id', vehicleTypeId)

    if (exceptId) query = query.neq('id', exceptId)

    await query
  }

  function sortTemplateItems(template: any) {
    return {
      ...template,
      inspection_template_items: [...(template.inspection_template_items || [])].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
      ),
    }
  }

  async function setSearch(value: string) {
    search.value = value
    page.value = 1
    await fetchTemplates()
  }

  async function setVehicleTypeFilter(value: string) {
    vehicleTypeFilter.value = value
    page.value = 1
    await fetchTemplates()
  }

  async function setDefaultFilter(value: string) {
    defaultFilter.value = value
    page.value = 1
    await fetchTemplates()
  }

  async function setPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages.value) return
    page.value = nextPage
    await fetchTemplates()
  }

  async function setPageSize(size: number) {
    pageSize.value = size
    page.value = 1
    await fetchTemplates()
  }

  return {
    templates,
    selectedTemplate,
    vehicleTypes,
    itemCategories,
    loading,
    error,
    search,
    vehicleTypeFilter,
    defaultFilter,
    page,
    pageSize,
    total,
    totalPages,
    fetchTemplates,
    fetchTemplateById,
    fetchVehicleTypes,
    fetchItemCategories,
    createTemplate,
    updateTemplate,
    saveTemplateItems,
    deleteTemplate,
    setSearch,
    setVehicleTypeFilter,
    setDefaultFilter,
    setPage,
    setPageSize,
  }
})
