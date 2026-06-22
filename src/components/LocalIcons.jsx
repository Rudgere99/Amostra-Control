import React from 'react'

function BaseIcon({ size = 18, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export function AlertTriangle(props) {
  return <BaseIcon {...props}><path d="M12 3 22 20H2L12 3Z" /><path d="M12 9v5" /><path d="M12 17h.01" /></BaseIcon>
}

export function PencilLine(props) {
  return <BaseIcon {...props}><path d="M4 20h4l11-11-4-4L4 16v4Z" /><path d="M13 6l4 4" /></BaseIcon>
}

export function Bell(props) {
  return <BaseIcon {...props}><path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" /><path d="M10 21h4" /></BaseIcon>
}

export function Menu(props) {
  return <BaseIcon {...props}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></BaseIcon>
}

export function Search(props) {
  return <BaseIcon {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></BaseIcon>
}

export function CalendarClock(props) {
  return <BaseIcon {...props}><path d="M7 2v4" /><path d="M17 2v4" /><path d="M3 9h18" /><path d="M5 5h14v16H5z" /><path d="M12 13v4l3 2" /></BaseIcon>
}

export function ClipboardCheck(props) {
  return <BaseIcon {...props}><path d="M9 4h6l1 2h3v16H5V6h3l1-2Z" /><path d="m9 14 2 2 4-5" /></BaseIcon>
}

export function FileText(props) {
  return <BaseIcon {...props}><path d="M6 2h9l5 5v15H6z" /><path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" /></BaseIcon>
}

export function Home(props) {
  return <BaseIcon {...props}><path d="M3 11 12 3l9 8" /><path d="M5 10v11h14V10" /><path d="M10 21v-6h4v6" /></BaseIcon>
}

export function Settings(props) {
  return <BaseIcon {...props}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 3.1a7 7 0 0 0-1.7 1l-2.4-1-2 3.4L5.1 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 3.1h5l.3-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.6.1-1Z" /></BaseIcon>
}

export function Users(props) {
  return <BaseIcon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.1a4 4 0 0 1 0 7.8" /></BaseIcon>
}

export function Download(props) {
  return <BaseIcon {...props}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></BaseIcon>
}

export function RefreshCcw(props) {
  return <BaseIcon {...props}><path d="M3 12a9 9 0 0 1 15-6l3 3" /><path d="M21 4v5h-5" /><path d="M21 12a9 9 0 0 1-15 6l-3-3" /><path d="M3 20v-5h5" /></BaseIcon>
}

export function Save(props) {
  return <BaseIcon {...props}><path d="M5 3h12l2 2v16H5z" /><path d="M8 3v6h8" /><path d="M8 21v-7h8v7" /></BaseIcon>
}

export function Activity(props) {
  return <BaseIcon {...props}><path d="M3 12h4l3-8 4 16 3-8h4" /></BaseIcon>
}

export function CheckCircle2(props) {
  return <BaseIcon {...props}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></BaseIcon>
}

export function Clock3(props) {
  return <BaseIcon {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></BaseIcon>
}

export function Target(props) {
  return <BaseIcon {...props}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></BaseIcon>
}

export function LogIn(props) {
  return <BaseIcon {...props}><path d="M15 3h4v18h-4" /><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /></BaseIcon>
}

export function UserPlus(props) {
  return <BaseIcon {...props}><path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M19 8v6" /><path d="M16 11h6" /></BaseIcon>
}

export function Beaker(props) {
  return <BaseIcon {...props}><path d="M9 3h6" /><path d="M10 3v6l-5 9a3 3 0 0 0 2.6 4h8.8a3 3 0 0 0 2.6-4l-5-9V3" /><path d="M8 15h8" /></BaseIcon>
}
