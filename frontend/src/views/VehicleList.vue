<template>
  <AppLayout :title="store.t('vehicles')">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative flex-1 min-w-48">
        <Search
          :size="15"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="localSearch"
          class="input-field pl-9 py-2 text-sm"
          :placeholder="store.t('searchVehicles')"
        />
      </div>

      <div class="flex items-center gap-2">
        <Filter :size="15" class="text-gray-400" />
        <select
          v-model="vehicleStore.statusFilter"
          @change="vehicleStore.setStatusFilter(vehicleStore.statusFilter)"
          class="input-field py-2 text-sm w-auto"
        >
          <option value="all">{{ store.t("allStatus") }}</option>
          <option value="active">{{ store.t("statusActive") }}</option>
          <option value="needs-attention">
            {{ store.t("statusNeedsAttention") }}
          </option>
          <option value="blocked">{{ store.t("statusBlocked") }}</option>
          <option value="in-repair">{{ store.t("statusInRepair") }}</option>
        </select>
      </div>

      <button @click="openCreateModal" class="btn-primary gap-2 text-sm">
        <Plus :size="16" /> {{ store.t("addVehicle") }}
      </button>
    </div>

    <div v-if="authStore.currentCompany" class="card p-3 mb-5 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{{ store.t('activeBusiness') }}</p>
        <p class="font-semibold text-gray-900 dark:text-white">{{ authStore.currentCompany.company_name }}</p>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 max-w-xl">
        {{ store.t('vehiclesBusyBusinessNotice') }}
      </p>
    </div>

    <!-- Loading / Error -->
    <div v-if="vehicleStore.loading" class="card p-6 text-sm text-gray-500">
      {{ store.t('loadingVehicles') }}
    </div>

    <div v-else-if="vehicleStore.error" class="card p-6 text-sm text-red-500">
      {{ vehicleStore.error }}
    </div>

    <template v-else>
      <div v-if="saveNotice" class="card p-6 mb-5 text-sm text-amber-700 dark:text-amber-300">
        {{ saveNotice }}
      </div>

      <!-- Summary badges for current page -->
      <div class="flex flex-wrap gap-2 mb-5">
        <button
          v-for="badge in statusBadges"
          :key="badge.value"
          type="button"
          :class="[
            badge.badgeClass,
            'transition-all whitespace-nowrap cursor-pointer',
            isStatusBadgeActive(badge.value)
              ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-950'
              : 'hover:opacity-85',
          ]"
          :aria-pressed="isStatusBadgeActive(badge.value)"
          @click="toggleStatusBadge(badge.value)"
        >
          {{ badge.count }} {{ badge.label }}
        </button>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr
                class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
              >
                <th
                  v-for="h in vehicleHeaders"
                  :key="h"
                  class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap"
                >
                  {{ h }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="v in vehicles"
                :key="v.id"
                class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td
                  class="px-4 py-3 cursor-pointer"
                  @click="openVehicle(v.id)"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0"
                    >
                      <img
                        v-if="v.photo_url"
                        :src="v.photo_url"
                        alt=""
                        class="w-full h-full object-cover"
                        @error="hideBrokenImage"
                      />
                    </div>

                    <div>
                      <p
                        class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap"
                      >
                        {{ getVehicleName(v) }}
                      </p>
                      <p class="text-xs font-mono text-gray-400">
                        {{ v.unit }}
                      </p>
                    </div>
                  </div>
                </td>

                <td
                  class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                  @click="openVehicle(v.id)"
                >
                  {{ getVehicleTypeLabel(v.type, store.language) }}
                </td>

                <td
                  class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                  @click="openVehicle(v.id)"
                >
                  {{ v.year ?? "—" }}
                </td>

                <td
                  class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap cursor-pointer"
                  @click="openVehicle(v.id)"
                >
                  {{ v.plate }}
                </td>

                <td
                  class="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap cursor-pointer"
                  @click="openVehicle(v.id)"
                >
                  {{ v.vin ? v.vin.substring(0, 12) + "…" : "—" }}
                </td>

                <td
                  class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap cursor-pointer"
                  @click="openVehicle(v.id)"
                >
                  {{
                    v.odometer != null
                      ? Number(v.odometer).toLocaleString() + " mi"
                      : "—"
                  }}
                </td>

                <td
                  class="px-4 py-3 cursor-pointer"
                  @click="openVehicle(v.id)"
                >
                  <span :class="statusConfig[v.status]?.badge || 'badge-gray'">
                    {{ statusConfig[v.status]?.label || v.status }}
                  </span>
                </td>

                <td class="px-4 py-3 cursor-pointer" @click="openVehicle(v.id)">
                  <div class="flex flex-col gap-1 min-w-44">
                    <span :class="getAvailabilityBadgeClass(v)">
                      {{ getAvailabilityLabel(v) }}
                    </span>
                    <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {{ getAvailabilityHint(v) }}
                    </p>
                  </div>
                </td>

                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <button
                      @click.stop="startEdit(v)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <Pencil :size="14" />
                    </button>

                    <button
                      @click.stop="confirmDelete(v)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="vehicles.length === 0">
                <td
                  :colspan="vehicleHeaders.length"
                  class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ store.t('noVehiclesFound') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900"
        >
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ store.t('showing') }}
            <span class="font-medium text-gray-700 dark:text-gray-200">
              {{
                vehicleStore.total === 0
                  ? 0
                  : (vehicleStore.page - 1) * vehicleStore.pageSize + 1
              }}
            </span>
            –
            <span class="font-medium text-gray-700 dark:text-gray-200">
              {{
                Math.min(
                  vehicleStore.page * vehicleStore.pageSize,
                  vehicleStore.total
                )
              }}
            </span>
            {{ store.t('of') }}
            <span class="font-medium text-gray-700 dark:text-gray-200">
              {{ vehicleStore.total }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <select
              :value="vehicleStore.pageSize"
              @change="
                vehicleStore.setPageSize(
                  Number(($event.target as HTMLSelectElement).value)
                )
              "
              class="input-field py-1.5 text-xs w-auto"
            >
              <option :value="5">5 / {{ store.t('perPage') }}</option>
              <option :value="10">10 / {{ store.t('perPage') }}</option>
              <option :value="25">25 / {{ store.t('perPage') }}</option>
              <option :value="50">50 / {{ store.t('perPage') }}</option>
            </select>

            <button
              type="button"
              class="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="vehicleStore.page <= 1"
              @click="vehicleStore.prevPage()"
            >
              {{ store.t('previous') }}
            </button>

            <div
              class="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200"
            >
              {{ vehicleStore.page }} / {{ vehicleStore.totalPages }}
            </div>

            <button
              type="button"
              class="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="vehicleStore.page >= vehicleStore.totalPages"
              @click="vehicleStore.nextPage()"
            >
              {{ store.t('next') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Add/Edit Vehicle Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          @click.self="closeModal"
        >
          <div
            class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800"
            >
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                {{ editingId ? store.t("editVehicle") : store.t("addVehicle") }}
              </h2>

              <button
                @click="closeModal"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X :size="18" />
              </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSave" class="p-6 space-y-5">
              <div v-if="authStore.currentCompany" class="rounded-xl bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-700 dark:text-blue-200">
                <p class="font-medium">{{ store.t('assignVehicleToBusiness') }} {{ authStore.currentCompany.company_name }}.</p>
                <p class="mt-1 text-xs text-blue-600 dark:text-blue-300">
                  {{ store.t('assignVehicleToBusinessHint') }}
                </p>
              </div>

              <div v-if="editingId" class="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
                <p class="font-medium">{{ store.t('businessFieldsEditableOnly') }}</p>
                <p class="mt-1 text-xs text-amber-600 dark:text-amber-300">
                  {{ store.t('businessFieldsEditableHint') }}
                </p>
              </div>

              <div v-if="!editingId" class="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium transition-colors" :class="modalMode === 'new' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'" @click="modalMode = 'new'">
                  {{ store.t('newVehicle') }}
                </button>
                <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium transition-colors" :class="modalMode === 'existing' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'" @click="switchToExistingMode">
                  {{ store.t('existingVehicle') }}
                </button>
              </div>

              <div v-if="!editingId && modalMode === 'existing'" class="space-y-4">
                <div class="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4">
                  <div class="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 class="font-medium text-gray-900 dark:text-white">{{ store.t('addFromMyFleet') }}</h3>
                      <p class="text-sm text-gray-500 dark:text-gray-400">{{ store.t('addFromMyFleetHint') }}</p>
                    </div>
                  </div>

                  <div v-if="existingVehiclesLoading" class="text-sm text-gray-500 dark:text-gray-400">{{ store.t('loadingFleet') }}</div>
                  <div v-else-if="existingFleetVehicles.length === 0" class="text-sm text-gray-500 dark:text-gray-400">{{ store.t('noReusableVehicles') }}</div>
                  <div v-else class="space-y-2 max-h-72 overflow-y-auto pr-1">
                    <button
                      v-for="vehicle in existingFleetVehicles"
                      :key="vehicle.id"
                      type="button"
                      class="w-full rounded-xl border px-4 py-3 text-left transition-colors"
                      :class="selectedExistingVehicleId === vehicle.id ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'"
                      @click="selectedExistingVehicleId = vehicle.id"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <p class="font-medium text-gray-900 dark:text-white">{{ vehicle.make }} {{ vehicle.model }}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">{{ getVehicleTypeLabel(vehicle.type, store.language) }} · {{ vehicle.unit }} · {{ vehicle.plate }}</p>
                        </div>
                        <span class="badge-gray">{{ vehicle.year || '—' }}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Photo upload -->
              <div v-if="editingId || modalMode === 'new'">
                <label class="label">{{ store.t("vehiclePhoto") }}</label>

                <div
                  class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors relative group"
                  @click="triggerFileInput"
                  @dragover.prevent
                  @drop.prevent="handleDrop"
                >
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleFileChange"
                  />

                  <template v-if="photoPreview">
                    <img
                      :src="photoPreview"
                      alt="Preview"
                      class="w-full max-h-40 object-cover rounded-lg"
                    />

                    <button
                      type="button"
                      @click.stop="removePhoto"
                      class="text-xs text-red-500 hover:underline"
                    >
                      {{ store.t("removePhoto") }}
                    </button>
                  </template>

                  <template v-else>
                    <div
                      class="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"
                    >
                      <Camera :size="22" class="text-blue-500" />
                    </div>

                    <div class="text-center">
                      <p
                        class="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {{ store.t("clickToUpload") }}
                      </p>
                      <p class="text-xs text-gray-400 mt-0.5">
                        {{ store.t("pngJpgUpTo10mb") }}
                      </p>
                    </div>
                  </template>
                </div>
              </div>

              <div v-if="editingId || modalMode === 'new'" class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">
                    {{ store.t("vehicleNumber") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.unit"
                    class="input-field"
                    placeholder="VH-001"
                    required
                  />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("type") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <select v-model="form.type" class="input-field" required @change="handleTypeChange" :disabled="Boolean(editingId)">
                    <option value="" disabled>
                      {{ store.t("selectType") }}
                    </option>
                    <option v-for="t in vehicleTypes" :key="t.value" :value="t.value">
                      {{ t.label }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="label">
                    {{ store.t("make") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.make"
                    class="input-field"
                    list="vehicle-makes"
                    :placeholder="store.t('make')"
                    @change="handleMakeChange"
                    :disabled="Boolean(editingId)"
                    required
                  />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("model") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.model"
                    class="input-field"
                    list="vehicle-models"
                    :placeholder="store.t('model')"
                    :disabled="Boolean(editingId)"
                    required
                  />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("year") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <select v-model.number="form.year" class="input-field" required :disabled="Boolean(editingId)">
                    <option v-for="year in vehicleYearOptions" :key="year" :value="year">{{ year }}</option>
                  </select>
                </div>

                <div>
                  <label class="label">
                    {{ store.t("plateNumber") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.plate"
                    class="input-field"
                    placeholder="AA1234BC"
                    required
                  />
                </div>

                <div>
                  <label class="label">{{ store.t("vin") }}</label>
                  <input
                    v-model="form.vin"
                    class="input-field"
                    placeholder="1HGBH41JXMN109186"
                    :disabled="Boolean(editingId)"
                  />
                </div>

                <div>
                  <label class="label">{{ store.t("odometer") }}</label>
                  <input
                    v-model.number="form.odometer"
                    class="input-field"
                    type="number"
                    placeholder="0"
                    min="0"
                    :disabled="Boolean(editingId)"
                  />
                </div>

                <div>
                  <label class="label">{{ store.t('engineHours') }}</label>
                  <input
                    v-model.number="form.engine_hours"
                    class="input-field"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.1"
                    :disabled="Boolean(editingId)"
                  />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("status") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <select v-model="form.status" class="input-field" required>
                    <option
                      v-for="s in vehicleStatuses"
                      :key="s.value"
                      :value="s.value"
                    >
                      {{ s.label }}
                    </option>
                  </select>
                </div>
              </div>

              <datalist v-if="editingId || modalMode === 'new'" id="vehicle-makes">
                <option v-for="make in availableMakes" :key="make" :value="make" />
              </datalist>

              <datalist v-if="editingId || modalMode === 'new'" id="vehicle-models">
                <option v-for="model in availableModels" :key="model" :value="model" />
              </datalist>

              <div
                class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800"
              >
                <button
                  type="button"
                  @click="closeModal"
                  class="btn-secondary px-5 py-2.5"
                >
                  {{ store.t("cancel") }}
                </button>

                <button type="submit" class="btn-primary px-6 py-2.5 gap-2">
                  <Save :size="16" /> {{ store.t("save") }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="deleteTargetVehicle"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          @click.self="closeDeleteModal"
        >
          <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto">
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ store.t('removeVehicleFromBusiness') }}</h2>

              <button
                @click="closeDeleteModal"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X :size="18" />
              </button>
            </div>

            <div class="p-6 space-y-5">
              <div class="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-200">
                <p class="font-medium">{{ store.t('removeVehicleFromBusinessHint') }} {{ authStore.currentCompany?.company_name || store.t('activeBusiness') }}.</p>
                <p class="mt-1 text-xs text-red-600 dark:text-red-300">{{ store.t('removeVehicleFromBusinessKeepRecord') }}</p>
              </div>

              <div class="space-y-1">
                <p class="font-medium text-gray-900 dark:text-white">{{ deleteTargetVehicle.make }} {{ deleteTargetVehicle.model }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ store.t('vehicleNumber') }} {{ deleteTargetVehicle.unit }} · {{ store.t('plate') }} {{ deleteTargetVehicle.plate }} · VIN {{ deleteTargetVehicle.vin || store.t('vinNotSetOnVehicle') }}</p>
              </div>

              <div v-if="deleteError" class="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                {{ deleteError }}
              </div>

              <div>
                <label class="label">{{ store.t('confirmWithPassword') }}</label>
                <input v-model="deletePassword" type="password" class="input-field" :placeholder="store.t('password')" />
              </div>

              <div>
                <label class="label">{{ store.t('typeVinToConfirm') }}</label>
                <input
                  v-model="deleteVinConfirmation"
                  class="input-field"
                  :placeholder="deleteTargetVehicle.vin || store.t('vinNotSetOnVehicle')"
                  :disabled="!deleteTargetVehicle.vin"
                />
                <p v-if="!deleteTargetVehicle.vin" class="mt-1 text-xs text-amber-600 dark:text-amber-300">
                  {{ store.t('addVinBeforeRemovalConfirmation') }}
                </p>
              </div>

              <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button type="button" @click="closeDeleteModal" class="btn-secondary px-5 py-2.5">{{ store.t('cancel') }}</button>
                <button
                  type="button"
                  class="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  :disabled="deleteLoading || !deletePassword || !deleteTargetVehicle.vin || deleteVinConfirmation.trim() !== deleteTargetVehicle.vin"
                  @click="handleDeleteVehicle"
                >
                  {{ deleteLoading ? store.t('removing') : store.t('removeVehicleFromBusiness') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Search,
  Filter,
  Plus,
  X,
  Camera,
  Save,
  Pencil,
  Trash2,
} from "lucide-vue-next";

import AppLayout from "../components/layout/AppLayout.vue";
import { useAppStore } from "../stores/app";
import { useVehicleStore } from "@/stores/vehicleStore";
import { uploadVehiclePhoto } from "@/api/storage";
import { useAuthStore } from "@/stores/authStore";
import { getMakesForVehicleType, getModelsForMake, getVehicleTypeLabel, vehicleTypeOptions, yearOptions } from "@/lib/vehicleCatalog";
import { supabase } from "@/lib/supabase";

type VehicleStatus = "active" | "needs-attention" | "blocked" | "in-repair";

type Vehicle = {
  id: string;
  company_id?: string | null;
  availability_status?: "available" | "busy" | "maintenance" | null;
  active_company_name?: string | null;
  active_driver_name?: string | null;
  active_service_type?: string | null;
  active_assignment_label?: string | null;
  unit: string;
  make: string;
  model: string;
  type: string;
  year: number;
  plate: string;
  vin?: string | null;
  odometer?: number | null;
  engine_hours?: number | null;
  status: VehicleStatus;
  photo_url?: string | null;
  created_at?: string;
};

type ExistingFleetVehicle = {
  id: string;
  unit: string;
  type: string;
  make: string;
  model: string;
  year?: number | null;
  plate: string;
};

const store = useAppStore();
const vehicleStore = useVehicleStore();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const showModal = ref(false);
const editingId = ref<string | null>(null);
const modalMode = ref<"new" | "existing">("new");
const photoPreview = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const selectedPhotoFile = ref<File | null>(null);
const existingFleetVehicles = ref<ExistingFleetVehicle[]>([]);
const existingVehiclesLoading = ref(false);
const selectedExistingVehicleId = ref("");
const deleteTargetVehicle = ref<Vehicle | null>(null);
const deletePassword = ref("");
const deleteVinConfirmation = ref("");
const deleteError = ref("");
const deleteLoading = ref(false);
const saveNotice = ref("");

const localSearch = ref(vehicleStore.search);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

watch(localSearch, (value) => {
  if (searchTimer) clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    vehicleStore.setSearch(value);
  }, 350);
});

onMounted(() => {
  vehicleStore.fetchVehicles();
});

watch(
  () => route.query.status,
  (status) => {
    const nextStatus = typeof status === 'string' && ['active', 'needs-attention', 'blocked', 'in-repair'].includes(status)
      ? status
      : 'all';

    if (vehicleStore.statusFilter !== nextStatus) {
      void vehicleStore.setStatusFilter(nextStatus);
    }
  },
  { immediate: true },
);

const vehicles = computed<Vehicle[]>(() => Array.isArray(vehicleStore.vehicles) ? vehicleStore.vehicles as Vehicle[] : []);
const summaryVehicles = computed<Vehicle[]>(() => Array.isArray(vehicleStore.summaryVehicles) ? vehicleStore.summaryVehicles as Vehicle[] : []);

const vehicleTypes = computed(() =>
  vehicleTypeOptions.map((type) => ({
    value: type,
    label: getVehicleTypeLabel(type, store.language),
  }))
);
const vehicleYearOptions = yearOptions();

const vehicleStatuses = computed(() => [
  { value: "active", label: store.t("statusActive") },
  { value: "needs-attention", label: store.t("statusNeedsAttention") },
  { value: "blocked", label: store.t("statusBlocked") },
  { value: "in-repair", label: store.t("statusInRepair") },
]);

const statusBadges = computed(() => [
  {
    value: "active" as VehicleStatus,
    label: store.t("statusActive"),
    count: summaryVehicles.value.filter((vehicle) => vehicle.status === "active").length,
    badgeClass: "badge-green",
  },
  {
    value: "needs-attention" as VehicleStatus,
    label: store.t("statusNeedsAttention"),
    count: summaryVehicles.value.filter((vehicle) => vehicle.status === "needs-attention").length,
    badgeClass: "badge-orange",
  },
  {
    value: "blocked" as VehicleStatus,
    label: store.t("statusBlocked"),
    count: summaryVehicles.value.filter((vehicle) => vehicle.status === "blocked").length,
    badgeClass: "badge-red",
  },
  {
    value: "in-repair" as VehicleStatus,
    label: store.t("statusInRepair"),
    count: summaryVehicles.value.filter((vehicle) => vehicle.status === "in-repair").length,
    badgeClass: "badge-gray",
  },
]);

const defaultForm = () => ({
  unit: "",
  type: "",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  plate: "",
  vin: "",
  odometer: 0 as number | null,
  engine_hours: null as number | null,
  status: "active" as VehicleStatus,
  photo_url: "",
});

const form = ref(defaultForm());
const availableMakes = computed(() => getMakesForVehicleType(form.value.type));
const availableModels = computed(() => getModelsForMake(form.value.type, form.value.make));

function handleTypeChange() {
  const nextMakes = getMakesForVehicleType(form.value.type);
  if (nextMakes.length > 0 && !nextMakes.includes(form.value.make)) {
    form.value.make = "";
  }

  handleMakeChange();
}

function handleMakeChange() {
  const nextModels = getModelsForMake(form.value.type, form.value.make);
  if (nextModels.length > 0 && !nextModels.includes(form.value.model)) {
    form.value.model = "";
  }
}

function closeModal() {
  showModal.value = false;
  editingId.value = null;
  modalMode.value = "new";
  form.value = defaultForm();
  photoPreview.value = null;
  selectedPhotoFile.value = null;
  existingFleetVehicles.value = [];
  selectedExistingVehicleId.value = "";
}

function closeDeleteModal() {
  deleteTargetVehicle.value = null;
  deletePassword.value = "";
  deleteVinConfirmation.value = "";
  deleteError.value = "";
  deleteLoading.value = false;
}

async function loadExistingFleetVehicles() {
  existingVehiclesLoading.value = true;

  try {
    existingFleetVehicles.value = (await vehicleStore.fetchOwnedFleetVehicles()) as ExistingFleetVehicle[];
    selectedExistingVehicleId.value = existingFleetVehicles.value[0]?.id || "";
  } finally {
    existingVehiclesLoading.value = false;
  }
}

function openCreateModal() {
  saveNotice.value = "";
  closeModal();
  showModal.value = true;
}

async function switchToExistingMode() {
  modalMode.value = "existing";
  await loadExistingFleetVehicles();
}

function getVehicleName(v: Vehicle) {
  return `${v.make || ""} ${v.model || ""}`.trim();
}

function openVehicle(vehicleId: string) {
  void router.push(`/vehicles/${vehicleId}`);
}

function isStatusBadgeActive(status: VehicleStatus) {
  return vehicleStore.statusFilter === status;
}

function toggleStatusBadge(status: VehicleStatus) {
  const nextStatus = vehicleStore.statusFilter === status ? "all" : status;
  void vehicleStore.setStatusFilter(nextStatus);
}

function isVehicleBusy(v: Vehicle) {
  return v.availability_status === "busy" || Boolean(v.active_company_name || v.active_driver_name || v.active_assignment_label);
}

function getAvailabilityLabel(v: Vehicle) {
  if (v.availability_status === "maintenance") {
    return store.t("availabilityMaintenance")
  }

  return isVehicleBusy(v) ? store.t("availabilityBusy") : store.t("availabilityAvailable")
}

function getAvailabilityHint(v: Vehicle) {
  if (v.availability_status === "maintenance") {
    return store.t("availabilityMaintenanceHint")
  }

  if (!isVehicleBusy(v)) {
    return store.t("availabilityReadyHint")
  }

  if (v.active_assignment_label) {
    return v.active_assignment_label
  }

  const segments = []

  if (v.active_driver_name) {
    segments.push(`${store.t("driver")}: ${v.active_driver_name}`)
  }

  if (v.active_company_name) {
    segments.push(`${store.t("availabilityBusiness")}: ${v.active_company_name}`)
  }

  if (v.active_service_type) {
    segments.push(`${store.t("availabilityService")}: ${v.active_service_type}`)
  }

  return segments.join(' · ') || store.t("availabilityAssignedElsewhere")
}

function getAvailabilityBadgeClass(v: Vehicle) {
  if (v.availability_status === "maintenance") {
    return 'badge-gray'
  }

  return isVehicleBusy(v) ? 'badge-yellow' : 'badge-green'
}

function startEdit(v: Vehicle) {
  saveNotice.value = "";
  form.value = {
    unit: v.unit || "",
    type: v.type || "",
    make: v.make || "",
    model: v.model || "",
    year: v.year || new Date().getFullYear(),
    plate: v.plate || "",
    vin: v.vin || "",
    odometer: v.odometer ?? 0,
    engine_hours: v.engine_hours ?? null,
    status: v.status || "active",
    photo_url: v.photo_url || "",
  };

  photoPreview.value = v.photo_url || null;
  editingId.value = v.id;
  modalMode.value = "new";
  showModal.value = true;
  handleTypeChange();
}

async function confirmDelete(v: Vehicle) {
  if (!authStore.currentCompany || !["owner", "manager"].includes(authStore.currentCompany.role)) {
    vehicleStore.error = store.t("onlyAdminsCanRemoveVehicle");
    return;
  }

  deleteTargetVehicle.value = v;
  deletePassword.value = "";
  deleteVinConfirmation.value = "";
  deleteError.value = "";
}

async function handleDeleteVehicle() {
  if (!deleteTargetVehicle.value || !authStore.user?.email) {
    return;
  }

  deleteError.value = "";

  if (!deleteTargetVehicle.value.vin) {
    deleteError.value = store.t("vinRequiredBeforeRemoval");
    return;
  }

  if (deleteVinConfirmation.value.trim() !== deleteTargetVehicle.value.vin) {
    deleteError.value = store.t("vinConfirmationMismatch");
    return;
  }

  deleteLoading.value = true;

  const { error } = await supabase.auth.signInWithPassword({
    email: authStore.user.email,
    password: deletePassword.value,
  });

  if (error) {
    deleteError.value = error.message || store.t("passwordConfirmationFailed");
    deleteLoading.value = false;
    return;
  }

  const removed = await vehicleStore.deleteVehicle(deleteTargetVehicle.value.id);
  deleteLoading.value = false;

  if (!removed) {
    deleteError.value = vehicleStore.error || store.t("removeVehicleFailed");
    return;
  }

  closeDeleteModal();
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  selectedPhotoFile.value = file;
  photoPreview.value = URL.createObjectURL(file);
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;

  selectedPhotoFile.value = file;
  photoPreview.value = URL.createObjectURL(file);
}

function removePhoto() {
  selectedPhotoFile.value = null;
  photoPreview.value = null;
  form.value.photo_url = "";
}

function hideBrokenImage(e: Event) {
  (e.target as HTMLImageElement).style.display = "none";
}

async function handleSave() {
  if (!authStore.companyId) {
    vehicleStore.error = store.t("saveVehicleRequiresBusiness");
    return;
  }

  saveNotice.value = "";

  if (!editingId.value && modalMode.value === "existing") {
    if (!selectedExistingVehicleId.value) {
      vehicleStore.error = store.t("linkExistingVehicleRequired");
      return;
    }

    const linked = await vehicleStore.assignExistingVehicleToBusiness(selectedExistingVehicleId.value);
    if (!linked) {
      return;
    }

    closeModal();
    return;
  }

  let photoUrl = form.value.photo_url || null;

  if (selectedPhotoFile.value) {
    try {
      photoUrl = await uploadVehiclePhoto(selectedPhotoFile.value);
    } catch (uploadError: any) {
      saveNotice.value = uploadError?.message || store.t("vehiclePhotoUploadFailedNotice");
      photoUrl = form.value.photo_url || null;
    }
  }

  const vehiclePayload = {
    unit: form.value.unit,
    type: form.value.type,
    make: form.value.make,
    model: form.value.model,
    year: Number(form.value.year),
    plate: form.value.plate,
    vin: form.value.vin || null,
    odometer:
      form.value.odometer !== null && form.value.odometer !== undefined
        ? Number(form.value.odometer)
        : null,
    engine_hours:
      form.value.engine_hours !== null && form.value.engine_hours !== undefined
        ? Number(form.value.engine_hours)
        : null,
    status: form.value.status,
    photo_url: photoUrl,
    company_id: authStore.companyId,
  };

  if (editingId.value) {
    const updated = await vehicleStore.updateVehicle(editingId.value, vehiclePayload);
    if (!updated) {
      return;
    }
  } else {
    const created = await vehicleStore.createVehicle(vehiclePayload);
    if (!created) {
      return;
    }
  }

  closeModal();
}

const statusConfig = computed(
  (): Record<string, { label: string; badge: string }> => ({
    active: { label: store.t("statusActive"), badge: "badge-green" },
    "needs-attention": {
      label: store.t("statusNeedsAttention"),
      badge: "badge-orange",
    },
    blocked: { label: store.t("statusBlocked"), badge: "badge-red" },
    "in-repair": { label: store.t("statusInRepair"), badge: "badge-gray" },
  })
);

const vehicleHeaders = computed(() => [
  store.t("vehicle"),
  store.t("type"),
  store.t("year"),
  store.t("plate"),
  store.t("vin"),
  store.t("odometer"),
  store.t("status"),
  store.t("availability"),
  "",
]);
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
