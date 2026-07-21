import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createCollection,
  fetchCollections,
  hasApiConfigured,
  loginUser,
  updateCollection
} from './src/services/api'

const SESSION_KEY = 'minetrace-user'
const COLORS = {
  background: '#08111f',
  surface: '#0f172a',
  surface2: '#172033',
  border: '#28364f',
  text: '#f8fafc',
  muted: '#9aa8bd',
  blue: '#38bdf8',
  blueDark: '#0369a1',
  orange: '#f59e0b',
  green: '#22c55e',
  red: '#fb7185',
  yellow: '#facc15'
}

const STATUS = {
  pendente: { label: 'Pendente', color: COLORS.yellow },
  coletado: { label: 'Coletado', color: COLORS.green },
  parcial: { label: 'Parcial', color: COLORS.orange },
  nao_realizado: { label: 'Não realizado', color: COLORS.red }
}

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseLocalDate(value) {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

function formatDisplayDate(value) {
  const date = parseLocalDate(value)
  return date ? date.toLocaleDateString('pt-BR') : value
}

function shiftDate(value, amount) {
  const date = parseLocalDate(value) || new Date()
  date.setDate(date.getDate() + amount)
  return formatLocalDate(date)
}

function hourNumber(time) {
  const match = String(time || '').match(/^(\d{1,2})/)
  if (!match) return null
  const hour = Number(match[1])
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null
}

function hourRange(time) {
  const hour = hourNumber(time)
  if (hour === null) return '--'
  const end = (hour + 1) % 24
  return `${String(hour).padStart(2, '0')}:00–${String(end).padStart(2, '0')}:00`
}

function shiftByHour(hour) {
  return hour >= 7 && hour <= 18 ? '1º Turno' : '2º Turno'
}

function fixedRows(date, plant, user) {
  return Array.from({ length: 24 }, (_, hour) => ({
    id: `novo-${date}-${plant}-${hour}`,
    date,
    plant,
    time: `${String(hour).padStart(2, '0')}:00`,
    shift: shiftByHour(hour),
    letter: user?.letter || '',
    status: 'pendente',
    sf1: false,
    htt1: false,
    npo1: false,
    fineNpo: false,
    fineHtt: false,
    ccco: false,
    sampler: user?.name || '',
    badge: user?.badge || '',
    realTime: '',
    notes: '',
    remote: false
  }))
}

function mergeRows(baseRows, savedRows) {
  return baseRows.map((base) => {
    const saved = savedRows.find((item) => hourNumber(item.time) === hourNumber(base.time))
    return saved ? { ...base, ...saved, remote: true } : base
  })
}

function launchLock(date, time) {
  const selectedDate = parseLocalDate(date)
  const hour = hourNumber(time)
  const now = new Date()

  if (!selectedDate || hour === null) return 'Data ou faixa horária inválida.'

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (selectedDate >= tomorrow) return 'Não é permitido lançar coleta para data futura.'

  if (selectedDate.getTime() < yesterday.getTime()) {
    return 'Não é permitido lançar coleta para datas anteriores ao dia de ontem.'
  }

  if (selectedDate.getTime() === yesterday.getTime()) {
    const limit = new Date(today)
    limit.setHours(1, 0, 0, 0)
    if (now > limit) return 'O lançamento do dia anterior só é permitido até 01:00.'
  }

  const release = new Date(selectedDate)
  release.setHours(hour + 1, 0, 0, 0)
  if (now < release) {
    return `Lançamento liberado a partir das ${release.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })}.`
  }

  return ''
}

function PrimaryButton({ title, onPress, disabled, secondary }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonSecondaryText]}>{title}</Text>
    </Pressable>
  )
}

function StatusPill({ status }) {
  const item = STATUS[status] || STATUS.pendente
  return (
    <View style={[styles.statusPill, { borderColor: item.color, backgroundColor: `${item.color}18` }]}> 
      <View style={[styles.statusDot, { backgroundColor: item.color }]} />
      <Text style={[styles.statusText, { color: item.color }]}>{item.label}</Text>
    </View>
  )
}

function LoginScreen({ onLogin }) {
  const [badge, setBadge] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)

  async function submit() {
    if (!badge.trim() && !name.trim()) {
      Alert.alert('Dados obrigatórios', 'Informe a matrícula ou o nome do usuário.')
      return
    }

    setLoading(true)
    try {
      let user
      if (hasApiConfigured()) {
        const result = await loginUser({ badge: badge.trim(), name: name.trim() })
        user = result.user
      } else {
        user = {
          id: Date.now(),
          name: name.trim() || 'Usuário local',
          badge: badge.trim() || 'local',
          profile: 'admin',
          active: true
        }
      }
      setPendingUser(user)
    } catch (error) {
      Alert.alert('Erro no login', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function confirmAwareness() {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(pendingUser))
    onLogin(pendingUser)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        style={styles.centered}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.loginCard}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>MT</Text></View>
          <Text style={styles.brandTitle}>Mine<Text style={styles.brandAccent}>Trace</Text></Text>
          <Text style={styles.brandSubtitle}>Controle operacional de amostragem</Text>

          <View style={styles.divider} />
          <Text style={styles.screenEyebrow}>ACESSO OPERACIONAL</Text>
          <Text style={styles.screenTitle}>Entrar no aplicativo</Text>
          <Text style={styles.helperText}>Use o cadastro registrado no MineTrace.</Text>

          <Text style={styles.label}>Cadastro / matrícula</Text>
          <TextInput
            value={badge}
            onChangeText={setBadge}
            placeholder="Ex.: 1023"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            keyboardType="number-pad"
            returnKeyType="next"
          />

          <Text style={styles.label}>Nome, caso não saiba o cadastro</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nome do usuário"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            autoCapitalize="words"
          />

          <PrimaryButton title={loading ? 'Entrando...' : 'Entrar'} onPress={submit} disabled={loading} />
          <Text style={styles.apiHint}>
            {hasApiConfigured() ? 'Conectado à API configurada no .env' : 'Modo local: EXPO_PUBLIC_API_URL não configurada'}
          </Text>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={Boolean(pendingUser)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.awarenessCard}>
            <Text style={styles.screenEyebrow}>CONFIRMAÇÃO OBRIGATÓRIA</Text>
            <Text style={styles.modalTitle}>Declaração de ciência</Text>
            <Text style={styles.awarenessText}>
              Eu, <Text style={styles.bold}>{pendingUser?.name || 'Usuário'}</Text>, declaro estar ciente da necessidade de realizar as coletas nos horários estabelecidos e de registrar informações verdadeiras e precisas.
            </Text>
            <Text style={styles.awarenessText}>
              Comprometo-me a comunicar qualquer intercorrência que possa impactar as amostragens e reconheço a importância desta atividade para o controle de qualidade.
            </Text>
            <PrimaryButton title="Estou ciente" onPress={confirmAwareness} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function SummaryCard({ label, value, color }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  )
}

function Header({ user, apiStatus }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerBrand}>Mine<Text style={styles.brandAccent}>Trace</Text></Text>
        <Text style={styles.headerSubtitle}>{user?.name || 'Operador'} · {user?.badge || 'Sem matrícula'}</Text>
      </View>
      <View style={styles.connectionBadge}>
        <View style={[styles.connectionDot, { backgroundColor: apiStatus === 'online' ? COLORS.green : COLORS.orange }]} />
        <Text style={styles.connectionText}>{apiStatus === 'online' ? 'Online' : 'Atenção'}</Text>
      </View>
    </View>
  )
}

function DatePlantFilter({ date, setDate, plant, setPlant }) {
  return (
    <View style={styles.filterCard}>
      <Text style={styles.cardTitle}>Base de lançamento</Text>
      <View style={styles.dateRow}>
        <PrimaryButton title="‹ Dia anterior" onPress={() => setDate(shiftDate(date, -1))} secondary />
        <View style={styles.dateDisplay}>
          <Text style={styles.dateDisplayLabel}>Data</Text>
          <Text style={styles.dateDisplayValue}>{formatDisplayDate(date)}</Text>
        </View>
        <PrimaryButton title="Hoje" onPress={() => setDate(formatLocalDate(new Date()))} secondary />
      </View>
      <View style={styles.segmentRow}>
        {['Planta 01', 'Planta 02'].map((option) => (
          <Pressable
            key={option}
            onPress={() => setPlant(option)}
            style={[styles.segmentButton, plant === option && styles.segmentButtonActive]}
          >
            <Text style={[styles.segmentText, plant === option && styles.segmentTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

function DashboardScreen({ rows, date, plant, onOpenCollections }) {
  const stats = useMemo(() => ({
    total: rows.length,
    done: rows.filter((row) => row.status === 'coletado').length,
    pending: rows.filter((row) => row.status === 'pendente').length,
    issues: rows.filter((row) => ['parcial', 'nao_realizado'].includes(row.status)).length
  }), [rows])

  const upcoming = rows.filter((row) => row.status === 'pendente').slice(0, 5)

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <Text style={styles.screenEyebrow}>VISÃO OPERACIONAL</Text>
      <Text style={styles.screenTitle}>Dashboard</Text>
      <Text style={styles.helperText}>{plant} · {formatDisplayDate(date)}</Text>

      <View style={styles.summaryGrid}>
        <SummaryCard label="Faixas" value={stats.total} color={COLORS.blue} />
        <SummaryCard label="Realizadas" value={stats.done} color={COLORS.green} />
        <SummaryCard label="Pendentes" value={stats.pending} color={COLORS.yellow} />
        <SummaryCard label="Ocorrências" value={stats.issues} color={COLORS.red} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.cardTitle}>Próximas pendências</Text>
        {upcoming.length === 0 ? (
          <Text style={styles.emptyText}>Não há faixas pendentes nesta base.</Text>
        ) : upcoming.map((row) => (
          <View key={row.id} style={styles.compactRow}>
            <View>
              <Text style={styles.compactTitle}>{hourRange(row.time)}</Text>
              <Text style={styles.compactSubtitle}>{row.shift}</Text>
            </View>
            <StatusPill status={row.status} />
          </View>
        ))}
        <PrimaryButton title="Abrir coletas" onPress={onOpenCollections} />
      </View>
    </ScrollView>
  )
}

function CollectionCard({ row, onPress }) {
  const lockedMessage = launchLock(row.date, row.time)
  const saved = row.status !== 'pendente' || row.remote

  return (
    <View style={styles.collectionCard}>
      <View style={styles.collectionTop}>
        <View>
          <Text style={styles.collectionHour}>{hourRange(row.time)}</Text>
          <Text style={styles.collectionShift}>{row.shift} · Letra {row.letter || '-'}</Text>
        </View>
        <StatusPill status={row.status} />
      </View>

      <View style={styles.sampleRow}>
        {['SF1', 'HTT1', 'NPO1', 'Fino NPO', 'Fino HTT', 'CCCO'].map((label, index) => {
          const values = [row.sf1, row.htt1, row.npo1, row.fineNpo, row.fineHtt, row.ccco]
          return (
            <View key={label} style={[styles.sampleTag, values[index] && styles.sampleTagActive]}>
              <Text style={[styles.sampleTagText, values[index] && styles.sampleTagTextActive]}>{label}</Text>
            </View>
          )
        })}
      </View>

      {row.notes ? <Text numberOfLines={2} style={styles.notesPreview}>{row.notes}</Text> : null}
      <PrimaryButton
        title={saved ? 'Editar registro' : 'Registrar coleta'}
        onPress={() => {
          if (lockedMessage) Alert.alert('Lançamento bloqueado', lockedMessage)
          else onPress(row)
        }}
        disabled={Boolean(lockedMessage)}
        secondary={saved}
      />
      {lockedMessage ? <Text style={styles.lockText}>{lockedMessage}</Text> : null}
    </View>
  )
}

function CollectionsScreen({ rows, date, setDate, plant, setPlant, loading, reload, onSelect }) {
  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => `${item.date}-${item.plant}-${item.time}`}
      contentContainerStyle={styles.pageContent}
      refreshing={loading}
      onRefresh={reload}
      ListHeaderComponent={(
        <>
          <Text style={styles.screenEyebrow}>ROTINA DE CAMPO</Text>
          <Text style={styles.screenTitle}>Coletas programadas</Text>
          <Text style={styles.helperText}>Selecione a base e registre cada faixa depois do horário de fechamento.</Text>
          <DatePlantFilter date={date} setDate={setDate} plant={plant} setPlant={setPlant} />
          <Text style={styles.listTitle}>24 faixas horárias</Text>
        </>
      )}
      renderItem={({ item }) => <CollectionCard row={item} onPress={onSelect} />}
    />
  )
}

function ToggleLine({ label, value, onChange }) {
  return (
    <View style={styles.toggleLine}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={Boolean(value)}
        onValueChange={onChange}
        trackColor={{ false: COLORS.border, true: COLORS.blueDark }}
        thumbColor={value ? COLORS.blue : '#cbd5e1'}
      />
    </View>
  )
}

function CollectionEditor({ row, visible, saving, onClose, onSave, user }) {
  const [form, setForm] = useState(row)

  useEffect(() => setForm(row), [row])
  if (!form) return null

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.editorContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.screenEyebrow}>REGISTRO DE COLETA</Text>
            <Text style={styles.screenTitle}>{hourRange(form.time)}</Text>
            <Text style={styles.helperText}>{form.plant} · {formatDisplayDate(form.date)} · {form.shift}</Text>

            <View style={styles.panel}>
              <Text style={styles.cardTitle}>Responsável</Text>
              <Text style={styles.infoText}>{user?.name || form.sampler || '-'}</Text>
              <Text style={styles.infoMuted}>Matrícula: {user?.badge || form.badge || '-'}</Text>
            </View>

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusOptions}>
              {['coletado', 'parcial', 'nao_realizado'].map((status) => (
                <Pressable
                  key={status}
                  onPress={() => setField('status', status)}
                  style={[
                    styles.statusOption,
                    form.status === status && { borderColor: STATUS[status].color, backgroundColor: `${STATUS[status].color}18` }
                  ]}
                >
                  <Text style={[styles.statusOptionText, form.status === status && { color: STATUS[status].color }]}>
                    {STATUS[status].label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.panel}>
              <Text style={styles.cardTitle}>Amostras registradas</Text>
              <ToggleLine label="SF1" value={form.sf1} onChange={(value) => setField('sf1', value)} />
              <ToggleLine label="HTT1" value={form.htt1} onChange={(value) => setField('htt1', value)} />
              <ToggleLine label="NPO1" value={form.npo1} onChange={(value) => setField('npo1', value)} />
              <ToggleLine label="Fino NPO" value={form.fineNpo} onChange={(value) => setField('fineNpo', value)} />
              <ToggleLine label="Fino HTT" value={form.fineHtt} onChange={(value) => setField('fineHtt', value)} />
              <ToggleLine label="CCCO" value={form.ccco} onChange={(value) => setField('ccco', value)} />
            </View>

            <Text style={styles.label}>Hora real da coleta</Text>
            <TextInput
              value={form.realTime || ''}
              onChangeText={(value) => setField('realTime', value)}
              placeholder="Ex.: 13:05"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.label}>Observações</Text>
            <TextInput
              value={form.notes || ''}
              onChangeText={(value) => setField('notes', value)}
              placeholder="Descreva ocorrências ou justificativas"
              placeholderTextColor={COLORS.muted}
              style={[styles.input, styles.textArea]}
              multiline
              textAlignVertical="top"
            />

            <PrimaryButton title={saving ? 'Salvando...' : 'Salvar coleta'} onPress={() => onSave(form)} disabled={saving} />
            <PrimaryButton title="Cancelar" onPress={onClose} secondary disabled={saving} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

function ProfileScreen({ user, onLogout }) {
  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <Text style={styles.screenEyebrow}>CONTA</Text>
      <Text style={styles.screenTitle}>Meu perfil</Text>
      <View style={styles.panel}>
        <Text style={styles.profileName}>{user?.name || 'Operador'}</Text>
        <Text style={styles.infoMuted}>Matrícula: {user?.badge || '-'}</Text>
        <Text style={styles.infoMuted}>Perfil: {user?.profile || '-'}</Text>
        <Text style={styles.infoMuted}>Letra: {user?.letter || '-'}</Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.cardTitle}>Aplicativo</Text>
        <Text style={styles.infoMuted}>MineTrace Mobile 1.0</Text>
        <Text style={styles.infoMuted}>Execução compatível com Expo Go.</Text>
      </View>
      <PrimaryButton title="Sair do aplicativo" onPress={onLogout} secondary />
    </ScrollView>
  )
}

function BottomNavigation({ active, onChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '▦' },
    { id: 'collections', label: 'Coletas', icon: '✓' },
    { id: 'profile', label: 'Perfil', icon: '●' }
  ]

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <Pressable key={tab.id} onPress={() => onChange(tab.id)} style={styles.bottomNavItem}>
          <Text style={[styles.bottomNavIcon, active === tab.id && styles.bottomNavActive]}>{tab.icon}</Text>
          <Text style={[styles.bottomNavLabel, active === tab.id && styles.bottomNavActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function MainApp({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [date, setDate] = useState(formatLocalDate(new Date()))
  const [plant, setPlant] = useState('Planta 01')
  const [savedRows, setSavedRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apiStatus, setApiStatus] = useState(hasApiConfigured() ? 'online' : 'warning')

  const rows = useMemo(
    () => mergeRows(fixedRows(date, plant, user), savedRows),
    [date, plant, user, savedRows]
  )

  async function loadRows() {
    if (!hasApiConfigured()) {
      setSavedRows([])
      setApiStatus('warning')
      return
    }

    setLoading(true)
    try {
      const data = await fetchCollections({ date, plant })
      setSavedRows(Array.isArray(data) ? data : [])
      setApiStatus('online')
    } catch (error) {
      setApiStatus('warning')
      Alert.alert('Falha ao atualizar', error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRows()
  }, [date, plant])

  async function saveRow(form) {
    setSaving(true)
    try {
      const hour = hourNumber(form.time) ?? 0
      const payload = {
        ...form,
        date,
        plant,
        time: `${String(hour).padStart(2, '0')}:00`,
        shift: shiftByHour(hour),
        sampler: user?.name || form.sampler || '',
        badge: user?.badge || form.badge || '',
        letter: user?.letter || form.letter || '',
        fine: Boolean(form.fineNpo || form.fineHtt)
      }

      let saved = payload
      if (hasApiConfigured()) {
        saved = form.remote && !String(form.id).startsWith('novo-')
          ? await updateCollection(form.id, payload)
          : await createCollection(payload)
        setApiStatus('online')
      }

      setSavedRows((current) => {
        const sameHour = (item) => hourNumber(item.time) === hourNumber(saved.time)
        return current.some(sameHour)
          ? current.map((item) => sameHour(item) ? { ...saved, remote: true } : item)
          : [{ ...saved, remote: true }, ...current]
      })
      setSelected(null)
      Alert.alert('Registro concluído', 'A coleta foi salva com sucesso.')
    } catch (error) {
      setApiStatus('warning')
      Alert.alert('Erro ao salvar', error.message)
    } finally {
      setSaving(false)
    }
  }

  async function logout() {
    await AsyncStorage.removeItem(SESSION_KEY)
    onLogout()
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <Header user={user} apiStatus={apiStatus} />
      <View style={styles.flex}>
        {loading && savedRows.length === 0 ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.blue} /></View>
        ) : activeTab === 'dashboard' ? (
          <DashboardScreen rows={rows} date={date} plant={plant} onOpenCollections={() => setActiveTab('collections')} />
        ) : activeTab === 'collections' ? (
          <CollectionsScreen
            rows={rows}
            date={date}
            setDate={setDate}
            plant={plant}
            setPlant={setPlant}
            loading={loading}
            reload={loadRows}
            onSelect={setSelected}
          />
        ) : (
          <ProfileScreen user={user} onLogout={logout} />
        )}
      </View>
      <BottomNavigation active={activeTab} onChange={setActiveTab} />
      <CollectionEditor
        row={selected}
        visible={Boolean(selected)}
        saving={saving}
        onClose={() => setSelected(null)}
        onSave={saveRow}
        user={user}
      />
    </SafeAreaView>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((value) => setUser(value ? JSON.parse(value) : null))
      .catch(() => AsyncStorage.removeItem(SESSION_KEY))
      .finally(() => setBooting(false))
  }, [])

  if (booting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={styles.bootText}>Carregando MineTrace...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return user
    ? <MainApp user={user} onLogout={() => setUser(null)} />
    : <LoginScreen onLogin={setUser} />
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  bootText: { color: COLORS.muted, marginTop: 14 },
  pageContent: { padding: 18, paddingBottom: 32 },
  loginCard: { width: '100%', maxWidth: 470, padding: 24, borderRadius: 26, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  brandMark: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.blueDark, marginBottom: 14 },
  brandMarkText: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  brandTitle: { color: COLORS.text, fontSize: 30, fontWeight: '900', letterSpacing: -1.2 },
  brandAccent: { color: COLORS.orange },
  brandSubtitle: { color: COLORS.muted, marginTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 22 },
  screenEyebrow: { color: COLORS.blue, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  screenTitle: { color: COLORS.text, fontSize: 29, fontWeight: '900', letterSpacing: -1.2, marginTop: 6 },
  helperText: { color: COLORS.muted, lineHeight: 20, marginTop: 5, marginBottom: 18 },
  label: { color: COLORS.text, fontWeight: '800', marginBottom: 8, marginTop: 12 },
  input: { minHeight: 50, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, backgroundColor: COLORS.surface2, color: COLORS.text, fontSize: 16 },
  textArea: { minHeight: 110, paddingTop: 14 },
  button: { minHeight: 48, marginTop: 14, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.blueDark, borderWidth: 1, borderColor: COLORS.blue },
  buttonSecondary: { backgroundColor: COLORS.surface2, borderColor: COLORS.border },
  buttonDisabled: { opacity: 0.42 },
  buttonPressed: { transform: [{ scale: 0.985 }] },
  buttonText: { color: COLORS.text, fontWeight: '900', fontSize: 15 },
  buttonSecondaryText: { color: COLORS.blue },
  apiHint: { color: COLORS.muted, fontSize: 11, textAlign: 'center', marginTop: 14 },
  modalBackdrop: { flex: 1, backgroundColor: '#020617dd', padding: 20, justifyContent: 'center' },
  awarenessCard: { padding: 24, borderRadius: 24, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: COLORS.text, fontSize: 25, fontWeight: '900', marginTop: 6, marginBottom: 16 },
  awarenessText: { color: '#dbeafe', lineHeight: 23, marginBottom: 13 },
  bold: { fontWeight: '900', color: COLORS.text },
  header: { minHeight: 72, paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerBrand: { color: COLORS.text, fontSize: 21, fontWeight: '900' },
  headerSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  connectionBadge: { flexDirection: 'row', gap: 7, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border },
  connectionDot: { width: 8, height: 8, borderRadius: 4 },
  connectionText: { color: COLORS.text, fontSize: 11, fontWeight: '800' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  summaryCard: { width: '48%', minHeight: 105, padding: 16, borderRadius: 19, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  summaryLabel: { color: COLORS.muted, fontWeight: '800', fontSize: 12 },
  summaryValue: { fontSize: 32, fontWeight: '900', marginTop: 14 },
  panel: { padding: 17, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900', marginBottom: 12 },
  emptyText: { color: COLORS.muted, marginBottom: 12 },
  compactRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  compactTitle: { color: COLORS.text, fontWeight: '900' },
  compactSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '900' },
  filterCard: { padding: 16, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginBottom: 18 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateDisplay: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 58 },
  dateDisplayLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '800' },
  dateDisplayValue: { color: COLORS.text, fontSize: 16, fontWeight: '900', marginTop: 3 },
  segmentRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  segmentButton: { flex: 1, minHeight: 45, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface2 },
  segmentButtonActive: { borderColor: COLORS.blue, backgroundColor: '#0369a133' },
  segmentText: { color: COLORS.muted, fontWeight: '800' },
  segmentTextActive: { color: COLORS.blue },
  listTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900', marginBottom: 10 },
  collectionCard: { padding: 16, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  collectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  collectionHour: { color: COLORS.text, fontSize: 19, fontWeight: '900' },
  collectionShift: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  sampleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 13 },
  sampleTag: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface2 },
  sampleTagActive: { borderColor: COLORS.green, backgroundColor: '#22c55e18' },
  sampleTagText: { color: COLORS.muted, fontSize: 9, fontWeight: '800' },
  sampleTagTextActive: { color: COLORS.green },
  notesPreview: { color: '#dbeafe', marginTop: 12, lineHeight: 19 },
  lockText: { color: COLORS.orange, fontSize: 10, lineHeight: 15, marginTop: 8, textAlign: 'center' },
  editorContent: { padding: 18, paddingBottom: 40 },
  infoText: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  infoMuted: { color: COLORS.muted, marginTop: 5, lineHeight: 20 },
  statusOptions: { gap: 8, marginBottom: 16 },
  statusOption: { minHeight: 47, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: COLORS.surface2 },
  statusOptionText: { color: COLORS.muted, fontWeight: '900' },
  toggleLine: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  toggleLabel: { color: COLORS.text, fontWeight: '800' },
  profileName: { color: COLORS.text, fontSize: 24, fontWeight: '900', marginBottom: 6 },
  bottomNav: { minHeight: 68, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface, flexDirection: 'row', paddingBottom: Platform.OS === 'ios' ? 10 : 2 },
  bottomNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomNavIcon: { color: COLORS.muted, fontSize: 17, fontWeight: '900' },
  bottomNavLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '800', marginTop: 3 },
  bottomNavActive: { color: COLORS.blue }
})
