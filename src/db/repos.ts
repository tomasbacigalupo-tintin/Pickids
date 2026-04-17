// Helpers de alto nivel sobre la DB: transiciones de estado con reglas,
// validaciones y efectos (notificaciones, timestamps).

import { db } from './schema'
import { emit, fireNative } from './sync'
import type {
  EstadoRetiro, Solicitud, Usuario, Alumno, Autorizado,
  TipoNotificacion, MotivoRetiro, MotivoRechazo, VigenciaAutorizado, RelacionAutorizado,
  Notificacion,
} from '../shared/types'
import { puedeTransitar, DEMO_EXPIRACION_MS } from '../shared/states'
import { uid } from '../shared/format'

const PRIO: Record<TipoNotificacion, 'normal' | 'alta' | 'critica'> = {
  solicitud_creada: 'normal',
  solicitud_recibida: 'alta',
  autorizada: 'alta',
  en_preparacion: 'alta',
  listo: 'critica',
  entregado: 'alta',
  rechazada: 'critica',
  cancelada_padre: 'normal',
  expirada: 'alta',
  autorizado_creado: 'normal',
  autorizado_aprobado: 'normal',
  autorizado_rechazado: 'alta',
  qr_usado: 'normal',
  mensaje_colegio: 'normal',
  cotutor_interfiere: 'alta',
  alumno_ausente: 'critica',
  recordatorio_no_retira: 'alta',
}

// --------- Helpers de lectura
export async function getUsuarioById(id: string) { return db.usuarios.get(id) }
export async function getColegioById(id: string) { return db.colegios.get(id) }
export async function getAlumnoById(id: string) { return db.alumnos.get(id) }
export async function getAutorizadoById(id: string) { return db.autorizados.get(id) }
export async function getSolicitudById(id: string) { return db.solicitudes.get(id) }

export async function getHijosDeUsuario(usuarioId: string): Promise<Alumno[]> {
  const vinc = await db.vinculos.where('usuarioId').equals(usuarioId).toArray()
  const ids = vinc.map(v => v.alumnoId)
  if (!ids.length) return []
  return (await db.alumnos.bulkGet(ids)).filter((x): x is Alumno => !!x)
}

export async function getCopadres(usuarioId: string, alumnoId: string): Promise<Usuario[]> {
  const vinc = await db.vinculos.where('alumnoId').equals(alumnoId).toArray()
  const otros = vinc.filter(v => v.usuarioId !== usuarioId).map(v => v.usuarioId)
  if (!otros.length) return []
  return (await db.usuarios.bulkGet(otros)).filter((x): x is Usuario => !!x)
}

export async function solicitudActivaDeAlumno(alumnoId: string): Promise<Solicitud | null> {
  const lista = await db.solicitudes.where('estado').anyOf(['solicitado','en_validacion','autorizado','en_preparacion','listo']).toArray()
  return lista.find(s => s.alumnosIds.includes(alumnoId)) ?? null
}

export async function solicitudesActivasDeUsuario(usuarioId: string): Promise<Solicitud[]> {
  const hijos = await getHijosDeUsuario(usuarioId)
  const ids = new Set(hijos.map(h => h.id))
  const activas = await db.solicitudes.where('estado').anyOf(['solicitado','en_validacion','autorizado','en_preparacion','listo']).toArray()
  return activas.filter(s => s.alumnosIds.some(a => ids.has(a)))
}

// --------- Notificaciones
export async function crearNotificacion(input: {
  destinatarioId: string
  destinatarioTipo: 'padre' | 'colegio'
  tipo: TipoNotificacion
  titulo: string
  cuerpo: string
  deepLink?: string | null
}): Promise<Notificacion> {
  const n: Notificacion = {
    id: uid('n-'),
    destinatarioId: input.destinatarioId,
    destinatarioTipo: input.destinatarioTipo,
    tipo: input.tipo,
    prioridad: PRIO[input.tipo],
    titulo: input.titulo,
    cuerpo: input.cuerpo,
    deepLink: input.deepLink ?? null,
    leida: false,
    createdAt: Date.now(),
  }
  await db.notificaciones.put(n)
  emit({ type: 'notificacion_nueva', notificacionId: n.id, destinatarioId: n.destinatarioId, titulo: n.titulo, cuerpo: n.cuerpo, prioridad: n.prioridad })
  // native notification mock — solo si el tab actual pertenece al destinatario
  try {
    const sesionRaw = localStorage.getItem('pickids-session')
    const sess = sesionRaw ? JSON.parse(sesionRaw) : null
    const yo = sess?.usuarioId
    const apunta = n.destinatarioTipo === 'colegio'
      ? sess?.rol && sess.rol !== 'padre'
      : yo === n.destinatarioId
    if (apunta) fireNative(n.titulo, n.cuerpo)
  } catch { /* noop */ }
  return n
}

// --------- Transiciones
export async function transicionar(solicitudId: string, hasta: EstadoRetiro, opts: {
  actorId: string
  actorRol: 'padre' | 'porteria' | 'coordinacion' | 'administracion' | 'sistema'
  nota?: string | null
  motivoRechazo?: MotivoRechazo | null
  notaRechazo?: string | null
}) {
  const s = await db.solicitudes.get(solicitudId)
  if (!s) throw new Error('Solicitud inexistente')
  if (!puedeTransitar(s.estado, hasta)) {
    throw new Error(`Transición no permitida: ${s.estado} → ${hasta}`)
  }
  const now = Date.now()
  const nuevaHitos = { ...s.hitosPorEstado, [hasta]: now }
  await db.solicitudes.update(solicitudId, {
    estado: hasta,
    updatedAt: now,
    hitosPorEstado: nuevaHitos,
    motivoRechazo: opts.motivoRechazo ?? s.motivoRechazo ?? null,
    notaRechazo: opts.notaRechazo ?? s.notaRechazo ?? null,
  })
  await db.transiciones.put({
    id: uid('t-'),
    solicitudId,
    estadoDesde: s.estado,
    estadoHasta: hasta,
    actorId: opts.actorId,
    actorRol: opts.actorRol,
    nota: opts.nota ?? null,
    at: now,
  })
  emit({ type: 'solicitud_changed', solicitudId, estado: hasta })

  // Efectos colaterales (notificaciones al padre / colegio)
  const colegio = await db.colegios.get(s.colegioId)
  const hijos = (await db.alumnos.bulkGet(s.alumnosIds)).filter(Boolean) as Alumno[]
  const nombresHijos = hijos.map(h => h.nombre).join(' y ')
  const staffDestino = `*colegio:${s.colegioId}`

  switch (hasta) {
    case 'en_validacion':
      // silent — no se notifica al padre
      break
    case 'autorizado':
      await crearNotificacion({
        destinatarioId: s.solicitanteId, destinatarioTipo: 'padre',
        tipo: 'autorizada',
        titulo: 'Retiro autorizado',
        cuerpo: `${colegio?.nombre ?? 'El colegio'} autorizó el retiro de ${nombresHijos}.`,
        deepLink: `/padres/seguimiento/${s.id}`,
      })
      break
    case 'en_preparacion':
      await crearNotificacion({
        destinatarioId: s.solicitanteId, destinatarioTipo: 'padre',
        tipo: 'en_preparacion',
        titulo: 'Buscando a tu hijo',
        cuerpo: `Están buscando a ${nombresHijos} en el aula.`,
        deepLink: `/padres/seguimiento/${s.id}`,
      })
      break
    case 'listo':
      await crearNotificacion({
        destinatarioId: s.solicitanteId, destinatarioTipo: 'padre',
        tipo: 'listo',
        titulo: `${nombresHijos} está en portería`,
        cuerpo: 'Podés retirarlo cuando llegues.',
        deepLink: `/padres/seguimiento/${s.id}`,
      })
      break
    case 'entregado':
      await crearNotificacion({
        destinatarioId: s.solicitanteId, destinatarioTipo: 'padre',
        tipo: 'entregado',
        titulo: 'Retiro completado',
        cuerpo: `Retiraste a ${nombresHijos} a las ${new Date(now).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}.`,
        deepLink: `/padres/seguimiento/${s.id}`,
      })
      break
    case 'rechazado':
      await crearNotificacion({
        destinatarioId: s.solicitanteId, destinatarioTipo: 'padre',
        tipo: 'rechazada',
        titulo: 'Solicitud rechazada',
        cuerpo: `Motivo: ${labelMotivoRechazo(opts.motivoRechazo ?? 'otro')}${opts.notaRechazo ? ' · ' + opts.notaRechazo : ''}`,
        deepLink: `/padres/seguimiento/${s.id}`,
      })
      break
    case 'cancelado':
      await crearNotificacion({
        destinatarioId: staffDestino, destinatarioTipo: 'colegio',
        tipo: 'cancelada_padre',
        titulo: 'Solicitud cancelada',
        cuerpo: `El padre canceló la solicitud de ${nombresHijos}.`,
        deepLink: `/colegio/solicitud/${s.id}`,
      })
      break
    case 'expirado':
      await crearNotificacion({
        destinatarioId: s.solicitanteId, destinatarioTipo: 'padre',
        tipo: 'expirada',
        titulo: 'Solicitud expirada',
        cuerpo: `La solicitud de ${nombresHijos} expiró por falta de retiro.`,
        deepLink: `/padres/seguimiento/${s.id}`,
      })
      await crearNotificacion({
        destinatarioId: staffDestino, destinatarioTipo: 'colegio',
        tipo: 'expirada',
        titulo: 'Solicitud expirada',
        cuerpo: `La solicitud de ${nombresHijos} expiró.`,
        deepLink: `/colegio/solicitud/${s.id}`,
      })
      break
  }
  return db.solicitudes.get(solicitudId) as Promise<Solicitud>
}

export function labelMotivoRechazo(m: MotivoRechazo): string {
  switch (m) {
    case 'identidad_no_coincide': return 'Identidad no coincide'
    case 'autorizado_no_vigente': return 'Autorizado no vigente'
    case 'hijo_ausente': return 'Hijo ausente'
    case 'horario_no_permitido': return 'Horario no permitido'
    default: return 'Otro'
  }
}

// --------- Crear solicitud
export async function crearSolicitud(input: {
  colegioId: string
  alumnosIds: string[]
  solicitanteId: string
  retiranteTipo: 'padre' | 'autorizado'
  retiranteUsuarioId?: string
  retiranteAutorizadoId?: string
  horario: { tipo: 'ahora' } | { tipo: 'programado'; hora: string }
  motivo: MotivoRetiro
  nota?: string | null
}): Promise<{ ok: true; solicitud: Solicitud } | { ok: false; reason: string; solicitudExistente?: Solicitud; conflictoCotutorNombre?: string }> {
  // Validaciones
  for (const aid of input.alumnosIds) {
    const alumno = await db.alumnos.get(aid)
    if (!alumno) return { ok: false, reason: 'Alumno no encontrado' }
    if (alumno.asistencia === 'ausente') return { ok: false, reason: `${alumno.nombre} figura ausente hoy.` }
    if (alumno.asistencia === 'retirado_hoy') return { ok: false, reason: `${alumno.nombre} ya fue retirado hoy.` }
    if (alumno.bloqueadoRetiro) return { ok: false, reason: `Retiros suspendidos para ${alumno.nombre}${alumno.bloqueadoMotivo ? ' — ' + alumno.bloqueadoMotivo : ''}.` }

    const activa = await solicitudActivaDeAlumno(aid)
    if (activa) {
      if (activa.solicitanteId !== input.solicitanteId) {
        const otro = await db.usuarios.get(activa.solicitanteId)
        return { ok: false, reason: 'cotutor', conflictoCotutorNombre: otro?.nombre ?? 'otro tutor', solicitudExistente: activa }
      }
      return { ok: false, reason: 'duplicado', solicitudExistente: activa }
    }
  }
  const now = Date.now()
  const token = uid('qr-')
  const s: Solicitud = {
    id: uid('s-'),
    colegioId: input.colegioId,
    alumnosIds: input.alumnosIds,
    solicitanteId: input.solicitanteId,
    retiranteTipo: input.retiranteTipo,
    retiranteUsuarioId: input.retiranteUsuarioId,
    retiranteAutorizadoId: input.retiranteAutorizadoId,
    horario: input.horario,
    motivo: input.motivo,
    nota: input.nota ?? null,
    estado: 'solicitado',
    motivoRechazo: null,
    notaRechazo: null,
    createdAt: now,
    updatedAt: now,
    qrToken: token,
    hitosPorEstado: { solicitado: now },
  }
  await db.solicitudes.put(s)
  await db.transiciones.put({
    id: uid('t-'),
    solicitudId: s.id,
    estadoDesde: null,
    estadoHasta: 'solicitado',
    actorId: input.solicitanteId,
    actorRol: 'padre',
    nota: null,
    at: now,
  })
  emit({ type: 'solicitud_changed', solicitudId: s.id, estado: 'solicitado' })

  const hijos = (await db.alumnos.bulkGet(s.alumnosIds)).filter(Boolean) as Alumno[]
  const nombres = hijos.map(h => h.nombre).join(' y ')
  await crearNotificacion({
    destinatarioId: s.solicitanteId, destinatarioTipo: 'padre',
    tipo: 'solicitud_creada',
    titulo: 'Solicitud enviada',
    cuerpo: `Tu solicitud para ${nombres} fue enviada.`,
    deepLink: `/padres/seguimiento/${s.id}`,
  })
  await crearNotificacion({
    destinatarioId: `*colegio:${s.colegioId}`, destinatarioTipo: 'colegio',
    tipo: 'solicitud_recibida',
    titulo: 'Nueva solicitud',
    cuerpo: `${nombres} — ${new Date(s.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`,
    deepLink: `/colegio/solicitud/${s.id}`,
  })
  // Notificar a cotutores
  for (const aid of s.alumnosIds) {
    const copadres = await getCopadres(s.solicitanteId, aid)
    for (const cp of copadres) {
      await crearNotificacion({
        destinatarioId: cp.id, destinatarioTipo: 'padre',
        tipo: 'cotutor_interfiere',
        titulo: 'Solicitud en curso',
        cuerpo: `Ya existe una solicitud activa para ${nombres}.`,
        deepLink: `/padres/seguimiento/${s.id}`,
      })
    }
  }

  return { ok: true, solicitud: s }
}

// --------- Autorizados
export async function crearAutorizado(input: {
  usuarioId: string
  nombre: string; apellido: string; dni: string; telefono?: string
  relacion: RelacionAutorizado
  vigencia: VigenciaAutorizado
  alumnosPermitidos: string[]
  avatar?: string | null
}) {
  const a: Autorizado = {
    id: uid('au-'),
    usuarioId: input.usuarioId,
    nombre: input.nombre, apellido: input.apellido, dni: input.dni,
    telefono: input.telefono, avatar: input.avatar ?? null,
    relacion: input.relacion,
    vigencia: input.vigencia,
    alumnosPermitidos: input.alumnosPermitidos,
    estado: input.vigencia.tipo === 'solo_hoy' ? 'activo' : 'pendiente',
    createdAt: Date.now(),
  }
  await db.autorizados.put(a)
  emit({ type: 'autorizado_changed', autorizadoId: a.id })
  await crearNotificacion({
    destinatarioId: a.usuarioId, destinatarioTipo: 'padre',
    tipo: 'autorizado_creado',
    titulo: 'Autorizado creado',
    cuerpo: a.estado === 'activo' ? `${a.nombre} activo para hoy.` : `${a.nombre} pendiente de validación.`,
    deepLink: `/padres/autorizados/${a.id}`,
  })
  return a
}

export async function setAutorizadoEstado(id: string, estado: Autorizado['estado']) {
  await db.autorizados.update(id, { estado })
  emit({ type: 'autorizado_changed', autorizadoId: id })
  const a = await db.autorizados.get(id)
  if (!a) return
  if (estado === 'activo') {
    await crearNotificacion({
      destinatarioId: a.usuarioId, destinatarioTipo: 'padre', tipo: 'autorizado_aprobado',
      titulo: 'Autorizado aprobado', cuerpo: `${a.nombre} ya puede retirar.`,
      deepLink: `/padres/autorizados/${a.id}`,
    })
  } else if (estado === 'rechazado') {
    await crearNotificacion({
      destinatarioId: a.usuarioId, destinatarioTipo: 'padre', tipo: 'autorizado_rechazado',
      titulo: 'Autorizado rechazado', cuerpo: `${a.nombre} no fue aprobado.`,
      deepLink: `/padres/autorizados/${a.id}`,
    })
  }
}

// --------- Reloj de expiración (corre periódicamente)
let _expInterval: number | null = null
export function startExpirationClock() {
  if (_expInterval != null) return
  const tick = async () => {
    const activas = await db.solicitudes.where('estado').equals('listo').toArray()
    const now = Date.now()
    for (const s of activas) {
      const listoAt = s.hitosPorEstado.listo ?? s.updatedAt
      if (now - listoAt >= DEMO_EXPIRACION_MS) {
        await transicionar(s.id, 'expirado', { actorId: 'sistema', actorRol: 'sistema' })
      }
    }
  }
  _expInterval = window.setInterval(tick, 5000)
  tick()
}
