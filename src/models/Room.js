const pool = require('../config/db');

class Room {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT c.*, 
        (SELECT GROUP_CONCAT(sc.servicio) FROM servicios_cuarto sc WHERE sc.cuarto_id = c.id) AS servicios
      FROM cuartos c
      ORDER BY c.numero ASC
    `);
    return rows.map(row => this.mapBasicRoomFields(row));
  }

  static async findById(id) {
    // Obtener información básica de la habitación
    const [roomRows] = await pool.query(`
      SELECT c.*, 
        (SELECT GROUP_CONCAT(sc.servicio) FROM servicios_cuarto sc WHERE sc.cuarto_id = c.id) AS servicios
      FROM cuartos c
      WHERE c.id = ?
    `, [id]);
    
    if (roomRows.length === 0) return null;
    
    const room = this.mapBasicRoomFields(roomRows[0]);
    
    // Obtener información de ocupación activa si existe
    const [occupationRows] = await pool.query(`
      SELECT o.*, h.nombre AS huesped_nombre, h.id_number AS huesped_identificacion
      FROM ocupaciones o
      JOIN huespedes h ON o.huesped_id = h.id
      WHERE o.cuarto_id = ? AND o.estado = 'Activa'
    `, [id]);
    
    if (occupationRows.length > 0) {
      const occupation = occupationRows[0];
      room.occupation = {
        id: occupation.id,
        guestId: occupation.huesped_id,
        guestName: occupation.huesped_nombre,
        guestIdNumber: occupation.huesped_identificacion,
        checkInDate: occupation.fecha_checkin,
        nights: occupation.noches,
        checkOutDate: occupation.fecha_checkout,
        status: occupation.estado
      };
      
      // Obtener productos consumidos
      const [products] = await pool.query(
        'SELECT * FROM productos_consumidos WHERE ocupacion_id = ?',
        [occupation.id]
      );
      room.products = products;
      
      // Obtener cargos extras
      const [extras] = await pool.query(
        'SELECT * FROM cargos_extras WHERE ocupacion_id = ?',
        [occupation.id]
      );
      room.extras = extras;
      
      // Obtener pagos
      const [payments] = await pool.query(
        'SELECT * FROM pagos WHERE ocupacion_id = ?',
        [occupation.id]
      );
      room.payments = payments;
    }
    
    return room;
  }

  static async create({ number, type, capacity, price, services, status = 'Disponible', image }) {
    const [result] = await pool.query(
      'INSERT INTO cuartos (numero, tipo, capacidad, precio, imagen_url, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [number, type, capacity, price, image, status]
    );

    if (services && services.length > 0) {
      await Promise.all(services.map(service => 
        pool.query('INSERT INTO servicios_cuarto (cuarto_id, servicio) VALUES (?, ?)', [result.insertId, service])
      ));
    }

    return this.findById(result.insertId);
  }

  static async update(id, { number, type, capacity, price, status, image }, services) {
    await pool.query(
      'UPDATE cuartos SET numero = ?, tipo = ?, capacidad = ?, precio = ?, estado = ?, imagen_url = ? WHERE id = ?',
      [number, type, capacity, price, status, image, id]
    );

    // Actualizar servicios
    await pool.query('DELETE FROM servicios_cuarto WHERE cuarto_id = ?', [id]);
    if (services && services.length > 0) {
      await Promise.all(services.map(service => 
        pool.query('INSERT INTO servicios_cuarto (cuarto_id, servicio) VALUES (?, ?)', [id, service])
      ));
    }

    return this.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM servicios_cuarto WHERE cuarto_id = ?', [id]);
    await pool.query('DELETE FROM cuartos WHERE id = ?', [id]);
    return true;
  }

  // Método para mapear solo los campos básicos de la habitación
  static mapBasicRoomFields(row) {
    return {
      id: row.id,
      number: row.numero,
      type: row.tipo,
      capacity: row.capacidad,
      price: row.precio_noche !== undefined && row.precio_noche !== null ? Number(row.precio_noche) : 0,
      status: row.estado,
      image: row.imagen_url,
      services: row.servicios ? row.servicios.split(',') : [],
      createdAt: row.fecha_creacion,
      updatedAt: row.fecha_actualizacion
    };
  }
}

module.exports = Room;