# ✅ CHECKLIST PRE-DEPLOY

## Antes de subir a GitHub

- [ ] `.env` está en `.gitignore` ✅
- [ ] `.env.example` existe con variables documentadas ✅
- [ ] `node_modules/` está en `.gitignore` ✅
- [ ] `package.json` tiene script `"start": "node server.js"` ✅
- [ ] Código funciona localmente con `npm start` ✅

## Variables de entorno para Render

Copia estas variables en Render Dashboard → Environment:

```bash
# 1. OBLIGATORIO - Tu MongoDB Atlas
MONGODB_URI=mongodb+srv://marcaquinocarhuas_db_user:y2hI1S7XDxVSrelD@smartlab.esnmsp2.mongodb.net/smartlab?retryWrites=true&w=majority&appName=SmartLab

# 2. OBLIGATORIO - JWT Secret
JWT_SECRET=SmartLabSecretKey2024SuperSecureKeyForJWTTokenGeneration123456789

# 3. OBLIGATORIO - JWT Expiración  
JWT_EXPIRES_IN=24h

# 4. OBLIGATORIO - Entorno
NODE_ENV=production

# 5. OBLIGATORIO - CORS (actualiza con tu URL de Render después)
ALLOWED_ORIGINS=http://localhost:5173,https://smartlab-backend.onrender.com

# 6. OPCIONAL - Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Comandos para GitHub

```bash
# 1. Inicializar git
cd d:\projects\smartlab\smartlab-backend
git init

# 2. Agregar archivos
git add .

# 3. Commit
git commit -m "Initial commit: SmartLab Backend con panel admin completo"

# 4. Crear repo en GitHub y conectar
git remote add origin https://github.com/TU-USUARIO/smartlab-backend.git

# 5. Subir
git branch -M main
git push -u origin main
```

## Después del Deploy en Render

- [ ] Health check funciona: `https://TU-APP.onrender.com/api/health`
- [ ] Actualizar `ALLOWED_ORIGINS` con tu URL de Render
- [ ] Probar endpoint de login: `POST /api/auth/login`
- [ ] Verificar logs en Render Dashboard

## Actualizar Frontend Local

```bash
# Editar d:\projects\smartlab\smartlab-web\.env
VITE_API_URL=https://TU-APP.onrender.com/api
```

## ¡LISTO! 🎉

Tu backend estará en producción usando MongoDB Atlas (misma base de datos que local).
