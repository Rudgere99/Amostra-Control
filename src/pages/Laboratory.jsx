import React, { useEffect, useMemo, useState } from 'react'
import { RefreshCcw, Save } from '../components/LocalIcons.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { confirmLabReceipt, fetchLabSamples, hasApiConfigured } from '../services/api.js'

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function today() {
  return formatLocalDate(new Date())
}

function addDays(date, days) {
  const copy = new Date(`${date}T00:00:00`)
  copy.setDate(copy.getDate() + days)
  return formatLocalDate(copy)
}

const fallbackPlants = ['Planta 01', 'Planta 02']
const materialLabels = [
  { key: 'sf1', label: 'SF1' },
  { key: 'htt1', label: 'HTT1' },
  { key: 'npo1', label: 'NPO1' }
]

function emptyMaterials() {
  return { sf1: false, htt1: false, npo1: false }
}

function fallbackRows(date) {
  return fallbackPlants.map((plant) => ({
    plant,
    operationalDate: date,
    collectedSamples: 0,
    expectedBags: 3,
    receivedMaterials: emptyMaterials(),
    received: false,
    receivedBy: '',
    receiptNotes: '',
    receiptAt: null
  }))
}

function normalizeMaterials(row) {
  return { ...emptyMaterials(), ...(row?.receivedMaterials || {}) }
}

function materialSummary(row) {
  const materials = normalizeMaterials(row)
  const total = materialLabels.filter((item) => materials[item.key]).length
  return `${total}/3 recebidos`
}

function LaboratoryReceiptModal({ row, loggedUser, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    receivedBy: row.receivedBy || loggedUser?.badge || '',
    notes: row.receiptNotes || '',
    receivedMaterials: normalizeMaterials(row)
  })

  function setMaterial(key, value) {
    setForm((current) => ({
      ...current,
      receivedMaterials: {
        ...current.receivedMaterials,
        [key]: value === 'sim'
      }
    }))
  }

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()
    onSave?.({ ...row, ...form })
  }

  return (
    <div className="modal-backdrop">
      <form className="modal-card" onSubmit={submit}>
        <div className="modal-card__header">
          <div>
            <span className="eyebrow">Registro de laboratório</span>
            <h3>Confirmar recebimento - {row.plant}</h3>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <div className="form-grid">
          <label>Usuário logado<input value={loggedUser?.name || 'Laboratório'} readOnly /></label>
          <label>Matrícula<input value={loggedUser?.badge || '-'} readOnly /></label>
          <label>Planta<input value={row.plant || '-'} readOnly /></label>
          <label>Data operacional<input value={row.operationalDate || '-'} readOnly /></label>
          <label>Janela inicial<input value="07:00" readOnly /></label>
          <label>Janela final<input value="06:00 do dia seguinte" readOnly /></label>
          <label>Coletas realizadas<input value={row.collectedSamples ?? 0} readOnly /></label>
          <label>Sacos esperados<input value={row.expectedBags ?? 3} readOnly /></label>
          <label>ID/cadastro da confirmação<input value={form.receivedBy} onChange={(event) => setField('receivedBy', event.target.value)} placeholder="Informe o ID" required /></label>
          <label>SF1 recebido?<select value={form.receivedMaterials.sf1 ? 'sim' : 'nao'} onChange={(event) => setMaterial('sf1', event.target.value)}><option value="sim">Sim</option><option value="nao">Não</option></select></label>
          <label>HTT1 recebido?<select value={form.receivedMaterials.htt1 ? 'sim' : 'nao'} onChange={(event) => setMaterial('htt1', event.target.value)}><option value="sim">Sim</option><option value="nao">Não</option></select></label>
          <label>NPO1 recebido?<select value={form.receivedMaterials.npo1 ? 'sim' : 'nao'} onChange={(event) => setMaterial('npo1', event.target.value)}><option value="sim">Sim</option><option value="nao">Não</option></select></label>
          <label className="form-grid__full">Observações do recebimento<textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} placeholder="Registre divergências, avarias ou observações do recebimento" /></label>
        </div>

        <div className="modal-card__actions">
          <button className="btn btn--ghost" type="button" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn--orange" type="submit" disabled={saving}><Save size={17} /> {saving ? 'Salvando...' : 'Salvar lançamento'}</button>
        </div>
      </form>
    </div>
  )
}

export default function Laboratory({ loggedUser }) {
  const [date, setDate] = useState(today())
  const [rows, setRows] = useState(() => fallbackRows(today()))
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState(hasApiConfigured() ? 'Conectando ao Railway...' : 'API não configurada. Exibindo modelo local.')
  const [savingPlant, setSavingPlant] = useState('')

  const endDate = useMemo(() => addDays(date, 1), [date])

  async function loadRows() {
    if (!hasApiConfigured()) {
      setRows(fallbackRows(date))
      return
    }

    setSavingPlant('__loading__')
    try {
      const data = await fetchLabSamples({ date })
      const list = Array.isArray(data) ? data : []
      setRows(list.length ? list : fallbackRows(date))
      setStatus('Amostras do laboratório carregadas do Railway')
    } catch (error) {
      console.error(error)
      setStatus(`Erro ao carregar amostras do laboratório: ${error.message}`)
    } finally {
      setSavingPlant('')
    }
  }

  useEffect(() => {
    loadRows()
  }, [date])

  async function saveReceipt(updatedRow) {
    const receivedBy = String(updatedRow.receivedBy || '').trim()
    const notes = String(updatedRow.notes || '').trim()
    const receivedMaterials = normalizeMaterials(updatedRow)

    if (!receivedBy) {
      window.alert('Informe o ID/cadastro de quem está confirmando o recebimento.')
      return
    }

    setSavingPlant(updatedRow.plant)
    try {
      if (hasApiConfigured()) {
        await confirmLabReceipt({ date, plant: updatedRow.plant, receivedBy, notes, receivedMaterials })
        await loadRows()
      } else {
        setRows((current) => current.map((item) => item.plant === updatedRow.plant ? {
          ...item,
          receivedMaterials,
          received: receivedMaterials.sf1 && receivedMaterials.htt1 && receivedMaterials.npo1,
          receivedBy,
          receiptNotes: notes,
          receiptAt: new Date().toISOString()
        } : item))
      }
      setSelected(null)
      setStatus(`Lançamento do laboratório salvo para ${updatedRow.plant}`)
    } catch (error) {
      console.error(error)
      window.alert(`Não foi possível salvar o lançamento: ${error.message}`)
      setStatus(`Erro ao salvar lançamento: ${error.message}`)
    } finally {
      setSavingPlant('')
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Laboratório"
        title="Amostras recebidas"
        description="Controle dos sacos enviados ao laboratório: montante coletado das 07:00 do dia selecionado até 06:00 do dia seguinte, com três sacos por planta."
        actions={(<button className="btn btn--ghost" type="button" onClick={loadRows} disabled={Boolean(savingPlant)}><RefreshCcw size={17} /> Atualizar</button>)}
      />

      <div className="api-status-bar"><span className={status.includes('carregadas') || status.includes('salvo') ? 'api-dot api-dot--ok' : 'api-dot'}></span>{status}</div>

      <div className="generation-card generation-card--fixed collections-filter">
        <div>
          <h3>Janela de recebimento</h3>
          <p>Exibe coletas realizadas entre <strong>{date} 07:00</strong> e <strong>{endDate} 06:00</strong>.</p>
        </div>
        <label>Data operacional<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      </div>

      <div className="table-card">
        <div className="table-card__header"><div><h3>Amostras para recebimento</h3><span>Abra o lançamento para marcar SF1, HTT1 e NPO1, informando o ID/cadastro e observações.</span></div></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Planta</th><th>Coletas realizadas</th><th>Sacos esperados</th><th>Materiais recebidos</th><th>Status laboratório</th><th>ID confirmação</th><th>Observação</th><th>Recebido em</th><th>Ação</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const disabled = savingPlant === '__loading__' || savingPlant === row.plant
                return (
                  <tr key={row.plant}>
                    <td><strong>{row.plant}</strong></td>
                    <td>{row.collectedSamples}</td>
                    <td>{row.expectedBags}</td>
                    <td>{materialSummary(row)}</td>
                    <td><span className={row.received ? 'status status--coletado' : 'status status--pendente'}>{row.received ? 'Completo' : 'Pendente'}</span></td>
                    <td>{row.receivedBy || '-'}</td>
                    <td className="notes-preview">{row.receiptNotes || '-'}</td>
                    <td>{row.receiptAt ? new Date(row.receiptAt).toLocaleString('pt-BR') : '-'}</td>
                    <td><button className="table-action table-action--primary" type="button" onClick={() => setSelected(row)} disabled={disabled}>{savingPlant === row.plant ? 'Salvando...' : row.receiptAt ? 'Editar' : 'Confirmar'}</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <LaboratoryReceiptModal
          row={selected}
          loggedUser={loggedUser}
          onClose={() => setSelected(null)}
          onSave={saveReceipt}
          saving={savingPlant === selected.plant}
        />
      )}
    </div>
  )
}
