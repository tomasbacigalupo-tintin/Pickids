import React from 'react'
import { ChevronLeft, Bell } from 'lucide-react'
import './ui.css'
import { initials, avatarColor } from '../shared/format'

// ========= Button =========
type ButtonVariant = 'primary' | 'action' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'md' | 'lg' | 'sm'
export function Button(props: {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  children?: React.ReactNode
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  type?: 'button' | 'submit'
  as?: 'button' | 'div'
  className?: string
}) {
  const variant = props.variant ?? 'primary'
  const size = props.size ?? 'lg'
  return (
    <button
      type={props.type ?? 'button'}
      className={`pk-btn pk-btn--${variant} pk-btn--${size} ${props.fullWidth ? 'pk-btn--full' : ''} ${props.className ?? ''}`}
      disabled={props.disabled || props.loading}
      onClick={props.onClick}
    >
      {props.leftIcon && <span className="pk-btn__icon">{props.leftIcon}</span>}
      <span>{props.loading ? 'Cargando…' : props.children}</span>
      {props.rightIcon && <span className="pk-btn__icon">{props.rightIcon}</span>}
    </button>
  )
}

// ========= Card =========
export function Card(props: {
  children: React.ReactNode
  variant?: 'default' | 'highlight' | 'message'
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}) {
  const variant = props.variant ?? 'default'
  return (
    <div
      className={`pk-card pk-card--${variant} ${props.onClick ? 'pk-card--clickable' : ''} ${props.className ?? ''}`}
      onClick={props.onClick}
      style={props.style}
    >
      {props.children}
    </div>
  )
}

// ========= Chip =========
export function Chip(props: { children: React.ReactNode; color?: string; bg?: string; style?: React.CSSProperties }) {
  return (
    <span className="pk-chip" style={{ color: props.color ?? 'var(--p-primary)', background: props.bg ?? 'var(--p-primary-tint)', ...(props.style || {}) }}>
      {props.children}
    </span>
  )
}

// ========= Input =========
export function Input(props: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'time'
  error?: string
  hint?: string
  disabled?: boolean
  maxLength?: number
  leftIcon?: React.ReactNode
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal'
}) {
  return (
    <label className="pk-field">
      {props.label && <span className="pk-field__label">{props.label}</span>}
      <span className={`pk-input ${props.error ? 'pk-input--error' : ''} ${props.disabled ? 'pk-input--disabled' : ''}`}>
        {props.leftIcon && <span className="pk-input__left">{props.leftIcon}</span>}
        <input
          type={props.type ?? 'text'}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          disabled={props.disabled}
          maxLength={props.maxLength}
          inputMode={props.inputMode}
        />
      </span>
      {props.hint && !props.error && <span className="pk-field__hint">{props.hint}</span>}
      {props.error && <span className="pk-field__error">{props.error}</span>}
    </label>
  )
}

export function TextArea(props: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
  hint?: string
}) {
  return (
    <label className="pk-field">
      {props.label && <span className="pk-field__label">{props.label}</span>}
      <textarea
        className="pk-textarea"
        value={props.value}
        rows={props.rows ?? 4}
        maxLength={props.maxLength}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
      {props.hint && <span className="pk-field__hint">{props.hint}</span>}
    </label>
  )
}

// ========= Switch =========
export function Switch(props: { checked: boolean; onChange: (v: boolean) => void; label?: string; description?: string }) {
  return (
    <label className="pk-switch-row">
      <div>
        {props.label && <div className="pk-switch-row__label">{props.label}</div>}
        {props.description && <div className="pk-switch-row__desc">{props.description}</div>}
      </div>
      <span className={`pk-switch ${props.checked ? 'pk-switch--on' : ''}`} onClick={() => props.onChange(!props.checked)}>
        <span className="pk-switch__dot" />
      </span>
    </label>
  )
}

// ========= Avatar =========
export function Avatar(props: { nombre: string; apellido?: string; src?: string | null; size?: number; color?: string }) {
  const size = props.size ?? 48
  const style: React.CSSProperties = {
    width: size, height: size, borderRadius: '50%',
    background: props.src ? `center/cover url("${props.src}")` : (props.color ?? avatarColor(props.nombre + (props.apellido ?? ''))),
    color: 'white',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 600, fontSize: Math.round(size * 0.38),
    flexShrink: 0, userSelect: 'none',
  }
  return (
    <span style={style}>
      {!props.src && initials(props.nombre, props.apellido)}
    </span>
  )
}

// ========= Screen shell =========
export function Header(props: {
  title?: React.ReactNode
  back?: boolean | (() => void)
  right?: React.ReactNode
  bell?: { count?: number; onClick?: () => void }
  subtitle?: React.ReactNode
}) {
  return (
    <header className="pk-header safe-top">
      <div className="pk-header__row">
        {props.back ? (
          <button className="pk-header__btn" onClick={typeof props.back === 'function' ? props.back : () => window.history.back()} aria-label="Volver">
            <ChevronLeft size={24} />
          </button>
        ) : <span className="pk-header__slot" />}
        <h1 className="pk-header__title">{props.title}</h1>
        <span className="pk-header__right">
          {props.bell && (
            <button className="pk-header__btn pk-header__bell" onClick={props.bell.onClick} aria-label="Notificaciones">
              <Bell size={22} />
              {!!props.bell.count && <span className="pk-header__badge">{props.bell.count > 9 ? '9+' : props.bell.count}</span>}
            </button>
          )}
          {props.right}
        </span>
      </div>
      {props.subtitle && <div className="pk-header__subtitle">{props.subtitle}</div>}
    </header>
  )
}

export function Screen(props: { children: React.ReactNode; withTabBar?: boolean; withStickyAction?: boolean; bg?: string; noPadding?: boolean }) {
  return (
    <main
      className={`pk-screen ${props.withTabBar ? 'pk-screen--tabbar' : ''} ${props.withStickyAction ? 'pk-screen--sticky' : ''} ${props.noPadding ? 'pk-screen--nopad' : ''}`}
      style={{ background: props.bg ?? 'var(--n-bg)' }}
    >
      {props.children}
    </main>
  )
}

export function StickyAction(props: { children: React.ReactNode }) {
  return <div className="pk-sticky-action safe-bottom">{props.children}</div>
}

// ========= Tab Bar =========
export function TabBar(props: {
  items: { id: string; label: string; icon: React.ReactNode; badge?: number }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <nav className="pk-tabbar safe-bottom">
      {props.items.map(item => (
        <button
          key={item.id}
          className={`pk-tabbar__item ${props.active === item.id ? 'is-active' : ''}`}
          onClick={() => props.onChange(item.id)}
        >
          <span className="pk-tabbar__icon">
            {item.icon}
            {!!item.badge && <span className="pk-tabbar__badge">{item.badge > 9 ? '9+' : item.badge}</span>}
          </span>
          <span className="pk-tabbar__label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

// ========= Empty state =========
export function EmptyState(props: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="pk-empty">
      <div className="pk-empty__icon">{props.icon ?? '📦'}</div>
      <div className="pk-empty__title">{props.title}</div>
      {props.description && <div className="pk-empty__desc">{props.description}</div>}
      {props.action && <div className="pk-empty__action">{props.action}</div>}
    </div>
  )
}

// ========= Bottom sheet / Modal =========
export function BottomSheet(props: { open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; size?: 'auto' | 'tall' }) {
  if (!props.open) return null
  return (
    <div className="pk-sheet__backdrop" onClick={props.onClose}>
      <div className={`pk-sheet pk-sheet--${props.size ?? 'auto'}`} onClick={(e) => e.stopPropagation()}>
        <div className="pk-sheet__handle" />
        {props.title && <div className="pk-sheet__title">{props.title}</div>}
        <div className="pk-sheet__body">{props.children}</div>
      </div>
    </div>
  )
}

// ========= Segmented =========
export function Segmented<T extends string>(props: {
  value: T; onChange: (v: T) => void; items: { id: T; label: string }[]
}) {
  return (
    <div className="pk-segmented">
      {props.items.map(it => (
        <button key={it.id} className={`pk-segmented__item ${props.value === it.id ? 'is-active' : ''}`} onClick={() => props.onChange(it.id)}>
          {it.label}
        </button>
      ))}
    </div>
  )
}

// ========= Stepper (steps dots) =========
export function Stepper(props: { current: number; total: number; labels?: string[] }) {
  return (
    <div className="pk-stepper">
      {Array.from({ length: props.total }).map((_, i) => (
        <span key={i} className={`pk-stepper__dot ${i <= props.current ? 'is-active' : ''}`} />
      ))}
      {props.labels && <span className="pk-stepper__label">{props.labels[props.current]}</span>}
    </div>
  )
}

// ========= FAB =========
export function FAB(props: { icon: React.ReactNode; onClick: () => void; variant?: 'action' | 'primary'; label?: string }) {
  return (
    <button className={`pk-fab pk-fab--${props.variant ?? 'action'} ${props.label ? 'pk-fab--withlabel' : ''} safe-bottom`} onClick={props.onClick}>
      <span className="pk-fab__icon">{props.icon}</span>
      {props.label && <span className="pk-fab__label">{props.label}</span>}
    </button>
  )
}

// ========= Toast container =========
import { useToast } from '../store/toast'
export function ToastHost() {
  const list = useToast(s => s.list)
  const dismiss = useToast(s => s.dismiss)
  if (!list.length) return null
  return (
    <div className="pk-toasts safe-top">
      {list.map(t => (
        <div key={t.id} className={`pk-toast pk-toast--${t.variant}`} onClick={() => dismiss(t.id)}>
          <div className="pk-toast__title">{t.title}</div>
          {t.body && <div className="pk-toast__body">{t.body}</div>}
        </div>
      ))}
    </div>
  )
}
