const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL

function ensureApiUrl() {
  const value = String(RAW_API_URL || '').trim()

  if (!value) {
    throw new Error('EXPO_PUBLIC_API_URL não configurada. Abra mobile/.env e informe a URL pública HTTPS do backend Railway.')
  }

  if (/sua-api|url-da-sua-api|seu-dominio/i.test(value)) {
    throw new Error('EXPO_PUBLIC_API_URL ainda contém um valor de exemplo. Substitua pela URL real do backend Railway.')
  }

  let parsed
  try {
    parsed = new URL(value)
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL inválida. Use uma URL completa, por exemplo: https://meu-backend.up.railway.app')
  }

  const isLocalhost = ['localhost', '127.0.0.1'].includes(parsed.hostname)
  if (parsed.protocol !== 'https:' && !isLocalhost) {
    throw new Error('A API móvel deve usar HTTPS. Copie o domínio público do backend no Railway.')
  }

  const normalized = value.replace(/\/+$/, '')
  if (/\/api$/i.test(normalized)) {
    throw new Error('Remova /api do final de EXPO_PUBLIC_API_URL. Informe somente o domínio do backend Railway.')
  }

  return normalized
}

async function request(path, options = {}) {
  const baseUrl = ensureApiUrl()
  let response

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    })
  } catch {
    throw new Error(`Não foi possível conectar à API em ${baseUrl}. Teste ${baseUrl}/health no navegador do celular e reinicie o Expo após alterar o .env.`)
  }

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
  try {
    ensureApiUrl()
    return true
  } catch {
    return false
  }
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
