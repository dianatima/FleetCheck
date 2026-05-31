import { supabase } from '@/lib/supabase'

type SignatureFallbackRecord = {
  dataUrl: string
  signedAt: string
  driverId?: string | null
}

const KEY_PREFIX = 'fleetcheck.signature.'

function keyForInspection(inspectionId: string) {
  return `${KEY_PREFIX}${inspectionId}`
}

export function saveSignatureFallback(
  inspectionId: string,
  dataUrl: string,
  signedAt: string,
  driverId?: string | null
) {
  if (!inspectionId || !dataUrl) return

  try {
    const payload: SignatureFallbackRecord = {
      dataUrl,
      signedAt,
      driverId: driverId || null,
    }
    localStorage.setItem(keyForInspection(inspectionId), JSON.stringify(payload))
  } catch {
    // ignore storage failures
  }
}

export function readSignatureFallback(inspectionId: string): SignatureFallbackRecord | null {
  if (!inspectionId) return null

  try {
    const raw = localStorage.getItem(keyForInspection(inspectionId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.dataUrl) return null
    return {
      dataUrl: String(parsed.dataUrl),
      signedAt: String(parsed.signedAt || ''),
      driverId: parsed.driverId ? String(parsed.driverId) : null,
    }
  } catch {
    return null
  }
}

export async function readSignatureFallbackFromDb(inspectionId: string): Promise<SignatureFallbackRecord | null> {
  if (!inspectionId) return null

  const { data, error } = await supabase
    .from('inspection_signature_fallbacks')
    .select('signature_data_url, signed_at, driver_id')
    .eq('inspection_id', inspectionId)
    .order('signed_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error || !data?.signature_data_url) return null

  return {
    dataUrl: String(data.signature_data_url),
    signedAt: String(data.signed_at || ''),
    driverId: data.driver_id ? String(data.driver_id) : null,
  }
}
