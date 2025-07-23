# 🚀 Proyecto Fullstack - Sistema de Gestión Institucional

Sistema completo de gestión institucional con módulos de planificación estratégica, proyectos de inversión y reportes avanzados.

## 📋 Características Principales

### ✅ Módulos Implementados

1. **📊 Módulo 1: Configuración Institucional**
   - Gestión de instituciones y jerarquías
   - Administración de usuarios y roles
   - Sistema de permisos granular

2. **🎯 Módulo 2: Gestión de Objetivos Estratégicos**
   - Creación y edición de objetivos
   - Alineación con PND y ODS
   - Sistema de validación y aprobación
   - Gestión de metas e indicadores

3. **🏗 Módulo 3: Proyectos de Inversión**
   - Registro de proyectos institucionales
   - Gestión de actividades POA
   - Control presupuestario
   - Flujo de revisión y validación

4. **📈 Módulo 4: Reportes y Analytics** ⭐ *RECIÉN IMPLEMENTADO*
   - Consulta de reportes con estadísticas
   - Filtros avanzados por múltiples criterios
   - Exportación en PDF, Excel y CSV
   - Reportes técnicos de objetivos estratégicos
   - Reportes técnicos de proyectos de inversión
   - Resumen presupuestario ejecutivo
   - Reportes comparativos dinámicos

## 🛠 Tecnologías Utilizadas

### Backend
- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **bcrypt** - Encriptación de contraseñas
- **CORS** - Manejo de peticiones cruzadas
- **Morgan** - Logging de peticiones
- **Helmet** - Seguridad

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **React Hooks** - Manejo de estado
- **Fetch API** - Peticiones HTTP

### Base de Datos
- **PostgreSQL 16+**
- **Extensiones**: uuid-ossp, pgcrypto
- **Datos de prueba** incluidos

## 🚀 Instalación y Configuración

### Prerequisitos
- Node.js 18+
- PostgreSQL 16+
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/javier19927/proyecto-fullstack.git
cd proyecto-fullstack
```

### 2. Instalar dependencias
```bash
# Instalar dependencias generales
npm install

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### 3. Configurar Base de Datos
```bash
# Crear base de datos PostgreSQL
createdb proyecto_fullstack

# Ejecutar script de configuración
psql -d proyecto_fullstack -f database/setup_final.sql
```

### 4. Configurar Variables de Entorno

**Backend (.env)**
```env
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=proyecto_fullstack
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_jwt_secret_super_seguro
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=Proyecto Fullstack
```

### 5. Ejecutar el proyecto
```bash
# Desde el directorio raíz
npm run dev

# O ejecutar por separado:
# Backend: cd backend && npm run dev
# Frontend: cd frontend && npm run dev
```

## 🌐 URLs de Acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## 👤 Usuarios de Prueba

| Email | Password | Rol | Permisos |
|-------|----------|-----|----------|
| admin@test.com | 123456 | Administrador | Acceso completo |
| planificador@test.com | 123456 | Técnico Planificador | Gestión y reportes |
| revisor@test.com | 123456 | Revisor Institucional | Solo proyectos |
| validador@test.com | 123456 | Autoridad Validante | Solo objetivos |
| consultor@test.com | 123456 | Consultor | Solo lectura |

## 📊 Endpoints API Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Reportes
- `GET /api/reportes/consultar` - Estadísticas generales
- `GET /api/reportes/objetivos` - Reporte de objetivos
- `GET /api/reportes/proyectos` - Reporte de proyectos
- `GET /api/reportes/presupuestario` - Resumen presupuestario
- `GET /api/reportes/comparativo` - Reportes comparativos
- `POST /api/reportes/exportar` - Exportar reportes
- `GET /api/reportes/filtros` - Opciones de filtrado

### Objetivos
- `GET /api/objetivos` - Listar objetivos
- `POST /api/objetivos` - Crear objetivo
- `PUT /api/objetivos/:id` - Actualizar objetivo
- `POST /api/objetivos/:id/validar` - Validar objetivo

### Proyectos
- `GET /api/proyectos` - Listar proyectos
- `POST /api/proyectos` - Crear proyecto
- `PUT /api/proyectos/:id` - Actualizar proyecto
- `POST /api/proyectos/:id/revisar` - Revisar proyecto

## 🔐 Sistema de Permisos

El sistema implementa un control de acceso basado en roles (RBAC) con los siguientes niveles:

### Roles y Accesos

1. **ADMIN** - Acceso completo al sistema
2. **PLANIF** - Gestión completa + reportes
3. **VALID** - Solo validación de objetivos + reportes limitados
4. **REVISOR** - Solo revisión de proyectos + reportes limitados
5. **AUDITOR** - Acceso de solo lectura + reportes completos

### Matriz de Permisos por Módulo

| Módulo | ADMIN | PLANIF | VALID | REVISOR | AUDITOR |
|---------|-------|--------|-------|---------|---------|
| Configuración | ✅ | ❌ | ❌ | ❌ | ❌ |
| Objetivos | ✅ | ✅ | ✅* | ❌ | 👁 |
| Proyectos | ✅ | ✅ | ❌ | ✅* | 👁 |
| Reportes | ✅ | ✅ | ✅* | ✅* | ✅ |

*✅ = Acceso completo, ✅* = Acceso limitado, 👁 = Solo lectura, ❌ = Sin acceso*

## 📁 Estructura del Proyecto

```
proyecto-fullstack/
├── backend/                 # Servidor Node.js + Express
│   ├── src/
│   │   ├── controllers/     # Controladores de la API
│   │   ├── middleware/      # Middlewares de autenticación y permisos
│   │   ├── models/         # Modelos de datos
│   │   ├── routes/         # Rutas de la API
│   │   ├── database/       # Configuración de BD
│   │   └── utils/          # Utilidades
│   ├── .env.example        # Variables de entorno ejemplo
│   └── package.json
├── frontend/               # Aplicación Next.js
│   ├── app/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── hooks/          # Hooks personalizados
│   │   ├── utils/          # Utilidades del frontend
│   │   ├── reportes/       # Módulo de reportes
│   │   └── ...             # Otras páginas
│   ├── .env.local.example  # Variables de entorno ejemplo
│   └── package.json
├── database/               # Scripts de base de datos
│   └── setup_final.sql     # Script de inicialización
└── README.md               # Este archivo
```

## 🧪 Testing y Desarrollo

### Comandos Útiles

```bash
# Desarrollo con hot reload
npm run dev

# Solo backend
cd backend && npm run dev

# Solo frontend  
cd frontend && npm run dev

# Verificar salud del sistema
curl http://localhost:4000/health

# Probar login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}'
```

### Página de Diagnóstico

Visita `http://localhost:3000/diagnostico` para verificar la conectividad entre frontend y backend.

## 📊 Características del Módulo de Reportes

### 🎯 Funcionalidades Implementadas

1. **Consultar Reportes**
   - Dashboard con estadísticas visuales
   - Métricas en tiempo real
   - Indicadores por rol

2. **Filtros Dinámicos**
   - Por institución, estado, año
   - Por responsable y área
   - Rangos de fechas personalizados

3. **Exportación Avanzada**
   - PDF para reportes ejecutivos
   - Excel para análisis detallado
   - CSV para integración con otros sistemas

4. **Reportes Técnicos**
   - Objetivos con alineaciones PND/ODS
   - Proyectos con presupuestos y actividades
   - Estados de validación detallados

5. **Analytics Presupuestarios**
   - Resumen ejecutivo de presupuestos
   - Porcentajes de ejecución
   - Comparativas por institución

6. **Reportes Comparativos**
   - Metas planificadas vs ejecutadas
   - Tendencias por año/institución
   - Indicadores de performance

## 🔧 Configuración Avanzada

### Variables de Entorno Completas

**Backend**
```env
# Servidor
PORT=4000
NODE_ENV=development

# Base de datos
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=proyecto_fullstack
DB_USER=postgres
DB_PASSWORD=tu_password

# Seguridad
JWT_SECRET=tu_jwt_secret_muy_largo_y_seguro
JWT_EXPIRATION=8h

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
```

**Frontend**
```env
# API
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Aplicación
NEXT_PUBLIC_APP_NAME=Sistema de Gestión Institucional
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ORGANIZATION=UTPL

# Features
NEXT_PUBLIC_ENABLE_DIAGNOSTICS=true
```

## 🚦 Estados y Flujos

### Estados de Objetivos
- **Borrador** → **Enviado** → **Aprobado/Rechazado**

### Estados de Proyectos  
- **Registrado** → **En Revisión** → **Aprobado/Rechazado**

### Flujo de Permisos
1. Usuario inicia sesión
2. Sistema valida roles
3. Middleware verifica permisos por endpoint
4. Acceso concedido/denegado según matriz

## 📞 Soporte y Contacto

- **Desarrollador**: javier19927
- **Email**: cjlitardo1@utpl.edu.ec
- **Repositorio**: https://github.com/javier19927/proyecto-fullstack

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

---

⭐ **¡Proyecto actualizado con el Módulo 4 de Reportes completamente funcional!** ⭐
