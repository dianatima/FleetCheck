<template>
  <div class="card overflow-hidden">
    <div class="section-header">
      <div>
        <h2 class="section-title">
          Inspection Item Categories
        </h2>
        <p class="section-description">
          Manage reusable checklist categories and default severity levels.
        </p>
      </div>
    </div>

    <div class="section-toolbar">
      <div class="relative flex-1 min-w-52">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="localSearch"
          class="input-field pl-9 py-2 text-sm"
          placeholder="Search categories..."
        />
      </div>

      <div class="flex items-center gap-2">
        <Filter :size="15" class="text-gray-400" />
        <select
          v-model="categoryStore.severityFilter"
          class="input-field py-2 text-sm w-auto"
          @change="categoryStore.setSeverityFilter(categoryStore.severityFilter)"
        >
          <option value="all">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <button class="btn-primary gap-2 text-sm" @click="openCreateModal">
        <Plus :size="16" />
        Add Category
      </button>
    </div>

    <div v-if="categoryStore.success" class="mx-6 mt-4 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-600 dark:border-green-900/30 dark:bg-green-900/10 dark:text-green-400">
      {{ categoryStore.success }}
    </div>
    <div v-if="categoryStore.error" class="mx-6 mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-500 dark:border-red-900/30 dark:bg-red-900/10">
      {{ categoryStore.error }}
    </div>

    <div v-if="categoryStore.loading" class="p-6 text-sm text-gray-500">
      Loading inspection item categories...
    </div>
    <div v-else>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="table-header-row">
              <th v-for="header in headers" :key="header" class="table-th">
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="categoryStore.categories.length === 0">
              <td :colspan="headers.length" class="px-4 py-12 text-center text-sm text-gray-400">
                No inspection item categories found.
              </td>
            </tr>
            <tr
              v-for="category in categoryStore.categories"
              :key="category.id"
              class="border-b border-gray-100/70 dark:border-gray-800/70 hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors"
            >
              <td class="px-4 py-3">
                <p class="table-main">{{ category.name }}</p>
              </td>
              <td class="px-4 py-3">
                <span :class="severityBadge(category.severity)">
                  {{ severityLabel(category.severity) }}
                </span>
              </td>
              <td class="table-td">{{ category.sort_order || 0 }}</td>
              <td class="table-td">{{ formatDate(category.created_at) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <button
                    class="icon-btn hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    title="Edit category"
                    @click="startEdit(category)"
                  >
                    <Pencil :size="15" />
                  </button>
                  <button
                    class="icon-btn hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Delete category"
                    @click="confirmDelete(category)"
                  >
                    <Trash2 :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <BaseTablePagination
        :total="categoryStore.total"
        :current-page="categoryStore.page"
        :page-size="categoryStore.pageSize"
        @update:current-page="categoryStore.setPage"
        @update:page-size="categoryStore.setPageSize"
      />
    </div>

    <InspectionItemCategoryFormModal
      v-model="showModal"
      :category="editingCategory"
      :loading="categoryStore.loading"
      @save="saveCategory"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Filter, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import BaseTablePagination from '@/components/shared/BaseTablePagination.vue'
import InspectionItemCategoryFormModal from '@/components/settings/InspectionItemCategoryFormModal.vue'
import { useAppStore } from '@/stores/app'
import {
  useInspectionItemCategoryStore,
  type InspectionItemCategory,
  type InspectionItemCategoryPayload,
  type InspectionItemCategorySeverity,
} from '@/stores/inspectionItemCategoryStore'
import { formatDateOnly } from '@/lib/dateFormat'

const appStore = useAppStore()
const categoryStore = useInspectionItemCategoryStore()
const showModal = ref(false)
const editingCategory = ref<InspectionItemCategory | null>(null)
const localSearch = ref(categoryStore.search)
const headers = ['Name', 'Severity', 'Sort Order', 'Created', 'Actions']
let searchTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => categoryStore.fetchCategories())

watch(localSearch, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => categoryStore.setSearch(value), 350)
})

function openCreateModal() {
  categoryStore.clearMessages()
  editingCategory.value = null
  showModal.value = true
}

function startEdit(category: InspectionItemCategory) {
  categoryStore.clearMessages()
  editingCategory.value = category
  showModal.value = true
}

async function saveCategory(payload: InspectionItemCategoryPayload) {
  const saved = editingCategory.value
    ? await categoryStore.updateCategory(editingCategory.value.id, payload)
    : await categoryStore.createCategory(payload)

  if (saved) {
    showModal.value = false
    editingCategory.value = null
  }
}

async function confirmDelete(category: InspectionItemCategory) {
  if (!confirm(`Delete category "${category.name}"?`)) return
  await categoryStore.deleteCategory(category)
}

function severityLabel(severity: InspectionItemCategorySeverity) {
  return {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  }[severity]
}

function severityBadge(severity: InspectionItemCategorySeverity) {
  return {
    low: 'badge-green',
    medium: 'badge-orange',
    high: 'badge-red',
  }[severity]
}

function formatDate(value: string | null) {
  return formatDateOnly(value, appStore.language)
}
</script>

<style scoped>
.section-header {
  @apply p-6 border-b border-gray-100 dark:border-gray-700;
}

.section-title {
  @apply font-bold text-gray-900 dark:text-white;
}

.section-description {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-1;
}

.section-toolbar {
  @apply flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900;
}

.icon-btn {
  @apply w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200;
}
</style>
