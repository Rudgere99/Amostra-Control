const API_URL = import.meta.env.VITE_API_URL

function ensureApiUrl() {
  if (!API_URL) {
    throw new Error('VITE_API_URL não configurada. Configure essa variável na Vercel com a URL da API Railway.')
  }
  return API_URL.replace(/\/$/, '')
}

async function request(path, options = {}) {
  const baseUrl = ensureApiUrl()
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data.error || 'Erro na comunicação com a API.'
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return data
}


async function requestWithRouteFallback(paths, options = {}) {
  let lastError

  for (const path of paths) {
    try {
      return await request(path, options)
    } catch (error) {
      lastError = error
      if (error.status !== 404) throw error
    }
  }

  throw lastError
}

export async function fetchCollections(filters = {}) {
  const params = new URLSearchParams()
  if (filters.date) params.set('date', filters.date)
  if (filters.status) params.set('status', filters.status)
  if (filters.plant) params.set('plant', filters.plant)
  const query = params.toString() ? `?${params.toString()}` : ''
  return request(`/api/coletas${query}`)
}

export async function createCollection(payload) {
  return request('/api/coletas', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateCollectionApi(id, payload) {
  return request(`/api/coletas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export async function fetchDashboardSummary(date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  return request(`/api/dashboard/summary${query}`)
}

export async function generateDaySchedule(payload) {
  return request('/api/programacao/generate-day', {
    method: 'POST',
    body: JSON.stringify({ startHour: 0, endHour: 23, ...payload })
  })
}

export async function fetchUsers() {
  return requestWithRouteFallback(['/api/cadastros', '/api/cadastro', '/api/usuarios'])
}

export async function createUser(payload) {
  return requestWithRouteFallback(['/api/cadastros', '/api/cadastro', '/api/usuarios'], {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateUserStatus(id, active) {
  return requestWithRouteFallback([`/api/cadastros/${id}/status`, `/api/cadastro/${id}/status`, `/api/usuarios/${id}/status`], {
    method: 'PATCH',
    body: JSON.stringify({ active })
  })
}

export function hasApiConfigured() {
  return Boolean(API_URL)
}
