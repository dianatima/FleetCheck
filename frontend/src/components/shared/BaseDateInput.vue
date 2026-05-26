<template>
  <label class="date-field">
    <span v-if="label" class="date-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </span>
    <span class="relative block">
      <input
        :value="modelValue"
        type="date"
        :lang="inputLocale"
        :required="required"
        class="input-field date-control"
        :class="[inputClass, !modelValue ? 'date-empty' : '']"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <span
        v-if="!modelValue"
        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400"
      >
        {{ placeholder }}
      </span>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

defineProps<{
  modelValue: string
  label?: string
  required?: boolean
  inputClass?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const store = useAppStore()

const inputLocale = computed(() => {
  return {
    en: 'en-US',
    uk: 'uk-UA',
    ru: 'ru-RU',
    es: 'es-ES',
    fr: 'fr-FR',
  }[store.language] || 'en-US'
})

const placeholder = computed(() => {
  return {
    en: 'MM/DD/YYYY',
    uk: 'ДД.ММ.РРРР',
    ru: 'ДД.ММ.ГГГГ',
    es: 'DD/MM/AAAA',
    fr: 'JJ/MM/AAAA',
  }[store.language] || 'MM/DD/YYYY'
})
</script>

<style scoped>
.date-field {
  @apply block;
}

.date-label {
  @apply block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1;
}

.date-control {
  @apply pr-3;
}

.date-empty::-webkit-datetime-edit {
  color: transparent;
}

.date-empty:focus::-webkit-datetime-edit {
  color: transparent;
}
</style>
