const pool = require('../config/db');

class Room {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT c.*, 
        (SELECT GROUP_CONCAT(sc.servicio) FROM servicios_cuarto sc WHERE sc.cuarto_id = c.id) AS servicios
      FROM cuartos c
    `);
    return rows.map(row => ({
      ...row,
      services: row.servicios ? row.servicios.split(',') : []
    }));
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT c.*, 
        (SELECT GROUP_CONCAT(sc.servicio) FROM servicios_cuarto sc WHERE sc.cuarto_id = c.id) AS servicios
      FROM cuartos c
      WHERE c.id = ?
    `, [id]);
    
    if (rows.length === 0) return null;
    
    const room = rows[0];
    return {
      ...room,
      services: room.servicios ? room.servicios.split(',') : []
    };
  }

  static async create({ number, type, capacity, price, services, status = 'Disponible', image_url }) {
    const [result] = await pool.query(
      'INSERT INTO cuartos (numero, tipo, capacidad, precio_noche, imagen_url, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [number, type, capacity, price, image_url, status]
    );

    if (services && services.length > 0) {
      await Promise.all(services.map(service => 
        pool.query('INSERT INTO servicios_cuarto (cuarto_id, servicio) VALUES (?, ?)', [result.insertId, service])
      ));
    }

    return this.findById(result.insertId);
  }

  // ... otros métodos (update, delete, etc.)
}

module.exports = Room;