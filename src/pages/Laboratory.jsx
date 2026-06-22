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

function fallbackRows(date) {
  return fallbackPlants.map((plant) => ({
    plant,
    operationalDate: date,
    collectedSamples: 0,
    expectedBags: 3,
    received: false,
    receivedBy: '',
    receiptNotes: '',
    receiptAt: null
  }))
}

export default function Laboratory({ loggedUser }) {
  const [date, setDate] = useState(today())
  const [rows, setRows] = useState(() => fallbackRows(today()))
  const [drafts, setDrafts] = useState({})
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

  function setDraft(plant, field, value) {
    setDrafts((current) => ({
      ...current,
      [plant]: {
        receivedBy: current[plant]?.receivedBy ?? loggedUser?.badge ?? '',
        notes: current[plant]?.notes ?? '',
        ...current[plant],
        [field]: value
      }
    }))
  }

  async function confirmReceipt(row) {
    const draft = drafts[row.plant] || {}
    const receivedBy = String(draft.receivedBy ?? loggedUser?.badge ?? '').trim()
    const notes = String(draft.notes ?? '').trim()

    if (!receivedBy) {
      window.alert('Informe o ID/cadastro de quem está confirmando o recebimento.')
      return
    }

    setSavingPlant(row.plant)
    try {
      if (hasApiConfigured()) {
        await confirmLabReceipt({ date, plant: row.plant, receivedBy, notes })
        await loadRows()
      } else {
        setRows((current) => current.map((item) => item.plant === row.plant ? {
          ...item,
          received: true,
          receivedBy,
          receiptNotes: notes,
          receiptAt: new Date().toISOString()
        } : item))
      }
      setStatus(`Recebimento confirmado para ${row.plant}`)
    } catch (error) {
      console.error(error)
      window.alert(`Não foi possível confirmar o recebimento: ${error.message}`)
      setStatus(`Erro ao confirmar recebimento: ${error.message}`)
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

      <div className="api-status-bar"><span className={status.includes('carregadas') || status.includes('confirmado') ? 'api-dot api-dot--ok' : 'api-dot'}></span>{status}</div>

      <div className="generation-card generation-card--fixed collections-filter">
        <div>
          <h3>Janela de recebimento</h3>
          <p>Exibe coletas realizadas entre <strong>{date} 07:00</strong> e <strong>{endDate} 06:00</strong>.</p>
        </div>
        <label>Data operacional<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      </div>

      <div className="table-card">
        <div className="table-card__header"><div><h3>Amostras para recebimento</h3><span>Confirme o recebimento por planta informando o ID/cadastro e uma observação quando necessário.</span></div></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Planta</th><th>Coletas realizadas</th><th>Sacos esperados</th><th>Status laboratório</th><th>ID confirmação</th><th>Observação</th><th>Recebido em</th><th>Ação</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const draft = drafts[row.plant] || {}
                const disabled = savingPlant === '__loading__' || savingPlant === row.plant || row.received
                return (
                  <tr key={row.plant}>
                    <td><strong>{row.plant}</strong></td>
                    <td>{row.collectedSamples}</td>
                    <td>{row.expectedBags}</td>
                    <td><span className={row.received ? 'status status--coletado' : 'status status--pendente'}>{row.received ? 'Recebido' : 'Pendente'}</span></td>
                    <td><input value={draft.receivedBy ?? row.receivedBy ?? loggedUser?.badge ?? ''} onChange={(event) => setDraft(row.plant, 'receivedBy', event.target.value)} disabled={disabled} placeholder="ID/cadastro" /></td>
                    <td><input value={draft.notes ?? row.receiptNotes ?? ''} onChange={(event) => setDraft(row.plant, 'notes', event.target.value)} disabled={disabled} placeholder="Observações do recebimento" /></td>
                    <td>{row.receiptAt ? new Date(row.receiptAt).toLocaleString('pt-BR') : '-'}</td>
                    <td><button className="table-action table-action--primary" type="button" onClick={() => confirmReceipt(row)} disabled={disabled}><Save size={15} /> {row.received ? 'Confirmado' : savingPlant === row.plant ? 'Salvando...' : 'Confirmar'}</button></td>
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
