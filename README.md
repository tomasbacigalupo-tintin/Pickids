# Pickids

**App de retiro escolar** — prototipo PWA con las dos experiencias (App Padres y App Colegio) en una sola base de código, siguiendo el [documento de diseño de producto](./docs/Pickids_Diseno_Producto.md).

![status](https://img.shields.io/badge/estado-prototipo-f59e0b) ![stack](https://img.shields.io/badge/stack-React%20+%20Vite%20+%20PWA-0b3d91) ![backend](https://img.shields.io/badge/backend-IndexedDB%20(Dexie)-2563eb)

---

## 🚀 Cómo probarla en el celular

Podés probarla de varias formas; la más rápida, sin tocar ni un comando, es **deployarla en Vercel** desde el botón de abajo. Las tres funcionan.

### Opción A — Vercel (recomendada para repo privado, gratis)

1. Entrá a [vercel.com/new](https://vercel.com/new) e iniciá sesión con GitHub.
2. Importá este repo `Pickids`.
3. Vercel detecta la config desde `vercel.json`. Dejá todo por defecto y tocá **Deploy**.
4. Cuando termina te da una URL del tipo `https://pickids-xxxx.vercel.app`.
5. Abrí esa URL en tu celular → seguí la sección [Instalar como PWA](#-instalar-como-pwa).

### Opción B — GitHub Pages (requiere GitHub Pro si el repo es privado)

1. En GitHub, `Settings → Pages → Source: GitHub Actions`.
2. El workflow `.github/workflows/deploy.yml` se dispara al pushear a `main`.
3. Cuando termina, el sitio queda en `https://tomasbacigalupo-tintin.github.io/Pickids/`.

> ⚠️ GitHub Pages en repo privado solo funciona con plan Pro/Team. Si no, hacé el repo público **solo para deploy**, o usá Vercel/Netlify.

### Opción C — Local + túnel a tu celular

```bash
npm install --legacy-peer-deps
npm run dev
```

En otra terminal:

```bash
npx ngrok http 5173
```

ngrok te devuelve una URL tipo `https://abcd.ngrok-free.app`. Abrila en el celular.

---

## 📱 Instalar como PWA

Ya con la URL abierta en el móvil:

- **Android (Chrome):** tocá los tres puntos → **Instalar app** / *Agregar a pantalla de inicio*. La primera vez te pide permiso para notificaciones.
- **iOS (Safari):** tocá el botón compartir (↑) → **Agregar a pantalla de inicio**. En iOS las notificaciones push requieren iOS 16.4+.

Queda como app real: ícono propio, splash azul Pickids, funciona offline una vez cargada.

---

## 🧪 Script de prueba paso a paso

El prototipo viene con **datos demo auto-cargados** la primera vez que abrís la app (se guardan en IndexedDB del navegador). Todo lo que hagas persiste localmente.

### Usuarios demo

| Email | Rol | Descripción |
|---|---|---|
| `martina@demo.com` | Padre | Martina López — tiene 3 hijos (Juan, Sofi, Tomi) |
| `diego@demo.com` | Padre | Diego Pérez — cotutor de Juan, padre de Ana |
| `porteria@sanluis.demo` | Portería | Mónica Ruiz |
| `coord@sanluis.demo` | Coordinación | Laura Gómez (puede ver reportes y publicar mensajes) |
| `admin@sanluis.demo` | Administración | Ricardo Suárez (todo + usuarios del colegio) |

**Contraseña:** cualquier cosa (en demo no se valida).
**Código de familia:** `PICKIDS-DEMO`.

### Flujo 1 — Feliz camino (2 dispositivos o 2 ventanas)

Es el más entretenido. Necesitás dos "vistas" abiertas a la vez (dos celulares, un celular + desktop, o dos pestañas en el mismo navegador). Los datos se sincronizan automáticamente entre ventanas.

1. **Padre** (vista 1): login como `martina@demo.com`. Tocá **Solicitar retiro** → marcá a **Juan** → **Continuar** → *Yo retiro* → **Continuar** → dejá "Ahora" y motivo "Rutina" → **Revisar y confirmar** → **Enviar solicitud**. Te lleva al **Seguimiento en Vivo** con el QR.
2. **Colegio** (vista 2): login como `porteria@sanluis.demo`. En **Cola Activa** aparece la solicitud con chip amarillo "En validación". Abrí el detalle. Tocá **Autorizar**.
3. Vas a ver en la vista del padre que el estado cambia en vivo. Recibís un toast (y una notificación nativa si diste permiso).
4. En colegio, seguí con **Marcar en preparación** → **Marcar listo para entregar**. En la vista del padre, el estado "Listo" llega con notificación crítica.
5. En colegio, tocá **Validar y entregar**. Se abre el modal de validación de identidad → **Confirmar y entregar**. Al padre le llega "Retiro completado" y la solicitud desaparece de la cola.

### Flujo 2 — Rechazo por ausencia

1. Padre `martina@demo.com` → Solicitar retiro → elegí a **Tomás** (el doc dice que figura ausente). La UI lo muestra en gris con chip "Ausente hoy" y no te deja seleccionarlo.
2. Alternativa: elegí a Juan, enviá la solicitud, en colegio abrí el detalle y tocá **Rechazar** → motivo "Hijo ausente" → escribí una nota → **Confirmar rechazo**.
3. Al padre le llega notificación crítica roja con el motivo.

### Flujo 3 — Retiro por tercero autorizado + QR compartido

1. Padre `martina@demo.com` → Solicitar retiro de Juan → paso 2, elegí **Un autorizado** → **Carmen Pérez** (abuela) → Continuar → Confirmar → Enviar.
2. En Seguimiento, tocá **Compartir link**. Copialo.
3. Abrí ese link en otra pestaña **sin sesión** (modo incógnito sirve) — aparece la vista pública con el QR que "la abuela" puede mostrar en portería.
4. En colegio (vista 2), tocá el FAB **Escanear QR**. Si te da permiso de cámara, apuntá al QR de la pantalla del celular. Si no, copiá el token (empieza con `qr-`) y pegalo en el campo manual.
5. El colegio cae directo en la pantalla de validación de identidad. Avanzá hasta entregar.

### Flujo 4 — Cotutor interfiere

1. Padre 1 (`martina@demo.com`) solicita retiro de **Juan**.
2. En otra vista, login como `diego@demo.com` (cotutor de Juan). Intentá solicitar retiro del mismo Juan. La app te bloquea con el modal *"Martina ya generó la solicitud de Juan"* y te ofrece abrir la solicitud activa.
3. Además, Diego recibe una notificación con la interferencia.

### Flujo 5 — Cancelación y expiración

1. Solicitá un retiro cualquiera.
2. Mientras está en estado "Solicitado" o "En preparación", abrí el Seguimiento y tocá **Cancelar**. Funciona.
3. Para probar **expiración**: llevá una solicitud hasta "Listo para entregar" y no hagas nada por 90 segundos. El sistema la pasa a **Expirada** automáticamente (en producción son 45 min; aceleramos a 90s para demo).

### Reseteo de datos

Si querés volver al estado inicial: **Perfil → Resetear datos demo** (app padres) o **Ajustes → Resetear datos demo** (app colegio). Borra todo y vuelve a cargar los datos semilla.

---

## 🧱 Stack técnico

- **React 19 + TypeScript + Vite 8** — base del bundle con HMR
- **vite-plugin-pwa** — manifest, service worker, soporte instalar
- **React Router v7** — navegación entre pantallas
- **Zustand** — estado global (sesión, rol, toasts)
- **Dexie.js + dexie-react-hooks** — IndexedDB como mock backend con reactividad
- **BroadcastChannel + Notifications API** — sincronización entre tabs + push simuladas
- **qrcode.react** y **jsQR** — generación y lectura de QR
- **lucide-react** — iconografía (fiel al estilo Phosphor/Lucide del doc)
- **Google Fonts Inter** — tipografía del documento

## 🗂 Estructura

```
src/
├── shell/AppRoot.tsx            # decide Login / Padres / Colegio según sesión
├── apps/
│   ├── auth/                    # Splash, Onboarding, Login, Verificación, Vincular, Selector de rol
│   ├── padres/                  # 20 pantallas del App Padres (P1..P21 del doc)
│   └── colegio/                 # 13 pantallas del App Colegio (C1..C13 del doc)
├── components/                  # Button, Card, Chip, StateBar, QR, etc
├── db/
│   ├── schema.ts                # Dexie tables
│   ├── seed.ts                  # Datos demo
│   ├── repos.ts                 # Transiciones + reglas de negocio + notificaciones
│   └── sync.ts                  # BroadcastChannel entre tabs
├── shared/
│   ├── types.ts                 # Modelo de dominio
│   ├── states.ts                # Máquina de estados + colores + transiciones permitidas
│   └── format.ts                # Helpers
├── store/                       # session (Zustand) + toast
└── index.css                    # Tokens de diseño (colores, tipografía, radios)
```

## ✅ Qué está implementado (MVP sección 11.1 del doc)

**App Padres:**
- ✅ Splash, Onboarding 3 slides, Login, Verificación, Vincular colegio con código
- ✅ Inicio con card de "retiro en curso", CTA ámbar, lista de hijos, historial, mensaje del colegio, bell con contador
- ✅ Solicitar retiro 3 pasos (defaults inteligentes = 2–3 taps)
- ✅ Seguimiento en vivo con stepper horizontal, QR, cancelar, compartir link
- ✅ Hijos (lista + detalle con tabs info/autorizados/historial)
- ✅ Autorizados (lista + FAB + agregar con foto/DNI/vigencia + detalle + desactivar)
- ✅ Perfil, Config notificaciones, FAQ, Centro de notificaciones
- ✅ Vista pública compartida (`/c/:token`) para autorizado

**App Colegio:**
- ✅ Splash, Login Staff, Selector de rol (Portería / Coordinación / Administración)
- ✅ Cola activa con filtros, búsqueda, FAB escanear QR, contador del día
- ✅ Detalle solicitud con timeline, acciones contextuales al estado, validar identidad, rechazar con motivo
- ✅ Escanear QR con cámara (y fallback manual)
- ✅ Alumnos (lista + ficha con tabs familia/autorizados/historial + bloqueo temporal)
- ✅ Reportes con KPIs y export CSV (solo Coord/Admin)
- ✅ Ajustes — horarios, usuarios staff, publicar mensaje

**Transversal:**
- ✅ Los 9 estados del documento con sus colores y transiciones permitidas
- ✅ Reglas de negocio sección 5 (duplicados, cotutor, ausente, bloqueado, fuera de horario, listo → no cancelable)
- ✅ Todas las notificaciones de sección 6 con prioridad
- ✅ Múltiples hijos en una sola solicitud
- ✅ Reloj de expiración automático
- ✅ PWA instalable con icono propio y safe-area respetada

## 🔜 Para una V2 (sección 11.2 del doc)

Login biométrico, widget en pantalla de inicio, chat colegio↔padre, retiros recurrentes, geo-fencing, panel web admin, integración con gestión escolar, reconocimiento facial, dark mode, temas por colegio, animaciones Lottie.

## 🛠 Scripts

```bash
npm install --legacy-peer-deps   # instalar (el flag es por compat con Vite 8)
npm run dev                      # desarrollo en http://localhost:5173
npm run build                    # build de producción a ./dist
npm run preview                  # servir el build
```

## 📦 Variables de entorno

- `VITE_BASE` — base path del sitio. Default: `/Pickids/` (para GitHub Pages). En Vercel/Netlify usar `/`. Se setea automáticamente según el `vercel.json` / `netlify.toml`.

## 📄 Licencia

MIT — ver [LICENSE](./LICENSE).
