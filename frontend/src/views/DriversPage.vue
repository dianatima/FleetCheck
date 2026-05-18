<template>
  <AppLayout title="Drivers">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative flex-1 min-w-48">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" class="input-field pl-9 py-2 text-sm" :placeholder="store.t('searchDrivers')" />
      </div>
      <div class="flex items-center gap-2">
        <Filter :size="15" class="text-gray-400" />
        <select v-model="filterStatus" class="input-field py-2 text-sm w-auto">
          <option value="all">{{ store.t('allStatus') }}</option>
          <option value="active">{{ store.t('statusActive') }}</option>
          <option value="pending">{{ store.t('statusPending') }}</option>
          <option value="inactive">{{ store.t('statusInactive') }}</option>
        </select>
      </div>
    </div>

    <div v-if="authStore.currentCompany" class="card p-4 mb-5 flex flex-wrap items-center justify-between gap-4 text-sm">
      <div class="min-w-0 flex-1">
        <p class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{{ store.t('activeBusiness') }}</p>
        <p class="font-semibold text-gray-900 dark:text-white">{{ authStore.currentCompany.company_name }}</p>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-xl">
          {{ store.t('driverInvitationsHelp') }}
        </p>
      </div>
      <button type="button" class="btn-primary gap-2 text-sm" @click="showInviteModal = true">
        <Plus :size="16" /> {{ store.t('driverInvitations') }}
      </button>
    </div>

    <!-- Summary badges -->
    <div class="flex flex-wrap gap-2 mb-5">
      <span class="badge-green">{{ drivers.filter(d => d.status === 'active').length }} {{ store.t('statusActive') }}</span>
      <span class="badge-yellow">{{ drivers.filter(d => d.status === 'pending').length }} {{ store.t('statusPending') }}</span>
      <span class="badge-gray">{{ drivers.filter(d => d.status === 'inactive').length }} {{ store.t('statusInactive') }}</span>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3">{{ store.t('driver') }}</th>
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ store.t('phone') }}</th>
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ store.t('licenseHash') }}</th>
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ store.t('licExpiry') }}</th>
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ store.t('medExpiry') }}</th>
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ store.t('allowedVehicles') }}</th>
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ store.t('availability') }}</th>
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3">{{ store.t('status') }}</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="9" class="text-center py-12 text-sm text-gray-400">{{ store.t('noDriversFound') }}</td>
            </tr>
            <tr
              v-for="d in filtered"
              :key="d.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
              @click="openCard(d)"
            >
              <!-- Driver name -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <img
                    v-if="d.avatarUrl"
                    :src="d.avatarUrl"
                    :alt="d.name"
                    class="h-9 w-9 rounded-full border border-gray-200 object-cover dark:border-gray-700"
                    referrerpolicy="no-referrer"
                  />
                  <div v-else class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" :style="{ background: d.avatarColor }">
                    {{ initials(d.name) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ d.name }}</p>
                    <p class="text-xs text-gray-400">{{ d.email }}</p>
                    <div class="mt-1 flex flex-wrap items-center gap-1.5">
                      <span v-if="driverMetaLine(d)" class="text-[11px] text-gray-500 dark:text-gray-400">{{ driverMetaLine(d) }}</span>
                      <span :class="inspectionStateBadge(d.inspectionState)">{{ inspectionStateLabel(d.inspectionState) }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <!-- Phone -->
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ d.phone }}</td>
              <!-- License # -->
              <td class="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ d.licenseNo }}</td>
              <!-- License expiry — red if expired -->
              <td class="px-4 py-3 text-sm whitespace-nowrap font-medium" :class="isExpired(d.licenseExpiry) ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'">
                <div class="flex items-center gap-1">
                  <AlertCircle v-if="isExpired(d.licenseExpiry)" :size="13" class="flex-shrink-0" />
                  {{ d.licenseExpiry ? formatDate(d.licenseExpiry) : '—' }}
                </div>
              </td>
              <!-- Med card expiry — red if expired -->
              <td class="px-4 py-3 text-sm whitespace-nowrap font-medium" :class="isExpired(d.medCardExpiry) ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'">
                <div class="flex items-center gap-1">
                  <AlertCircle v-if="isExpired(d.medCardExpiry)" :size="13" class="flex-shrink-0" />
                  {{ d.medCardExpiry ? formatDate(d.medCardExpiry) : '—' }}
                </div>
              </td>
              <!-- Allowed vehicles -->
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span v-for="t in d.allowedVehicles" :key="t" class="badge-blue text-[10px]">{{ t }}</span>
                  <span v-if="!d.allowedVehicles.length" class="text-xs text-gray-400">—</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-col gap-1 min-w-44">
                  <span :class="driverAvailabilityBadge(d)">{{ driverAvailabilityLabel(d) }}</span>
                  <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{{ driverAvailabilityHint(d) }}</p>
                </div>
              </td>
              <!-- Status -->
              <td class="px-4 py-3">
                <div class="flex flex-col gap-1">
                  <span :class="statusConfig[d.status].badge">{{ statusConfig[d.status].label }}</span>
                  <p v-if="pendingReason(d)" class="text-xs text-amber-600 dark:text-amber-300 leading-relaxed">{{ pendingReason(d) }}</p>
                </div>
              </td>
              <!-- Actions — stop propagation so row click doesn't also trigger -->
              <td class="px-4 py-3" @click.stop>
                <div class="flex items-center gap-1 flex-wrap justify-end">
                  <button
                    v-if="d.status === 'pending'"
                    @click="updateDriverStatus(d, 'active')"
                    class="btn-secondary px-2.5 py-1 text-xs"
                  >
                    {{ store.t('approveDriver') }}
                  </button>
                  <button
                    v-if="d.status === 'pending'"
                    @click="updateDriverStatus(d, 'inactive')"
                    class="btn-secondary px-2.5 py-1 text-xs text-red-600 dark:text-red-300"
                  >
                    {{ store.t('rejectDriver') }}
                  </button>
                  <button
                    v-if="d.status !== 'pending'"
                    @click="updateDriverStatus(d, 'pending')"
                    class="btn-secondary px-2.5 py-1 text-xs"
                  >
                    {{ store.t('statusPending') }}
                  </button>
                  <button @click="startEdit(d)" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                    <Pencil :size="14" />
                  </button>
                  <button @click="confirmDelete(d)" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showInviteModal" class="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showInviteModal = false" />
          <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
              <div>
                <p class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{{ store.t('driverInvitations') }}</p>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ store.t('inviteDriversTo') }} {{ authStore.currentCompany?.company_name }}</h2>
              </div>
              <button @click="showInviteModal = false" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X :size="18" />
              </button>
            </div>

            <div class="p-6 space-y-4">
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ store.t('businessInviteCodeHelp') }}</p>

              <div v-if="inviteMessage" class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                {{ inviteMessage }}
              </div>

              <div v-if="!companyInviteCode" class="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {{ store.t('noBusinessInviteCode') }}
              </div>

              <div v-else class="rounded-xl border border-gray-200 px-4 py-4 dark:border-gray-700">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{{ store.t('businessInviteCode') }}</p>
                    <p class="font-mono text-sm font-semibold text-gray-900 dark:text-white">{{ companyInviteCode }}</p>
                  </div>
                  <span class="badge-blue">{{ store.t('statusActive') }}</span>
                </div>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ store.t('businessInviteCodeHelp') }}</p>
                <div class="mt-4 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
                  <p class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{{ store.t('driverRegistrationLink') }}</p>
                  <a :href="driverRegistrationLink" target="_blank" rel="noreferrer" class="mt-1 block break-all text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                    {{ driverRegistrationLink }}
                  </a>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="copyInvite(companyInviteCode)">{{ store.t('copyCode') }}</button>
                  <button type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="copyInviteLink(companyInviteCode)">{{ store.t('copyLink') }}</button>
                  <a :href="driverRegistrationLink" target="_blank" rel="noreferrer" class="btn-secondary px-3 py-1.5 text-xs">{{ store.t('openRegistrationPage') }}</a>
                  <button type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="handleRefreshInviteCode">{{ store.t('rotateBusinessCode') }}</button>
                </div>
              </div>

              <div v-if="!companyInviteCode" class="flex justify-end">
                <button type="button" class="btn-primary gap-2 px-4 py-2.5 text-sm" @click="handleRefreshInviteCode">
                  <Plus :size="16" /> {{ store.t('generateBusinessCode') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ─── Add/Edit Driver Modal ─── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeModal" />
          <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ editingId ? store.t('editDriver') : store.t('addDriver') }}</h2>
              <button @click="closeModal" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X :size="18" />
              </button>
            </div>

            <form @submit.prevent="handleSave" class="p-6 space-y-6">
              <div v-if="modalError" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {{ modalError }}
              </div>

              <!-- Personal Info -->
              <section>
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <User :size="15" class="text-blue-500" /> {{ store.t('personalInformation') }}
                </h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('firstName') }} <span class="text-red-500">*</span></label>
                    <input v-model="form.firstName" class="input-field" placeholder="John" required />
                  </div>
                  <div>
                    <label class="label">{{ store.t('lastName') }} <span class="text-red-500">*</span></label>
                    <input v-model="form.lastName" class="input-field" placeholder="Smith" required />
                  </div>
                  <div>
                    <label class="label">{{ store.t('emailField') }} <span class="text-red-500">*</span></label>
                    <input v-model="form.email" class="input-field" type="email" placeholder="john@company.com" required :disabled="Boolean(editingId)" />
                    <p v-if="editingId" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ store.t('driverAuthManagedByDriver') }}</p>
                  </div>
                  <div>
                    <label class="label">{{ store.t('phone') }}</label>
                    <input v-model="form.phone" class="input-field" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div>
                    <label class="label">{{ store.t('dateOfBirth') }}</label>
                    <input v-model="form.birthday" class="input-field" type="date" />
                  </div>
                  <div>
                    <label class="label">{{ store.t('temporaryPassword') }} <span v-if="!editingId" class="text-red-500">*</span></label>
                    <div class="relative">
                      <input v-model="form.tempPassword" :type="showPass ? 'text' : 'password'" class="input-field pr-10" placeholder="••••••••" :required="!editingId" :disabled="Boolean(editingId)" />
                      <button type="button" @click="showPass = !showPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" :disabled="Boolean(editingId)">
                        <EyeOff v-if="showPass" :size="15" /><Eye v-else :size="15" />
                      </button>
                    </div>
                    <p v-if="editingId" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ store.t('driverAuthManagedByDriver') }}</p>
                  </div>
                </div>
                <div class="mt-4">
                  <label class="label">{{ store.t('homeAddress') }}</label>
                  <div class="relative">
                    <MapPin :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input v-model="form.address" class="input-field pl-9" placeholder="123 Main St, City, State" />
                  </div>
                </div>
                <div class="mt-4">
                  <label class="label">{{ store.t('profilePhoto') }}</label>
                  <input type="file" accept="image/*" class="input-field text-sm" @change="onAdminAvatarSelected" />
                  <img v-if="adminAvatarPreview" :src="adminAvatarPreview" alt="Driver avatar preview" class="mt-3 h-28 w-28 rounded-2xl border border-gray-200 object-cover dark:border-gray-700" />
                </div>
              </section>

              <!-- Emergency Contact -->
              <section class="border border-red-200 dark:border-red-800 rounded-xl p-4 bg-red-50/40 dark:bg-red-900/10">
                <h3 class="text-sm font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                  <Heart :size="15" /> {{ store.t('emergencyContact') }}
                </h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('contactName') }}</label>
                    <input v-model="form.emergencyName" class="input-field" placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label class="label">{{ store.t('contactPhone') }}</label>
                    <input v-model="form.emergencyPhone" class="input-field" placeholder="+1 555-9999" />
                  </div>
                </div>
              </section>

              <!-- Driver License -->
              <section class="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <FileText :size="15" class="text-blue-500" /> {{ store.t('driverLicense') }}
                </h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('licenseNumber') }} <span class="text-red-500">*</span></label>
                    <input v-model="form.licenseNo" class="input-field" placeholder="DL-123456" required />
                  </div>
                  <div>
                    <label class="label">{{ store.t('licenseClass') }} <span class="text-red-500">*</span></label>
                    <select v-model="form.licenseClass" class="input-field" required>
                      <option value="">{{ store.t('selectClass') }}</option>
                      <option v-for="c in licenseClasses" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="label">{{ store.t('expiryDate') }}</label>
                    <input v-model="form.licenseExpiry" class="input-field" type="date" />
                  </div>
                </div>
                <div class="mt-4">
                  <label class="label">{{ store.t('licensePhoto') }}</label>
                  <input type="file" accept="image/*" class="input-field text-sm" @change="onAdminLicenseSelected" />
                  <img v-if="adminLicensePreview" :src="adminLicensePreview" alt="License document preview" class="mt-3 h-36 rounded-xl border border-gray-200 object-cover dark:border-gray-700" />
                </div>
              </section>

              <!-- Medical Card -->
              <section class="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <FileText :size="15" class="text-green-500" /> {{ store.t('medicalCard') }}
                </h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('medicalCardNumber') }}</label>
                    <input v-model="form.medCardNo" class="input-field" placeholder="MC-123456" />
                  </div>
                  <div>
                    <label class="label">{{ store.t('expiryDate') }}</label>
                    <input v-model="form.medCardExpiry" class="input-field" type="date" />
                  </div>
                </div>
                <div class="mt-4">
                  <label class="label">{{ store.t('medicalCardPhoto') }}</label>
                  <input type="file" accept="image/*" class="input-field text-sm" @change="onAdminMedicalSelected" />
                  <img v-if="adminMedicalPreview" :src="adminMedicalPreview" alt="Medical document preview" class="mt-3 h-36 rounded-xl border border-gray-200 object-cover dark:border-gray-700" />
                </div>
              </section>

              <!-- Employment -->
              <section>
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <Briefcase :size="15" class="text-blue-500" /> {{ store.t('employment') }}
                </h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('hireDate') }}</label>
                    <input v-model="form.hireDate" class="input-field" type="date" />
                  </div>
                  <div>
                    <label class="label">{{ store.t('status') }} <span class="text-red-500">*</span></label>
                    <select v-model="form.status" class="input-field" required>
                      <option v-for="s in driverStatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                    </select>
                  </div>
                </div>
                <div class="mt-4">
                  <label class="label">{{ store.t('allowedVehicleTypes') }}</label>
                  <div class="flex flex-wrap gap-2 mt-1">
                    <button
                      v-for="t in vehicleTypes"
                      :key="t"
                      type="button"
                      @click="toggleVehicleType(t)"
                      class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                      :class="form.allowedVehicles.includes(t)
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'"
                    >{{ t }}</button>
                  </div>
                </div>
              </section>

              <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button type="button" @click="closeModal" class="btn-secondary px-5 py-2.5">{{ store.t('cancel') }}</button>
                <button type="submit" class="btn-primary px-6 py-2.5 gap-2"><Save :size="16" /> {{ store.t('saveDriver') }}</button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, Plus, X, Save, Pencil, Trash2, User, MapPin, Heart, FileText, Briefcase, Eye, EyeOff, AlertCircle } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '@/lib/supabase'
import { uploadDriverAvatar, uploadDriverDocument } from '@/api/storage'
const store = useAppStore()
const authStore = useAuthStore()

const router = useRouter()

// ─── State ───
const search = ref('')
const filterStatus = ref('all')
const showModal = ref(false)
const showInviteModal = ref(false)
const editingId = ref<string | number | null>(null)
const showPass = ref(false)
const inviteMessage = ref('')
const companyInviteCode = computed(() => authStore.currentCompany?.driver_invite_code || '')
const driverRegistrationLink = computed(() => {
  if (!companyInviteCode.value) {
    return `${window.location.origin}/register/driver`
  }

  return `${window.location.origin}/register/driver?code=${encodeURIComponent(companyInviteCode.value)}`
})

// ─── Config ───
const licenseClasses = ['Class A CDL', 'Class B CDL', 'Class C CDL', 'Class D', 'Class E', 'Motorcycle']
const vehicleTypes = ['Truck', 'Van', 'Car', 'Equipment', 'Bus', 'Trailer', 'Pickup', 'Other']
const driverStatuses = computed(() => [
  { value: 'active',   label: store.t('statusActive') },
  { value: 'pending',  label: store.t('statusPending') },
  { value: 'inactive', label: store.t('statusInactive') },
])
const statusConfig = computed((): Record<string, { label: string; badge: string }> => ({
  'active':   { label: store.t('statusActive'),   badge: 'badge-green' },
  'pending':  { label: store.t('statusPending'),  badge: 'badge-yellow' },
  'inactive': { label: store.t('statusInactive'), badge: 'badge-gray' },
}))
const avatarColors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16']

// ─── Helpers ───
const TODAY = new Date().toISOString().split('T')[0]

function isExpired(date: string) {
  return !!date && date < TODAY
}

function resolveDriverStatus(currentStatus: string, licenseExpiry: string, medCardExpiry: string) {
  if (currentStatus === 'inactive') {
    return 'inactive'
  }

  return isExpired(licenseExpiry) || isExpired(medCardExpiry) ? 'pending' : currentStatus
}

function pendingReason(driver: Driver) {
  if (driver.status !== 'pending') {
    return ''
  }

  return isExpired(driver.licenseExpiry) || isExpired(driver.medCardExpiry)
    ? store.t('pendingDueExpiredDocuments')
    : ''
}

function formatDate(d: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function avatarColorFor(value: string, index: number) {
  const seed = `${value}-${index}`
  const total = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return avatarColors[total % avatarColors.length]
}

// ─── Type ───
interface Driver {
  id: string | number; name: string; email: string; phone: string; birthday: string
  authUserId?: string
  avatarUrl?: string
  licensePhotoUrl?: string
  medCardPhotoUrl?: string
  address: string; emergencyName: string; emergencyPhone: string
  licenseNo: string; licenseClass: string; licenseExpiry: string
  medCardNo: string; medCardExpiry: string; hireDate: string
  status: string; allowedVehicles: string[]; avatarColor: string
  availability_status?: 'available' | 'busy'; activeCompanyName?: string; activeVehicleName?: string; activeServiceType?: string
  updatedAt?: string; profileUpdatedAt?: string; lastInspectionAt?: string
  inspectionState: 'pretrip-done' | 'inspection-pending' | 'inactive'
}

const driverUiCopy = {
  en: {
    yearsOld: 'y.o.',
    inCompany: 'in company',
    yearShort: 'y',
    monthShort: 'mo',
    pretripDone: 'Pre-trip done today',
    pretripPending: 'Pre-trip pending',
    inactive: 'Inactive 5d+',
  },
  uk: {
    yearsOld: 'р.',
    inCompany: 'у компанії',
    yearShort: 'р',
    monthShort: 'міс',
    pretripDone: 'Претріп зроблено сьогодні',
    pretripPending: 'Претріп не зроблено',
    inactive: 'Без активності 5+ днів',
  },
  es: {
    yearsOld: 'años',
    inCompany: 'en la empresa',
    yearShort: 'a',
    monthShort: 'mes',
    pretripDone: 'Pre-viaje hecho hoy',
    pretripPending: 'Pre-viaje pendiente',
    inactive: 'Sin actividad 5+d',
  },
  fr: {
    yearsOld: 'ans',
    inCompany: "dans l'entreprise",
    yearShort: 'a',
    monthShort: 'm',
    pretripDone: 'Pré-voyage fait aujourd’hui',
    pretripPending: 'Pré-voyage en attente',
    inactive: 'Inactif 5j+',
  },
} as const

function driverCopy() {
  return driverUiCopy[(store.language as keyof typeof driverUiCopy) || 'en'] || driverUiCopy.en
}

function calculateAge(birthday: string) {
  if (!birthday) return null
  const birthDate = new Date(birthday)
  if (Number.isNaN(birthDate.getTime())) return null

  const now = new Date()
  let years = now.getFullYear() - birthDate.getFullYear()
  const monthDiff = now.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    years -= 1
  }

  return years >= 0 ? years : null
}

function calculateMonthsInCompany(hireDate: string) {
  if (!hireDate) return null
  const startedAt = new Date(hireDate)
  if (Number.isNaN(startedAt.getTime())) return null

  const now = new Date()
  let months = (now.getFullYear() - startedAt.getFullYear()) * 12 + (now.getMonth() - startedAt.getMonth())

  if (now.getDate() < startedAt.getDate()) {
    months -= 1
  }

  return months >= 0 ? months : 0
}

function companyTenureLabel(hireDate: string) {
  const months = calculateMonthsInCompany(hireDate)

  if (months === null) {
    return ''
  }

  const copy = driverCopy()

  if (months < 12) {
    return `${months}${copy.monthShort} ${copy.inCompany}`
  }

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  return remainingMonths > 0
    ? `${years}${copy.yearShort} ${remainingMonths}${copy.monthShort} ${copy.inCompany}`
    : `${years}${copy.yearShort} ${copy.inCompany}`
}

function daysSince(value?: string) {
  if (!value) return Number.POSITIVE_INFINITY
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY
  return Math.floor((Date.now() - date.getTime()) / 86400000)
}

function inspectionStateLabel(state: Driver['inspectionState']) {
  const copy = driverCopy()

  if (state === 'pretrip-done') return copy.pretripDone
  if (state === 'inactive') return copy.inactive
  return copy.pretripPending
}

function inspectionStateBadge(state: Driver['inspectionState']) {
  if (state === 'pretrip-done') return 'badge-green'
  if (state === 'inactive') return 'badge-gray'
  return 'badge-red'
}

function driverMetaLine(driver: Driver) {
  const copy = driverCopy()
  const parts: string[] = []
  const age = calculateAge(driver.birthday)
  const tenure = companyTenureLabel(driver.hireDate)

  if (age !== null) {
    parts.push(`${age} ${copy.yearsOld}`)
  }

  if (tenure) {
    parts.push(tenure)
  }

  return parts.join(' • ')
}

function isDriverBusy(driver: Driver) {
  return driver.availability_status === 'busy' || Boolean(driver.activeCompanyName || driver.activeVehicleName || driver.activeServiceType)
}

function driverAvailabilityLabel(driver: Driver) {
  return isDriverBusy(driver) ? store.t('availabilityBusy') : store.t('availabilityAvailable')
}

function driverAvailabilityHint(driver: Driver) {
  if (!isDriverBusy(driver)) {
    return store.t('availabilityReadyHint')
  }

  const segments = []

  if (driver.activeCompanyName) {
    segments.push(`${store.t('availabilityBusiness')}: ${driver.activeCompanyName}`)
  }

  if (driver.activeVehicleName) {
    segments.push(`${store.t('availabilityVehicle')}: ${driver.activeVehicleName}`)
  }

  if (driver.activeServiceType) {
    segments.push(`${store.t('availabilityService')}: ${driver.activeServiceType}`)
  }

  return segments.join(' · ') || store.t('availabilityAssignedElsewhere')
}

function driverAvailabilityBadge(driver: Driver) {
  return isDriverBusy(driver) ? 'badge-yellow' : 'badge-green'
}

function inspectionSortRank(driver: Driver) {
  if (driver.inspectionState === 'pretrip-done') return 0
  if (driver.inspectionState === 'inspection-pending') return 1
  return 2
}

// ─── Card ───
function openCard(d: Driver) { router.push(`/drivers/${d.id}`) }

// ─── Form ───
const defaultForm = () => ({
  firstName: '', lastName: '', email: '', phone: '', birthday: '', tempPassword: '',
  address: '', emergencyName: '', emergencyPhone: '',
  licenseNo: '', licenseClass: '', licenseExpiry: '',
  medCardNo: '', medCardExpiry: '',
  hireDate: '', status: 'active', allowedVehicles: [] as string[],
})
const form = ref(defaultForm())
const modalError = ref('')
const adminAvatarFile = ref<File | null>(null)
const adminLicenseFile = ref<File | null>(null)
const adminMedicalFile = ref<File | null>(null)
const adminAvatarPreview = ref('')
const adminLicensePreview = ref('')
const adminMedicalPreview = ref('')

function fileIdentity(file: File | null) {
  if (!file) return ''
  return `${file.name}-${file.size}-${file.lastModified}`
}

function hasDuplicateDocumentFiles(license: File | null, medical: File | null) {
  return Boolean(license && medical && fileIdentity(license) === fileIdentity(medical))
}

function resetAdminMediaState() {
  adminAvatarFile.value = null
  adminLicenseFile.value = null
  adminMedicalFile.value = null
  adminAvatarPreview.value = ''
  adminLicensePreview.value = ''
  adminMedicalPreview.value = ''
  modalError.value = ''
}

function onAdminAvatarSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] || null
  adminAvatarFile.value = file
  adminAvatarPreview.value = file ? URL.createObjectURL(file) : adminAvatarPreview.value
}

function onAdminLicenseSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] || null

  if (hasDuplicateDocumentFiles(file, adminMedicalFile.value)) {
    modalError.value = store.t('driverDocumentsMustDiffer')
    ;(event.target as HTMLInputElement).value = ''
    return
  }

  modalError.value = ''
  adminLicenseFile.value = file
  adminLicensePreview.value = file ? URL.createObjectURL(file) : adminLicensePreview.value
}

function onAdminMedicalSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] || null

  if (hasDuplicateDocumentFiles(adminLicenseFile.value, file)) {
    modalError.value = store.t('driverDocumentsMustDiffer')
    ;(event.target as HTMLInputElement).value = ''
    return
  }

  modalError.value = ''
  adminMedicalFile.value = file
  adminMedicalPreview.value = file ? URL.createObjectURL(file) : adminMedicalPreview.value
}

function toggleVehicleType(t: string) {
  const idx = form.value.allowedVehicles.indexOf(t)
  if (idx === -1) form.value.allowedVehicles.push(t)
  else form.value.allowedVehicles.splice(idx, 1)
}

function openAddModal() {
  form.value = defaultForm()
  editingId.value = null
  resetAdminMediaState()
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  form.value = defaultForm()
  showPass.value = false
  resetAdminMediaState()
}

async function copyInvite(value: string) {
  await navigator.clipboard.writeText(value)
  inviteMessage.value = `${store.t('inviteCodeCopied')} ${value}`
}

async function copyInviteLink(code: string) {
  const link = `${window.location.origin}/register/driver?code=${encodeURIComponent(code)}`
  await navigator.clipboard.writeText(link)
  inviteMessage.value = store.t('inviteLinkCopied')
}

async function handleRefreshInviteCode() {
  const hadCode = Boolean(companyInviteCode.value)
  const invite = await authStore.createDriverInvite()

  if (!invite) {
    return
  }

  inviteMessage.value = hadCode ? store.t('businessInviteCodeUpdated') : store.t('businessInviteCodeCreated')
}

async function updateDriverStatus(driver: Driver, nextStatus: 'active' | 'inactive' | 'pending') {
  const resolvedStatus = nextStatus === 'active'
    ? resolveDriverStatus(nextStatus, driver.licenseExpiry, driver.medCardExpiry)
    : nextStatus

  const { error: driverError } = await supabase
    .from('drivers')
    .update({ status: resolvedStatus })
    .eq('id', driver.id)

  if (driverError) {
    console.error('Unable to update driver status.', driverError)
    return
  }

  if (driver.authUserId) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ status: resolvedStatus })
      .eq('auth_user_id', driver.authUserId)

    if (profileError) {
      console.error('Unable to update driver profile status.', profileError)
    }
  }

  inviteMessage.value = resolvedStatus === 'active'
    ? store.t('driverApproved')
    : resolvedStatus === 'inactive'
      ? store.t('driverRejected')
      : store.t('statusPending')
  await fetchDrivers()
}

function startEdit(d: Driver) {
  const [firstName, ...rest] = d.name.split(' ')
  form.value = {
    firstName, lastName: rest.join(' '), email: d.email, phone: d.phone,
    birthday: d.birthday, tempPassword: '', address: d.address,
    emergencyName: d.emergencyName, emergencyPhone: d.emergencyPhone,
    licenseNo: d.licenseNo, licenseClass: d.licenseClass, licenseExpiry: d.licenseExpiry,
    medCardNo: d.medCardNo, medCardExpiry: d.medCardExpiry,
    hireDate: d.hireDate, status: d.status, allowedVehicles: [...d.allowedVehicles],
  }
  editingId.value = d.id
  modalError.value = ''
  adminAvatarPreview.value = d.avatarUrl || ''
  adminLicensePreview.value = d.licensePhotoUrl || ''
  adminMedicalPreview.value = d.medCardPhotoUrl || ''
  showModal.value = true
}

async function confirmDelete(d: Driver) {
  if (!authStore.companyId || !d.authUserId || !confirm(`Delete driver "${d.name}"?`)) {
    return
  }

  const { error: vehicleAssignmentError } = await supabase
    .from('vehicle_company_assignments')
    .update({ assigned_driver_id: null })
    .eq('company_id', authStore.companyId)
    .eq('assigned_driver_id', d.id)

  if (vehicleAssignmentError) {
    inviteMessage.value = vehicleAssignmentError.message
    return
  }

  const { error: driverAssignmentError } = await supabase
    .from('driver_company_assignments')
    .delete()
    .eq('driver_id', d.id)
    .eq('company_id', authStore.companyId)

  if (driverAssignmentError) {
    inviteMessage.value = driverAssignmentError.message
    return
  }

  const { error: membershipError } = await supabase
    .from('company_memberships')
    .delete()
    .eq('user_id', d.authUserId)
    .eq('company_id', authStore.companyId)
    .eq('role', 'driver')

  if (membershipError) {
    inviteMessage.value = membershipError.message
    return
  }

  inviteMessage.value = store.t('driverRemovedFromBusiness')
  await fetchDrivers()
}

async function handleSave() {
  modalError.value = ''

  if (editingId.value === null) {
    inviteMessage.value = store.t('managerWillReview')
    closeModal()
    return
  }

  const driverToEdit = drivers.value.find((driver) => driver.id === editingId.value)

  if (!driverToEdit) {
    console.error('Unable to find driver for editing.')
    return
  }

  if (hasDuplicateDocumentFiles(adminLicenseFile.value, adminMedicalFile.value)) {
    modalError.value = store.t('driverDocumentsMustDiffer')
    return
  }

  const firstName = form.value.firstName.trim()
  const lastName = form.value.lastName.trim()
  const uploadKey = driverToEdit.authUserId || String(driverToEdit.id)
  const avatarUrl = adminAvatarFile.value ? await uploadDriverAvatar(adminAvatarFile.value, uploadKey) : driverToEdit.avatarUrl || null
  const licensePhotoUrl = adminLicenseFile.value ? await uploadDriverDocument(adminLicenseFile.value, uploadKey, 'licenses') : driverToEdit.licensePhotoUrl || null
  const medCardPhotoUrl = adminMedicalFile.value ? await uploadDriverDocument(adminMedicalFile.value, uploadKey, 'medical-cards') : driverToEdit.medCardPhotoUrl || null

  const { error: driverError } = await supabase
    .from('drivers')
    .update({
      first_name: firstName,
      last_name: lastName,
      email: driverToEdit.email,
      phone: form.value.phone.trim() || null,
      birthday: form.value.birthday || null,
      address: form.value.address.trim() || null,
      emergency_name: form.value.emergencyName.trim() || null,
      emergency_phone: form.value.emergencyPhone.trim() || null,
      license_no: form.value.licenseNo.trim(),
      license_class: form.value.licenseClass.trim(),
      license_expiry: form.value.licenseExpiry || null,
      license_photo_url: licensePhotoUrl,
      med_card_no: form.value.medCardNo.trim() || null,
      med_card_expiry: form.value.medCardExpiry || null,
      med_card_photo_url: medCardPhotoUrl,
      hire_date: form.value.hireDate || null,
      status: resolveDriverStatus(form.value.status, form.value.licenseExpiry, form.value.medCardExpiry),
    })
    .eq('id', editingId.value)

  if (driverError) {
    modalError.value = driverError.message
    return
  }

  if (driverToEdit.authUserId) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: form.value.phone.trim() || null,
        avatar_url: avatarUrl,
        status: resolveDriverStatus(form.value.status, form.value.licenseExpiry, form.value.medCardExpiry),
      })
      .eq('auth_user_id', driverToEdit.authUserId)

    if (profileError) {
      modalError.value = profileError.message
      return
    }
  }

  inviteMessage.value = store.t('driverProfileUpdated')
  closeModal()
  await fetchDrivers()
}

// ─── Data ───
const drivers = ref<Driver[]>([])
let driversRefreshInterval: number | null = null

function clearDriversRefreshInterval() {
  if (driversRefreshInterval !== null) {
    window.clearInterval(driversRefreshInterval)
    driversRefreshInterval = null
  }
}

function setupDriversRefreshInterval() {
  clearDriversRefreshInterval()

  if (!authStore.companyId) {
    return
  }

  driversRefreshInterval = window.setInterval(() => {
    fetchDrivers()
  }, 15000)
}

async function fetchDrivers() {
  if (!authStore.companyId) {
    drivers.value = []
    return
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('company_memberships')
    .select('user_id')
    .eq('company_id', authStore.companyId)
    .eq('role', 'driver')

  if (membershipError) {
    console.error('Unable to load company driver memberships.', membershipError)
    drivers.value = []
    return
  }

  const driverUserIds = (memberships || [])
    .map((membership) => membership.user_id)
    .filter(Boolean)

  if (!driverUserIds.length) {
    drivers.value = []
    return
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('auth_user_id, avatar_url, updated_at')
    .in('auth_user_id', driverUserIds)

  if (profilesError) {
    console.error('Unable to load driver profiles.', profilesError)
  }

  const avatarByUserId = new Map((profilesData || []).map((profile) => [profile.auth_user_id, profile.avatar_url || '']))
  const profileUpdatedAtByUserId = new Map((profilesData || []).map((profile) => [profile.auth_user_id, profile.updated_at || '']))

  const { data, error: driversError } = await supabase
    .from('drivers')
    .select('id, auth_user_id, first_name, last_name, email, phone, birthday, address, emergency_name, emergency_phone, license_no, license_class, license_expiry, license_photo_url, med_card_no, med_card_expiry, med_card_photo_url, hire_date, status, availability_status, active_company_name, active_vehicle_name, active_service_type, updated_at')
    .in('auth_user_id', driverUserIds)
    .order('created_at', { ascending: false })

  if (driversError) {
    console.error('Unable to load drivers.', driversError)
    drivers.value = []
    return
  }

  const driverIds = (data || []).map((driver) => driver.id).filter(Boolean)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: inspectionsData, error: inspectionsError } = driverIds.length
    ? await supabase
      .from('inspections')
      .select('driver_id, inspection_type, created_at')
      .eq('company_id', authStore.companyId)
      .in('driver_id', driverIds)
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
    : { data: [], error: null as any }

  if (inspectionsError) {
    console.error('Unable to load driver inspections.', inspectionsError)
  }

  const latestInspectionByDriverId = new Map<string, string>()
  const preTripTodayByDriverId = new Set<string>()

  for (const inspection of inspectionsData || []) {
    if (!inspection.driver_id) continue

    const latestCreatedAt = latestInspectionByDriverId.get(inspection.driver_id)
    if (!latestCreatedAt || latestCreatedAt < inspection.created_at) {
      latestInspectionByDriverId.set(inspection.driver_id, inspection.created_at)
    }

    if (inspection.inspection_type === 'pre-trip' && inspection.created_at >= todayStart.toISOString()) {
      preTripTodayByDriverId.add(inspection.driver_id)
    }
  }

  drivers.value = (data || []).map((driver, index) => ({
    id: driver.id,
    authUserId: driver.auth_user_id || undefined,
    name: [driver.first_name, driver.last_name].filter(Boolean).join(' ').trim() || driver.email || 'Driver',
    email: driver.email || '',
    phone: driver.phone || '',
    birthday: driver.birthday || '',
    address: driver.address || '',
    emergencyName: driver.emergency_name || '',
    emergencyPhone: driver.emergency_phone || '',
    licenseNo: driver.license_no || '',
    licenseClass: driver.license_class || '',
    licenseExpiry: driver.license_expiry || '',
    licensePhotoUrl: driver.license_photo_url || '',
    medCardNo: driver.med_card_no || '',
    medCardExpiry: driver.med_card_expiry || '',
    medCardPhotoUrl: driver.med_card_photo_url || '',
    hireDate: driver.hire_date || '',
    status: resolveDriverStatus(driver.status || 'pending', driver.license_expiry || '', driver.med_card_expiry || ''),
    allowedVehicles: [],
    avatarUrl: driver.auth_user_id ? (avatarByUserId.get(driver.auth_user_id) || '') : '',
    avatarColor: avatarColorFor(driver.email || driver.id, index),
    availability_status: driver.availability_status || 'available',
    activeCompanyName: driver.active_company_name || undefined,
    activeVehicleName: driver.active_vehicle_name || undefined,
    activeServiceType: driver.active_service_type || undefined,
    updatedAt: driver.updated_at || '',
    profileUpdatedAt: driver.auth_user_id ? (profileUpdatedAtByUserId.get(driver.auth_user_id) || '') : '',
    lastInspectionAt: latestInspectionByDriverId.get(driver.id) || '',
    inspectionState: 'inspection-pending',
  })).map((driver) => {
    const latestActivityCandidates = [driver.updatedAt, driver.profileUpdatedAt, driver.lastInspectionAt]
      .filter(Boolean)
      .sort()
    const latestActivity = latestActivityCandidates[latestActivityCandidates.length - 1]

    const inactive = daysSince(latestActivity) > 5

    return {
      ...driver,
      inspectionState: inactive ? 'inactive' : (preTripTodayByDriverId.has(String(driver.id)) ? 'pretrip-done' : 'inspection-pending'),
    }
  })
}

const filtered = computed(() => drivers.value
  .filter(d => {
    const q = search.value.toLowerCase()
    const matchSearch = d.name.toLowerCase().includes(q) || d.licenseNo.toLowerCase().includes(q) || d.email.toLowerCase().includes(q)
    return matchSearch && (filterStatus.value === 'all' || d.status === filterStatus.value)
  })
  .sort((left, right) => {
    const rankDiff = inspectionSortRank(left) - inspectionSortRank(right)
    if (rankDiff !== 0) {
      return rankDiff
    }

    const leftCandidates = [left.updatedAt, left.profileUpdatedAt, left.lastInspectionAt].filter(Boolean).sort()
    const rightCandidates = [right.updatedAt, right.profileUpdatedAt, right.lastInspectionAt].filter(Boolean).sort()
    const leftActivity = leftCandidates[leftCandidates.length - 1] || ''
    const rightActivity = rightCandidates[rightCandidates.length - 1] || ''

    if (leftActivity !== rightActivity) {
      return rightActivity.localeCompare(leftActivity)
    }

    return left.name.localeCompare(right.name)
  }))

onMounted(() => {
  authStore.fetchDriverInvites()
  fetchDrivers()
  setupDriversRefreshInterval()
})

watch(() => authStore.companyId, () => {
  authStore.fetchDriverInvites()
  fetchDrivers()
  setupDriversRefreshInterval()
})

onBeforeUnmount(() => {
  clearDriversRefreshInterval()
})
</script>

<style scoped>
.badge-blue   { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400; }
.badge-yellow { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400; }
.badge-red    { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300; }
.badge-gray   { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300; }

/* Modal */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
