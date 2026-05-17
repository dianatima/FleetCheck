<template>
  <div class="relative">
    <input
      :value="modelValue"
      :class="['input-field', inputClass]"
      :placeholder="placeholder"
      autocomplete="street-address"
      @input="handleInput"
      @focus="showSuggestions = suggestions.length > 0"
      @blur="handleBlur"
    />

    <div
      v-if="showSuggestions && (loading || suggestions.length > 0)"
      class="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden"
    >
      <div v-if="loading" class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
        Searching address...
      </div>
      <button
        v-for="suggestion in suggestions"
        :key="suggestion.place_id"
        type="button"
        class="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        @mousedown.prevent="selectSuggestion(suggestion.display_name)"
      >
        {{ suggestion.display_name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getCountryCode } from '@/lib/companyForm'

type AddressSuggestion = {
  place_id: number
  display_name: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  country?: string
  placeholder?: string
  inputClass?: string
}>(), {
  country: '',
  placeholder: 'Start typing an address',
  inputClass: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const suggestions = ref<AddressSuggestion[]>([])
const loading = ref(false)
const showSuggestions = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null
let controller: AbortController | null = null

watch(() => props.country, () => {
  suggestions.value = []
  showSuggestions.value = false
})

watch(() => props.modelValue, (value) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  const query = value.trim()

  if (query.length < 4) {
    suggestions.value = []
    showSuggestions.value = false
    loading.value = false
    if (controller) {
      controller.abort()
      controller = null
    }
    return
  }

  searchTimer = setTimeout(() => {
    void fetchSuggestions(query)
  }, 300)
})

function handleInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function handleBlur() {
  window.setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}

function selectSuggestion(value: string) {
  emit('update:modelValue', value)
  suggestions.value = []
  showSuggestions.value = false
}

async function fetchSuggestions(query: string) {
  if (controller) {
    controller.abort()
  }

  controller = new AbortController()
  loading.value = true

  try {
    const searchParams = new URLSearchParams({
      format: 'jsonv2',
      addressdetails: '1',
      limit: '5',
      q: query,
    })

    const countryCode = getCountryCode(props.country)

    if (countryCode) {
      searchParams.set('countrycodes', countryCode)
    }

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${searchParams.toString()}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Address lookup failed')
    }

    const data = await response.json() as AddressSuggestion[]
    suggestions.value = data
    showSuggestions.value = data.length > 0
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      suggestions.value = []
      showSuggestions.value = false
    }
  } finally {
    loading.value = false
  }
}
</script>
