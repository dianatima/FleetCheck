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
