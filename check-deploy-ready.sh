#!/bin/bash

echo "🔍 Verificando que el backend esté listo para deploy..."
echo ""

# Verificar que .env no se suba
if grep -q "^\.env$" .gitignore; then
    echo "✅ .env está en .gitignore"
else
    echo "❌ ADVERTENCIA: .env NO está en .gitignore"
fi

# Verificar que exista .env.example
if [ -f ".env.example" ]; then
    echo "✅ .env.example existe"
else
    echo "❌ FALTA .env.example"
fi

# Verificar package.json
if grep -q '"start": "node server.js"' package.json; then
    echo "✅ Script 'start' configurado correctamente"
else
    echo "❌ Script 'start' no encontrado en package.json"
fi

# Verificar que node_modules esté en .gitignore
if grep -q "node_modules" .gitignore; then
    echo "✅ node_modules está en .gitignore"
else
    echo "❌ ADVERTENCIA: node_modules NO está en .gitignore"
fi

echo ""
echo "📋 Variables de entorno requeridas para Render:"
echo "   1. MONGODB_URI"
echo "   2. JWT_SECRET"
echo "   3. JWT_EXPIRES_IN"
echo "   4. NODE_ENV"
echo "   5. ALLOWED_ORIGINS"
echo ""
echo "✅ Backend listo para deploy en Render!"
echo ""
echo "Próximos pasos:"
echo "1. git init (si no lo hiciste)"
echo "2. git add ."
echo "3. git commit -m 'Initial commit'"
echo "4. git remote add origin https://github.com/TU-USUARIO/smartlab-backend.git"
echo "5. git push -u origin main"
echo "6. Ir a https://render.com y crear Web Service"
