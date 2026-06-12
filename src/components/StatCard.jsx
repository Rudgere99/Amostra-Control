import React from 'react'

export default function StatCard({ label, value, detail, tone = 'blue', icon: Icon }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__top">
        <span>{label}</span>
        {Icon && <Icon size={22} />}
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  )
}
