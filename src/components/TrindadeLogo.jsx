import React from 'react'

const LOGO_SRC = '/logo-trindade.png'

export default function TrindadeLogo({ compact = false, className = '' }) {
  return (
    <div className={`trindade-logo ${compact ? 'trindade-logo--compact' : ''} ${className}`.trim()} aria-label="Trindade">
      <img
        className="trindade-logo__image"
        src={LOGO_SRC}
        alt=""
        decoding="async"
        onError={(event) => {
          event.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}
