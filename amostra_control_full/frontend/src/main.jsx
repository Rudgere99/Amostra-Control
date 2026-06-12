import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, CheckCircle2, Clock, Database, FileDown, History, LayoutDashboard, RefreshCw, Search, UserRound } from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function formatDateInput(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function currentTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function currentTimeShort() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function playBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.45);
    oscillator.stop(audioCtx.currentTime + 0.45);
  } catch {
    console.log('Áudio indisponível.');
  }
}

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Erro na comunicação com a API');
  return data;
}

function StatusPill({ status }) {
  const normalized = status || 'Pendente';
  let cls = 'pending';
  if (normalized.includes('horário')) cls = 'ok';
  if (normalized.includes('atraso') || normalized === 'Atrasado') cls = 'late';
  if (normalized === 'Parcial') cls = 'partial';
  if (normalized === 'Não realizado') cls = 'neutral';
  return <span className={`pill ${cls}`}>{normalized}</span>;
}

function BoolPill({ value }) {
  if (value === 1 || value === true) return <span className="pill ok">OK</span>;
  if (value === 0 || value === false) return <span className="pill late">Não</span>;
  return <span className="pill pending">--</span>;
}

function App() {
  const [date, setDate] = useState(formatDateInput());
  const [planta, setPlanta] = useState('Planta 01');
  const [turno, setTurno] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [clock, setClock] = useState(currentTime());
  const [programacao, setProgramacao] = useState([]);
  const [dashboard, setDashboard] = useState({ total: 0, realizadas: 0, pendentes: 0, atrasadas: 0, parciais: 0, aderencia: 0 });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const [form, setForm] = useState({
    nome: '', cadastro: '', sf1: true, htt1: true, npo1: true,
    contem_fino_agregado: false, informado_ccco: true, observacoes: '', justificativa: ''
  });

  const filteredProgramacao = useMemo(() => {
    return programacao.filter(item => {
      const st = item.coleta_status || item.status || 'Pendente';
      const turnoOk = turno === 'Todos' || item.turno === turno;
      const statusOk = statusFilter === 'Todos' || st === statusFilter;
      return turnoOk && statusOk;
    });
  }, [programacao, turno, statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [rows, dash] = await Promise.all([
        api(`/programacao?date=${date}&planta=${encodeURIComponent(planta)}`),
        api(`/dashboard?date=${date}&planta=${encodeURIComponent(planta)}`),
      ]);
      setProgramacao(rows);
      setDashboard(dash);
    } catch (error) {
      setAlert({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function gerarProgramacao() {
    setLoading(true);
    try {
      await api('/seed', { method: 'POST', body: JSON.stringify({ date, planta }) });
      setAlert({ type: 'success', text: 'Programação gerada/atualizada para o dia selecionado.' });
      await loadData();
    } catch (error) {
      setAlert({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [date, planta]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setClock(currentTime());
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:00`;
      if (now.getMinutes() === 0 && now.getSeconds() === 0) {
        const pending = programacao.find(item => item.hora_programada === hhmm && !item.coleta_status && ['Pendente', 'Atrasado'].includes(item.status));
        if (pending) {
          setAlert({ type: 'warning', text: `Atenção: coleta de amostra pendente para ${hhmm}.` });
          playBeep();
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [programacao]);

  function openModal(item) {
    setModalItem(item);
    setForm({
      nome: '', cadastro: '', sf1: true, htt1: true, npo1: true,
      contem_fino_agregado: false, informado_ccco: true, observacoes: '', justificativa: ''
    });
  }

  async function saveCollection(event) {
    event.preventDefault();
    if (!modalItem) return;

    const hasPartial = !form.sf1 || !form.htt1 || !form.npo1;
    if (hasPartial && !form.observacoes && !form.justificativa) {
      setAlert({ type: 'error', text: 'Informe observação ou justificativa para coleta parcial/não realizada.' });
      return;
    }

    try {
      await api('/coletas', {
        method: 'POST',
        body: JSON.stringify({ programacao_id: modalItem.id, ...form }),
      });
      setAlert({ type: 'success', text: 'Coleta registrada com sucesso.' });
      setModalItem(null);
      await loadData();
    } catch (error) {
      setAlert({ type: 'error', text: error.message });
    }
  }

  function exportCsv() {
    const header = ['Data','Hora Programada','SF1','HTT1','NPO1','Amostrador','Cadastro','Hora Real','Status','Fino Agregado','Informado CCCO','Observações'];
    const rows = programacao.map(item => [
      item.data_programada,
      item.hora_programada,
      item.pilha_sf1 ? 'Sim' : item.coleta_id ? 'Não' : '',
      item.pilha_htt1 ? 'Sim' : item.coleta_id ? 'Não' : '',
      item.pilha_npo1 ? 'Sim' : item.coleta_id ? 'Não' : '',
      item.amostrador || '',
      item.cadastro || '',
      item.hora_real || '',
      item.coleta_status || item.status || '',
      item.contem_fino_agregado ? 'Sim' : 'Não',
      item.informado_ccco ? 'Sim' : 'Não',
      item.observacoes || item.justificativa || '',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `amostragem_${date}_${planta.replaceAll(' ', '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logoBox">
          <div className="logoMark">AC</div>
          <div>
            <h1>Amostra<span>Control</span></h1>
            <p>Controle Operacional</p>
          </div>
        </div>
        <nav className="menu">
          <a className="active"><LayoutDashboard size={18}/> Dashboard</a>
          <a><Bell size={18}/> Coletas</a>
          <a><History size={18}/> Histórico</a>
          <a><FileDown size={18}/> Relatórios</a>
          <a><Database size={18}/> Banco local</a>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>Controle de Coleta de Amostras</h2>
            <p>Acompanhamento horário das amostragens SF1, HTT1 e NPO1</p>
          </div>
          <div className="clockBox">
            <strong>{clock}</strong>
            <span>{new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')}</span>
          </div>
        </header>

        {alert && (
          <section className={`alert ${alert.type}`}>
            <span>{alert.text}</span>
            <button onClick={() => setAlert(null)}>Fechar</button>
          </section>
        )}

        <section className="cards">
          <Card label="Programadas" value={dashboard.total} icon={<Clock />} tone="blue" />
          <Card label="Realizadas" value={dashboard.realizadas} icon={<CheckCircle2 />} tone="green" />
          <Card label="Pendentes" value={dashboard.pendentes} icon={<Bell />} tone="orange" />
          <Card label="Atrasadas" value={dashboard.atrasadas} icon={<Clock />} tone="red" />
          <Card label="Aderência" value={`${dashboard.aderencia}%`} icon={<CheckCircle2 />} tone="yellow" />
        </section>

        <section className="filters">
          <label>Data<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
          <label>Planta<select value={planta} onChange={e => setPlanta(e.target.value)}><option>Planta 01</option><option>Planta 02</option></select></label>
          <label>Turno<select value={turno} onChange={e => setTurno(e.target.value)}><option>Todos</option><option>1º Turno</option><option>2º Turno</option></select></label>
          <label>Status<select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>Todos</option><option>Pendente</option><option>Coletado no horário</option><option>Coletado com atraso</option><option>Parcial</option><option>Não realizado</option></select></label>
          <div className="filterActions">
            <button className="btn dark" onClick={loadData}><RefreshCw size={16}/> Atualizar</button>
            <button className="btn orange" onClick={gerarProgramacao}>Gerar dia</button>
            <button className="btn blue" onClick={exportCsv}><FileDown size={16}/> CSV</button>
          </div>
        </section>

        <section className="tableCard">
          <div className="tableHeader">
            <div>
              <h3>Programação diária de amostragem</h3>
              <p>Hora programada, pilhas, amostrador, cadastro e status da coleta.</p>
            </div>
            {loading && <span className="loading">Carregando...</span>}
          </div>

          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Hora</th><th>SF1</th><th>HTT1</th><th>NPO1</th><th>Amostrador</th><th>Cadastro</th><th>Hora real</th><th>Status</th><th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredProgramacao.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.hora_programada}</strong></td>
                    <td><BoolPill value={item.coleta_id ? item.pilha_sf1 : null} /></td>
                    <td><BoolPill value={item.coleta_id ? item.pilha_htt1 : null} /></td>
                    <td><BoolPill value={item.coleta_id ? item.pilha_npo1 : null} /></td>
                    <td>{item.amostrador || '--'}</td>
                    <td>{item.cadastro || '--'}</td>
                    <td>{item.hora_real || '--'}</td>
                    <td><StatusPill status={item.coleta_status || item.status} /></td>
                    <td>
                      {item.coleta_id ? <button className="btn dark"><Search size={15}/> Visualizar</button> : <button className="btn blue" onClick={() => openModal(item)}><UserRound size={15}/> Registrar</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {modalItem && (
        <div className="modalOverlay">
          <form className="modal" onSubmit={saveCollection}>
            <div className="modalHeader">
              <div>
                <h3>Registrar Coleta</h3>
                <p>Hora programada: {modalItem.hora_programada} | Hora real: {currentTimeShort()}</p>
              </div>
              <button type="button" className="close" onClick={() => setModalItem(null)}>×</button>
            </div>

            <div className="formGrid">
              <label>Nome do amostrador<input required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></label>
              <label>Cadastro / Matrícula<input required value={form.cadastro} onChange={e => setForm({...form, cadastro: e.target.value})} /></label>
              <label>SF1 coletada?<select value={String(form.sf1)} onChange={e => setForm({...form, sf1: e.target.value === 'true'})}><option value="true">Sim</option><option value="false">Não</option></select></label>
              <label>HTT1 coletada?<select value={String(form.htt1)} onChange={e => setForm({...form, htt1: e.target.value === 'true'})}><option value="true">Sim</option><option value="false">Não</option></select></label>
              <label>NPO1 coletada?<select value={String(form.npo1)} onChange={e => setForm({...form, npo1: e.target.value === 'true'})}><option value="true">Sim</option><option value="false">Não</option></select></label>
              <label>Contém fino agregado?<select value={String(form.contem_fino_agregado)} onChange={e => setForm({...form, contem_fino_agregado: e.target.value === 'true'})}><option value="false">Não</option><option value="true">Sim</option></select></label>
              <label>Informado ao CCCO?<select value={String(form.informado_ccco)} onChange={e => setForm({...form, informado_ccco: e.target.value === 'true'})}><option value="true">Sim</option><option value="false">Não</option></select></label>
              <label>Justificativa<select value={form.justificativa} onChange={e => setForm({...form, justificativa: e.target.value})}><option value="">Sem justificativa</option><option>Pilha sem material</option><option>Acesso impedido</option><option>Condição insegura</option><option>Chuva</option><option>Ausência de amostrador</option><option>Outro</option></select></label>
              <label className="full">Observações<textarea value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} placeholder="Obrigatório em caso de coleta parcial ou não realizada" /></label>
            </div>

            <div className="modalActions">
              <button type="button" className="btn dark" onClick={() => setModalItem(null)}>Cancelar</button>
              <button type="submit" className="btn orange">Salvar Coleta</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, icon, tone }) {
  return <div className={`card ${tone}`}><div className="cardIcon">{icon}</div><p>{label}</p><h3>{value}</h3></div>;
}

createRoot(document.getElementById('root')).render(<App />);
