export function getAppUrl() {
  const configured = String(import.meta.env.VITE_APP_URL || '').trim()
  return configured.replace(/\/$/, '') || window.location.origin
}

export function getAuthCallbackUrl(query = '') {
  const suffix = query ? `?${query}` : ''
  return `${getAppUrl()}/auth/callback${suffix}`
}