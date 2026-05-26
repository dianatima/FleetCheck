<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div
            class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800"
          >
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ driver ? store.t("editDriver") : store.t("addDriver") }}
            </h2>

            <button
              @click="close"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X :size="18" />
            </button>
          </div>

          <form @submit.prevent="submitForm" class="p-6 space-y-6">
            <section>
              <h3 class="section-title">
                <User :size="15" class="text-blue-500" />
                {{ store.t("personalInformation") }}
              </h3>

              <div class="mb-5">
                <label class="label">Avatar</label>

                <div class="flex items-center gap-4">
                  <div
                    class="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                  >
                    <img
                      v-if="avatarPreview || driver?.avatar_url"
                      :src="avatarPreview || driver?.avatar_url || ''"
                      class="w-full h-full object-cover"
                    />
                    <User v-else :size="26" class="text-gray-400" />
                  </div>

                  <input
                    ref="avatarInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleAvatar"
                  />
                  <button
                    type="button"
                    class="btn-secondary gap-2"
                    @click="avatarInput?.click()"
                  >
                    <Camera :size="16" />
                    Add Photo
                  </button>
                </div>
              </div>

              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">
                    {{ store.t("firstName") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.firstName"
                    class="input-field"
                    required
                  />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("lastName") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input v-model="form.lastName" class="input-field" required />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("emailField") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.email"
                    class="input-field"
                    type="email"
                    required
                  />
                </div>

                <div>
                  <label class="label">{{ store.t("phone") }}</label>
                  <input v-model="form.phone" class="input-field" />
                </div>

                <div>
                  <BaseDateInput
                    v-model="form.birthday"
                    :label="store.t('dateOfBirth')"
                  />
                </div>

                <div>
                  <BaseDateInput
                    v-model="form.hireDate"
                    :label="store.t('hireDate')"
                  />
                </div>
              </div>

              <div class="mt-4">
                <label class="label">{{ store.t("homeAddress") }}</label>
                <div class="relative">
                  <MapPin
                    :size="15"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input v-model="form.address" class="input-field pl-9" />
                </div>
              </div>
            </section>

            <section
              class="border border-red-200 dark:border-red-800 rounded-xl p-4 bg-red-50/40 dark:bg-red-900/10"
            >
              <h3 class="section-title text-red-600 dark:text-red-400">
                <Heart :size="15" />
                {{ store.t("emergencyContact") }}
              </h3>

              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{ store.t("contactName") }}</label>
                  <input v-model="form.emergencyName" class="input-field" />
                </div>

                <div>
                  <label class="label">{{ store.t("contactPhone") }}</label>
                  <input v-model="form.emergencyPhone" class="input-field" />
                </div>
              </div>
            </section>

            <section
              class="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
            >
              <h3 class="section-title">
                <FileText :size="15" class="text-blue-500" />
                {{ store.t("driverLicense") }}
              </h3>

              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{ store.t("licenseNumber") }}</label>
                  <input v-model="form.licenseNo" class="input-field" />
                </div>

                <div>
                  <label class="label">{{ store.t("licenseClass") }}</label>
                  <select v-model="form.licenseClass" class="input-field">
                    <option value="">{{ store.t("selectClass") }}</option>
                    <option v-for="c in licenseClasses" :key="c" :value="c">
                      {{ c }}
                    </option>
                  </select>
                </div>

                <div>
                  <BaseDateInput
                    v-model="form.licenseExpiry"
                    :label="store.t('expiryDate')"
                  />
                </div>
              </div>

              <div class="mt-4">
                <label class="label">Driver License Photos</label>
                <input
                  ref="licensePhotoInput"
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="handleLicensePhotos"
                />
                <button
                  type="button"
                  class="btn-secondary gap-2"
                  @click="licensePhotoInput?.click()"
                >
                  <Camera :size="16" />
                  Add Photo
                </button>
                <p class="text-xs text-gray-400 mt-2">
                  You can upload multiple license photos.
                </p>

                <div
                  v-if="
                    existingLicensePhotos.length || licensePhotoFiles.length
                  "
                  class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3"
                >
                  <div
                    v-for="(photo, index) in existingLicensePhotos"
                    :key="photo"
                    class="photo-preview"
                  >
                    <button
                      type="button"
                      class="block h-full w-full cursor-pointer"
                      @click="openPhotoPreview(existingLicensePhotos, index)"
                    >
                      <img
                        :src="photo"
                        alt="Driver license photo"
                        class="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      type="button"
                      class="photo-remove"
                      title="Remove photo"
                      aria-label="Remove driver license photo"
                      @click="removeExistingLicensePhoto(photo)"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>

                  <div
                    v-for="(photo, index) in licensePhotoFiles"
                    :key="photo.previewUrl"
                    class="photo-preview"
                  >
                    <button
                      type="button"
                      class="block h-full w-full cursor-pointer"
                      @click="openPhotoPreview(licensePreviewUrls, index)"
                    >
                      <img
                        :src="photo.previewUrl"
                        :alt="photo.file.name"
                        class="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      type="button"
                      class="photo-remove"
                      title="Remove photo"
                      aria-label="Remove driver license photo"
                      @click="removeLicensePhotoFile(photo.previewUrl)"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section
              class="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
            >
              <h3 class="section-title">
                <FileText :size="15" class="text-green-500" />
                {{ store.t("medicalCard") }}
              </h3>

              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{
                    store.t("medicalCardNumber")
                  }}</label>
                  <input v-model="form.medCardNo" class="input-field" />
                </div>

                <div>
                  <BaseDateInput
                    v-model="form.medCardExpiry"
                    :label="store.t('expiryDate')"
                  />
                </div>
              </div>

              <div class="mt-4">
                <label class="label">Medical Card Photos</label>
                <input
                  ref="medCardPhotoInput"
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="handleMedCardPhotos"
                />
                <button
                  type="button"
                  class="btn-secondary gap-2"
                  @click="medCardPhotoInput?.click()"
                >
                  <Camera :size="16" />
                  Add Photo
                </button>
                <p class="text-xs text-gray-400 mt-2">
                  You can upload multiple medical card photos.
                </p>

                <div
                  v-if="
                    existingMedCardPhotos.length || medCardPhotoFiles.length
                  "
                  class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3"
                >
                  <div
                    v-for="(photo, index) in existingMedCardPhotos"
                    :key="photo"
                    class="photo-preview"
                  >
                    <button
                      type="button"
                      class="block h-full w-full cursor-pointer"
                      @click="openPhotoPreview(existingMedCardPhotos, index)"
                    >
                      <img
                        :src="photo"
                        alt="Medical card photo"
                        class="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      type="button"
                      class="photo-remove"
                      title="Remove photo"
                      aria-label="Remove medical card photo"
                      @click="removeExistingMedCardPhoto(photo)"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>

                  <div
                    v-for="(photo, index) in medCardPhotoFiles"
                    :key="photo.previewUrl"
                    class="photo-preview"
                  >
                    <button
                      type="button"
                      class="block h-full w-full cursor-pointer"
                      @click="openPhotoPreview(medCardPreviewUrls, index)"
                    >
                      <img
                        :src="photo.previewUrl"
                        :alt="photo.file.name"
                        class="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      type="button"
                      class="photo-remove"
                      title="Remove photo"
                      aria-label="Remove medical card photo"
                      @click="removeMedCardPhotoFile(photo.previewUrl)"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <div
              class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800"
            >
              <button
                type="button"
                @click="close"
                class="btn-secondary px-5 py-2.5"
              >
                {{ store.t("cancel") }}
              </button>

              <button
                type="submit"
                class="btn-primary px-6 py-2.5 gap-2"
                :disabled="loading || uploading"
              >
                <Save :size="16" />
                {{ loading || uploading ? "Saving..." : store.t("saveDriver") }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <PhotoLightbox
      v-model="photoLightboxOpen"
      :photos="lightboxPhotos"
      :start-index="lightboxStartIndex"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, watch, ref } from "vue";
import {
  X,
  Save,
  User,
  MapPin,
  Heart,
  FileText,
  Trash2,
  Camera,
} from "lucide-vue-next";

import { useAppStore } from "@/stores/app";
import { supabase } from "@/lib/supabase";
import BaseDateInput from "@/components/shared/BaseDateInput.vue";
import PhotoLightbox from "@/components/shared/PhotoLightbox.vue";

type DriverStatus = "new" | "active" | "pending" | "inactive";

type Driver = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  birthday?: string | null;
  address?: string | null;
  emergency_name?: string | null;
  emergency_phone?: string | null;
  license_no?: string | null;
  license_class?: string | null;
  license_expiry?: string | null;
  med_card_no?: string | null;
  med_card_expiry?: string | null;
  hire_date?: string | null;
  status: DriverStatus;
  avatar_url?: string | null;
  license_photo_urls?: string[] | null;
  med_card_photo_urls?: string[] | null;
};

const props = defineProps<{
  modelValue: boolean;
  driver?: Driver | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  save: [payload: any];
}>();

const store = useAppStore();

const uploading = ref(false);
const avatarInput = ref<HTMLInputElement | null>(null);
const licensePhotoInput = ref<HTMLInputElement | null>(null);
const medCardPhotoInput = ref<HTMLInputElement | null>(null);

type NewPhoto = {
  file: File;
  previewUrl: string;
};

const avatarFile = ref<File | null>(null);
const licensePhotoFiles = ref<NewPhoto[]>([]);
const medCardPhotoFiles = ref<NewPhoto[]>([]);
const existingLicensePhotos = ref<string[]>([]);
const existingMedCardPhotos = ref<string[]>([]);
const avatarPreview = ref("");
const photoLightboxOpen = ref(false);
const lightboxPhotos = ref<string[]>([]);
const lightboxStartIndex = ref(0);

const licensePreviewUrls = computed(() =>
  licensePhotoFiles.value.map((photo) => photo.previewUrl)
);
const medCardPreviewUrls = computed(() =>
  medCardPhotoFiles.value.map((photo) => photo.previewUrl)
);

const licenseClasses = [
  "Class A",
  "Class B",
  "Class C",
  "Class D",
  "Class E",
  "CDL",
];

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthday: "",
  address: "",
  emergencyName: "",
  emergencyPhone: "",
  licenseNo: "",
  licenseClass: "",
  licenseExpiry: "",
  medCardNo: "",
  medCardExpiry: "",
  hireDate: "",
});

function splitName(name: string) {
  const parts = name.trim().split(" ");
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");
  return { firstName, lastName };
}

function resetFiles() {
  licensePhotoFiles.value.forEach((photo) =>
    URL.revokeObjectURL(photo.previewUrl)
  );
  medCardPhotoFiles.value.forEach((photo) =>
    URL.revokeObjectURL(photo.previewUrl)
  );
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value);

  avatarFile.value = null;
  licensePhotoFiles.value = [];
  medCardPhotoFiles.value = [];
  existingLicensePhotos.value = [];
  existingMedCardPhotos.value = [];
  avatarPreview.value = "";
}

function resetForm() {
  resetFiles();

  const current = props.driver;

  if (current) {
    const { firstName, lastName } = splitName(current.name || "");

    Object.assign(form, {
      firstName,
      lastName,
      email: current.email || "",
      phone: current.phone || "",
      birthday: current.birthday || "",
      address: current.address || "",
      emergencyName: current.emergency_name || "",
      emergencyPhone: current.emergency_phone || "",
      licenseNo: current.license_no || "",
      licenseClass: current.license_class || "",
      licenseExpiry: current.license_expiry || "",
      medCardNo: current.med_card_no || "",
      medCardExpiry: current.med_card_expiry || "",
      hireDate: current.hire_date || "",
    });

    existingLicensePhotos.value = [...(current.license_photo_urls || [])];
    existingMedCardPhotos.value = [...(current.med_card_photo_urls || [])];

    return;
  }

  Object.assign(form, {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    licenseNo: "",
    licenseClass: "",
    licenseExpiry: "",
    medCardNo: "",
    medCardExpiry: "",
    hireDate: "",
  });
}

watch(
  () => [props.modelValue, props.driver],
  () => {
    if (props.modelValue) {
      resetForm();
      return;
    }

    resetFiles();
  },
  { immediate: true }
);

function close() {
  emit("update:modelValue", false);
}

function handleAvatar(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value);

  avatarFile.value = file;
  avatarPreview.value = URL.createObjectURL(file);
  input.value = "";
}

function handleLicensePhotos(e: Event) {
  const input = e.target as HTMLInputElement;

  licensePhotoFiles.value.push(...createNewPhotos(input.files));
  input.value = "";
}

function handleMedCardPhotos(e: Event) {
  const input = e.target as HTMLInputElement;

  medCardPhotoFiles.value.push(...createNewPhotos(input.files));
  input.value = "";
}

function createNewPhotos(files: FileList | null) {
  return Array.from(files || []).map((file) => ({
    file,
    previewUrl: URL.createObjectURL(file),
  }));
}

function removeExistingLicensePhoto(photo: string) {
  existingLicensePhotos.value = existingLicensePhotos.value.filter(
    (currentPhoto) => currentPhoto !== photo
  );
}

function removeExistingMedCardPhoto(photo: string) {
  existingMedCardPhotos.value = existingMedCardPhotos.value.filter(
    (currentPhoto) => currentPhoto !== photo
  );
}

function removeNewPhoto(photos: NewPhoto[], previewUrl: string) {
  const photo = photos.find(
    (currentPhoto) => currentPhoto.previewUrl === previewUrl
  );
  if (photo) URL.revokeObjectURL(photo.previewUrl);

  return photos.filter((currentPhoto) => currentPhoto.previewUrl !== previewUrl);
}

function removeLicensePhotoFile(previewUrl: string) {
  licensePhotoFiles.value = removeNewPhoto(licensePhotoFiles.value, previewUrl);
}

function removeMedCardPhotoFile(previewUrl: string) {
  medCardPhotoFiles.value = removeNewPhoto(medCardPhotoFiles.value, previewUrl);
}

function openPhotoPreview(photos: string[] | null | undefined, index = 0) {
  const cleanPhotos = (photos || []).filter(Boolean);
  if (!cleanPhotos.length) return;
  lightboxPhotos.value = cleanPhotos;
  lightboxStartIndex.value = index;
  photoLightboxOpen.value = true;
}

async function uploadSingleFile(file: File, folder: string) {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("driver-files")
    .upload(path, file);

  if (error) throw error;

  const { data } = supabase.storage.from("driver-files").getPublicUrl(path);

  return data.publicUrl;
}

async function uploadMultipleFiles(files: File[], folder: string) {
  const urls: string[] = [];

  for (const file of files) {
    const url = await uploadSingleFile(file, folder);
    urls.push(url);
  }

  return urls;
}

async function submitForm() {
  uploading.value = true;

  try {
    let avatarUrl = props.driver?.avatar_url || null;

    if (avatarFile.value) {
      avatarUrl = await uploadSingleFile(avatarFile.value, "driver-avatars");
    }

    const uploadedLicensePhotos = await uploadMultipleFiles(
      licensePhotoFiles.value.map((photo) => photo.file),
      "license-photos"
    );

    const uploadedMedCardPhotos = await uploadMultipleFiles(
      medCardPhotoFiles.value.map((photo) => photo.file),
      "med-card-photos"
    );

    emit("save", {
      name: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email,
      phone: form.phone || null,
      birthday: form.birthday || null,
      address: form.address || null,
      emergency_name: form.emergencyName || null,
      emergency_phone: form.emergencyPhone || null,
      license_no: form.licenseNo || null,
      license_class: form.licenseClass || null,
      license_expiry: form.licenseExpiry || null,
      med_card_no: form.medCardNo || null,
      med_card_expiry: form.medCardExpiry || null,
      hire_date: form.hireDate || null,
      avatar_url: avatarUrl,
      license_photo_urls: [
        ...existingLicensePhotos.value,
        ...uploadedLicensePhotos,
      ],
      med_card_photo_urls: [
        ...existingMedCardPhotos.value,
        ...uploadedMedCardPhotos,
      ],
    });
  } finally {
    uploading.value = false;
  }
}
</script>

<style scoped>
.section-title {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2;
}

.photo-preview {
  @apply relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800;
}

.photo-remove {
  @apply absolute right-1.5 top-1.5 w-7 h-7 rounded-lg bg-black/65 text-white flex items-center justify-center hover:bg-red-600 transition-colors;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
