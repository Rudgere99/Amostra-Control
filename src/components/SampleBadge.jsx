import React from 'react'

export default function SampleBadge({ value }) {
  return (
    <span className={`sample ${value ? 'sample--ok' : 'sample--empty'}`}>
      {value ? 'OK' : '--'}
    </span>
  )
}
