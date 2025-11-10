# SmartLab Backend - Guía de Testing

## Prerrequisitos

1. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Editar `.env` con tus credenciales de MongoDB Atlas

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Poblar base de datos**
   ```bash
   npm run seed
   ```

## Iniciar Servidor

```bash
# Modo desarrollo (con hot reload)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:5000`

## Endpoints Disponibles

### 1. Health Check
```bash
GET http://localhost:5000/api/health
```

### 2. Autenticación

#### Registro
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@smartlab.com",
  "password": "Test123!",
  "role": "student"
}
```

#### Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@smartlab.com",
  "password": "Admin123!"
}
```
**Respuesta:** Guarda el `token` para las siguientes peticiones

#### Obtener Perfil
```bash
GET http://localhost:5000/api/auth/me
Authorization: Bearer <TOKEN>
```

#### Cambiar Contraseña
```bash
PUT http://localhost:5000/api/auth/change-password
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "currentPassword": "Admin123!",
  "newPassword": "NewAdmin123!"
}
```

### 3. Laboratorios

#### Listar Laboratorios
```bash
GET http://localhost:5000/api/labs
Authorization: Bearer <TOKEN>
```

#### Obtener Laboratorio por ID
```bash
GET http://localhost:5000/api/labs/:labId
Authorization: Bearer <TOKEN>
```

#### Crear Laboratorio (ADMIN)
```bash
POST http://localhost:5000/api/labs
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "name": "Lab de Prueba",
  "code": "LAB-TEST-01",
  "description": "Laboratorio de prueba",
  "location": "Edificio X - Piso Y",
  "capacity": 20,
  "totalStations": 20
}
```

#### Actualizar Laboratorio (ADMIN)
```bash
PUT http://localhost:5000/api/labs/:labId
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "name": "Lab Actualizado",
  "capacity": 25
}
```

#### Eliminar Laboratorio (ADMIN)
```bash
DELETE http://localhost:5000/api/labs/:labId
Authorization: Bearer <ADMIN_TOKEN>
```

#### Estadísticas de Laboratorio
```bash
GET http://localhost:5000/api/labs/:labId/stats
Authorization: Bearer <TOKEN>
```

### 4. Estaciones

#### Listar Estaciones de un Lab
```bash
GET http://localhost:5000/api/stations?labId=<LAB_ID>
Authorization: Bearer <TOKEN>
```

#### Obtener Estación por ID
```bash
GET http://localhost:5000/api/stations/:stationId
Authorization: Bearer <TOKEN>
```

#### Crear Estación (ADMIN)
```bash
POST http://localhost:5000/api/stations
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "code": "TEST-01",
  "name": "Estación Test",
  "lab": "<LAB_ID>",
  "specifications": {
    "processor": "Intel i7",
    "ram": "16GB",
    "storage": "512GB SSD"
  }
}
```

#### Actualizar Estado de Estación (ADMIN)
```bash
PATCH http://localhost:5000/api/stations/:stationId/status
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "status": "free"
}
```

#### Eliminar Estación (ADMIN)
```bash
DELETE http://localhost:5000/api/stations/:stationId
Authorization: Bearer <ADMIN_TOKEN>
```

### 5. Reservaciones

#### Crear Reserva
```bash
POST http://localhost:5000/api/reservations
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "userId": "<USER_ID>",
  "labId": "<LAB_ID>",
  "stationId": "<STATION_ID>",
  "start": "2024-01-20T10:00:00.000Z",
  "end": "2024-01-20T12:00:00.000Z",
  "purpose": "Práctica de programación"
}
```

#### Listar Reservas del Usuario
```bash
GET http://localhost:5000/api/reservations/user/:userId
Authorization: Bearer <TOKEN>
```

#### Buscar Reserva por Código
```bash
GET http://localhost:5000/api/reservations/lookup?code=<RESERVATION_CODE>
Authorization: Bearer <TOKEN>
```

#### Check-In
```bash
PUT http://localhost:5000/api/reservations/:reservationId/checkin
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "method": "manual"
}
```

#### Check-Out
```bash
PUT http://localhost:5000/api/reservations/:reservationId/checkout
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "method": "manual"
}
```

#### Cancelar Reserva
```bash
DELETE http://localhost:5000/api/reservations/:reservationId
Authorization: Bearer <TOKEN>
```

#### Listar Todas las Reservas (ADMIN)
```bash
GET http://localhost:5000/api/reservations
Authorization: Bearer <ADMIN_TOKEN>
```

### 6. Eventos en Tiempo Real (SSE)

#### Conectar al Stream
```bash
GET http://localhost:5000/api/events/stream
Authorization: Bearer <TOKEN>
```

Este endpoint mantiene una conexión abierta y envía eventos en tiempo real cuando:
- Se actualiza el estado de una estación
- Se crea/actualiza/cancela una reserva
- Se hace check-in/check-out

## Credenciales de Prueba (después del seed)

### Admin
- Email: `admin@smartlab.com`
- Password: `Admin123!`

### Profesores
- Email: `carlos.rodriguez@smartlab.com` / Password: `Teacher123!`
- Email: `maria.gonzalez@smartlab.com` / Password: `Teacher123!`

### Estudiantes
- Email: `juan.perez@smartlab.com` / Password: `Student123!`
- Email: `ana.martinez@smartlab.com` / Password: `Student123!`
- Email: `luis.garcia@smartlab.com` / Password: `Student123!`

## Testing con VS Code REST Client

Instala la extensión "REST Client" y puedes usar este formato:

```http
### Variables
@baseUrl = http://localhost:5000/api
@token = <TOKEN_AQUI>

### Health Check
GET {{baseUrl}}/health

### Login
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin@smartlab.com",
  "password": "Admin123!"
}

### Get Labs
GET {{baseUrl}}/labs
Authorization: Bearer {{token}}
```

## Testing con Postman

1. Importa la colección de Postman (crear archivo JSON con todos los endpoints)
2. Configura la variable de entorno `baseUrl` = `http://localhost:5000/api`
3. Configura la variable `token` después del login
4. Ejecuta los endpoints

## Flujo de Prueba Completo

1. **Login como Admin**
2. **Listar Labs y Estaciones** (deberían estar poblados)
3. **Crear Reserva** para mañana
4. **Intentar Check-In** (debería fallar - fuera de ventana)
5. **Buscar Reserva** por código
6. **Cancelar Reserva**
7. **Crear Nueva Reserva** para dentro de 10 minutos
8. **Esperar 10 minutos**
9. **Check-In** (debería funcionar)
10. **Check-Out**

## Monitoreo de Eventos SSE

Usa curl para ver eventos en tiempo real:

```bash
curl -N -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/events/stream
```

## Errores Comunes

### Error: Cannot connect to MongoDB
- Verifica que MongoDB Atlas esté configurado correctamente
- Revisa que la IP esté en la whitelist
- Confirma las credenciales en `.env`

### Error: Token invalid
- El token expiró (24h por defecto)
- Haz login nuevamente para obtener nuevo token

### Error: Station not available
- La estación está reservada u ocupada
- Verifica el estado con GET /api/stations/:id

### Error: Outside check-in window
- Solo puedes hacer check-in 15 minutos antes y 15 minutos después del inicio
- Ajusta la hora de inicio de la reserva
