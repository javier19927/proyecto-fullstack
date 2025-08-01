import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

// Cargar variables de entorno desde el directorio backend
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

console.log('🔧 Configuracion de base de datos:');
console.log('   Host:', process.env.DB_HOST || 'localhost');
console.log('   Puerto:', process.env.DB_PORT || '5432');
console.log('   Base de datos:', process.env.DB_NAME || 'fullstack');
console.log('   Usuario:', process.env.DB_USER || 'postgres');
console.log('   Contrasena configurada:', process.env.DB_PASSWORD ? '✅ Si' : '❌ No');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fullstack',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456789',
  client_encoding: 'UTF8',
  connectionString: undefined,
  ssl: false,
  query_timeout: 10000,
  statement_timeout: 10000
});

// Configurar encoding al conectar
pool.on('connect', (client) => {
  client.query('SET client_encoding = UTF8');
});

export default pool;
