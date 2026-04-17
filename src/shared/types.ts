// =============================================================
// PICKIDS — Tipos de dominio
// Fiel a las secciones 1–5 del documento de diseño.
// =============================================================

export type Rol = 'padre' | 'porteria' | 'coordinacion' | 'administracion'

export type EstadoRetiro =
  | 'solicitado'
  | 'en_validacion'
  | 'autorizado'
  | 'en_preparacion'
  | 'listo'
  | 'entregado'
  | 'rechazado'
  | 'cancelado'
  | 'expirado'

export type MotivoRetiro = 'rutina' | 'medico' | 'familiar' | 'otro'
export type MotivoRechazo =
  | 'identidad_no_coincide'
  | 'autorizado_no_vigente'
  | 'hijo_ausente'
  | 'horario_no_permitido'
  | 'otro'

export type VigenciaAutorizado =
  | { tipo: 'permanente' }
  | { tipo: 'solo_hoy' }
  | { tipo: 'rango'; desde: string; hasta: string }

export type RelacionAutorizado = 'abuelo' | 'abuela' | 'tio' | 'tia' | 'amigo_familiar' | 'remis' | 'otro'

export type EstadoAsistencia = 'presente' | 'ausente' | 'retirado_hoy'

export interface Colegio {
  id: string
  nombre: string
  codigoFamiliaDemo: string
  horarioApertura: string   // 'HH:MM'
  horarioCierre: string     // 'HH:MM'
  mensaje?: string | null
}

export interface Usuario {
  id: string
  email: string
  password?: string         // mock, siempre aceptado
  nombre: string
  apellido: string
  telefono?: string
  dni?: string
  avatar?: string | null
  roles: Rol[]
  colegioId?: string
  verificado: boolean
  createdAt: number
}

export interface Alumno {
  id: string
  colegioId: string
  nombre: string
  apellido: string
  curso: string
  division: string
  turno: 'mañana' | 'tarde'
  avatar?: string | null
  observacionesMedicas?: string | null
  asistencia: EstadoAsistencia
  bloqueadoRetiro: boolean
  bloqueadoMotivo?: string | null
}

export interface VinculoFamilia {
  id: string
  usuarioId: string
  alumnoId: string
  parentesco: 'madre' | 'padre' | 'tutor'
}

export interface Autorizado {
  id: string
  usuarioId: string         // quién lo registró
  nombre: string
  apellido: string
  dni: string
  telefono?: string
  avatar?: string | null
  relacion: RelacionAutorizado
  vigencia: VigenciaAutorizado
  alumnosPermitidos: string[]   // alumnoId[]
  estado: 'activo' | 'pendiente' | 'vencido' | 'desactivado' | 'rechazado'
  createdAt: number
}

export interface Solicitud {
  id: string
  colegioId: string
  alumnosIds: string[]
  solicitanteId: string          // usuarioId
  retiranteTipo: 'padre' | 'autorizado'
  retiranteUsuarioId?: string    // si retiranteTipo === 'padre'
  retiranteAutorizadoId?: string // si retiranteTipo === 'autorizado'
  horario: { tipo: 'ahora' } | { tipo: 'programado'; hora: string }
  motivo: MotivoRetiro
  nota?: string | null
  estado: EstadoRetiro
  motivoRechazo?: MotivoRechazo | null
  notaRechazo?: string | null
  createdAt: number
  updatedAt: number
  qrToken: string
  // timestamps por transición
  hitosPorEstado: Partial<Record<EstadoRetiro, number>>
}

export interface Transicion {
  id: string
  solicitudId: string
  estadoDesde: EstadoRetiro | null
  estadoHasta: EstadoRetiro
  actorId: string
  actorRol: Rol | 'sistema'
  nota?: string | null
  at: number
}

export type TipoNotificacion =
  | 'solicitud_creada'
  | 'solicitud_recibida'
  | 'autorizada'
  | 'en_preparacion'
  | 'listo'
  | 'entregado'
  | 'rechazada'
  | 'cancelada_padre'
  | 'expirada'
  | 'autorizado_creado'
  | 'autorizado_aprobado'
  | 'autorizado_rechazado'
  | 'qr_usado'
  | 'mensaje_colegio'
  | 'cotutor_interfiere'
  | 'alumno_ausente'
  | 'recordatorio_no_retira'

export interface Notificacion {
  id: string
  destinatarioId: string        // usuarioId o '*colegio:{id}' para staff
  destinatarioTipo: 'padre' | 'colegio'
  tipo: TipoNotificacion
  prioridad: 'normal' | 'alta' | 'critica'
  titulo: string
  cuerpo: string
  deepLink?: string | null
  leida: boolean
  createdAt: number
}

export interface MensajeColegio {
  id: string
  colegioId: string
  titulo: string
  cuerpo: string
  audiencia: 'todos' | string // 'todos' o nombre de curso
  publicadoPor: string
  createdAt: number
}
