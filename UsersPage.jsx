import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, RefreshCcw, Save } from '../components/LocalIcons.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { formatClockTime, formatHourRange, toHourNumber } from '../utils/time.js'

function today() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function normalizeTime(time) {
  const hour = toHourNumber(time)
  if (hour === null) return time || ''
  return `${String(hour).padStart(2, '0')}:00`
}

function shiftByHour(time) {
  const hour = toHourNumber(time)
  if (hour === null) return ''
  if (hour >= 7 && hour <= 18) return '1º Turno'
  return '2º Turno'
}

function draftFromRow(row, loggedUser) {
  return {
    ...row,
    date: normalizeDate(row.date) || today(),
    time: normalizeTime(row.time),
    shift: shiftByHour(row.time) || row.shift || '',
    status: row.status || 'pendente',
    sampler: row.sampler || loggedUser?.name || '',
    badge: row.badge || loggedUser?.badge || '',
    letter: row.letter || loggedUser?.letter || '',
    sf1: Boolean(row.sf1),
    htt1: Boolean(row.htt1),
    npo1: Boolean(row.npo1),
    fineNpo: Boolean(row.fineNpo),
    fineHtt: Boolean(row.fineHtt),
    ccco: Boolean(row.ccco),
    realTime: row.realTime || '',
    notes: row.notes || ''
  }
}

function rowKey(row) {
  return row.id || `${row.date}-${row.plant}-${row.time}`
}

export default function Contingency({ schedule = [], updateCollection, reloadCollections, isSaving, loggedUser }) {
  const [filters, setFilters] = useState({
    date: today(),
    plant: 'Todas',
    status: 'todos'
  })
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)

  function setFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function handleReload() {
    reloadCollections?.({
      date: filters.date,
      plant: filters.plant === 'Todas' ? undefined : filters.plant,
      status: filters.status === 'todos' ? undefined : filters.status
    })
  }

  useEffect(() => {
    handleReload()
  }, [filters.date, filters.plant, filters.status])

  const rows = useMemo(() => {
    return schedule.filter((row) => {
      const sameDate = !filters.date || normalizeDate(row.date) === filters.date
      const samePlant = filters.plant === 'Todas' || String(row.plant || '') === filters.plant
      const sameStatus = filters.status === 'todos' || String(row.status || 'pendente') === filters.status
      return sameDate && samePlant && sameStatus
    })
  }, [schedule, filters])

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current }
      rows.forEach((row) => {
        const key = rowKey(row)
        next[key] = current[key] || draftFromRow(row, loggedUser)
      })
      return next
    })
  }, [rows, loggedUser])

  const summary = useMemo(() => {
    return {
      total: rows.length,
      changed: rows.filter((row) => {
        const draft = drafts[rowKey(row)]
        if (!draft) return false
        return ['status', 'sf1', 'htt1', 'npo1', 'fineNpo', 'fineHtt', 'ccco', 'realTime', 'notes', 'sampler', 'badge', 'letter'].some((field) => String(draft[field] ?? '') !== String(row[field] ?? ''))
      }).length,
      partial: rows.filter((row) => row.status === 'parcial').length,
      notDone: rows.filter((row) => row.status === 'nao_realizado').length
    }
  }, [rows, drafts])

  function setDraftField(row, field, value) {
    const key = rowKey(row)
    setDrafts((current) => {
      const currentDraft = current[key] || draftFromRow(row, loggedUser)
      const nextDraft = { ...currentDraft, [field]: value }

      if (['sf1', 'htt1', 'npo1'].includes(field)) {
        nextDraft.status = nextDraft.sf1 && nextDraft.htt1 && nextDraft.npo1 ? 'coletado' : 'parcial'
      }

      return { ...current, [key]: nextDraft }
    })
  }

  async function saveDraft(row) {
    const key = rowKey(row)
    const draft = drafts[key] || draftFromRow(row, loggedUser)
    const hour = toHourNumber(draft.time)
    const payload = {
      ...row,
      ...draft,
      time: hour === null ? draft.time : `${String(hour).padStart(2, '0')}:00`,
      shift: shiftByHour(draft.time) || draft.shift,
      fine: Boolean(draft.fineNpo || draft.fineHtt),
      remote: row.remote
    }

    setSavingId(key)
    try {
      await updateCollection?.(payload)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Modo contingência"
        title="Contingência de lançamentos"
        description="Altere rapidamente lançamentos já registrados quando houver correção operacional, falha de rede ou necessidade de ajuste posterior das coletas de amostras."
        actions={(
          <button className="btn btn--ghost" type="button" onClick={handleReload} disabled={isSaving}>
            <RefreshCcw size={17} /> Atualizar
          </button>
        )}
      />

      <div className="alert-banner contingency-alert">
        <div className="alert-banner__icon"><AlertTriangle size={20} /></div>
        <div>
          <strong>Use esta tela somente para ajustes de contingência.</strong>
          <p>Salve uma linha por vez para manter rastreabilidade e evitar sobrescrever registros incorretamente.</p>
        </div>
      </div>

      <div className="generation-card contingency-filter">
        <div>
          <h3>Filtros de contingência</h3>
          <p>Localize o lançamento por data, planta e status antes de alterar os campos necessários.</p>
        </div>
        <label>
          Data
          <input type="date" value={filters.date} onChange={(e) => setFilter('date', e.target.value)} />
        </label>
        <label>
          Planta
          <select value={filters.plant} onChange={(e) => setFilter('plant', e.target.value)}>
            <option>Todas</option>
            <option>Planta 01</option>
            <option>Planta 02</option>
          </select>
        </label>
        <label>
          Status
          <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="todos">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="coletado">Realizada</option>
            <option value="parcial">Parcial</option>
            <option value="nao_realizado">Não realizada</option>
            <option value="atrasado">Atrasada</option>
          </select>
        </label>
      </div>

      <div className="collection-summary-grid">
        <div><span>Registros filtrados</span><strong>{summary.total}</strong></div>
        <div><span>Alterados em tela</span><strong>{summary.changed}</strong></div>
        <div><span>Parciais</span><strong>{summary.partial}</strong></div>
        <div><span>Não realizadas</span><strong>{summary.notDone}</strong></div>
      </div>

      <div className="table-card">
        <div className="table-card__header">
          <div>
            <h3>Editar lançamentos de coletas</h3>
            <span>Atualize status, pilhas coletadas, hora real, CCCO e observações diretamente na tabela.</span>
          </div>
        </div>

        <div className="table-wrapper table-wrapper--fixed">
          <table className="collections-table contingency-table">
            <thead>
              <tr>
                <th>Faixa</th>
                <th>Planta</th>
                <th>Status atual</th>
                <th>Novo status</th>
                <th>SF1</th>
                <th>HTT1</th>
                <th>NPO1</th>
                <th>Fino NPO</th>
                <th>Fino HTT</th>
                <th>CCCO</th>
                <th>Hora real</th>
                <th>Amostrador</th>
                <th>Matrícula</th>
                <th>Letra</th>
                <th>Observações</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan="16" className="empty-state">Nenhum lançamento encontrado para os filtros selecionados.</td>
                </tr>
              )}

              {rows.map((row) => {
                const key = rowKey(row)
                const draft = drafts[key] || draftFromRow(row, loggedUser)
                const saving = savingId === key || isSaving

                return (
                  <tr key={key}>
                    <td className="sticky-cell"><strong>{formatHourRange(row.time)}</strong></td>
                    <td>{row.plant || '-'}</td>
                    <td><StatusBadge status={row.status || 'pendente'} /></td>
                    <td>
                      <select value={draft.status} onChange={(e) => setDraftField(row, 'status', e.target.value)}>
                        <option value="pendente">Pendente</option>
                        <option value="coletado">Realizada</option>
                        <option value="parcial">Parcial</option>
                        <option value="nao_realizado">Não realizada</option>
                        <option value="atrasado">Atrasada</option>
                      </select>
                    </td>
                    <td><select value={draft.sf1 ? 'sim' : 'nao'} onChange={(e) => setDraftField(row, 'sf1', e.target.value === 'sim')}><option value="sim">Sim</option><option value="nao">Não</option></select></td>
                    <td><select value={draft.htt1 ? 'sim' : 'nao'} onChange={(e) => setDraftField(row, 'htt1', e.target.value === 'sim')}><option value="sim">Sim</option><option value="nao">Não</option></select></td>
                    <td><select value={draft.npo1 ? 'sim' : 'nao'} onChange={(e) => setDraftField(row, 'npo1', e.target.value === 'sim')}><option value="sim">Sim</option><option value="nao">Não</option></select></td>
                    <td><select value={draft.fineNpo ? 'sim' : 'nao'} onChange={(e) => setDraftField(row, 'fineNpo', e.target.value === 'sim')}><option value="nao">Não</option><option value="sim">Sim</option></select></td>
                    <td><select value={draft.fineHtt ? 'sim' : 'nao'} onChange={(e) => setDraftField(row, 'fineHtt', e.target.value === 'sim')}><option value="nao">Não</option><option value="sim">Sim</option></select></td>
                    <td><select value={draft.ccco ? 'sim' : 'nao'} onChange={(e) => setDraftField(row, 'ccco', e.target.value === 'sim')}><option value="sim">Sim</option><option value="nao">Não</option></select></td>
                    <td><input type="time" value={formatClockTime(draft.realTime) === '-' ? '' : formatClockTime(draft.realTime)} onChange={(e) => setDraftField(row, 'realTime', e.target.value)} /></td>
                    <td><input value={draft.sampler} onChange={(e) => setDraftField(row, 'sampler', e.target.value)} /></td>
                    <td><input value={draft.badge} onChange={(e) => setDraftField(row, 'badge', e.target.value)} /></td>
                    <td><input value={draft.letter} onChange={(e) => setDraftField(row, 'letter', e.target.value)} /></td>
                    <td><textarea value={draft.notes} onChange={(e) => setDraftField(row, 'notes', e.target.value)} placeholder="Justificativa da contingência" /></td>
                    <td>
                      <button className="table-action table-action--primary" type="button" onClick={() => saveDraft(row)} disabled={saving}>
                        <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
