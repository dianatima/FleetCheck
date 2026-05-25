<template>
  <AppLayout title="Inspection Template">
    <RouterLink
      to="/inspection-templates"
      class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors"
    >
      <ArrowLeft :size="16" />
      Back to Templates
    </RouterLink>

    <div v-if="templateStore.loading && !template" class="card p-6 text-sm text-gray-500">
      Loading template...
    </div>
    <div v-else-if="templateStore.error && !template" class="card p-6 text-sm text-red-500">
      {{ templateStore.error }}
    </div>
    <div v-else-if="!template" class="card p-6 text-sm text-gray-500">
      Template not found.
    </div>

    <template v-else>
      <section class="card p-5 mb-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ template.name }}
              </h2>
              <span v-if="template.is_default" class="badge-blue">Default</span>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              {{ template.description || "No description provided." }}
            </p>
            <div class="flex flex-wrap gap-2 mt-3 text-xs">
              <span class="badge-gray">{{ template.vehicle_types?.name || "Unknown vehicle type" }}</span>
              <span class="badge-gray">{{ items.length }} checklist items</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button class="btn-secondary gap-2 text-sm" @click="showEditModal = true">
              <Pencil :size="15" />
              Edit Template
            </button>
            <button class="btn-danger gap-2 text-sm" @click="deleteCurrentTemplate">
              <Trash2 :size="15" />
              Delete
            </button>
          </div>
        </div>
      </section>

      <section class="card p-5">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Checklist Items
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Drag rows or use the arrow controls to persist inspection order.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-secondary gap-2 text-sm" @click="addItem">
              <Plus :size="15" />
              Add Item
            </button>
            <button class="btn-primary gap-2 text-sm" :disabled="templateStore.loading" @click="saveItems">
              <Save :size="15" />
              Save Items
            </button>
          </div>
        </div>

        <p
          v-if="itemError || templateStore.error"
          class="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400"
        >
          {{ itemError || templateStore.error }}
        </p>

        <div class="space-y-3">
          <TemplateItemEditor
            v-for="(item, index) in items"
            :key="item.id || `draft-${index}`"
            :item="item"
            :index="index"
            :count="items.length"
            @update="updateItem"
            @remove="removeItem"
            @move="moveItem"
            @drag-start="dragIndex = $event"
            @drop-on="dropItem"
          />
        </div>
      </section>
    </template>

    <InspectionTemplateFormModal
      v-model="showEditModal"
      :template="template"
      :loading="templateStore.loading"
      @save="saveTemplateMeta"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Pencil, Plus, Save, Trash2 } from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'
import InspectionTemplateFormModal from '@/components/inspection-templates/InspectionTemplateFormModal.vue'
import TemplateItemEditor from '@/components/inspection-templates/TemplateItemEditor.vue'
import { useAuthStore } from '@/stores/authStore'
import {
  useInspectionTemplateStore,
  type InspectionTemplatePayload,
  type TemplateItemDraft,
} from '@/stores/inspectionTemplateStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const templateStore = useInspectionTemplateStore()
const templateId = computed(() => route.params.id as string)
const template = computed(() => templateStore.selectedTemplate)
const items = ref<TemplateItemDraft[]>([])
const showEditModal = ref(false)
const itemError = ref('')
const dragIndex = ref<number | null>(null)

watch(
  () => authStore.companyId,
  async (companyId) => {
    if (companyId) {
      await templateStore.fetchTemplateById(templateId.value)
      await templateStore.fetchVehicleTypes()
    }
  },
  { immediate: true }
)

watch(
  () => template.value?.inspection_template_items,
  (nextItems) => {
    items.value = (nextItems || []).map((item: any, index: number) => ({
      id: item.id,
      title: item.title || '',
      description: item.description || null,
      category: item.category || null,
      is_required: Boolean(item.is_required),
      requires_photo: Boolean(item.requires_photo),
      sort_order: index + 1,
    }))
  },
  { immediate: true }
)

function addItem() {
  if (items.value.some((item) => !item.title.trim())) {
    itemError.value = 'Finish the empty checklist item before adding another.'
    return
  }

  itemError.value = ''
  items.value.push({
    title: '',
    description: null,
    category: null,
    is_required: true,
    requires_photo: false,
    sort_order: items.value.length + 1,
  })
}

function updateItem(index: number, patch: Partial<TemplateItemDraft>) {
  items.value[index] = { ...items.value[index], ...patch }
  itemError.value = ''
}

function removeItem(index: number) {
  if (items.value.length === 1) {
    itemError.value = 'A template must keep at least one checklist item.'
    return
  }

  items.value.splice(index, 1)
  syncSortOrder()
}

function moveItem(from: number, to: number) {
  if (to < 0 || to >= items.value.length || from === to) return
  const [item] = items.value.splice(from, 1)
  items.value.splice(to, 0, item)
  syncSortOrder()
}

function dropItem(index: number) {
  if (dragIndex.value === null) return
  moveItem(dragIndex.value, index)
  dragIndex.value = null
}

function syncSortOrder() {
  items.value = items.value.map((item, index) => ({
    ...item,
    sort_order: index + 1,
  }))
  itemError.value = ''
}

async function saveItems() {
  if (!template.value) return
  const saved = await templateStore.saveTemplateItems(template.value.id, items.value)
  if (saved) itemError.value = ''
}

async function saveTemplateMeta(payload: InspectionTemplatePayload) {
  if (!template.value) return
  const saved = await templateStore.updateTemplate(template.value.id, payload)
  if (saved) showEditModal.value = false
}

async function deleteCurrentTemplate() {
  if (!template.value) return
  if (confirm(`Delete "${template.value.name}" and its checklist items?`)) {
    const deleted = await templateStore.deleteTemplate(template.value.id)
    if (deleted) await router.push('/inspection-templates')
  }
}
</script>

<style scoped>
.btn-danger {
  @apply inline-flex items-center justify-center px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors;
}
</style>
