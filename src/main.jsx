import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CalendarClock, ClipboardCheck, FileText, Home, Settings, Users } from 'lucide-react'
import AppLayout from './layouts/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Collections from './pages/Collections.jsx'
import History from './pages/History.jsx'
import Reports from './pages/Reports.jsx'
import UsersPage from './pages/UsersPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import { initialSchedule } from './data/sampleSchedule.js'
import { buildStats } from './utils/status.js'
import { createCollection, fetchCollections, generateDaySchedule, hasApiConfigured, updateCollectionApi } from './services/api.js'
import './styles.css'
import './api-status.css'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, allowedProfiles: ['Amostrador', 'Controle'] },
  { id: 'collections', label: 'Coletas', icon: ClipboardCheck, allowedProfiles: ['Amostrador', 'Controle'] },
  { id: 'history', label: 'Histórico', icon: CalendarClock, allowedProfiles: ['Amostrador', 'Controle'] },
  { id: 'reports', label: 'Relatórios', icon: FileText, allowedProfiles: ['Amostrador', 'Controle'] },
  { id: 'users', label: 'Usuários', icon: Users, allowedProfiles: ['Controle'] },
  { id: 'settings', label: 'Configurações', icon: Settings, allowedProfiles: ['Controle'] }
]

function normalizeRemoteRows(rows) {
  return rows.map((row) => ({ ...row, remote: true }))
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('amostra-control-user')
    return saved ? JSON.parse(saved) : null
  })
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
    loadCollections()
  }, [])

  async function updateCollection(updatedRow) {
    setIsSaving(true)

    try {
      let savedRow = updatedRow

      if (hasApiConfigured()) {
        if (updatedRow.remote) {
          savedRow = await updateCollectionApi(updatedRow.id, updatedRow)
        } else {
          savedRow = await createCollection(updatedRow)
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


  const currentProfile = currentUser?.profile || currentUser?.perfil
  const allowedNavItems = useMemo(() => navItems.filter((item) => item.allowedProfiles.includes(currentProfile)), [currentProfile])

  function handleLogin(user) {
    localStorage.setItem('amostra-control-user', JSON.stringify(user))
    setCurrentUser(user)
    setActivePage('dashboard')
  }

  function handleLogout() {
    localStorage.removeItem('amostra-control-user')
    setCurrentUser(null)
    setActivePage('dashboard')
  }

  function changePage(pageId) {
    const allowed = allowedNavItems.some((item) => item.id === pageId)
    setActivePage(allowed ? pageId : 'dashboard')
  }

  useEffect(() => {
    if (currentUser && !allowedNavItems.some((item) => item.id === activePage)) {
      setActivePage('dashboard')
    }
  }, [activePage, allowedNavItems, currentUser])

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />
  }

  const commonProps = { schedule, stats, updateCollection, alertVisible, setAlertVisible, apiStatus, isSaving, generateFullDay, reloadCollections: loadCollections }

  const page = {
    dashboard: <Dashboard {...commonProps} onOpenCollections={() => changePage('collections')} />,
    collections: <Collections {...commonProps} />,
    history: <History />,
    reports: <Reports schedule={schedule} stats={stats} />,
    users: <UsersPage />,
    settings: <SettingsPage />
  }[activePage]

  return (
    <AppLayout navItems={allowedNavItems} activePage={activePage} onChangePage={changePage} currentUser={currentUser} onLogout={handleLogout}>
      <div className="api-status-bar">
        <span className={apiStatus.includes('Conectado') || apiStatus.includes('salvo') || apiStatus.includes('gerada') ? 'api-dot api-dot--ok' : 'api-dot'}></span>
        {apiStatus}{isSaving ? ' | Salvando...' : ''}
      </div>
      {page}
    </AppLayout>
  )
}

createRoot(document.getElementById('root')).render(<App />)
