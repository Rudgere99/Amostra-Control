import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CalendarClock, ClipboardCheck, FileText, Home, Settings, Users } from 'lucide-react'
import AppLayout from './layouts/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Collections from './pages/Collections.jsx'
import History from './pages/History.jsx'
import Reports from './pages/Reports.jsx'
import UsersPage from './pages/UsersPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import { initialSchedule } from './data/sampleSchedule.js'
import { buildStats } from './utils/status.js'
import { createCollection, fetchCollections, generateDaySchedule, hasApiConfigured, updateCollectionApi } from './services/api.js'
import './styles.css'
import './api-status.css'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'collections', label: 'Coletas', icon: ClipboardCheck },
  { id: 'history', label: 'Histórico', icon: CalendarClock },
  { id: 'reports', label: 'Relatórios', icon: FileText },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'settings', label: 'Configurações', icon: Settings }
]

function normalizeRemoteRows(rows) {
  return rows.map((row) => ({ ...row, remote: true }))
}

function getStoredUser() {
  try {
    const stored = localStorage.getItem('amostra-control-user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function App() {
  const [loggedUser, setLoggedUser] = useState(getStoredUser)
  const [activePage, setActivePage] = useState('dashboard')
  const [schedule, setSchedule] = useState(initialSchedule)
  const [alertVisible, setAlertVisible] = useState(true)
  const [apiStatus, setApiStatus] = useState(hasApiConfigured() ? 'Conectando ao Railway...' : 'API não configurada. Usando dados locais.')
  const [isSaving, setIsSaving] = useState(false)

  const stats = useMemo(() => buildStats(schedule), [schedule])

  async function loadCollections(filters = {}) {
    if (!hasApiConfigured()) return

    try {
      const data = await fetchCollections(filters)
      if (Array.isArray(data)) {
        setSchedule(data.length > 0 ? normalizeRemoteRows(data) : initialSchedule)
      }
      setApiStatus('Conectado ao Railway')
    } catch (error) {
      console.error(error)
      setApiStatus(`Falha ao conectar no Railway: ${error.message}`)
    }
  }

  useEffect(() => {
    if (loggedUser) {
      loadCollections()
    }
  }, [loggedUser])

  async function updateCollection(updatedRow) {
    setIsSaving(true)

    try {
      let savedRow = {
        ...updatedRow,
        sampler: updatedRow.sampler || loggedUser?.name || '',
        badge: updatedRow.badge || loggedUser?.badge || ''
      }

      if (hasApiConfigured()) {
        if (updatedRow.remote) {
          savedRow = await updateCollectionApi(updatedRow.id, savedRow)
        } else {
          savedRow = await createCollection(savedRow)
        }

        savedRow = { ...savedRow, remote: true }
        setApiStatus('Registro salvo no Railway')
      }

      setSchedule((current) => {
        const exists = current.some((row) => row.id === updatedRow.id)
        if (!exists) return [savedRow, ...current]
        return current.map((row) => row.id === updatedRow.id ? savedRow : row)
      })

      setAlertVisible(false)
    } catch (error) {
      console.error(error)
      alert(`Não foi possível salvar no banco: ${error.message}`)
      setApiStatus(`Erro ao salvar: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function generateFullDay(payload) {
    setIsSaving(true)
    try {
      await generateDaySchedule(payload)
      await loadCollections({ date: payload.date, plant: payload.plant })
      setApiStatus('Programação 00-01 até 23-00 gerada no Railway')
      setActivePage('collections')
    } catch (error) {
      console.error(error)
      alert(`Não foi possível gerar a programação: ${error.message}`)
      setApiStatus(`Erro ao gerar programação: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('amostra-control-user')
    setLoggedUser(null)
    setActivePage('dashboard')
  }

  if (!loggedUser) {
    return <LoginPage onLogin={setLoggedUser} />
  }

  const commonProps = { schedule, stats, updateCollection, alertVisible, setAlertVisible, apiStatus, isSaving, generateFullDay, reloadCollections: loadCollections, loggedUser }

  const page = {
    dashboard: <Dashboard {...commonProps} onOpenCollections={() => setActivePage('collections')} />,
    collections: <Collections {...commonProps} />,
    history: <History />,
    reports: <Reports schedule={schedule} stats={stats} />,
    users: <UsersPage />,
    settings: <SettingsPage />
  }[activePage]

  return (
    <AppLayout navItems={navItems} activePage={activePage} onChangePage={setActivePage}>
      <div className="api-status-bar api-status-bar--with-user">
        <span className={apiStatus.includes('Conectado') || apiStatus.includes('salvo') || apiStatus.includes('gerada') ? 'api-dot api-dot--ok' : 'api-dot'}></span>
        <span>{apiStatus}{isSaving ? ' | Salvando...' : ''}</span>
        <strong>{loggedUser.name} | {loggedUser.badge}</strong>
        <button className="mini-link" type="button" onClick={handleLogout}>Sair</button>
      </div>
      {page}
    </AppLayout>
  )
}

createRoot(document.getElementById('root')).render(<App />)
