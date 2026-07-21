const API_URL = process.env.EXPO_PUBLIC_API_URL

function ensureApiUrl() {
  if (!API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL não configurada no arquivo mobile/.env.')
  }

  return API_URL.replace(/\/$/, '')
}

async function request(path, options = {}) {
  const response = await fetch(`${ensureApiUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message = typeof data === 'string'
      ? data
      : data?.error || data?.message || 'Erro na comunicação com a API.'

    throw new Error(message)
  }

  return data
}

export function hasApiConfigured() {
  return Boolean(API_URL)
}

export function loginUser(payload) {
  return request('/api/usuarios/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function fetchCollections(filters = {}) {
  const params = new URLSearchParams()
  if (filters.date) params.set('date', filters.date)
  if (filters.status) params.set('status', filters.status)
  if (filters.plant) params.set('plant', filters.plant)
  const query = params.toString() ? `?${params.toString()}` : ''
  return request(`/api/coletas${query}`)
}

export function fetchDashboardSummary(filters = {}) {
  const params = new URLSearchParams()
  if (filters.date) params.set('date', filters.date)
  if (filters.plant) params.set('plant', filters.plant)
  const query = params.toString() ? `?${params.toString()}` : ''
  return request(`/api/dashboard/summary${query}`)
}

export function createCollection(payload) {
  return request('/api/coletas', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function updateCollection(id, payload) {
  return request(`/api/coletas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}
