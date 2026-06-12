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
    throw new Error(message)
  }

  return data
}

export async function fetchCollections() {
  return request('/api/coletas')
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
    body: JSON.stringify(payload)
  })
}

export function hasApiConfigured() {
  return Boolean(API_URL)
}
