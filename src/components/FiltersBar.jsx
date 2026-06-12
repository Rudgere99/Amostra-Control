import React from 'react'

export default function FiltersBar() {
  return (
    <div className="filters-bar">
      <label>Data<input type="date" defaultValue="2026-06-11" /></label>
      <label>Turno<select defaultValue="Todos"><option>Todos</option><option>1º Turno</option><option>2º Turno</option></select></label>
      <label>Planta<select defaultValue="Todas"><option>Todas</option><option>Planta 01</option><option>Planta 02</option></select></label>
      <label>Letra<select defaultValue="Todas"><option>Todas</option><option>A</option><option>B</option><option>C</option><option>D</option></select></label>
      <label>Status<select defaultValue="Todos"><option>Todos</option><option>Pendente</option><option>Coletado</option><option>Atrasado</option><option>Parcial</option></select></label>
    </div>
  )
}
