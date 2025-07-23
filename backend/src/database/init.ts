import pool from './connection';

export async function initDatabase() {
  try {
    console.log('🔄 Inicializando conexion a la base de datos...');

    // Verificar que podemos conectar a la base de datos
    const client = await pool.connect();
    console.log('✅ Conexion a PostgreSQL establecida correctamente');
    
    // Verificar si las tablas principales ya existen
    const checkTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('usuario', 'rol', 'proyecto', 'objetivo', 'institucion')
    `;
    
    const existingTables = await client.query(checkTablesQuery);
    
    console.log(`📊 Tablas encontradas: ${existingTables.rows.length}`);
    
    // Si las tablas ya existen, solo verificamos los datos
    if (existingTables.rows.length >= 5) {
      console.log('✅ Las tablas principales ya existen en la base de datos');
      client.release();
      
      // Verificar datos iniciales
      await verifyInitialData();
      console.log('✅ Base de datos inicializada correctamente');
      return;
    }

    console.log('⚠️  Faltan tablas en la base de datos.');
    console.log('📄 Por favor, ejecuta el script: database/setup_consolidado.sql');
    console.log('🔧 Comando: psql -h localhost -U postgres -d postgres -f "database/setup_consolidado.sql"');
    client.release();

  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error);
    console.log('');
    console.log('🔍 Posibles soluciones:');
    console.log('   1. Verifica que PostgreSQL este instalado e iniciado');
    console.log('   2. Verifica las credenciales en el archivo .env');
    console.log('   3. Verifica que la base de datos "proyecto_fullstack" exista');
    console.log('');
    throw error;
  }
}

async function verifyInitialData() {
  try {
    // Verificar usuarios
    const usersResult = await pool.query('SELECT COUNT(*) FROM usuario');
    const userCount = parseInt(usersResult.rows[0].count);
    console.log(`👥 Usuarios en la base de datos: ${userCount}`);

    // Verificar roles
    const rolesResult = await pool.query('SELECT COUNT(*) FROM rol');
    const roleCount = parseInt(rolesResult.rows[0].count);
    console.log(`🔐 Roles en la base de datos: ${roleCount}`);

    // Verificar instituciones
    const instResult = await pool.query('SELECT COUNT(*) FROM institucion');
    const instCount = parseInt(instResult.rows[0].count);
    console.log(`🏢 Instituciones en la base de datos: ${instCount}`);

    // Verificar proyectos
    const projResult = await pool.query('SELECT COUNT(*) FROM proyecto');
    const projCount = parseInt(projResult.rows[0].count);
    console.log(`📊 Proyectos en la base de datos: ${projCount}`);

    // Verificar objetivos
    const objResult = await pool.query('SELECT COUNT(*) FROM objetivo');
    const objCount = parseInt(objResult.rows[0].count);
    console.log(`🎯 Objetivos en la base de datos: ${objCount}`);

  } catch (error) {
    console.error('❌ Error al verificar datos iniciales:', error);
    throw error;
  }
}
