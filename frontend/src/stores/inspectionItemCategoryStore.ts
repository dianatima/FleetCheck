import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export type InspectionItemCategorySeverity = 'low' | 'medium' | 'high'

export type InspectionItemCategoryPayload = {
  name: string
  severity: InspectionItemCategorySeverity
  sort_order?: number | null
}

export type InspectionItemCategory = InspectionItemCategoryPayload & {
  id: string
  sort_order: number
  created_at: string | null
}

const severities = ['low', 'medium', 'high']

export const useInspectionItemCategoryStore = defineStore(
  'inspectionItemCategories',
  () => {
    const categories = ref<InspectionItemCategory[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const success = ref<string | null>(null)
    const page = ref(1)
    const pageSize = ref(10)
    const total = ref(0)

    const totalPages = computed(() =>
      Math.max(1, Math.ceil(total.value / pageSize.value))
    )

    async function fetchCategories() {
      loading.value = true
      error.value = null

      const from = (page.value - 1) * pageSize.value
      const to = from + pageSize.value - 1
      const { data, count, error: fetchError } = await supabase
        .from('inspection_item_categories')
        .select('id, name, severity, sort_order, created_at', { count: 'exact' })
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
        .range(from, to)

      if (fetchError) {
        error.value = fetchError.message
        categories.value = []
        total.value = 0
      } else {
        categories.value = (data || []).map((category: any) => ({
          ...category,
          sort_order: Number(category.sort_order || 0),
        }))
        total.value = count || 0
      }

      loading.value = false
    }

    async function createCategory(payload: InspectionItemCategoryPayload) {
      const normalized = normalizePayload(payload)
      if (!normalized) return false

      loading.value = true
      error.value = null
      success.value = null

      const { error: createError } = await supabase
        .from('inspection_item_categories')
        .insert(normalized)

      if (createError) {
        error.value = createError.message
        loading.value = false
        return false
      }

      success.value = 'Category created.'
      await fetchCategories()
      loading.value = false
      return true
    }

    async function updateCategory(
      id: string,
      payload: InspectionItemCategoryPayload
    ) {
      const normalized = normalizePayload(payload)
      if (!normalized) return false

      loading.value = true
      error.value = null
      success.value = null

      const { error: updateError } = await supabase
        .from('inspection_item_categories')
        .update(normalized)
        .eq('id', id)

      if (updateError) {
        error.value = updateError.message
        loading.value = false
        return false
      }

      success.value = 'Category updated.'
      await fetchCategories()
      loading.value = false
      return true
    }

    async function deleteCategory(category: InspectionItemCategory) {
      loading.value = true
      error.value = null
      success.value = null

      const { count, error: usageError } = await supabase
        .from('inspection_template_items')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', category.id)

      if (usageError) {
        error.value = usageError.message
        loading.value = false
        return false
      }

      if ((count || 0) > 0) {
        error.value =
          'This category is used by inspection template items and cannot be deleted.'
        loading.value = false
        return false
      }

      const { error: deleteError } = await supabase
        .from('inspection_item_categories')
        .delete()
        .eq('id', category.id)

      if (deleteError) {
        error.value = deleteError.message
        loading.value = false
        return false
      }

      success.value = 'Category deleted.'
      if (categories.value.length === 1 && page.value > 1) page.value -= 1
      await fetchCategories()
      loading.value = false
      return true
    }

    async function setPage(nextPage: number) {
      if (nextPage < 1 || nextPage > totalPages.value) return
      page.value = nextPage
      await fetchCategories()
    }

    async function setPageSize(size: number) {
      pageSize.value = size
      page.value = 1
      await fetchCategories()
    }

    function clearMessages() {
      error.value = null
      success.value = null
    }

    function normalizePayload(payload: InspectionItemCategoryPayload) {
      const name = payload.name.trim()
      const severity = payload.severity

      error.value = null
      success.value = null

      if (!name) {
        error.value = 'Category name is required.'
        return null
      }

      if (!severities.includes(severity)) {
        error.value = 'Severity is required.'
        return null
      }

      return {
        name,
        severity,
        sort_order: Number(payload.sort_order || 0),
      }
    }

    return {
      categories,
      loading,
      error,
      success,
      page,
      pageSize,
      total,
      totalPages,
      fetchCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      setPage,
      setPageSize,
      clearMessages,
    }
  }
)
