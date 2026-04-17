import Dexie, { type Table } from 'dexie'
import type {
  Colegio, Usuario, Alumno, VinculoFamilia,
  Autorizado, Solicitud, Transicion, Notificacion, MensajeColegio,
} from '../shared/types'

export class PickidsDB extends Dexie {
  colegios!: Table<Colegio, string>
  usuarios!: Table<Usuario, string>
  alumnos!: Table<Alumno, string>
  vinculos!: Table<VinculoFamilia, string>
  autorizados!: Table<Autorizado, string>
  solicitudes!: Table<Solicitud, string>
  transiciones!: Table<Transicion, string>
  notificaciones!: Table<Notificacion, string>
  mensajes!: Table<MensajeColegio, string>

  constructor() {
    super('pickids-db')
    this.version(1).stores({
      colegios: 'id, nombre',
      usuarios: 'id, email, colegioId',
      alumnos: 'id, colegioId, asistencia',
      vinculos: 'id, usuarioId, alumnoId, [usuarioId+alumnoId]',
      autorizados: 'id, usuarioId, estado',
      solicitudes: 'id, colegioId, solicitanteId, estado, createdAt, qrToken',
      transiciones: 'id, solicitudId, at',
      notificaciones: 'id, destinatarioId, leida, createdAt',
      mensajes: 'id, colegioId, createdAt',
    })
  }
}

export const db = new PickidsDB()
