import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

// Cargar variables de entorno PRIMERO
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🚀 Iniciando servidor backend - roles corregidos...');
// Reinicio para detectar problemas de puerto

import { initDatabase } from './database/init';
import { errorHandler } from './middleware/errorHandler';
import auditoriaRoutes from './routes/auditoria';
import authRoutes from './routes/auth';
import configuracionRoutes from './routes/configuracion';
import dashboardRoutes from './routes/dashboard';
import institucionRoutes from './routes/instituciones';
import objetivosRoutes from './routes/objetivos';
import proyectosRoutes from './routes/proyectos';
import reportesRoutes from './routes/reportes';
import rolRoutes from './routes/roles';
// import rolNewRoutes from './routes/rolesNew'; // Eliminado - consolidado en roles
import usuarioRoutes from './routes/usuarios';
import notificacionesRoutes from './routes/notificaciones';
import revisionesRoutes from './routes/revisiones';

const app = express();
const PORT = process.env.PORT || 4001;

// Middlewares de seguridad
app.use(helmet());
app.use(morgan('combined'));

// Configuracion de CORS
app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 CORS request from origin:', origin);
    
    // Permitir requests sin origin (ej: desde Postman o aplicaciones moviles)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    
    console.log('🔧 Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  exposedHeaders: ['Authorization']
}));

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas API
console.log('🔧 Registrando rutas de la API...');
app.use('/api/auth', authRoutes);
console.log('✅ Rutas AUTH registradas en /api/auth');
app.use('/api/dashboard', dashboardRoutes);
console.log('✅ Rutas DASHBOARD registradas en /api/dashboard');
app.use('/api/configuracion', configuracionRoutes);
console.log('✅ Rutas CONFIGURACION registradas en /api/configuracion');
app.use('/api/objetivos', objetivosRoutes);
console.log('✅ Rutas OBJETIVOS registradas en /api/objetivos');
app.use('/api/proyectos', proyectosRoutes);
console.log('✅ Rutas PROYECTOS registradas en /api/proyectos');
app.use('/api/reportes', reportesRoutes);
console.log('✅ Rutas REPORTES registradas en /api/reportes');
app.use('/api/notificaciones', notificacionesRoutes);
console.log('✅ Rutas NOTIFICACIONES registradas en /api/notificaciones');
app.use('/api/revisiones', revisionesRoutes);
console.log('✅ Rutas REVISIONES registradas en /api/revisiones');

// 🏢 Modulo 1: Configuracion Institucional
app.use('/api/instituciones', institucionRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/roles', rolRoutes);
// app.use('/api/rolesNew', rolNewRoutes); // Eliminado - consolidado en /api/roles
app.use('/api/auditoria', auditoriaRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    port: PORT,
    cors: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
    modules: [
      'Configuracion Institucional',
      'Gestion de Objetivos Estrategicos',
      'Proyectos de Inversion'
    ]
  });
});

// Ruta de salud para el API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    cors: {
      enabled: true,
      origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    }
  });
});

// Ruta 404
app.use('*', (req, res) => {
  console.log('❌ [404] Ruta no encontrada:', {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer ***' : 'No Auth'
    }
  });
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Inicializar base de datos y servidor
async function startServer() {
  try {
    await initDatabase();
    console.log('✅ Base de datos inicializada correctamente');
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutandose en puerto ${PORT}`);
      console.log(`📊 Entorno: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Error: El puerto ${PORT} ya está en uso`);
        console.error('💡 Intenta cambiar el puerto en el archivo .env o terminar el proceso que lo está usando');
        process.exit(1);
      } else {
        console.error('❌ Error del servidor:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
 
 
