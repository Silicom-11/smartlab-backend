# 🔬 SmartLab Backend - Node.js + Express + MongoDB

Backend REST API para el Sistema de Gestión, Reserva y Monitorización de Estaciones de Cómputo.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

## 🚀 Características

- ✅ Autenticación JWT con bcrypt
- ✅ Gestión de Laboratorios y Estaciones
- ✅ Sistema de Reservas con validación de conflictos
- ✅ Check-in/Check-out con códigos QR
- ✅ Roles de usuario (ADMIN, TEACHER, STUDENT)
- ✅ Actualizaciones en tiempo real (SSE)
- ✅ Auto-liberación de estaciones con cron jobs
- ✅ MongoDB Atlas (Cloud Database)
- ✅ Panel de Administración completo
- ✅ CORS configurado para producción
- ✅ Helmet para seguridad
- ✅ Morgan para logging

## 🌐 Demo en Producción

**API Base URL:** `https://smartlab-backend.onrender.com/api`  
**Health Check:** `https://smartlab-backend.onrender.com/api/health`

## 📋 Requisitos

- Node.js >= 16.x
- MongoDB Atlas account (gratis)
- npm >= 8.x

## 🛠️ Instalación Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU-USUARIO/smartlab-backend.git
cd smartlab-backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:
```bash
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/smartlab
JWT_SECRET=tu_secreto_super_seguro
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

### 4. Poblar base de datos (primera vez)
```bash
npm run seed
```

### 5. Iniciar el servidor

**Desarrollo (con nodemon):**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

5. **Poblar base de datos con datos iniciales (opcional)**
```bash
npm run seed
```

## 📁 Estructura del Proyecto

```
smartlab-backend/
├── config/           # Configuración (DB, JWT)
├── models/          # Modelos de MongoDB (Mongoose)
├── routes/          # Rutas de Express
├── controllers/     # Lógica de negocio
├── middleware/      # Middlewares (auth, validation)
├── services/        # Servicios (QR, scheduler, SSE)
├── utils/           # Utilidades
└── server.js        # Punto de entrada
```

## 🔌 Endpoints API

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Laboratorios
- `GET /api/labs` - Listar laboratorios
- `GET /api/labs/:id` - Obtener laboratorio
- `POST /api/labs` - Crear laboratorio (ADMIN)
- `PUT /api/labs/:id` - Actualizar laboratorio (ADMIN)
- `DELETE /api/labs/:id` - Eliminar laboratorio (ADMIN)

### Estaciones
- `GET /api/stations` - Listar estaciones
- `GET /api/stations/:id` - Obtener estación
- `GET /api/stations/lab/:labId` - Estaciones por laboratorio
- `POST /api/stations` - Crear estación (ADMIN)
- `PUT /api/stations/:id` - Actualizar estación (ADMIN)

### Reservas
- `POST /api/reservations` - Crear reserva
- `GET /api/reservations/user/:userId` - Reservas de usuario
- `GET /api/reservations/lookup?code=` - Buscar por código
- `PUT /api/reservations/:id/checkin` - Check-in
- `PUT /api/reservations/:id/checkout` - Check-out
- `DELETE /api/reservations/:id` - Cancelar reserva

### Eventos (SSE)
- `GET /api/events/stream` - Stream de eventos en tiempo real

## 🔐 Autenticación

Todos los endpoints (excepto `/api/auth/*`) requieren autenticación JWT.

**Header requerido:**
```
Authorization: Bearer <token>
```

## 👥 Roles

- **ADMIN**: Acceso completo (CRUD de labs, stations, users)
- **TEACHER**: Crear reservas, ver estadísticas
- **STUDENT**: Crear reservas, ver propias reservas

## 🗄️ Modelos de Datos

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (ADMIN|TEACHER|STUDENT),
  active: Boolean
}
```

### Lab
```javascript
{
  name: String,
  location: String,
  description: String,
  capacity: Number,
  active: Boolean
}
```

### Station
```javascript
{
  labId: ObjectId,
  code: String,
  name: String,
  status: String (free|reserved|occupied),
  currentReservationId: ObjectId,
  active: Boolean
}
```

### Reservation
```javascript
{
  userId: ObjectId,
  labId: ObjectId,
  stationId: ObjectId,
  start: Date,
  end: Date,
  status: String (booked|checked_in|finished|cancelled|no_show),
  reservationCode: String (UUID),
  qrCodeUrl: String
}
```

## 🔄 Tareas Automáticas

El sistema ejecuta tareas programadas cada 5 minutos para:
- Marcar reservas como "no_show" si no hubo check-in
- Auto-finalizar reservas vencidas
- Liberar estaciones automáticamente

## 🌐 Despliegue

### Render.com
1. Conecta tu repositorio de GitHub
2. Configura las variables de entorno
3. Deploy automático

### Variables de entorno en producción
```
MONGODB_URI=<tu-mongodb-atlas-uri>
JWT_SECRET=<clave-secreta-segura>
NODE_ENV=production
CORS_ORIGIN=<url-de-tu-frontend>
```

## 📝 Licencia

MIT

## 👨‍💻 Autor

SmartLab Team - 2025
