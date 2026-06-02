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
  reference_photo_url: string | null
  sort_order: number
}

export type InspectionTemplatePayload = {
  name: string
  description: string | null
  vehicle_type_id: string
  is_default: boolean
  engine_hours_required: boolean
}

const templateSelect = `
  id,
  company_id,
  name,
  description,
  vehicle_type_id,
  is_default,
  engine_hours_required,
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
    reference_photo_url,
    sort_order,
    inspection_item_categories (
      id,
      name,
      severity
    )
  )
`

const templateSelectNoReferencePhoto = `
  id,
  company_id,
  name,
  description,
  vehicle_type_id,
  is_default,
  engine_hours_required,
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

const templateSelectNoEngineHours = `
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
    reference_photo_url,
    sort_order,
    inspection_item_categories (
      id,
      name,
      severity
    )
  )
`

const templateSelectLegacy = `
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
  const templateVehicleTypeIds = ref<string[]>([])
  const itemCategories = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const search = ref('')
  const vehicleTypeFilter = ref('all')
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const hasEngineHoursColumn = ref(true)
  const hasReferencePhotoColumn = ref(true)

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(total.value / pageSize.value))
  )

  function isMissingReferencePhotoColumnError(message?: string | null) {
    return String(message || '').toLowerCase().includes('reference_photo_url')
  }

  function isMissingEngineHoursColumnError(message?: string | null) {
    return String(message || '').toLowerCase().includes('engine_hours_required')
  }

  function currentTemplateSelect() {
    if (hasEngineHoursColumn.value && hasReferencePhotoColumn.value) return templateSelect
    if (hasEngineHoursColumn.value && !hasReferencePhotoColumn.value) return templateSelectNoReferencePhoto
    if (!hasEngineHoursColumn.value && hasReferencePhotoColumn.value) return templateSelectNoEngineHours
    return templateSelectLegacy
  }

  function normalizeTemplateItemColumns(template: any) {
    if (!template) return template

    return {
      ...template,
      engine_hours_required: !!template?.engine_hours_required,
      inspection_template_items: (template.inspection_template_items || []).map((item: any) => ({
        ...item,
        reference_photo_url: item?.reference_photo_url || null,
      })),
    }
  }

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

  async function fetchTemplateVehicleTypeUsage() {
    if (!authStore.companyId) {
      templateVehicleTypeIds.value = []
      return false
    }

    const { data, error: usageError } = await supabase
      .from('inspection_templates')
      .select('vehicle_type_id')
      .eq('company_id', authStore.companyId)

    if (usageError) {
      error.value = usageError.message
      templateVehicleTypeIds.value = []
      return false
    }

    templateVehicleTypeIds.value = [
      ...new Set((data || []).map((row) => row.vehicle_type_id).filter(Boolean)),
    ]
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

    const searchValue = search.value.trim()

    async function runTemplatesQuery(options: {
      useSearch: boolean
      useVehicleType: boolean
      requestedPage: number
    }) {
      const from = (options.requestedPage - 1) * pageSize.value
      const to = from + pageSize.value - 1

      let query = supabase
        .from('inspection_templates')
        .select(currentTemplateSelect(), { count: 'exact' })
        .eq('company_id', authStore.companyId)
        .order('created_at', { ascending: false })

      if (options.useVehicleType && vehicleTypeFilter.value !== 'all') {
        query = query.eq('vehicle_type_id', vehicleTypeFilter.value)
      }

      if (options.useSearch && searchValue) {
        query = query.or(`name.ilike.%${searchValue}%,description.ilike.%${searchValue}%`)
      }

      let response = await query.range(from, to)

      if (response.error && isMissingEngineHoursColumnError(response.error.message)) {
        hasEngineHoursColumn.value = false

        let retryQuery = supabase
          .from('inspection_templates')
          .select(currentTemplateSelect(), { count: 'exact' })
          .eq('company_id', authStore.companyId)
          .order('created_at', { ascending: false })

        if (options.useVehicleType && vehicleTypeFilter.value !== 'all') {
          retryQuery = retryQuery.eq('vehicle_type_id', vehicleTypeFilter.value)
        }

        if (options.useSearch && searchValue) {
          retryQuery = retryQuery.or(`name.ilike.%${searchValue}%,description.ilike.%${searchValue}%`)
        }

        response = await retryQuery.range(from, to)
      }

      if (response.error && isMissingReferencePhotoColumnError(response.error.message)) {
        hasReferencePhotoColumn.value = false

        let retryQuery = supabase
          .from('inspection_templates')
          .select(currentTemplateSelect(), { count: 'exact' })
          .eq('company_id', authStore.companyId)
          .order('created_at', { ascending: false })

        if (options.useVehicleType && vehicleTypeFilter.value !== 'all') {
          retryQuery = retryQuery.eq('vehicle_type_id', vehicleTypeFilter.value)
        }

        if (options.useSearch && searchValue) {
          retryQuery = retryQuery.or(`name.ilike.%${searchValue}%,description.ilike.%${searchValue}%`)
        }

        response = await retryQuery.range(from, to)
      }

      return response
    }

    let { data, count, error: templatesError } = await runTemplatesQuery({
      useSearch: true,
      useVehicleType: true,
      requestedPage: page.value,
    })

    const shouldResetHiddenFilters =
      !templatesError &&
      (count || 0) === 0 &&
      (searchValue.length > 0 || vehicleTypeFilter.value !== 'all' || page.value > 1)

    if (shouldResetHiddenFilters) {
      const fallback = await runTemplatesQuery({
        useSearch: false,
        useVehicleType: false,
        requestedPage: 1,
      })

      if (!fallback.error && (fallback.count || 0) > 0) {
        search.value = ''
        vehicleTypeFilter.value = 'all'
        page.value = 1
        data = fallback.data as any
        count = fallback.count as any
        templatesError = null
      }
    }

    if (templatesError) {
      error.value = templatesError.message
      templates.value = []
      total.value = 0
    } else {
      templates.value = (data || []).map((template: any) => sortTemplateItems(normalizeTemplateItemColumns(template)))
      total.value = count || 0
    }

    await fetchTemplateVehicleTypeUsage()
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

    let { data, error: templateError } = await supabase
      .from('inspection_templates')
      .select(currentTemplateSelect())
      .eq('id', id)
      .eq('company_id', authStore.companyId)
      .single()

    if (templateError && isMissingEngineHoursColumnError(templateError.message)) {
      hasEngineHoursColumn.value = false
      const retry = await supabase
        .from('inspection_templates')
        .select(currentTemplateSelect())
        .eq('id', id)
        .eq('company_id', authStore.companyId)
        .single()
      data = retry.data as any
      templateError = retry.error as any
    }

    if (templateError && isMissingReferencePhotoColumnError(templateError.message)) {
      hasReferencePhotoColumn.value = false
      const retry = await supabase
        .from('inspection_templates')
        .select(currentTemplateSelect())
        .eq('id', id)
        .eq('company_id', authStore.companyId)
        .single()
      data = retry.data as any
      templateError = retry.error as any
    }

    if (templateError) {
      error.value = templateError.message
      selectedTemplate.value = null
    } else {
      selectedTemplate.value = sortTemplateItems(normalizeTemplateItemColumns(data))
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

    const { data: existingTemplate, error: existingError } =
      await findTemplateByVehicleType(payload.vehicle_type_id)

    if (existingError) {
      error.value = existingError.message
      loading.value = false
      return null
    }

    if (existingTemplate) {
      error.value =
        'An inspection template for this vehicle type already exists. Edit the existing template instead.'
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

    const templateInsertRow: Record<string, any> = {
      name: payload.name,
      description: payload.description,
      vehicle_type_id: payload.vehicle_type_id,
      is_default: true,
      company_id: authStore.companyId,
    }

    if (hasEngineHoursColumn.value) {
      templateInsertRow.engine_hours_required = !!payload.engine_hours_required
    }

    let { data, error: createError } = await supabase
      .from('inspection_templates')
      .insert(templateInsertRow)
      .select('id')
      .single()

    if (createError && hasEngineHoursColumn.value && isMissingEngineHoursColumnError(createError.message)) {
      hasEngineHoursColumn.value = false
      delete templateInsertRow.engine_hours_required

      const retry = await supabase
        .from('inspection_templates')
        .insert(templateInsertRow)
        .select('id')
        .single()
      data = retry.data as any
      createError = retry.error as any
    }

    if (createError || !data) {
      error.value =
        createError?.code === '23505'
          ? 'An inspection template for this vehicle type already exists. Edit the existing template instead.'
          : createError?.message || 'Template could not be created'
      loading.value = false
      return null
    }

    const defaultItemRow: Record<string, any> = {
      template_id: data.id,
      title: 'General condition',
      description: 'Inspect the vehicle and note any visible concerns.',
      category_id: defaultCategoryId,
      is_required: true,
      requires_photo: false,
      sort_order: 1,
    }

    if (hasReferencePhotoColumn.value) {
      defaultItemRow.reference_photo_url = null
    }

    let { error: itemError } = await supabase
      .from('inspection_template_items')
      .insert(defaultItemRow)

    if (itemError && hasReferencePhotoColumn.value && isMissingReferencePhotoColumnError(itemError.message)) {
      hasReferencePhotoColumn.value = false
      const fallbackItemRow = {
        template_id: data.id,
        title: 'General condition',
        description: 'Inspect the vehicle and note any visible concerns.',
        category_id: defaultCategoryId,
        is_required: true,
        requires_photo: false,
        sort_order: 1,
      }
      const fallback = await supabase
        .from('inspection_template_items')
        .insert(fallbackItemRow)
      itemError = fallback.error
    }

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

    const { data: existingTemplate, error: existingError } =
      await findTemplateByVehicleType(payload.vehicle_type_id, id)

    if (existingError) {
      error.value = existingError.message
      loading.value = false
      return false
    }

    if (existingTemplate) {
      error.value =
        'An inspection template for this vehicle type already exists. Edit the existing template instead.'
      loading.value = false
      return false
    }

    const templateUpdateRow: Record<string, any> = {
      name: payload.name,
      description: payload.description,
      vehicle_type_id: payload.vehicle_type_id,
      is_default: true,
    }

    if (hasEngineHoursColumn.value) {
      templateUpdateRow.engine_hours_required = !!payload.engine_hours_required
    }

    let { error: updateError } = await supabase
      .from('inspection_templates')
      .update(templateUpdateRow)
      .eq('id', id)
      .eq('company_id', authStore.companyId)

    if (updateError && hasEngineHoursColumn.value && isMissingEngineHoursColumnError(updateError.message)) {
      hasEngineHoursColumn.value = false
      delete templateUpdateRow.engine_hours_required

      const retry = await supabase
        .from('inspection_templates')
        .update(templateUpdateRow)
        .eq('id', id)
        .eq('company_id', authStore.companyId)

      updateError = retry.error
    }

    if (updateError) {
      error.value =
        updateError.code === '23505'
          ? 'An inspection template for this vehicle type already exists. Edit the existing template instead.'
          : updateError.message
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
      reference_photo_url: item.reference_photo_url?.trim() || null,
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
      const row: Record<string, any> = {
        template_id: templateId,
        title: item.title,
        description: item.description,
        category_id: item.category_id,
        is_required: item.is_required,
        requires_photo: item.requires_photo,
        sort_order: item.sort_order,
      }

      if (hasReferencePhotoColumn.value) {
        row.reference_photo_url = item.reference_photo_url
      }

      const result = item.id
        ? await supabase
            .from('inspection_template_items')
            .update(row)
            .eq('id', item.id)
            .eq('template_id', templateId)
        : await supabase.from('inspection_template_items').insert(row)

      if (result.error && hasReferencePhotoColumn.value && isMissingReferencePhotoColumnError(result.error.message)) {
        hasReferencePhotoColumn.value = false
        delete row.reference_photo_url

        const retry = item.id
          ? await supabase
              .from('inspection_template_items')
              .update(row)
              .eq('id', item.id)
              .eq('template_id', templateId)
          : await supabase.from('inspection_template_items').insert(row)

        if (retry.error) {
          error.value = retry.error.message
          loading.value = false
          return false
        }

        continue
      }

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

  function clearError() {
    error.value = null
  }

  async function findTemplateByVehicleType(vehicleTypeId: string, exceptId?: string) {
    let query = supabase
      .from('inspection_templates')
      .select('id, name')
      .eq('company_id', authStore.companyId)
      .eq('vehicle_type_id', vehicleTypeId)
      .limit(1)

    if (exceptId) query = query.neq('id', exceptId)

    return query.maybeSingle()
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
    templateVehicleTypeIds,
    itemCategories,
    loading,
    error,
    search,
    vehicleTypeFilter,
    page,
    pageSize,
    total,
    totalPages,
    fetchTemplates,
    fetchTemplateById,
    fetchVehicleTypes,
    fetchTemplateVehicleTypeUsage,
    fetchItemCategories,
    createTemplate,
    updateTemplate,
    saveTemplateItems,
    deleteTemplate,
    clearError,
    setSearch,
    setVehicleTypeFilter,
    setPage,
    setPageSize,
  }
})
