import { db } from './schema'
import { uid } from '../shared/format'
import type { Alumno, Autorizado, Colegio, Usuario, VinculoFamilia, MensajeColegio } from '../shared/types'

const SEED_FLAG_KEY = 'pickids-seeded-v1'

export async function ensureSeed() {
  const done = localStorage.getItem(SEED_FLAG_KEY)
  const count = await db.colegios.count()
  if (done === 'yes' && count > 0) return
  await seed()
  localStorage.setItem(SEED_FLAG_KEY, 'yes')
}

export async function resetDemo() {
  await db.delete()
  await db.open()
  localStorage.removeItem(SEED_FLAG_KEY)
  localStorage.removeItem('pickids-session')
  await seed()
  localStorage.setItem(SEED_FLAG_KEY, 'yes')
}

async function seed() {
  // --- Colegio ---
  const colegio: Colegio = {
    id: 'col-sanluis',
    nombre: 'Colegio San Luis',
    codigoFamiliaDemo: 'PICKIDS-DEMO',
    horarioApertura: '07:30',
    horarioCierre: '18:00',
    mensaje: 'Recordá presentar DNI físico en portería al retirar.',
  }

  // --- Usuarios ---
  const martina: Usuario = {
    id: 'u-martina', email: 'martina@demo.com', password: '*',
    nombre: 'Martina', apellido: 'López', telefono: '+54 9 351 555 0101',
    dni: '27456123', roles: ['padre'], colegioId: colegio.id, verificado: true,
    createdAt: Date.now() - 90 * 86400000,
  }
  const diego: Usuario = {
    id: 'u-diego', email: 'diego@demo.com', password: '*',
    nombre: 'Diego', apellido: 'Pérez', telefono: '+54 9 351 555 0102',
    dni: '28456789', roles: ['padre'], colegioId: colegio.id, verificado: true,
    createdAt: Date.now() - 60 * 86400000,
  }
  const porteria: Usuario = {
    id: 'u-porteria', email: 'porteria@sanluis.demo', password: '*',
    nombre: 'Mónica', apellido: 'Ruiz', roles: ['porteria'], colegioId: colegio.id, verificado: true,
    createdAt: Date.now() - 120 * 86400000,
  }
  const coord: Usuario = {
    id: 'u-coord', email: 'coord@sanluis.demo', password: '*',
    nombre: 'Laura', apellido: 'Gómez', roles: ['porteria', 'coordinacion'], colegioId: colegio.id, verificado: true,
    createdAt: Date.now() - 180 * 86400000,
  }
  const admin: Usuario = {
    id: 'u-admin', email: 'admin@sanluis.demo', password: '*',
    nombre: 'Ricardo', apellido: 'Suárez', roles: ['porteria', 'coordinacion', 'administracion'], colegioId: colegio.id, verificado: true,
    createdAt: Date.now() - 365 * 86400000,
  }

  // --- Alumnos ---
  const juan: Alumno = { id: 'a-juan',  colegioId: colegio.id, nombre: 'Juan',   apellido: 'López', curso: '3°', division: 'B', turno: 'tarde', asistencia: 'presente', bloqueadoRetiro: false }
  const sofi: Alumno = { id: 'a-sofi',  colegioId: colegio.id, nombre: 'Sofía',  apellido: 'López', curso: '5°', division: 'A', turno: 'tarde', asistencia: 'presente', bloqueadoRetiro: false }
  const tomi: Alumno = { id: 'a-tomi',  colegioId: colegio.id, nombre: 'Tomás',  apellido: 'López', curso: '1°', division: 'A', turno: 'tarde', asistencia: 'ausente',  bloqueadoRetiro: false, bloqueadoMotivo: null }
  const ana:  Alumno = { id: 'a-ana',   colegioId: colegio.id, nombre: 'Ana',    apellido: 'Pérez', curso: '2°', division: 'A', turno: 'tarde', asistencia: 'presente', bloqueadoRetiro: false, observacionesMedicas: 'Asma leve — inhalador en mochila.' }

  // --- Vínculos ---
  const vinculos: VinculoFamilia[] = [
    { id: uid('v-'), usuarioId: martina.id, alumnoId: juan.id, parentesco: 'madre' },
    { id: uid('v-'), usuarioId: martina.id, alumnoId: sofi.id, parentesco: 'madre' },
    { id: uid('v-'), usuarioId: martina.id, alumnoId: tomi.id, parentesco: 'madre' },
    { id: uid('v-'), usuarioId: diego.id,   alumnoId: juan.id, parentesco: 'padre' },
    { id: uid('v-'), usuarioId: diego.id,   alumnoId: ana.id,  parentesco: 'padre' },
  ]

  // --- Autorizados ---
  const carmen: Autorizado = {
    id: 'au-carmen',
    usuarioId: martina.id,
    nombre: 'Carmen', apellido: 'Pérez', dni: '12456789', telefono: '+54 9 351 555 0201',
    relacion: 'abuela', vigencia: { tipo: 'permanente' },
    alumnosPermitidos: [juan.id, sofi.id, tomi.id],
    estado: 'activo', createdAt: Date.now() - 30 * 86400000,
  }
  const daniel: Autorizado = {
    id: 'au-daniel',
    usuarioId: martina.id,
    nombre: 'Daniel', apellido: 'Suárez', dni: '30123456', telefono: '+54 9 351 555 0203',
    relacion: 'tio', vigencia: { tipo: 'permanente' },
    alumnosPermitidos: [juan.id],
    estado: 'pendiente', createdAt: Date.now() - 2 * 86400000,
  }
  const remis: Autorizado = {
    id: 'au-remis',
    usuarioId: diego.id,
    nombre: 'Remis', apellido: 'Cabify #432', dni: '99999999', telefono: '+54 9 351 555 0299',
    relacion: 'remis', vigencia: { tipo: 'solo_hoy' },
    alumnosPermitidos: [ana.id], estado: 'activo',
    createdAt: Date.now() - 2 * 3600_000,
  }

  // --- Mensajes ---
  const mensaje: MensajeColegio = {
    id: uid('m-'),
    colegioId: colegio.id,
    titulo: 'Simulacro de evacuación',
    cuerpo: 'Mañana 14:30 realizaremos un simulacro. Los retiros posteriores pueden demorar 10 min.',
    audiencia: 'todos',
    publicadoPor: coord.id,
    createdAt: Date.now() - 6 * 3600_000,
  }

  await db.transaction('rw', [db.colegios, db.usuarios, db.alumnos, db.vinculos, db.autorizados, db.mensajes], async () => {
    await db.colegios.bulkPut([colegio])
    await db.usuarios.bulkPut([martina, diego, porteria, coord, admin])
    await db.alumnos.bulkPut([juan, sofi, tomi, ana])
    await db.vinculos.bulkPut(vinculos)
    await db.autorizados.bulkPut([carmen, daniel, remis])
    await db.mensajes.bulkPut([mensaje])
  })
}
