import React from 'react'
import { ESTADOS_ORDEN, ESTADO_META, idxEnBarra } from '../shared/states'
import type { EstadoRetiro } from '../shared/types'
import './state-bar.css'

export function StateBar({ estado }: { estado: EstadoRetiro }) {
  const current = idxEnBarra(estado)
  const isFinalNegativo = ['rechazado', 'cancelado', 'expirado'].includes(estado)

  if (isFinalNegativo) {
    const meta = ESTADO_META[estado]
    return (
      <div className="pk-statebar pk-statebar--negative" style={{ background: meta.bg, borderColor: meta.color }}>
        <span className="pk-statebar__dot" style={{ background: meta.color }} />
        <span style={{ color: meta.color, fontWeight: 700 }}>{meta.label}</span>
      </div>
    )
  }

  return (
    <div className="pk-statebar">
      {ESTADOS_ORDEN.map((e, i) => {
        const meta = ESTADO_META[e]
        const active = i <= current
        return (
          <React.Fragment key={e}>
            <div className="pk-statebar__step">
              <span
                className={`pk-statebar__node ${active ? 'is-active' : ''}`}
                style={active ? { background: meta.color, boxShadow: `0 0 0 6px ${meta.bg}` } : undefined}
              >
                {active && <span className="pk-statebar__check">•</span>}
              </span>
              <span className="pk-statebar__label" style={i === current ? { color: meta.color, fontWeight: 600 } : undefined}>
                {meta.short}
              </span>
            </div>
            {i < ESTADOS_ORDEN.length - 1 && (
              <span className={`pk-statebar__line ${i < current ? 'is-active' : ''}`} style={i < current ? { background: ESTADO_META[ESTADOS_ORDEN[i + 1]].color } : undefined} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export function StateChip({ estado }: { estado: EstadoRetiro }) {
  const meta = ESTADO_META[estado]
  return (
    <span className="pk-statechip" style={{ color: meta.color, background: meta.bg }}>
      <span className="pk-statechip__dot" style={{ background: meta.color }} />
      {meta.label}
    </span>
  )
}
