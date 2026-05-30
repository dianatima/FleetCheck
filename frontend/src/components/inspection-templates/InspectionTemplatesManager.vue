<template>
  <div class="card overflow-hidden">
    <div class="section-header">
      <div>
        <h2 class="section-title">Inspection Templates</h2>
        <p class="section-description">
          Manage reusable inspection templates for different vehicle types.
        </p>
      </div>
    </div>

    <div class="section-toolbar">
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
      </div>

      <button
        class="btn-primary gap-2 text-sm disabled:opacity-45 disabled:cursor-not-allowed"
        :disabled="!canCreateTemplate"
        :title="canCreateTemplate ? 'Create Inspection Template' : noVehicleTypesMessage"
        @click="openCreateModal"
      >
        <Plus :size="16" />
        Create Inspection Template
      </button>
      <p v-if="!canCreateTemplate" class="basis-full text-xs text-gray-500 dark:text-gray-400">
        {{ noVehicleTypesMessage }}
      </p>
    </div>

    <div v-if="templateStore.loading" class="p-6 text-sm text-gray-500">
      Loading inspection templates...
    </div>
    <div v-else-if="templateStore.error && !showModal" class="p-6 text-sm text-red-500">
      {{ templateStore.error }}
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
            <tr v-if="templates.length === 0">
              <td :colspan="headers.length" class="px-4 py-12 text-center text-sm text-gray-400">
                No inspection templates found.
              </td>
            </tr>
            <tr
              v-for="template in templates"
              :key="template.id"
              class="border-b border-gray-100/70 dark:border-gray-800/70 hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors cursor-pointer"
              @click="openTemplate(template.id)"
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
                <div class="flex flex-col gap-1">
                  <span>{{ vehicleTypeName(template) }}</span>
                  <span class="inline-flex w-fit rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                    {{ inspectionModeLabel(template) }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {{ template.inspection_template_items.length }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {{ formatDate(template.created_at) }}
              </td>
              <td class="px-4 py-3" @click.stop>
                <div class="flex items-center gap-1">
                  <button class="icon-btn" title="View template" @click="openTemplate(template.id)">
                    <Eye :size="15" />
                  </button>
                  <button class="icon-btn hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Edit inspection template" @click="startEdit(template)">
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
      :vehicle-types="modalVehicleTypes"
      :error="showModal ? templateStore.error : null"
      :loading="templateStore.loading"
      @save="saveTemplate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, Filter, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
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
const headers = ['Template name', 'Vehicle type', 'Items', 'Created', '']
let searchTimer: ReturnType<typeof setTimeout> | null = null

const templates = computed(() => templateStore.templates)
const modalVehicleTypes = computed(() => templateStore.vehicleTypes)
const canCreateTemplate = computed(() => templateStore.vehicleTypes.length > 0)
const noVehicleTypesMessage = 'Add at least one vehicle type before creating inspection templates.'

onMounted(async () => {
  await templateStore.fetchVehicleTypes()
})

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

function inspectionModeLabel(template: any) {
  if (template.inspection_mode === 'pre-trip') return 'Pre-trip'
  if (template.inspection_mode === 'post-trip') return 'Post-trip'
  return 'Custom'
}

function formatDate(value: string | null) {
  return formatDateOnly(value, appStore.language)
}

function openTemplate(id: string) {
  router.push(`/settings/inspection-templates/${id}`)
}

async function openCreateModal() {
  if (!canCreateTemplate.value) return
  templateStore.clearError()
  await templateStore.fetchVehicleTypes()
  editingTemplate.value = null
  showModal.value = true
}

async function startEdit(template: any) {
  templateStore.clearError()
  await templateStore.fetchVehicleTypes()
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
    await router.push(`/settings/inspection-templates/${id}`)
  }
}

async function confirmDelete(template: any) {
  if (confirm(`Delete "${template.name}" and its checklist items?`)) {
    await templateStore.deleteTemplate(template.id)
  }
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
