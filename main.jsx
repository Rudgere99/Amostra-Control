import React, { useState } from 'react'

const LOGO_SRC = '/logo-trindade.png'

export default function TrindadeLogo({ compact = false, className = '' }) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className={`trindade-logo ${compact ? 'trindade-logo--compact' : ''} ${className}`.trim()} aria-label="Trindade">
      {!imageError ? (
        <img
          className="trindade-logo__image"
          src={LOGO_SRC}
          alt="Trindade"
          decoding="async"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="trindade-logo__fallback" aria-hidden="true">
          <span>Trindade</span>
        </div>
      )}
    </div>
  )
}
