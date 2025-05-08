const mysql = require('mysql2/promise');
require('dotenv').config();

const sslOptions = {
  rejectUnauthorized: false, // Importante para Clever Cloud
  // Agrega esto si tienes problemas persistentes:
  // ca: fs.readFileSync('./path/to/clever-cloud-ca.pem')
};

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.NODE_ENV === 'production' ? sslOptions : null,
  charset: 'utf8mb4'
});

// Función de prueba mejorada
async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT 1 + 1 AS result');
    console.log('✅ Conexión a MySQL exitosa. Resultado:', rows[0].result);
    
    // Verificación adicional de tablas
    const [users] = await conn.query('SELECT COUNT(*) AS count FROM usuarios');
    console.log(`✅ Tabla usuarios verificada (${users[0].count} registros)`);
    
  } catch (err) {
    console.error('❌ Error de conexión a MySQL:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState
    });
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
}

testConnection();

module.exports = pool;