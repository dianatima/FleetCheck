<template>
  <div class="space-y-2">
    <div ref="mapEl" class="h-56 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"></div>
    <p v-if="hint" class="text-[11px] text-gray-500 dark:text-gray-400">{{ hint }}</p>
    <p
      v-if="hasOutlier"
      class="flex items-start gap-1.5 rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-700 dark:bg-red-900/30 dark:text-red-200"
    >
      <span class="font-semibold">!</span>
      <span>{{ outlierText }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { haversineMeters } from '@/lib/photoFraud'

type MapPoint = {
  lat: number
  lng: number
  label: string
  result?: string | null
  riskLevel?: string | null
  distanceFromCentroidM?: number | null
}

const props = defineProps<{
  points: MapPoint[]
  radiusMeters?: number
  hint?: string
  outlierText?: string
}>()

const mapEl = ref<HTMLElement | null>(null)
let mapInstance: any = null
let layerGroup: any = null
let L: any = null

const hasOutlier = ref(false)

async function ensureLeaflet() {
  if (L) return L
  const mod = await import('leaflet')
  L = (mod as any).default || mod
  await import('leaflet/dist/leaflet.css')
  return L
}

function colorForRisk(risk?: string | null) {
  if (risk === 'high-risk') return '#dc2626'
  if (risk === 'suspicious') return '#ea580c'
  if (risk === 'needs-review') return '#ca8a04'
  return '#16a34a'
}

async function render() {
  if (!mapEl.value) return
  await ensureLeaflet()

  const radius = props.radiusMeters ?? 300
  const pts = (props.points || []).filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
  )

  if (!pts.length) {
    if (mapInstance) {
      mapInstance.remove()
      mapInstance = null
      layerGroup = null
    }
    hasOutlier.value = false
    return
  }

  if (!mapInstance) {
    mapInstance = L.map(mapEl.value, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(mapInstance)
  }

  if (layerGroup) {
    layerGroup.clearLayers()
  } else {
    layerGroup = L.layerGroup().addTo(mapInstance)
  }

  const centroidLat = pts.reduce((s, p) => s + p.lat, 0) / pts.length
  const centroidLng = pts.reduce((s, p) => s + p.lng, 0) / pts.length

  let outlierDetected = false

  for (const p of pts) {
    const distance = Number.isFinite(p.distanceFromCentroidM as number)
      ? Number(p.distanceFromCentroidM)
      : haversineMeters(p.lat, p.lng, centroidLat, centroidLng)
    const isOutlier = distance > radius
    if (isOutlier) outlierDetected = true
    const color = isOutlier ? '#dc2626' : colorForRisk(p.riskLevel)

    L.circleMarker([p.lat, p.lng], {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: color,
      fillOpacity: 0.95,
    })
      .bindTooltip(`${p.label} — ${Math.round(distance)} m`, { direction: 'top' })
      .addTo(layerGroup)
  }

  if (pts.length >= 2) {
    L.circle([centroidLat, centroidLng], {
      radius,
      color: '#2563eb',
      weight: 1,
      opacity: 0.7,
      fillColor: '#2563eb',
      fillOpacity: 0.05,
      dashArray: '4 4',
    }).addTo(layerGroup)
  }

  hasOutlier.value = outlierDetected

  if (pts.length === 1) {
    mapInstance.setView([pts[0].lat, pts[0].lng], 16)
  } else {
    const bounds = L.latLngBounds(pts.map((p) => [p.lat, p.lng] as [number, number]))
    mapInstance.fitBounds(bounds.pad(0.4), { maxZoom: 17 })
  }

  // Some hosts give the modal its final size after mount — invalidate next tick.
  setTimeout(() => mapInstance && mapInstance.invalidateSize(), 50)
}

onMounted(() => {
  render().catch((err) => console.warn('[InspectionPhotoMap] render failed', err))
})

watch(
  () => props.points,
  () => {
    render().catch((err) => console.warn('[InspectionPhotoMap] render failed', err))
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
    layerGroup = null
  }
})
</script>
