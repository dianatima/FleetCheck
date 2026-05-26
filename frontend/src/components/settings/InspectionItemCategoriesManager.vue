<template>
  <div>
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
      <div>
        <h2 class="text-sm font-medium text-gray-700 dark:text-gray-200">
          Inspection Item Categories
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage reusable checklist categories and default severity levels.
        </p>
      </div>

      <button class="btn-primary gap-2 text-sm" @click="openCreateModal">
        <Plus :size="16" />
        Add Category
      </button>
    </div>

    <div v-if="categoryStore.success" class="card p-4 mb-4 text-sm text-green-600 dark:text-green-400">
      {{ categoryStore.success }}
    </div>
    <div v-if="categoryStore.error" class="card p-4 mb-4 text-sm text-red-500">
      {{ categoryStore.error }}
    </div>

    <div v-if="categoryStore.loading" class="card p-6 text-sm text-gray-500">
      Loading inspection item categories...
    </div>
    <div v-else class="card overflow-hidden">
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
import { onMounted, ref } from 'vue'
import { Pencil, Plus, Trash2 } from 'lucide-vue-next'
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
const headers = ['Name', 'Severity', 'Sort Order', 'Created', 'Actions']

onMounted(() => categoryStore.fetchCategories())

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
.icon-btn {
  @apply w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200;
}
</style>
