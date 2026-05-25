<template>
  <AppLayout title="Inspection Templates">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative flex-1 min-w-52">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="localSearch"
          class="input-field pl-9 py-2 text-sm"
          placeholder="Search templates..."
        />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Filter :size="15" class="text-gray-400" />
        <select
          v-model="templateStore.vehicleTypeFilter"
          class="input-field py-2 text-sm w-auto"
          @change="templateStore.setVehicleTypeFilter(templateStore.vehicleTypeFilter)"
        >
          <option value="all">All vehicle types</option>
          <option
            v-for="vehicleType in templateStore.vehicleTypes"
            :key="vehicleType.id"
            :value="vehicleType.id"
          >
            {{ vehicleType.name }}
          </option>
        </select>
        <select
          v-model="templateStore.defaultFilter"
          class="input-field py-2 text-sm w-auto"
          @change="templateStore.setDefaultFilter(templateStore.defaultFilter)"
        >
          <option value="all">All templates</option>
          <option value="default">Default only</option>
          <option value="custom">Custom only</option>
        </select>
      </div>

      <button class="btn-primary gap-2 text-sm" @click="openCreateModal">
        <Plus :size="16" />
        Create Template
      </button>
    </div>

    <div v-if="templateStore.loading" class="card p-6 text-sm text-gray-500">
      Loading inspection templates...
    </div>
    <div v-else-if="templateStore.error" class="card p-6 text-sm text-red-500">
      {{ templateStore.error }}
    </div>
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th
                v-for="header in headers"
                :key="header"
                class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap"
              >
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="templates.length === 0">
              <td :colspan="headers.length" class="px-4 py-12 text-center text-sm text-gray-400">
                No inspection templates found.
              </td>
            </tr>
            <tr
              v-for="template in templates"
              :key="template.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
              @click="router.push(`/inspection-templates/${template.id}`)"
            >
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {{ template.name }}
                </p>
                <p class="text-xs text-gray-400 max-w-xs truncate">
                  {{ template.description || "No description" }}
                </p>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {{ vehicleTypeName(template) }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {{ template.inspection_template_items.length }}
              </td>
              <td class="px-4 py-3">
                <span v-if="template.is_default" class="badge-blue">Default</span>
                <span v-else class="text-xs text-gray-400">—</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {{ formatDate(template.created_at) }}
              </td>
              <td class="px-4 py-3" @click.stop>
                <div class="flex items-center gap-1">
                  <button class="icon-btn" title="View template" @click="router.push(`/inspection-templates/${template.id}`)">
                    <Eye :size="15" />
                  </button>
                  <button class="icon-btn hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Edit template" @click="startEdit(template)">
                    <Pencil :size="15" />
                  </button>
                  <button class="icon-btn hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="Delete template" @click="confirmDelete(template)">
                    <Trash2 :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <BaseTablePagination
        :total="templateStore.total"
        :current-page="templateStore.page"
        :page-size="templateStore.pageSize"
        @update:current-page="templateStore.setPage"
        @update:page-size="templateStore.setPageSize"
      />
    </div>

    <InspectionTemplateFormModal
      v-model="showModal"
      :template="editingTemplate"
      :loading="templateStore.loading"
      @save="saveTemplate"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, Filter, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTablePagination from '@/components/shared/BaseTablePagination.vue'
import InspectionTemplateFormModal from '@/components/inspection-templates/InspectionTemplateFormModal.vue'
import { useInspectionTemplateStore, type InspectionTemplatePayload } from '@/stores/inspectionTemplateStore'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/app'
import { formatDateOnly } from '@/lib/dateFormat'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const templateStore = useInspectionTemplateStore()
const showModal = ref(false)
const editingTemplate = ref<any | null>(null)
const localSearch = ref(templateStore.search)
const headers = ['Template name', 'Vehicle type', 'Items', 'Default', 'Created', '']
let searchTimer: ReturnType<typeof setTimeout> | null = null

const templates = computed(() => templateStore.templates)

onMounted(() => templateStore.fetchVehicleTypes())

watch(
  () => authStore.companyId,
  async (companyId) => {
    if (companyId) await templateStore.fetchTemplates()
  },
  { immediate: true }
)

watch(localSearch, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => templateStore.setSearch(value), 350)
})

function vehicleTypeName(template: any) {
  return template.vehicle_types?.name || '—'
}

function formatDate(value: string | null) {
  return formatDateOnly(value, appStore.language)
}

function openCreateModal() {
  editingTemplate.value = null
  showModal.value = true
}

function startEdit(template: any) {
  editingTemplate.value = template
  showModal.value = true
}

async function saveTemplate(payload: InspectionTemplatePayload) {
  if (editingTemplate.value) {
    const saved = await templateStore.updateTemplate(editingTemplate.value.id, payload)
    if (saved) showModal.value = false
    return
  }

  const id = await templateStore.createTemplate(payload)
  if (id) {
    showModal.value = false
    await router.push(`/inspection-templates/${id}`)
  }
}

async function confirmDelete(template: any) {
  if (confirm(`Delete "${template.name}" and its checklist items?`)) {
    await templateStore.deleteTemplate(template.id)
  }
}
</script>

<style scoped>
.icon-btn {
  @apply w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200;
}
</style>
