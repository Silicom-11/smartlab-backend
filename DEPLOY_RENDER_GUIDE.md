# 🚀 GUÍA DE DEPLOY - SmartLab Backend a Render

## 📋 PREPARACIÓN PREVIA

### 1. Tu MongoDB Atlas ya está listo ✅
```
mongodb+srv://marcaquinocarhuas_db_user:y2hI1S7XDxVSrelD@smartlab.esnmsp2.mongodb.net/smartlab
```

### 2. Verificar que todo funciona localmente
```bash
cd d:\projects\smartlab\smartlab-backend
npm start
```

---

## 🔧 PASO 1: PREPARAR REPOSITORIO GITHUB

### 1.1 Inicializar Git (si aún no lo hiciste)
```bash
cd d:\projects\smartlab\smartlab-backend
git init
git add .
git commit -m "Initial commit: SmartLab Backend completo con panel admin"
```

### 1.2 Crear repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre del repo: `smartlab-backend`
3. Descripción: "Backend Node.js para SmartLab - Sistema de Gestión de Laboratorios"
4. **NO marques** "Add a README file" (ya lo tienes)
5. Click en "Create repository"

### 1.3 Subir código a GitHub
```bash
git remote add origin https://github.com/TU-USUARIO/smartlab-backend.git
git branch -M main
git push -u origin main
```

---

## 🌐 PASO 2: DEPLOY EN RENDER

### 2.1 Crear cuenta en Render
1. Ve a https://render.com
2. Sign up con tu cuenta de GitHub
3. Autoriza Render para acceder a tus repos

### 2.2 Crear Web Service
1. Click en "New +" → "Web Service"
2. Conecta tu repositorio `smartlab-backend`
3. Click en "Connect"

### 2.3 Configuración del Servicio

**Configuración básica:**
```
Name: smartlab-backend
Region: Oregon (US West) o el más cercano
Branch: main
Root Directory: (dejar vacío)
Runtime: Node
Build Command: npm install
Start Command: npm start
```

**Plan:**
- Selecciona "Free" (0$/mes)
- Click en "Advanced"

### 2.4 Variables de Entorno (MUY IMPORTANTE)

Click en "Advanced" y agrega estas variables:

```bash
# 1. MongoDB Atlas (COPIA TU CONNECTION STRING)
MONGODB_URI=mongodb+srv://marcaquinocarhuas_db_user:y2hI1S7XDxVSrelD@smartlab.esnmsp2.mongodb.net/smartlab?retryWrites=true&w=majority&appName=SmartLab

# 2. JWT Secret (genera uno nuevo y seguro)
JWT_SECRET=SmartLabSecretKey2024SuperSecureKeyForJWTTokenGeneration123456789

# 3. JWT Expiration
JWT_EXPIRES_IN=24h

# 4. Node Environment
NODE_ENV=production

# 5. CORS Origins (actualiza después con tu URL de Render)
ALLOWED_ORIGINS=http://localhost:5173,https://smartlab-backend.onrender.com

# 6. Frontend URL (actualiza después si usas Vercel/Netlify)
FRONTEND_URL=http://localhost:5173
```

### 2.5 Deploy
1. Click en "Create Web Service"
2. Espera 5-10 minutos mientras se despliega
3. ✅ Verás "Live" cuando esté listo

### 2.6 Obtener tu URL
Tu backend estará disponible en:
```
https://smartlab-backend.onrender.com
```

---

## ✅ PASO 3: VERIFICAR QUE FUNCIONA

### 3.1 Test de Health Check
Abre en tu navegador:
```
https://smartlab-backend.onrender.com/api/health
```

Deberías ver:
```json
{
  "success": true,
  "message": "SmartLab API funcionando correctamente",
  "environment": "production",
  "timestamp": "2024-11-10T...",
  "uptime": 123.456
}
```

### 3.2 Actualizar ALLOWED_ORIGINS
1. En Render, ve a tu servicio
2. Environment → Edit
3. Actualiza `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS=http://localhost:5173,https://smartlab-backend.onrender.com
```
4. Save Changes (se reiniciará automáticamente)

---

## 🎨 PASO 4: CONECTAR FRONTEND LOCAL A PRODUCCIÓN

### 4.1 Actualizar .env del frontend
```bash
cd d:\projects\smartlab\smartlab-web
```

Edita `.env`:
```bash
# Cambiar de:
VITE_API_URL=http://localhost:5000/api

# A (reemplaza con tu URL de Render):
VITE_API_URL=https://smartlab-backend.onrender.com/api
```

### 4.2 Reiniciar frontend
```bash
npm run dev
```

### 4.3 Poblar la base de datos (solo primera vez)
Como el backend en Render usa la MISMA base de datos de MongoDB Atlas, ya tiene todos los datos del seed que corriste localmente. ✅

**Si necesitas re-seedear:**
```bash
# Localmente, apuntando a producción
cd d:\projects\smartlab\smartlab-backend
npm run seed
```

---

## 🔥 PASO 5: PROBAR TODO EL FLUJO

### 5.1 Login como Admin
```
http://localhost:5173/login

Email: admin@smartlab.com
Password: admin123
```

### 5.2 Verificar panel de administración
- Click en "Admin" en navbar
- Deberías ver el dashboard
- Crear un laboratorio de prueba
- Crear una estación

### 5.3 Verificar que se guarda en MongoDB Atlas
1. Ve a MongoDB Atlas
2. Database → Browse Collections
3. Verás los nuevos datos en `smartlab.labs` y `smartlab.stations`

---

## 📱 PASO 6 (OPCIONAL): DEPLOY DEL FRONTEND

### Opción A: Vercel (Recomendado)
```bash
cd d:\projects\smartlab\smartlab-web
npm install -g vercel
vercel login
vercel

# Sigue las instrucciones
# Agrega tu variable de entorno en Vercel:
VITE_API_URL=https://smartlab-backend.onrender.com/api
```

### Opción B: Netlify
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod

# Agrega variable de entorno en Netlify UI:
VITE_API_URL=https://smartlab-backend.onrender.com/api
```

---

## 🛠️ TROUBLESHOOTING

### Problema: "Application failed to respond"
**Solución:** Verifica logs en Render Dashboard → Logs

### Problema: Error de CORS
**Solución:** Actualiza `ALLOWED_ORIGINS` en Render para incluir tu dominio frontend

### Problema: MongoDB connection error
**Solución:** 
1. Verifica que `MONGODB_URI` esté correctamente copiado
2. En MongoDB Atlas → Network Access → Agregar IP 0.0.0.0/0 (permitir todas)

### Problema: JWT Invalid
**Solución:** Verifica que `JWT_SECRET` sea el mismo que usaste para crear los tokens

### Problema: Render se duerme (plan Free)
**Solución:** 
- El plan free se duerme después de 15 min de inactividad
- Primera petición tardará ~30 segundos en despertar
- Usa un servicio como UptimeRobot para hacer pings cada 10 min

---

## 📊 MONITOREO

### Ver Logs en tiempo real
```
Render Dashboard → Tu servicio → Logs
```

### Métricas
```
Render Dashboard → Tu servicio → Metrics
```

---

## 🎯 RESUMEN RÁPIDO

```bash
# 1. Subir a GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU-USUARIO/smartlab-backend.git
git push -u origin main

# 2. Deploy en Render
- Crear Web Service
- Conectar repo
- Configurar variables de entorno
- Deploy

# 3. Actualizar frontend local
VITE_API_URL=https://smartlab-backend.onrender.com/api

# 4. ¡LISTO! 🎉
```

---

## 📝 NOTAS IMPORTANTES

1. **MongoDB Atlas ya tiene tus datos** - No necesitas re-seedear
2. **Plan Free de Render** - Se duerme después de 15 min de inactividad
3. **CORS** - Recuerda actualizar ALLOWED_ORIGINS cuando despliegues el frontend
4. **JWT_SECRET** - Usa uno diferente en producción por seguridad
5. **Logs** - Revísalos si algo falla

---

## 🚀 SIGUIENTE PASO

Una vez que el backend esté funcionando en Render:
1. Actualiza `.env` del frontend con la URL de Render
2. Prueba todo el flujo (login, crear labs, reservas, etc.)
3. Si funciona perfecto, procede a deployar el frontend en Vercel/Netlify

---

¡ÉXITO! 🎉
