// BroadcastChannel entre tabs/devices locales + notificaciones simuladas.
// Cada mutación relevante emite un evento; los tabs refrescan UI via dexie-react-hooks
// que ya observa cambios de IndexedDB, pero mantenemos el canal para notificaciones push mock.

let channel: BroadcastChannel | null = null

export type SyncEvent =
  | { type: 'solicitud_changed'; solicitudId: string; estado: string }
  | { type: 'autorizado_changed'; autorizadoId: string }
  | { type: 'mensaje_nuevo'; mensajeId: string }
  | { type: 'notificacion_nueva'; notificacionId: string; destinatarioId: string; titulo: string; cuerpo: string; prioridad: string }
  | { type: 'data_reset' }

export function initSync() {
  if (typeof BroadcastChannel === 'undefined') return
  channel = new BroadcastChannel('pickids-sync')
}

export function emit(ev: SyncEvent) {
  if (!channel) return
  channel.postMessage(ev)
}

export function subscribe(listener: (ev: SyncEvent) => void) {
  if (!channel) return () => {}
  const handler = (e: MessageEvent<SyncEvent>) => listener(e.data)
  channel.addEventListener('message', handler)
  return () => channel?.removeEventListener('message', handler)
}

// Native Notification API fallback
export async function requestNotifPermission() {
  if (!('Notification' in window)) return 'denied' as const
  if (Notification.permission === 'default') {
    try { return await Notification.requestPermission() } catch { return 'denied' as const }
  }
  return Notification.permission
}

export function fireNative(titulo: string, cuerpo: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(titulo, { body: cuerpo, icon: '/Pickids/pickids-icon.svg', silent: false })
    }
  } catch { /* noop */ }
}
