const DEV_DRIVER_PREVIEW_KEY = 'fleetcheck.dev.driverPreview'

export function canUseDevDriverPreview() {
  return Boolean(import.meta.env.DEV)
}

export function isDevDriverPreviewEnabled() {
  if (!canUseDevDriverPreview()) return false

  try {
    return localStorage.getItem(DEV_DRIVER_PREVIEW_KEY) === '1'
  } catch {
    return false
  }
}

export function setDevDriverPreviewEnabled(enabled: boolean) {
  if (!canUseDevDriverPreview()) return

  try {
    if (enabled) localStorage.setItem(DEV_DRIVER_PREVIEW_KEY, '1')
    else localStorage.removeItem(DEV_DRIVER_PREVIEW_KEY)
  } catch {
    // ignore storage failures
  }
}
