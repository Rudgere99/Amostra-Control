import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CalendarClock, ClipboardCheck, FileText, Home, Settings, Users } from 'lucide-react'
import AppLayout from './layouts/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Collections from './pages/Collections.jsx'
import History from './pages/History.jsx'
import Reports from './pages/Reports.jsx'
import UsersPage from './pages/UsersPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import { initialSchedule } from './data/sampleSchedule.js'
import { buildStats } from './utils/status.js'
import './styles.css'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'collections', label: 'Coletas', icon: ClipboardCheck },
  { id: 'history', label: 'Histórico', icon: CalendarClock },
  { id: 'reports', label: 'Relatórios', icon: FileText },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'settings', label: 'Configurações', icon: Settings }
]

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [schedule, setSchedule] = useState(initialSchedule)
  const [alertVisible, setAlertVisible] = useState(true)

  const stats = useMemo(() => buildStats(schedule), [schedule])

  function updateCollection(updatedRow) {
    setSchedule((current) => current.map((row) => row.id === updatedRow.id ? updatedRow : row))
    setAlertVisible(false)
  }

  const commonProps = { schedule, stats, updateCollection, alertVisible, setAlertVisible }

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
      {page}
    </AppLayout>
  )
}

createRoot(document.getElementById('root')).render(<App />)
