<template>
  <AppLayout :title="store.t('settings')">

    <!-- Horizontal tabs -->
    <div class="flex items-center gap-1 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px"
        :class="activeTab === tab.id
          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
      >
        <component :is="tab.icon" :size="15" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Company Management -->
    <div v-if="activeTab === 'company'" class="space-y-5">
      <div class="card p-6">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 class="font-bold text-gray-900 dark:text-white mb-2">Business Management</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
              One owner can have more than five companies. There is no hard limit in the UI. Add as many businesses as your workspace needs.
            </p>
          </div>
          <div class="rounded-xl bg-blue-50 dark:bg-blue-900/20 px-4 py-3 min-w-44">
            <p class="text-xs uppercase tracking-wide text-blue-500 dark:text-blue-300">Companies in workspace</p>
            <p class="text-2xl font-bold text-blue-700 dark:text-blue-200">{{ companies.length }}</p>
          </div>
        </div>

        <div v-if="authStore.error" class="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {{ authStore.error }}
        </div>
        <div v-else-if="companyActionMessage" class="mt-4 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          {{ companyActionMessage }}
        </div>

        <div v-if="!authStore.isAuthenticated" class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <p class="font-semibold mb-1">You are not signed in.</p>
          <p class="mb-3">Sign in to add companies to your workspace, or create your first company account from the registration flow.</p>
          <div class="flex flex-wrap gap-2">
            <RouterLink to="/login" class="btn-primary text-sm px-4 py-2">Sign in</RouterLink>
            <RouterLink to="/register/company" class="btn-secondary text-sm px-4 py-2">Create first company</RouterLink>
          </div>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div class="card p-6">
          <div class="flex items-center justify-between gap-3 mb-4">
            <h3 class="font-semibold text-gray-900 dark:text-white">Your businesses</h3>
            <span class="text-xs text-gray-400 dark:text-gray-500">Unlimited list</span>
          </div>

          <div v-if="companies.length === 0" class="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No companies connected yet.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="company in companies"
              :key="company.company_id"
              class="rounded-2xl border px-4 py-4 transition-colors"
              :class="authStore.companyId === company.company_id
                ? 'border-blue-300 bg-blue-50/70 dark:border-blue-700 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'"
            >
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-1.5">
                    <h4 class="font-semibold text-gray-900 dark:text-white truncate">{{ company.company_name }}</h4>
                    <span v-if="authStore.companyId === company.company_id" class="badge-green">Active</span>
                    <span class="badge-blue">{{ company.role }}</span>
                    <span v-if="company.status" class="badge-gray">{{ company.status }}</span>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ company.industry || 'No industry selected' }}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ formatCompanyLocation(company) }}</p>
                </div>

                <div class="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    class="btn-secondary text-sm px-4 py-2"
                      :disabled="!authStore.isAuthenticated || authStore.companyId === company.company_id"
                    @click="switchCompany(company.company_id)"
                  >
                    {{ authStore.companyId === company.company_id ? 'Current' : 'Switch' }}
                  </button>
                  <button
                    type="button"
                    class="px-4 py-2 rounded-xl border text-sm font-medium transition-colors border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-40"
                    :disabled="!authStore.isAuthenticated"
                    @click="openDeleteCompany(company.company_id)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="card p-6">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Add business</h3>
            <form class="space-y-4" @submit.prevent="handleCreateCompany">
              <div>
                <label class="label">Company name *</label>
                <input v-model="createCompanyForm.name" class="input-field" placeholder="Prime Rentals" required />
              </div>
              <div>
                <label class="label">Industry</label>
                <select v-model="createCompanyForm.industry" class="input-field">
                  <option value="">Select industry</option>
                  <option v-for="o in industryOptions" :key="o">{{ o }}</option>
                </select>
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">Country</label>
                  <select v-model="createCompanyForm.country" class="input-field" @change="handleCreateCompanyCountryChange">
                    <option v-for="country in prioritizedCountries" :key="country.code" :value="country.name">{{ country.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="label">City</label>
                  <input v-model="createCompanyForm.city" class="input-field" placeholder="Chicago" />
                </div>
              </div>
              <div>
                <label class="label">Phone</label>
                <input
                  :value="createCompanyForm.phone"
                  class="input-field"
                  :placeholder="selectedCreateCompanyCountry.phonePlaceholder"
                  inputmode="tel"
                  @input="handleCreateCompanyPhoneInput"
                />
              </div>
              <div>
                <label class="label">Address</label>
                <AddressAutocomplete v-model="createCompanyForm.address" :country="createCompanyForm.country" placeholder="123 Fleet Street" />
              </div>
              <button type="submit" class="btn-primary text-sm w-full justify-center" :disabled="!authStore.isAuthenticated || authStore.loading || !createCompanyForm.name.trim()">
                {{ authStore.loading ? 'Creating...' : 'Create company' }}
              </button>
            </form>
          </div>

          <div v-if="deleteTarget" class="card p-6 border border-red-200 dark:border-red-800">
            <h3 class="font-semibold text-red-600 dark:text-red-300 mb-2">Delete company</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You are deleting <span class="font-semibold text-gray-900 dark:text-white">{{ deleteTarget?.company_name }}</span>.
              This action removes the company from your workspace. If you are the last member, it will be archived.
            </p>
            <p class="text-sm text-red-600 dark:text-red-300 mb-4">
              {{ companies.length === 1
                ? store.t('lastBusinessDeleteWarning')
                : store.t('deleteBusinessAccessWarning') }}
            </p>
            <div class="space-y-4">
              <div>
                <label class="label">Confirm with your password</label>
                <input v-model="deletePassword" type="password" class="input-field" placeholder="Current password" />
              </div>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  :disabled="authStore.loading || !deletePassword"
                  @click="handleDeleteCompany"
                >
                  {{ authStore.loading ? 'Deleting...' : 'Delete company' }}
                </button>
                <button type="button" class="btn-secondary text-sm px-4 py-2" @click="closeDeleteCompany">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Inspection Templates -->
    <div v-else-if="activeTab === 'templates'" class="space-y-5">
      <div class="card p-6">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 class="font-bold text-gray-900 dark:text-white mb-2">Inspection Templates</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
              Build reusable pre-trip and post-trip checklists for each vehicle type. Drivers can then use the right checklist instead of one static template for everything.
            </p>
          </div>
          <button type="button" class="btn-primary text-sm px-4 py-2 gap-2" @click="startCreateTemplate">
            <Plus :size="15" /> New template
          </button>
        </div>

        <div v-if="templatesError" class="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {{ templatesError }}
        </div>
        <div v-else-if="templatesMessage" class="mt-4 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          {{ templatesMessage }}
        </div>
      </div>

      <div class="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div class="card p-5">
          <div class="flex items-center justify-between gap-3 mb-4">
            <h3 class="font-semibold text-gray-900 dark:text-white">Saved templates</h3>
            <span class="text-xs text-gray-400 dark:text-gray-500">{{ inspectionTemplates.length }} total</span>
          </div>

          <div v-if="templatesLoading" class="text-sm text-gray-500 dark:text-gray-400">Loading templates...</div>
          <div v-else-if="inspectionTemplates.length === 0" class="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No templates yet. Create your first checklist for a vehicle type.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="template in inspectionTemplates"
              :key="template.id"
              class="rounded-2xl border px-4 py-4 transition-colors"
              :class="editingTemplateId === template.id
                ? 'border-blue-300 bg-blue-50/70 dark:border-blue-700 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <h4 class="font-semibold text-gray-900 dark:text-white truncate">{{ template.name }}</h4>
                    <span class="badge-blue">{{ template.vehicle_type }}</span>
                    <span class="badge-gray">{{ template.inspection_type }}</span>
                    <span class="badge-gray">{{ distanceUnitLabel(template.distance_unit) }}</span>
                    <span class="badge-gray">{{ dimensionUnitLabel(template.dimension_unit) }}</span>
                    <span v-if="template.is_active" class="badge-green">Active</span>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ template.items.filter((item) => item.enabled).length }} enabled items</p>
                </div>

                <div class="flex items-center gap-1">
                  <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" @click="startEditTemplate(template)">
                    <Pencil :size="14" />
                  </button>
                  <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" @click="deleteInspectionTemplate(template.id)">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-5 space-y-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ editingTemplateId ? 'Edit template' : 'Create template' }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Choose a vehicle type, then switch checklist items on or off.</p>
            </div>
            <button type="button" class="btn-secondary text-sm px-4 py-2" @click="resetTemplateForm">Reset</button>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="label">Template name *</label>
              <input v-model="templateForm.name" class="input-field" placeholder="e.g. My Fleet Semi Config" />
            </div>
            <div>
              <label class="label">Vehicle type *</label>
              <select v-model="templateForm.vehicle_type" class="input-field" @change="applyTemplatePreset(templateForm.vehicle_type)">
                <option v-for="vehicleType in vehicleTypeOptions" :key="vehicleType" :value="vehicleType">{{ vehicleType }}</option>
              </select>
            </div>
            <div>
              <label class="label">Inspection type</label>
              <select v-model="templateForm.inspection_type" class="input-field">
                <option value="pre-trip">Pre-trip</option>
                <option value="post-trip">Post-trip</option>
              </select>
            </div>
            <div>
              <label class="label">Distance unit</label>
              <select v-model="templateForm.distance_unit" class="input-field">
                <option v-for="option in distanceUnitOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </div>
            <div>
              <label class="label">Length unit</label>
              <select v-model="templateForm.dimension_unit" class="input-field">
                <option v-for="option in dimensionUnitOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </div>
            <label class="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
              <input v-model="templateForm.is_active" type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              Template is active and visible to drivers
            </label>
          </div>

          <div class="grid sm:grid-cols-3 gap-3">
            <div class="rounded-2xl bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
              <p class="text-xs uppercase tracking-wide text-blue-500 dark:text-blue-300">Checklist items</p>
              <p class="text-2xl font-bold text-blue-700 dark:text-blue-200">{{ templateForm.items.length }}</p>
            </div>
            <div class="rounded-2xl bg-green-50 dark:bg-green-900/20 px-4 py-3">
              <p class="text-xs uppercase tracking-wide text-green-500 dark:text-green-300">Required items</p>
              <p class="text-2xl font-bold text-green-700 dark:text-green-200">{{ templateForm.items.filter((item) => item.enabled && item.required).length }}</p>
            </div>
            <div class="rounded-2xl bg-purple-50 dark:bg-fuchsia-900/20 px-4 py-3">
              <p class="text-xs uppercase tracking-wide text-fuchsia-500 dark:text-fuchsia-300">Enabled items</p>
              <p class="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-200">{{ templateForm.items.filter((item) => item.enabled).length }}</p>
            </div>
          </div>

          <div class="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            <div v-for="item in templateForm.items" :key="item.id" class="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
              <div class="grid md:grid-cols-[0.8fr_1.3fr_auto] gap-3 items-center">
                <input v-model="item.section" class="input-field" placeholder="Section" />
                <input v-model="item.label" class="input-field" placeholder="Checklist item" />
                <button type="button" class="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" @click="removeTemplateItem(item.id)">
                  <Trash2 :size="14" />
                </button>
              </div>
              <div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <label class="inline-flex items-center gap-2">
                  <input v-model="item.required" type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  Required
                </label>
                <label class="inline-flex items-center gap-2">
                  <input v-model="item.enabled" type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  Enabled
                </label>
                <label class="inline-flex items-center gap-2">
                  <input v-model="item.photoEnabled" type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  Allow photo
                </label>
                <label class="inline-flex items-center gap-2">
                  <input v-model="item.photoRequired" type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" :disabled="!item.photoEnabled" />
                  Photo required
                </label>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <h4 class="font-medium text-gray-900 dark:text-white">Add custom checklist item</h4>
            <div class="grid md:grid-cols-[0.8fr_1.3fr_auto] gap-3 items-center">
              <input v-model="customItemSection" class="input-field" placeholder="Custom section" />
              <input v-model="customItemLabel" class="input-field" placeholder="Add custom checklist item..." @keydown.enter.prevent="addCustomTemplateItem" />
              <button type="button" class="btn-primary px-4 py-2 text-sm gap-2" @click="addCustomTemplateItem">
                <Plus :size="14" /> Add
              </button>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button type="button" class="btn-secondary px-5 py-2.5" @click="resetTemplateForm">Cancel</button>
            <button type="button" class="btn-primary px-6 py-2.5 gap-2" @click="saveInspectionTemplate">
              <Save :size="16" /> {{ editingTemplateId ? 'Save template' : 'Create template' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Fleet -->
    <div v-else-if="activeTab === 'fleet'" class="space-y-5">
      <div class="card p-6">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 class="font-bold text-gray-900 dark:text-white mb-2">Fleet Vehicles</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
              Each business keeps its own fleet. Add vehicles to the active business, then drivers will select from that fleet and the correct template will be matched by vehicle type.
            </p>
          </div>
          <RouterLink to="/vehicles" class="btn-primary text-sm px-4 py-2 gap-2 inline-flex">
            <Plus :size="15" /> Open fleet vehicles
          </RouterLink>
        </div>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between gap-3 mb-4">
          <h3 class="font-semibold text-gray-900 dark:text-white">Supported vehicle categories</h3>
          <span class="text-xs text-gray-400 dark:text-gray-500">{{ vehicleTypeOptions.length }} types</span>
        </div>

        <div class="flex flex-wrap gap-2">
          <span v-for="vehicleType in vehicleTypeOptions" :key="vehicleType" class="badge-blue">{{ vehicleType }}</span>
        </div>

        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Templates are business-scoped and vehicle-scoped: one business can have its own sedan template, while another business can keep a completely different sedan checklist.
        </p>
      </div>
    </div>

    <!-- Language -->
    <div v-else-if="activeTab === 'language'" class="card p-5">
      <h2 class="font-bold text-gray-900 dark:text-white mb-1">{{ store.t('languageSettings') }}</h2>
      <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">{{ store.t('chooseLanguage') }}</p>
      <div class="space-y-2">
        <button
          v-for="lang in languages"
          :key="lang.code"
          @click="store.setLanguage(lang.code)"
          class="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all"
          :class="store.language === lang.code ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'"
        >
          <span class="text-2xl">{{ lang.flag }}</span>
          <div class="flex-1 text-left">
            <p class="font-medium" :class="store.language === lang.code ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'">{{ lang.name }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ lang.native }}</p>
          </div>
          <div v-if="store.language === lang.code" class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <Check :size="13" class="text-white" />
          </div>
        </button>
      </div>
    </div>

    <!-- Theme -->
    <div v-else-if="activeTab === 'theme'" class="card p-5">
      <h2 class="font-bold text-gray-900 dark:text-white mb-1">{{ store.t('appearance') }}</h2>
      <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">{{ store.t('customizeAppearance') }}</p>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="opt in themeOptions"
          :key="opt.id"
          @click="selectTheme(opt.id)"
          class="p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all"
          :class="appTheme === opt.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'"
        >
          <div class="w-full h-16 rounded-lg border flex items-center justify-center overflow-hidden" :class="opt.preview">
            <component :is="opt.icon" :size="20" :class="opt.iconClass" />
          </div>
          <span class="text-sm font-medium" :class="appTheme === opt.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'">{{ opt.label }}</span>
          <div v-if="appTheme === opt.id" class="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"><Check :size="11" class="text-white" /></div>
        </button>
      </div>
    </div>

  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Building2, Globe, Sun, Moon, Check, ClipboardList, Plus, Pencil, Trash2, Save } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import type { Language } from '../stores/app'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAuthStore } from '../stores/authStore'
import AddressAutocomplete from '../components/shared/AddressAutocomplete.vue'
import { formatPhoneByCountry, getCountryOption, getPreferredCountryCode, getPrioritizedCountries } from '@/lib/companyForm'
import { supabase } from '@/lib/supabase'
import { vehicleTypeOptions } from '@/lib/vehicleCatalog'
import { defaultDimensionUnitForCountry, defaultDistanceUnitForCountry, dimensionUnitLabel, dimensionUnitOptions, distanceUnitLabel, distanceUnitOptions } from '@/lib/measurementUnits'

const store = useAppStore()
const authStore = useAuthStore()
const activeTab = ref('company')
const appTheme = ref<'light' | 'dark'>('light')
const companyActionMessage = ref('')
const deletePassword = ref('')
const deleteCompanyId = ref<string | null>(null)
const browserLocale = typeof navigator !== 'undefined' ? navigator.language : undefined
const defaultCountry = getCountryOption(getPreferredCountryCode(store.language, browserLocale))

const tabs = computed(() => [
  { id: 'company',  icon: Building2, label: store.t('companyProfile') },
  { id: 'templates', icon: ClipboardList, label: 'Inspection Templates' },
  { id: 'fleet', icon: Building2, label: 'Fleet Vehicles' },
  { id: 'language', icon: Globe,     label: store.t('languageSettings') },
  { id: 'theme',    icon: Sun,       label: store.t('appearance') },
])

type TemplateInspectionType = 'pre-trip' | 'post-trip'

type TemplateItemDraft = {
  id: string
  section: string
  label: string
  required: boolean
  enabled: boolean
  photoEnabled?: boolean
  photoRequired?: boolean
}

type InspectionTemplateRecord = {
  id: string
  name: string
  vehicle_type: string
  inspection_type: TemplateInspectionType
  is_active: boolean
  distance_unit: 'mi' | 'km'
  dimension_unit: 'ft' | 'yd' | 'm'
  items: TemplateItemDraft[]
  updated_at?: string
}

const presetTemplates: Record<string, TemplateItemDraft[]> = {
  'Sedan': [
    { id: crypto.randomUUID(), section: 'Tires', label: 'Tire pressure', required: true, enabled: true, photoEnabled: true, photoRequired: false },
    { id: crypto.randomUUID(), section: 'Lights', label: 'Headlights', required: true, enabled: true, photoEnabled: false, photoRequired: false },
    { id: crypto.randomUUID(), section: 'Brakes', label: 'Brake pedal', required: true, enabled: true, photoEnabled: false, photoRequired: false },
    { id: crypto.randomUUID(), section: 'Fluids', label: 'Engine oil', required: true, enabled: true, photoEnabled: true, photoRequired: false },
    { id: crypto.randomUUID(), section: 'Documents', label: 'Insurance', required: true, enabled: true, photoEnabled: true, photoRequired: true },
  ],
  'SUV': [
    { id: crypto.randomUUID(), section: 'Tires', label: 'Tread depth', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Lights', label: 'Turn signals', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Safety', label: 'Seat belts', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Interior', label: 'Interior cleanliness', required: false, enabled: true },
  ],
  'Pickup Truck': [
    { id: crypto.randomUUID(), section: 'Bed', label: 'Cargo area secure', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Brakes', label: 'Parking brake', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Lights', label: 'Brake lights', required: true, enabled: true },
  ],
  'Van': [
    { id: crypto.randomUUID(), section: 'Doors', label: 'Cargo doors', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Lights', label: 'Hazard lights', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Documents', label: 'Registration', required: true, enabled: true },
  ],
  'Box Truck': [
    { id: crypto.randomUUID(), section: 'Cargo', label: 'Lift gate', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Cargo', label: 'Cargo area secure', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Lights', label: 'Marker lights', required: true, enabled: true },
  ],
  'Semi Truck': [
    { id: crypto.randomUUID(), section: 'Tires', label: 'Tire pressure', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Lights', label: 'Headlights', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Brakes', label: 'Brake pedal', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Fluids', label: 'Engine oil', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Windshield', label: 'Wipers', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Mirrors', label: 'Left mirror', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Mirrors', label: 'Right mirror', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Documents', label: 'Registration', required: true, enabled: true },
  ],
  'Taxi': [
    { id: crypto.randomUUID(), section: 'Interior', label: 'Passenger cabin cleanliness', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Safety', label: 'Seat belts', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Lights', label: 'Interior dome lights', required: false, enabled: true },
  ],
  'Construction Equipment': [
    { id: crypto.randomUUID(), section: 'Hydraulics', label: 'Hydraulic hoses', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Safety', label: 'Backup alarm', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Exterior', label: 'Boom / arm condition', required: true, enabled: true },
  ],
  'Boom Lift': [
    { id: crypto.randomUUID(), section: 'Safety', label: 'Emergency stop', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Safety', label: 'Harness anchor points', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Hydraulics', label: 'Hydraulic leaks', required: true, enabled: true },
  ],
  'Crane': [
    { id: crypto.randomUUID(), section: 'Rigging', label: 'Hook latch', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Rigging', label: 'Cable condition', required: true, enabled: true },
    { id: crypto.randomUUID(), section: 'Safety', label: 'Outriggers', required: true, enabled: true },
  ],
  'Custom Vehicle': [
    { id: crypto.randomUUID(), section: 'General', label: 'Main operational check', required: true, enabled: true, photoEnabled: true, photoRequired: false },
  ],
}

const inspectionTemplates = ref<InspectionTemplateRecord[]>([])
const templatesLoading = ref(false)
const templatesMessage = ref('')
const templatesError = ref('')
const editingTemplateId = ref<string | null>(null)
const customItemLabel = ref('')
const customItemSection = ref('Custom')
const templateForm = reactive<InspectionTemplateRecord>({
  id: '',
  name: '',
  vehicle_type: 'Semi Truck',
  inspection_type: 'pre-trip',
  is_active: true,
  distance_unit: defaultDistanceUnitForCountry(authStore.currentCompany?.country),
  dimension_unit: defaultDimensionUnitForCountry(authStore.currentCompany?.country),
  items: [],
})

const languages = [
  { code: 'en' as Language, flag: '🇺🇸', name: 'English',   native: 'English' },
  { code: 'uk' as Language, flag: '🇺🇦', name: 'Ukrainian', native: 'Українська' },
  { code: 'es' as Language, flag: '🇪🇸', name: 'Spanish',   native: 'Español' },
  { code: 'fr' as Language, flag: '🇫🇷', name: 'French',    native: 'Français' },
]

const themeOptions = computed(() => [
  { id: 'light', icon: Sun,  label: store.t('lightMode'), preview: 'bg-white border-gray-200',    iconClass: 'text-gray-700' },
  { id: 'dark',  icon: Moon, label: store.t('darkMode'),  preview: 'bg-gray-900 border-gray-700', iconClass: 'text-gray-200' },
])

function selectTheme(id: string) {
  appTheme.value = id as 'light' | 'dark'
  if (id === 'light' && store.theme === 'dark') store.toggleTheme()
  if (id === 'dark'  && store.theme === 'light') store.toggleTheme()
}

const industryOptions = ['Trucking / Freight', 'Construction Equipment', 'Boom Lift Rental', 'Delivery Fleet', 'Taxi / Passenger', 'Service Vehicles', 'Other']
const companies = computed(() => authStore.companyMemberships)
const deleteTarget = computed(() => companies.value.find((company) => company.company_id === deleteCompanyId.value) || null)
const prioritizedCountries = computed(() => getPrioritizedCountries(store.language, browserLocale))
const selectedCreateCompanyCountry = computed(() => getCountryOption(createCompanyForm.country))

const createCompanyForm = reactive({
  name: '',
  country: defaultCountry.name,
  state: '',
  city: '',
  address: '',
  phone: '',
  industry: '',
})

onMounted(async () => {
  if (!authStore.companyMemberships.length) {
    await authStore.fetchCompanyMemberships()
  }

  resetTemplateForm()
  await fetchInspectionTemplates()
})

watch(() => authStore.companyId, async () => {
  resetTemplateForm()
  await fetchInspectionTemplates()
})

function resetCreateCompanyForm() {
  createCompanyForm.name = ''
  createCompanyForm.country = defaultCountry.name
  createCompanyForm.state = ''
  createCompanyForm.city = ''
  createCompanyForm.address = ''
  createCompanyForm.phone = ''
  createCompanyForm.industry = ''
}

function formatCompanyLocation(company: {
  city?: string | null
  state?: string | null
  country?: string | null
  address?: string | null
}) {
  const location = [company.city, company.state, company.country].filter(Boolean).join(', ')

  if (location) {
    return location
  }

  return company.address || 'No location provided'
}

function handleCreateCompanyCountryChange() {
  createCompanyForm.phone = formatPhoneByCountry(createCompanyForm.phone, createCompanyForm.country)
}

function handleCreateCompanyPhoneInput(event: Event) {
  createCompanyForm.phone = formatPhoneByCountry((event.target as HTMLInputElement).value, createCompanyForm.country)
}

function cloneTemplateItems(items: TemplateItemDraft[]) {
  return items.map((item) => ({
    id: crypto.randomUUID(),
    section: item.section,
    label: item.label,
    required: item.required,
    enabled: item.enabled,
    photoEnabled: item.photoEnabled ?? false,
    photoRequired: item.photoRequired ?? false,
  }))
}

function resetTemplateForm() {
  editingTemplateId.value = null
  templateForm.id = ''
  templateForm.name = ''
  templateForm.vehicle_type = 'Semi Truck'
  templateForm.inspection_type = 'pre-trip'
  templateForm.is_active = true
  templateForm.distance_unit = defaultDistanceUnitForCountry(authStore.currentCompany?.country)
  templateForm.dimension_unit = defaultDimensionUnitForCountry(authStore.currentCompany?.country)
  templateForm.items = cloneTemplateItems(presetTemplates['Semi Truck'] || [])
  customItemLabel.value = ''
  customItemSection.value = 'Custom'
  templatesError.value = ''
}

function startCreateTemplate() {
  resetTemplateForm()
  templatesMessage.value = ''
}

function startEditTemplate(template: InspectionTemplateRecord) {
  editingTemplateId.value = template.id
  templateForm.id = template.id
  templateForm.name = template.name
  templateForm.vehicle_type = template.vehicle_type
  templateForm.inspection_type = template.inspection_type
  templateForm.is_active = template.is_active
  templateForm.distance_unit = template.distance_unit || defaultDistanceUnitForCountry(authStore.currentCompany?.country)
  templateForm.dimension_unit = template.dimension_unit || defaultDimensionUnitForCountry(authStore.currentCompany?.country)
  templateForm.items = cloneTemplateItems(template.items || [])
  templatesError.value = ''
  templatesMessage.value = ''
}

function applyTemplatePreset(vehicleType: string) {
  if (editingTemplateId.value) {
    return
  }

  templateForm.items = cloneTemplateItems(presetTemplates[vehicleType] || presetTemplates['Custom Vehicle'] || [])
}

function addCustomTemplateItem() {
  if (!customItemLabel.value.trim()) {
    return
  }

  templateForm.items.push({
    id: crypto.randomUUID(),
    section: customItemSection.value.trim() || 'Custom',
    label: customItemLabel.value.trim(),
    required: true,
    enabled: true,
    photoEnabled: false,
    photoRequired: false,
  })

  customItemLabel.value = ''
}

function removeTemplateItem(itemId: string) {
  templateForm.items = templateForm.items.filter((item) => item.id !== itemId)
}

async function fetchInspectionTemplates() {
  if (!authStore.companyId) {
    inspectionTemplates.value = []
    return
  }

  templatesLoading.value = true
  templatesError.value = ''

  const { data, error } = await supabase
    .from('inspection_templates')
    .select('id, name, vehicle_type, inspection_type, is_active, distance_unit, dimension_unit, items, updated_at')
    .eq('company_id', authStore.companyId)
    .order('updated_at', { ascending: false })

  if (error) {
    templatesError.value = error.message
    inspectionTemplates.value = []
    templatesLoading.value = false
    return
  }

  inspectionTemplates.value = (data || []).map((template) => ({
    id: template.id,
    name: template.name,
    vehicle_type: template.vehicle_type,
    inspection_type: template.inspection_type as TemplateInspectionType,
    is_active: template.is_active,
    distance_unit: (template.distance_unit || defaultDistanceUnitForCountry(authStore.currentCompany?.country)) as 'mi' | 'km',
    dimension_unit: (template.dimension_unit || defaultDimensionUnitForCountry(authStore.currentCompany?.country)) as 'ft' | 'yd' | 'm',
    items: Array.isArray(template.items) ? template.items as TemplateItemDraft[] : [],
    updated_at: template.updated_at,
  }))

  templatesLoading.value = false
}

async function saveInspectionTemplate() {
  templatesError.value = ''
  templatesMessage.value = ''

  if (!authStore.user?.id || !authStore.companyId) {
    templatesError.value = 'Sign in and choose an active company first.'
    return
  }

  if (!templateForm.name.trim()) {
    templatesError.value = 'Template name is required.'
    return
  }

  if (templateForm.items.filter((item) => item.enabled && item.label.trim()).length === 0) {
    templatesError.value = 'Add at least one enabled checklist item.'
    return
  }

  const payload = {
    company_id: authStore.companyId,
    created_by_user_id: authStore.user.id,
    name: templateForm.name.trim(),
    vehicle_type: templateForm.vehicle_type,
    inspection_type: templateForm.inspection_type,
    is_active: templateForm.is_active,
    distance_unit: templateForm.distance_unit,
    dimension_unit: templateForm.dimension_unit,
    items: templateForm.items
      .map((item) => ({
        id: item.id,
        section: item.section.trim() || 'General',
        label: item.label.trim(),
        required: item.required,
        enabled: item.enabled,
        photoEnabled: item.photoEnabled ?? false,
        photoRequired: item.photoRequired ?? false,
      }))
      .filter((item) => item.label),
  }

  const query = editingTemplateId.value
    ? supabase.from('inspection_templates').update(payload).eq('id', editingTemplateId.value)
    : supabase.from('inspection_templates').insert(payload)

  const { error } = await query

  if (error) {
    templatesError.value = error.message
    return
  }

  templatesMessage.value = editingTemplateId.value ? 'Template updated.' : 'Template created.'
  await fetchInspectionTemplates()
  resetTemplateForm()
}

async function deleteInspectionTemplate(templateId: string) {
  templatesError.value = ''
  templatesMessage.value = ''

  const { error } = await supabase
    .from('inspection_templates')
    .delete()
    .eq('id', templateId)

  if (error) {
    templatesError.value = error.message
    return
  }

  if (editingTemplateId.value === templateId) {
    resetTemplateForm()
  }

  templatesMessage.value = 'Template deleted.'
  await fetchInspectionTemplates()
}

function switchCompany(companyId: string) {
  authStore.setActiveCompany(companyId)
  companyActionMessage.value = 'Active company updated.'
}

function openDeleteCompany(companyId: string) {
  deleteCompanyId.value = companyId
  deletePassword.value = ''
  companyActionMessage.value = ''
}

function closeDeleteCompany() {
  deleteCompanyId.value = null
  deletePassword.value = ''
}

async function handleCreateCompany() {
  companyActionMessage.value = ''

  const success = await authStore.createCompany({
    name: createCompanyForm.name.trim(),
    country: createCompanyForm.country.trim(),
    state: createCompanyForm.state.trim(),
    city: createCompanyForm.city.trim(),
    address: createCompanyForm.address.trim(),
    phone: createCompanyForm.phone.trim(),
    industry: createCompanyForm.industry.trim(),
  })

  if (!success) {
    return
  }

  companyActionMessage.value = 'Company created and added to your workspace.'
  resetCreateCompanyForm()
}

async function handleDeleteCompany() {
  if (!deleteTarget.value || !deletePassword.value) {
    return
  }

  companyActionMessage.value = ''

  const success = await authStore.deleteCompany(deleteTarget.value.company_id, deletePassword.value)

  if (!success) {
    return
  }

  companyActionMessage.value = `Company "${deleteTarget.value.company_name}" was removed from your workspace.`
  closeDeleteCompany()
}
</script>
