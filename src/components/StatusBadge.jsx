import React from 'react'
import { getStatusLabel } from '../utils/status.js'

export default function StatusBadge({ status }) {
  return <span className={`status status--${status}`}>{getStatusLabel(status)}</span>
}
