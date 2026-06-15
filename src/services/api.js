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



let cachedUserRoutePaths = null

function routeUnavailableError() {
  const error = new Error('API de cadastros não disponível neste backend.')
  error.status = 404
  return error
}

async function getUserRoutePaths() {
  if (cachedUserRoutePaths) return cachedUserRoutePaths

  const fallbackPaths = ['/api/cadastros', '/api/cadastro', '/api/usuarios']

  try {
    const metadata = await request('/')
    const routes = Array.isArray(metadata?.routes) ? metadata.routes : []
    cachedUserRoutePaths = fallbackPaths.filter((path) => routes.includes(path))
    return cachedUserRoutePaths
  } catch (error) {
    cachedUserRoutePaths = fallbackPaths
    return cachedUserRoutePaths
  }
}

async function requestWithRouteFallback(paths, options = {}) {
  if (!paths.length) throw routeUnavailableError()

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
  return requestWithRouteFallback(await getUserRoutePaths())
}

export async function createUser(payload) {
  return requestWithRouteFallback(await getUserRoutePaths(), {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateUserStatus(id, active) {
  const paths = (await getUserRoutePaths()).map((path) => `${path}/${id}/status`)
  return requestWithRouteFallback(paths, {
    method: 'PATCH',
    body: JSON.stringify({ active })
  })
}

export function hasApiConfigured() {
  return Boolean(API_URL)
}
