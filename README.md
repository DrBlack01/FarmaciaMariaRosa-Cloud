# 💊 Farmacia María Rosa - Sistema Web (Cloud)

[![Java](https://img.shields.io/badge/Java-21-red?logo=openjdk)](https://www.java.com/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.5-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)](https://render.com/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000?logo=vercel)](https://vercel.com/)

> ⚠️ **SEGURIDAD**: Este repositorio NO contiene credenciales reales. Todas las configuraciones sensibles se manejan mediante variables de entorno.

---

## 📌 Descripción

Sistema web para **gestión de farmacia** que permite:
- 👩‍⚕️ A los **clientes**: visualizar catálogo de productos, hacer reservas y recogerlas en tienda.
- 🧑‍💻 Al **administrador**: gestionar productos, lotes, usuarios, reservas, categorías y ver estadísticas de ventas.
- 🤖 **Chatbot IA** (Groq/llama-3.1): responde consultas farmacéuticas en tiempo real.

Esta versión (`FarmaciaMariaRosa-Cloud`) es una copia preparada para despliegue en la nube, derivada del proyecto original. Contiene las configuraciones necesarias para ejecutarse en Render (backend) y Vercel (frontend).

---

## 🛠️ Tecnologías

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Java | 21 | Lenguaje principal |
| Spring Boot | 3.5.5 | Framework REST + JPA |
| Spring Security | Incluido | Autenticación y autorización |
| JWT (jjwt) | 0.11.5 | Tokens de sesión |
| Hibernate / JPA | Incluido | ORM y manejo de BD |
| PostgreSQL | 15+ | Base de datos relacional |
| Maven | 3.9+ | Gestión de dependencias |
| BCrypt | Incluido | Encriptación de contraseñas |
| Groq API | - | Chatbot IA (llama-3.1-8b-instant) |

### Frontend (activo)
| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | Framework UI principal |
| Vite | 7 | Bundler y servidor de desarrollo |
| React Router | 7 | Navegación SPA |
| Chart.js | 4.5 | Gráficas de estadísticas |
| Bootstrap | 5.3 | Estilos y componentes |

### Frontend (alternativo)
- HTML5, CSS3, JavaScript Vanilla
- Bootstrap 5
- Modo oscuro
- Chatbot integrado

---

## 🏗️ Arquitectura

```
FarmaciaMariaRosa-Cloud/
├── springboot/demo/        ← Backend Spring Boot
│   ├── src/main/java/com/proyectouno/demo/
│   │   ├── Config/         ← Config CORS + AdminInitializer
│   │   ├── Controller/     ← REST Controllers
│   │   ├── DTO/            ← Data Transfer Objects
│   │   ├── models/         ← Entidades JPA
│   │   ├── repository/     ← Spring Data JPA Repositories
│   │   ├── security/       ← JWT + Spring Security
│   │   └── DemoApplication.java
│   ├── src/main/resources/
│   │   ├── application.properties      ← Selector de perfil
│   │   ├── application-dev.properties  ← Desarrollo local
│   │   └── application-prod.properties ← Producción (Render)
│   └── Dockerfile          ← Para despliegue en Render
│
├── reactFront/             ← Frontend React + Vite (ACTIVO)
│   ├── src/
│   │   ├── components/     ← Navbar, Footer, etc.
│   │   ├── contexts/       ← Auth, DarkMode
│   │   ├── pages/          ← Home, Productos, Contacto, Admin
│   │   └── services/       ← Servicios de API
│   └── vercel.json         ← Config SPA routing en Vercel
│
├── frontent/               ← Frontend HTML/CSS/JS (ALTERNATIVO)
│   ├── assets/js/config.js ← URL del backend centralizada
│   ├── admin/              ← Panel de administración
│   └── pages/              ← Páginas públicas
│
├── render.yaml             ← Infraestructura Render
└── DEPLOYMENT.md           ← Guía de despliegue
```

---

## ⚙️ Instalación y ejecución local

### Requisitos
- Java 21
- Maven 3.9+
- PostgreSQL 15+
- Node.js 20+

### 1. Base de datos PostgreSQL local
```sql
-- En psql o pgAdmin:
CREATE DATABASE farmacia_maria_rosa;
```

### 2. Backend
```bash
cd springboot/demo

# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales locales (opcional para dev)

# Iniciar con perfil de desarrollo (usa localhost:5432 por defecto)
.\mvnw.cmd clean spring-boot:run
# o en Linux/Mac:
./mvnw clean spring-boot:run
```

El backend iniciará en: `http://localhost:8081`

✅ Hibernate creará las tablas automáticamente al primer inicio.

### 3. Frontend React
```bash
cd reactFront
npm install
npm run dev
```

El frontend React estará en: `http://localhost:5173`

El proxy de Vite redirige `/api/*` automáticamente al backend.

### 4. Frontend HTML (alternativo)
Abrir `frontent/index.html` con Live Server de VSCode o cualquier servidor estático.
El `config.js` detecta automáticamente si está en localhost o producción.

---

## 🔑 Usuario administrador

La creación automática del administrador está deshabilitada por defecto. Para habilitarla,
configura `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `CREATE_DEFAULT_ADMIN=true` únicamente como
variables de entorno. El administrador **no se duplica** si ya existe en la base de datos.

---

## 🌐 Variables de entorno

### Backend (.env para desarrollo local)
```bash
# Copiar de .env.example y completar:
cp springboot/demo/.env.example springboot/demo/.env
```

### Producción (Render)
Ver tabla completa en [DEPLOYMENT.md](DEPLOYMENT.md).

Variables mínimas requeridas:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME` y `DB_PASSWORD` - enlazadas automáticamente por el Blueprint
- `JWT_SECRET` - generada automáticamente por Render
- `FRONTEND_URL` - URL del frontend para CORS
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` - Credenciales del admin

### Frontend React (Vercel)
```bash
VITE_API_URL=https://farmacia-maria-rosa-backend.onrender.com
```

---

## 🤖 Chatbot (IA)

El chatbot utiliza **Groq API** con el modelo `llama-3.1-8b-instant`.

- La API key se configura en la variable de entorno `GROQ_API_KEY` (solo en Render/backend).
- El frontend llama al endpoint `/api/chat-ai` del backend (la clave NUNCA va al cliente).
- Si `GROQ_API_KEY` no está configurada, el chatbot responde un mensaje amigable sin romper la app.
- Obtener clave en: https://console.groq.com

---

## 🏗️ Entidades de la base de datos

| Entidad | Tabla | Descripción |
|---|---|---|
| Usuario | `usuarios` | Administradores del sistema |
| Cliente | `clientes` | Clientes de la farmacia |
| Producto | `productos` | Catálogo de productos |
| Categoria | `categorias` | Categorías de productos |
| Lote | `lotes` | Control de inventario por lotes |
| Reserva | `reservas` | Reservas de productos |
| DetalleReserva | `detalle_reservas` | Líneas de cada reserva |
| MensajeContacto | `mensajes_contacto` | Formulario de contacto |

Hibernate crea y actualiza las tablas automáticamente con `ddl-auto=update`.

---

## 🚀 Despliegue en la nube

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para instrucciones completas paso a paso.

### Resumen rápido
1. Crear repositorio nuevo en GitHub
2. Crear PostgreSQL en Render
3. Crear Web Service en Render (Docker, carpeta `springboot/demo`)
4. Crear proyecto en Vercel (carpeta `reactFront`)
5. Configurar variables de entorno en ambos servicios
6. ¡Listo!

---

## 📋 Compilación y empaquetado

```bash
# Backend (genera JAR ejecutable)
cd springboot/demo
.\mvnw.cmd clean package -DskipTests

# Archivo generado:
# target/demo-0.0.1-SNAPSHOT.jar

# Frontend React (genera build de producción)
cd reactFront
npm run build
# Archivos generados en: dist/
```

---

## ⚠️ Advertencia de seguridad

- **NUNCA** subas archivos `.env` a GitHub.
- **NUNCA** escribas contraseñas o API keys directamente en el código.
- Todos los secretos van en variables de entorno de Render/Vercel.
- El archivo `.gitignore` está configurado para excluir archivos `.env`.
- En producción, cambiar las credenciales del administrador por defecto.

---

## 📂 Estructura de endpoints API

| Endpoint | Método | Acceso | Descripción |
|---|---|---|---|
| `/api/auth/login` | POST | Público | Iniciar sesión |
| `/api/auth/register` | POST | Público | Registrar usuario |
| `/api/productos` | GET | Público | Listar productos |
| `/api/categorias` | GET | Público | Listar categorías |
| `/api/clientes` | GET/POST | Público | Gestión clientes |
| `/api/contacto` | POST | Público | Formulario contacto |
| `/api/chat-ai` | POST | Público | Chatbot IA |
| `/api/health` | GET | Público | Health check |
| `/api/lotes` | GET/POST/PUT/DELETE | ADMIN/CAJERO/SECRETARIO | Gestión lotes |
| `/api/reservas` | GET/POST/PUT | Autenticado | Gestión reservas |
| `/api/mensajes` | GET/DELETE | ADMIN/SECRETARIO | Mensajes de contacto |
| `/api/estadisticas` | GET | ADMIN | Dashboard estadísticas |
| `/usuarios` | GET/POST/PUT/DELETE | Autenticado | Gestión usuarios |

---

## 👥 Créditos

Proyecto académico de gestión de farmacia.
Esta versión `Cloud` fue preparada para despliegue en producción a partir del repositorio original.
