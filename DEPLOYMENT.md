# 🚀 DEPLOYMENT.md - Farmacia María Rosa
# Guía de Despliegue en la Nube

Guía paso a paso para desplegar **Farmacia María Rosa** usando:
- **Render** → Backend Spring Boot + PostgreSQL
- **Vercel** → Frontend React (o Render → Frontend HTML/CSS/JS)

---

## 1. Subir código a GitHub

### 1.1 Crear repositorio nuevo en GitHub
1. Ir a https://github.com/new
2. Nombre: `FarmaciaMariaRosa-Cloud`
3. Tipo: **Private** (recomendado, contiene config)
4. **NO** inicializar con README, .gitignore ni licencia
5. Clic en **Create repository**

### 1.2 Subir la copia del proyecto
```bash
# Desde la carpeta FarmaciaMariaRosa-Cloud
git init
git checkout -b main
git add .
git commit -m "feat: preparar proyecto para despliegue en la nube"
git remote add origin https://github.com/TU_USUARIO/FarmaciaMariaRosa-Cloud.git
git push -u origin main
```

---

## 2. PostgreSQL en Render

El archivo `render.yaml` crea `farmacia-maria-rosa-db` y enlaza internamente host,
puerto, base, usuario y contraseña con el backend. No copies ni publiques credenciales.

> ⚠️ El plan Free de PostgreSQL en Render expira a los 30 días y no incluye backups.

---

## 3. Backend Spring Boot en Render

### 3.1 Crear el Blueprint
1. Dashboard → **New** → **Blueprint**.
2. Conectar el repositorio `FarmaciaMariaRosa-Cloud`.
3. Render detectará `render.yaml` y creará el backend Docker y PostgreSQL.

### 3.2 Variables de entorno
Durante la creación inicial del Blueprint, Render solicitará únicamente las variables
marcadas con `sync: false`:

| Variable | Valor | Secreto |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` | No |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Enlace automático a PostgreSQL | No |
| `DB_USERNAME`, `DB_PASSWORD` | Enlace automático a PostgreSQL | **Automático** |
| `DDL_AUTO` | `update` | No |
| `SHOW_SQL` | `false` | No |
| `JWT_SECRET` | Generada automáticamente por Render | **Sí** |
| `FRONTEND_URL` | `https://farmacia-maria-rosa.vercel.app` | No |
| `ADMIN_EMAIL` | `admin@farmacia.com` | No |
| `ADMIN_PASSWORD` | (contraseña segura) | **Sí** |
| `CREATE_DEFAULT_ADMIN` | `true` | No |
| `GROQ_API_KEY` | (tu API key de Groq) | **Sí** |

> ⚠️ No copies a archivos ni logs los valores de `ADMIN_PASSWORD` o `GROQ_API_KEY`.

### 3.3 JWT_SECRET
El Blueprint usa `generateValue: true`; Render crea y conserva el secreto sin publicarlo.

### 3.4 Health Check
- **Path**: `/api/health`
- Render verificará automáticamente que el servicio responde.

### 3.5 Primer despliegue
1. Clic en **Create Web Service**
2. Render descargará el código y construirá el Docker image
3. Monitorear los logs en **Logs** para verificar:
   - Que Spring Boot arranca correctamente
   - Que Hibernate crea las tablas
   - Que el administrador se crea automáticamente
4. Verificar health check: `https://farmacia-maria-rosa-backend.onrender.com/api/health`

---

## 4. Frontend React en Vercel

### 4.1 Crear proyecto en Vercel
1. Ir a https://vercel.com
2. **Add New** → **Project**
3. Importar repositorio `FarmaciaMariaRosa-Cloud`
4. Configurar:
   - **Root Directory**: `reactFront`
   - **Framework**: Vite (detectado automáticamente)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 4.2 Variables de entorno en Vercel
En **Settings** → **Environment Variables**:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://farmacia-maria-rosa-backend.onrender.com` |

### 4.3 Desplegar
1. Clic en **Deploy**
2. Vercel construirá el proyecto React
3. Anotar la URL asignada (ej: `https://farmacia-maria-rosa.vercel.app`)
4. Actualizar `FRONTEND_URL` en las variables de Render con esta URL

---

## 5. Frontend HTML/CSS/JS en Render (alternativa)

Si se decide usar el frontend Vanilla (`frontent/`) en lugar de React:

### 5.1 Crear Static Site en Render
1. Dashboard → **New** → **Static Site**
2. Conectar repositorio
3. Configurar:
   - **Root Directory**: `frontent`
   - **Build Command**: (dejar vacío, es HTML estático)
   - **Publish Directory**: `.`

### 5.2 Configurar URL del Backend
En `frontent/assets/js/config.js`, actualizar:
```js
const PRODUCTION_API_URL = "https://farmacia-maria-rosa-backend.onrender.com";
```

---

## 6. CORS - Configuración final

Después de desplegar ambos servicios:
1. Obtener la URL final del frontend (Vercel o Render)
2. En Render (backend), actualizar la variable:
   ```
   FRONTEND_URL=https://TU-FRONTEND.vercel.app
   ```
3. Render redesplegará automáticamente el backend con el nuevo valor

---

## 7. Verificar el despliegue

### 7.1 Health Check
```
GET https://farmacia-maria-rosa-backend.onrender.com/api/health
```
Respuesta esperada:
```json
{"status": "UP", "application": "Farmacia María Rosa"}
```

### 7.2 Verificar tablas
Conectarse a la base de datos de Render con pgAdmin o psql:
```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/farmacia_maria_rosa?sslmode=require"
\dt  # listar tablas
```
Hibernate debería haber creado las tablas automáticamente al iniciar.

### 7.3 Login de administrador
- Email: (el configurado en `ADMIN_EMAIL`)
- Contraseña: (la configurada en `ADMIN_PASSWORD`)

### 7.4 Verificar que el admin no se duplica
Reiniciar el backend en Render y verificar que el log dice:
```
AdminInitializer: El administrador 'admin@farmacia.com' ya existe. No se duplica.
```

---

## 8. Chatbot (Groq)

1. Crear cuenta en https://console.groq.com
2. Generar una API Key
3. Configurar en Render: `GROQ_API_KEY` = tu clave
4. El chatbot usa el modelo `llama-3.1-8b-instant`

> ⚠️ Si no se configura `GROQ_API_KEY`, el chatbot responde con un mensaje amigable de "no disponible" sin romper la aplicación.

---

## 9. Revisión de logs

En Render Dashboard → tu servicio → **Logs**:
- Buscar `Started DemoApplication` → backend iniciado
- Buscar `AdminInitializer` → estado del admin
- Buscar errores de conexión DB → revisar los enlaces `DB_HOST`, `DB_PORT` y `DB_NAME`
- Buscar errores CORS → revisar FRONTEND_URL

---

## 10. Solución de errores frecuentes

| Error | Causa probable | Solución |
|---|---|---|
| `Connection refused` al DB | Enlace de PostgreSQL incorrecto | Verificar variables `DB_HOST`, `DB_PORT` y `DB_NAME` |
| `401 Unauthorized` | JWT_SECRET diferente entre deployments | Usar siempre el mismo JWT_SECRET |
| CORS error | FRONTEND_URL incorrecto | Actualizar FRONTEND_URL en Render |
| Admin no se crea | BD no disponible al iniciar | Verificar que la BD esté Running antes del backend |
| Chatbot error 503 | GROQ_API_KEY no configurada | Agregar clave en variables de Render |
| Hibernate error tablas | ddl-auto incorrecto | Verificar DDL_AUTO=update |
| Render timeout (free) | Instancia se duerme | Primera petición tarda ~30s, es normal |

---

## 11. Variables de entorno - Tabla completa

| Variable | Servicio | Obligatoria | Ejemplo ficticio | Descripción |
|---|---|---|---|---|
| `SPRING_PROFILES_ACTIVE` | Render (backend) | ✅ | `prod` | Perfil de Spring Boot |
| `PORT` | Render (auto) | ✅ | `10000` | Puerto asignado por Render |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | Render (backend) | ✅ | Enlace Blueprint | Destino PostgreSQL interno |
| `DB_USERNAME` / `DB_PASSWORD` | Render (backend) | ✅ | Enlace Blueprint | Credenciales inyectadas por Render |
| `DDL_AUTO` | Render (backend) | ❌ | `update` | Estrategia Hibernate (default: update) |
| `SHOW_SQL` | Render (backend) | ❌ | `false` | Mostrar queries SQL en logs |
| `JWT_SECRET` | Render (backend) | ✅ | Generado por Render | Clave para firmar JWT |
| `FRONTEND_URL` | Render (backend) | ✅ | `https://farmacia.vercel.app` | URL del frontend para CORS |
| `ADMIN_EMAIL` | Render (backend) | ✅ | `admin@farmacia.com` | Email del admin por defecto |
| `ADMIN_PASSWORD` | Render (backend) | ✅ | Configurar solo en Render | Contraseña admin |
| `CREATE_DEFAULT_ADMIN` | Render (backend) | ❌ | `true` | Crear admin si no existe |
| `GROQ_API_KEY` | Render (backend) | ❌ | Configurar solo en Render | API Key de Groq para el chatbot |
| `VITE_API_URL` | Vercel (frontend) | ✅ | `https://backend.onrender.com` | URL del backend para React |

> ⚠️ **SEGURIDAD**: Ninguna de estas variables debe aparecer en el código fuente ni en el historial de Git.

---

## 12. Comandos Git para subir al repositorio nuevo

```bash
# Desde la carpeta FarmaciaMariaRosa-Cloud
git init
git checkout -b main
git add .
git commit -m "feat: preparar proyecto para despliegue en la nube (Render + Vercel)"
git remote add origin https://github.com/TU_USUARIO/FarmaciaMariaRosa-Cloud.git
git push -u origin main
```

Reemplazar `TU_USUARIO` con el nombre de usuario de GitHub real.
