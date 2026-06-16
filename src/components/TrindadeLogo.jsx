import React from 'react'

export default function TrindadeLogo({ compact = false, className = '' }) {
  return (
    <div className={`trindade-logo ${compact ? 'trindade-logo--compact' : ''} ${className}`.trim()} aria-label="Trindade">
      <svg className="trindade-logo__mark" viewBox="0 0 64 64" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="trindade-mark-gradient" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="0.52" stopColor="#2563eb" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <path d="M32 5 58 20v24L32 59 6 44V20L32 5Z" fill="url(#trindade-mark-gradient)" />
        <path d="M20 22h24M32 22v24M22 42h20" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="trindade-logo__text">
        <strong>Trindade</strong>
        {!compact && <span>Operação & Amostragem</span>}
      </div>
    </div>
  )
}
