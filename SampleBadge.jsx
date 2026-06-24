import React from 'react'

export default function FiltersBar({ filters, onChange }) {
  function setFilter(field, value) {
    onChange?.({ ...filters, [field]: value })
  }

  return (
    <div className="filters-bar">
      <label>
        Data
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilter('date', e.target.value)}
        />
      </label>

      <label>
        Turno
        <select value={filters.shift} onChange={(e) => setFilter('shift', e.target.value)}>
          <option value="Todos">Todos</option>
          <option value="1º Turno">1º Turno</option>
          <option value="2º Turno">2º Turno</option>
        </select>
      </label>

      <label>
        Planta
        <select value={filters.plant} onChange={(e) => setFilter('plant', e.target.value)}>
          <option value="Todas">Todas</option>
          <option value="Planta 01">Planta 01</option>
          <option value="Planta 02">Planta 02</option>
        </select>
      </label>

      <label>
        Letra
        <select value={filters.letter} onChange={(e) => setFilter('letter', e.target.value)}>
          <option value="Todas">Todas</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </label>

      <label>
        Status
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="Todos">Todos</option>
          <option value="pendente">Pendente</option>
          <option value="coletado">Coletado</option>
          <option value="atrasado">Atrasado</option>
          <option value="parcial">Parcial</option>
          <option value="nao_realizado">Não realizado</option>
        </select>
      </label>
    </div>
  )
}
