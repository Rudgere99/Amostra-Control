import React from 'react'
import PageHeader from '../components/PageHeader.jsx'
import FiltersBar from '../components/FiltersBar.jsx'

export default function History() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Consulta"
        title="Histórico de amostragens"
        description="Área reservada para consultar coletas anteriores por período, amostrador, status e planta."
      />
      <FiltersBar />
      <div className="panel">
        <div className="panel__header"><div><h3>Histórico</h3><span>Conectar ao banco/API na próxima etapa.</span></div></div>
        <p className="report-text">Nesta versão front-end, os dados são demonstrativos. Ao integrar com back-end, esta página listará todos os registros salvos.</p>
      </div>
    </div>
  )
}
