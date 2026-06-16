import React, { useState } from 'react'

const LOGO_SOURCES = ['/logo-trindade.png', '/trindade.png', '/logo.png', '/Logo.png']

export default function TrindadeLogo({ compact = false, className = '' }) {
  const [sourceIndex, setSourceIndex] = useState(0)
  const logoSource = LOGO_SOURCES[sourceIndex]

  function handleError() {
    setSourceIndex((current) => Math.min(current + 1, LOGO_SOURCES.length - 1))
  }

  return (
    <div className={`trindade-logo ${compact ? 'trindade-logo--compact' : ''} ${className}`.trim()} aria-label="Trindade">
      <img className="trindade-logo__image" src={logoSource} alt="Trindade" onError={handleError} />
    </div>
  )
}
