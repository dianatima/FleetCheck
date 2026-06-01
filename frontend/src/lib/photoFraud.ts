import exifr from 'exifr'
import { supabase } from '@/lib/supabase'

export type PhotoRiskLevel = 'ok' | 'needs-review' | 'suspicious' | 'high-risk'

export type InspectionPhotoInput = {
  inspectionResultId: string
  photoIndex: number
  dataUrl: string
  fileName?: string | null
  fileSizeBytes?: number | null
  mimeType?: string | null
  uploadedAt?: string | null
}

export type AnalyzeInspectionPhotosInput = {
  companyId: string
  inspectionId: string
  driverId?: string | null
  vehicleId?: string | null
  inspectionCreatedAt?: string | null
  photos: InspectionPhotoInput[]
}

type ExistingPhotoVerification = {
  id: string
  inspection_id: string
  inspection_result_id: string
  photo_index: number
  driver_id: string | null
  vehicle_id: string | null
  file_name: string | null
  exif_device_model: string | null
  uploaded_at: string | null
  exif_taken_at: string | null
  sha256: string | null
  d_hash: string | null
}

type ExifInfo = {
  takenAt: string | null
  make: string | null
  model: string | null
  software: string | null
  latitude: number | null
  longitude: number | null
  raw: Record<string, unknown> | null
}

function isMissingOnConflictConstraintError(message?: string | null) {
  const value = String(message || '').toLowerCase()
  return value.includes('on conflict') && value.includes('no unique')
}

function fnv1aHex(bytes: Uint8Array) {
  let hash = 0x811c9dc5
  for (let i = 0; i < bytes.length; i += 1) {
    hash ^= bytes[i]
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.trunc(value)))
}

function scoreToLevel(score: number): PhotoRiskLevel {
  if (score <= 20) return 'ok'
  if (score <= 50) return 'needs-review'
  if (score <= 80) return 'suspicious'
  return 'high-risk'
}

function dataUrlToBytes(dataUrl: string) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '')
  if (!match) return null

  const mimeType = match[1] || 'application/octet-stream'
  const base64 = match[2] || ''
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return {
    mimeType,
    bytes,
    size: bytes.byteLength,
  }
}

async function sha256Hex(bytes: Uint8Array) {
  if (typeof crypto === 'undefined' || !crypto.subtle?.digest) {
    return `fnv1a-${fnv1aHex(bytes)}`
  }

  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function dataUrlToImage(dataUrl: string) {
  const image = new Image()
  image.decoding = 'async'
  image.src = dataUrl
  await image.decode()
  return image
}

async function dHashHex(dataUrl: string) {
  const image = await dataUrlToImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = 9
  canvas.height = 8

  const context = canvas.getContext('2d')
  if (!context) return null

  context.drawImage(image, 0, 0, 9, 8)
  const { data } = context.getImageData(0, 0, 9, 8)

  let bits = ''
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const leftIndex = (y * 9 + x) * 4
      const rightIndex = (y * 9 + x + 1) * 4
      const leftLuma = data[leftIndex] * 0.299 + data[leftIndex + 1] * 0.587 + data[leftIndex + 2] * 0.114
      const rightLuma = data[rightIndex] * 0.299 + data[rightIndex + 1] * 0.587 + data[rightIndex + 2] * 0.114
      bits += leftLuma > rightLuma ? '1' : '0'
    }
  }

  const chunks = bits.match(/.{1,4}/g) || []
  return chunks.map((chunk) => Number.parseInt(chunk, 2).toString(16)).join('')
}

function hammingDistanceHex(a: string, b: string) {
  if (!a || !b) return Number.POSITIVE_INFINITY
  const length = Math.min(a.length, b.length)
  let distance = Math.abs(a.length - b.length) * 4

  for (let i = 0; i < length; i += 1) {
    const left = Number.parseInt(a[i], 16)
    const right = Number.parseInt(b[i], 16)
    if (Number.isNaN(left) || Number.isNaN(right)) return Number.POSITIVE_INFINITY
    let xor = left ^ right
    while (xor) {
      distance += xor & 1
      xor >>= 1
    }
  }

  return distance
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

function isCandidateNotLaterThanCurrent(candidateUploadedAt: string | null | undefined, currentUploadedAt: string | null | undefined) {
  const candidateTs = toTimestamp(candidateUploadedAt)
  const currentTs = toTimestamp(currentUploadedAt)

  if (candidateTs == null || currentTs == null) return true
  return candidateTs <= currentTs
}

async function extractExifInfo(dataUrl: string): Promise<ExifInfo> {
  try {
    const parsed = await exifr.parse(dataUrl, {
      pick: ['DateTimeOriginal', 'CreateDate', 'Make', 'Model', 'Software', 'latitude', 'longitude'],
    })

    const taken = parsed?.DateTimeOriginal || parsed?.CreateDate

    return {
      takenAt: taken instanceof Date ? taken.toISOString() : taken ? new Date(taken).toISOString() : null,
      make: parsed?.Make ? String(parsed.Make) : null,
      model: parsed?.Model ? String(parsed.Model) : null,
      software: parsed?.Software ? String(parsed.Software) : null,
      latitude: Number.isFinite(parsed?.latitude) ? Number(parsed.latitude) : null,
      longitude: Number.isFinite(parsed?.longitude) ? Number(parsed.longitude) : null,
      raw: parsed ? (parsed as Record<string, unknown>) : null,
    }
  } catch {
    return {
      takenAt: null,
      make: null,
      model: null,
      software: null,
      latitude: null,
      longitude: null,
      raw: null,
    }
  }
}

async function fetchRecentDriverDevice(companyId: string, driverId?: string | null) {
  if (!driverId) return null

  const { data } = await supabase
    .from('inspection_photo_verifications')
    .select('exif_device_model')
    .eq('company_id', companyId)
    .eq('driver_id', driverId)
    .not('exif_device_model', 'is', null)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data?.exif_device_model ? String(data.exif_device_model) : null
}

async function fetchExactDuplicate(companyId: string, inspectionId: string, sha256: string) {
  const { data } = await supabase
    .from('inspection_photo_verifications')
    .select('id, inspection_id, inspection_result_id, photo_index, driver_id, vehicle_id, file_name, exif_device_model, uploaded_at, exif_taken_at, sha256, d_hash')
    .eq('company_id', companyId)
    .eq('sha256', sha256)
    .neq('inspection_id', inspectionId)
    .order('uploaded_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return (data || null) as ExistingPhotoVerification | null
}

async function fetchVisualCandidates(companyId: string, inspectionId: string) {
  const { data } = await supabase
    .from('inspection_photo_verifications')
    .select('id, inspection_id, inspection_result_id, photo_index, driver_id, vehicle_id, file_name, exif_device_model, uploaded_at, exif_taken_at, sha256, d_hash')
    .eq('company_id', companyId)
    .neq('inspection_id', inspectionId)
    .not('d_hash', 'is', null)
    .order('uploaded_at', { ascending: true })
    .limit(1000)

  return (Array.isArray(data) ? data : []) as ExistingPhotoVerification[]
}

async function hasFileNameReuse(companyId: string, driverId: string | null | undefined, vehicleId: string | null | undefined, inspectionId: string, fileName: string) {
  if (!fileName || (!driverId && !vehicleId)) return false

  let query = supabase
    .from('inspection_photo_verifications')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('file_name', fileName)
    .neq('inspection_id', inspectionId)

  if (driverId) query = query.eq('driver_id', driverId)
  if (vehicleId) query = query.eq('vehicle_id', vehicleId)

  const result = await query
  return (result.count || 0) > 0
}

export async function analyzeAndStoreInspectionPhotos(input: AnalyzeInspectionPhotosInput) {
  if (!input.companyId || !input.inspectionId || !input.photos.length) return

  const createdAt = input.inspectionCreatedAt ? new Date(input.inspectionCreatedAt) : null
  const recentDriverDevice = await fetchRecentDriverDevice(input.companyId, input.driverId)
  const visualCandidates = await fetchVisualCandidates(input.companyId, input.inspectionId)

  const rows = [] as any[]
  const textEncoder = new TextEncoder()

  for (const photo of input.photos) {
    try {
      const currentUploadedAt = photo.uploadedAt || input.inspectionCreatedAt || new Date().toISOString()
      const parsedData = dataUrlToBytes(photo.dataUrl)
      const bytes = parsedData?.bytes || textEncoder.encode(photo.dataUrl || '')

      const [sha256, dHash, exif] = await Promise.all([
        sha256Hex(bytes),
        parsedData ? dHashHex(photo.dataUrl) : Promise.resolve<string | null>(null),
        parsedData
          ? extractExifInfo(photo.dataUrl)
          : Promise.resolve<ExifInfo>({
              takenAt: null,
              make: null,
              model: null,
              software: null,
              latitude: null,
              longitude: null,
              raw: null,
            }),
      ])

      const flags: string[] = []
      let score = 0
      let exactDuplicate: ExistingPhotoVerification | null = null
      let visualDuplicate: ExistingPhotoVerification | null = null

      if (!parsedData) {
        flags.push('NO_EMBEDDED_BINARY')
        score += 10
      }

      exactDuplicate = await fetchExactDuplicate(input.companyId, input.inspectionId, sha256)
      if (exactDuplicate && isCandidateNotLaterThanCurrent(exactDuplicate.uploaded_at, currentUploadedAt)) {
        flags.push('EXACT_DUPLICATE')
        score += 70
      } else {
        exactDuplicate = null
      }

      if (!exactDuplicate && dHash) {
        let bestDistance = Number.POSITIVE_INFINITY
        let bestMatch: ExistingPhotoVerification | null = null

        for (const candidate of visualCandidates) {
          if (!candidate.d_hash) continue
          if (!isCandidateNotLaterThanCurrent(candidate.uploaded_at, currentUploadedAt)) continue
          const distance = hammingDistanceHex(dHash, candidate.d_hash)
          if (distance < bestDistance) {
            bestDistance = distance
            bestMatch = candidate
          }
        }

        if (bestMatch && bestDistance <= 6) {
          visualDuplicate = bestMatch
          flags.push('VISUAL_DUPLICATE')
          score += 50
        }
      }

      if (createdAt && exif.takenAt) {
        const takenAt = new Date(exif.takenAt)
        if (Number.isFinite(takenAt.getTime()) && takenAt.getTime() < createdAt.getTime() - 5 * 60 * 1000) {
          flags.push('PHOTO_TAKEN_BEFORE_INSPECTION')
          score += 30
        }
      }

      if (!exif.raw) {
        flags.push('NO_EXIF')
        score += 10
      }

      const currentDevice = exif.model?.trim() || null
      if (currentDevice && recentDriverDevice && currentDevice !== recentDriverDevice) {
        flags.push('DEVICE_CHANGED')
        score += 10
      }

      const fileName = photo.fileName?.trim() || null
      if (fileName) {
        const fileNameReused = await hasFileNameReuse(
          input.companyId,
          input.driverId,
          input.vehicleId,
          input.inspectionId,
          fileName
        )
        if (fileNameReused) {
          flags.push('FILE_NAME_REUSED')
          score += 5
        }
      }

      const normalizedScore = clampScore(score)
      const level = scoreToLevel(normalizedScore)

      rows.push({
        company_id: input.companyId,
        inspection_id: input.inspectionId,
        inspection_result_id: photo.inspectionResultId,
        driver_id: input.driverId || null,
        vehicle_id: input.vehicleId || null,
        photo_index: photo.photoIndex,
        photo_url: photo.dataUrl,
        file_name: fileName,
        file_size_bytes: photo.fileSizeBytes ?? parsedData?.size ?? bytes.byteLength,
        mime_type: photo.mimeType || parsedData?.mimeType || 'text/plain',
        uploaded_at: currentUploadedAt,
        exif: exif.raw || {},
        exif_taken_at: exif.takenAt,
        exif_device_make: exif.make,
        exif_device_model: exif.model,
        exif_software: exif.software,
        gps_latitude: exif.latitude,
        gps_longitude: exif.longitude,
        sha256,
        d_hash: dHash,
        exact_duplicate_of_id: exactDuplicate?.id || null,
        visual_duplicate_of_id: visualDuplicate?.id || null,
        risk_score: normalizedScore,
        risk_level: level,
        verification_status: level,
        flags,
        details: {
          exact_duplicate: exactDuplicate
            ? {
                id: exactDuplicate.id,
                inspection_id: exactDuplicate.inspection_id,
                uploaded_at: exactDuplicate.uploaded_at,
                driver_id: exactDuplicate.driver_id,
                vehicle_id: exactDuplicate.vehicle_id,
                file_name: exactDuplicate.file_name,
                exif_taken_at: exactDuplicate.exif_taken_at,
                // no photo_index here intentionally
              }
            : null,
          visual_duplicate: visualDuplicate
            ? {
                id: visualDuplicate.id,
                inspection_id: visualDuplicate.inspection_id,
                uploaded_at: visualDuplicate.uploaded_at,
                driver_id: visualDuplicate.driver_id,
                vehicle_id: visualDuplicate.vehicle_id,
                file_name: visualDuplicate.file_name,
                exif_taken_at: visualDuplicate.exif_taken_at,
                // no photo_index here intentionally
              }
            : null,
        },
      })
    } catch (analysisError) {
      rows.push({
        company_id: input.companyId,
        inspection_id: input.inspectionId,
        inspection_result_id: photo.inspectionResultId,
        driver_id: input.driverId || null,
        vehicle_id: input.vehicleId || null,
        photo_index: photo.photoIndex,
        photo_url: photo.dataUrl,
        file_name: photo.fileName?.trim() || null,
        file_size_bytes: photo.fileSizeBytes ?? null,
        mime_type: photo.mimeType || null,
        uploaded_at: photo.uploadedAt || input.inspectionCreatedAt || new Date().toISOString(),
        exif: {},
        exif_taken_at: null,
        exif_device_make: null,
        exif_device_model: null,
        exif_software: null,
        gps_latitude: null,
        gps_longitude: null,
        sha256: null,
        d_hash: null,
        exact_duplicate_of_id: null,
        visual_duplicate_of_id: null,
        risk_score: 20,
        risk_level: 'needs-review',
        verification_status: 'needs-review',
        flags: ['ANALYSIS_ERROR'],
        details: {
          analysis_error: String((analysisError as Error)?.message || 'unknown error'),
        },
      })
    }
  }

  if (!rows.length) return

  const { error: upsertError } = await supabase
    .from('inspection_photo_verifications')
    .upsert(rows, { onConflict: 'inspection_result_id,photo_index' })

  if (!upsertError) return

  if (isMissingOnConflictConstraintError(upsertError.message)) {
    const { error: insertError } = await supabase
      .from('inspection_photo_verifications')
      .insert(rows)
    if (!insertError) return
    throw insertError
  }

  throw upsertError
}
