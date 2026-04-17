import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AppRoot } from './shell/AppRoot'
import { ensureSeed } from './db/seed'
import { initSync } from './db/sync'

// Seed demo data and init cross-tab sync before rendering.
ensureSeed().then(() => {
  initSync()
  const base = (import.meta as any).env?.BASE_URL ?? '/'
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter basename={base.replace(/\/$/, '') || '/'}>
        <AppRoot />
      </BrowserRouter>
    </StrictMode>
  )
})
