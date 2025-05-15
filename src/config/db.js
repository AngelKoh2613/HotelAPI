const mysql = require('mysql2/promise');
require('dotenv').config(); // Cargar las variables de entorno

// Opciones de SSL para producción
const sslOptions = {
  rejectUnauthorized: false, // Importante para Clever Cloud
  // Si tienes un archivo .pem para la CA, puedes agregarlo aquí:
  // ca: fs.readFileSync('./path/to/clever-cloud-ca.pem')
};

// Crear el pool de conexiones con configuración desde variables de entorno
const pool = mysql.createPool({
  host: process.env.DB_HOST,         // Dirección del servidor de base de datos
  user: process.env.DB_USER,         // Usuario de la base de datos
  password: process.env.DB_PASSWORD, // Contraseña de la base de datos
  database: process.env.DB_NAME,     // Nombre de la base de datos
  port: process.env.DB_PORT || 3306, // Puerto (por defecto 3306)
  waitForConnections: true,          // Esperar conexiones
  connectionLimit: 10,               // Número máximo de conexiones
  queueLimit: 0,                     // Sin límite en la cola
  ssl: process.env.NODE_ENV === 'production' ? sslOptions : null, // Configuración SSL en producción
  charset: 'utf8mb4',                // Usar utf8mb4 para compatibilidad con emojis
});

// Función de prueba para la conexión a la base de datos
async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection(); // Obtener una conexión del pool

    // Prueba de consulta simple
    const [rows] = await conn.query('SELECT 1 + 1 AS result');
    console.log('✅ Conexión a MySQL exitosa. Resultado:', rows[0].result);
    
    // Verificación adicional de la tabla 'usuarios'
    const [users] = await conn.query('SELECT COUNT(*) AS count FROM usuarios');
    console.log(`✅ Tabla usuarios verificada (${users[0].count} registros)`);

  } catch (err) {
    console.error('❌ Error de conexión a MySQL:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
    });

    // Terminar el proceso si no se puede conectar a la base de datos
    process.exit(1);
  } finally {
    if (conn) conn.release(); // Liberar la conexión para que se pueda reutilizar
  }
}

// Llamar a la función de prueba de conexión
testConnection();

// Exportar el pool para su uso en otros módulos
module.exports = pool;
