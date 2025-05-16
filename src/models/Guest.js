const pool = require('../config/db');

class Guest {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM huespedes ORDER BY nombre ASC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM huespedes WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findOneByIdNumber(idNumber) {
    const [rows] = await pool.query('SELECT * FROM huespedes WHERE id_number = ?', [idNumber]);
    return rows[0] || null;
  }

  static async create({ name, idNumber, image }) {
    const [result] = await pool.query(
      'INSERT INTO huespedes (nombre, id_number, imagen_url) VALUES (?, ?, ?)',
      [name, idNumber, image]
    );
    return { id: result.insertId, name, idNumber, image };
  }

  static async update(id, { name, idNumber, image }) {
    await pool.query(
      'UPDATE huespedes SET nombre = ?, id_number = ?, imagen_url = ? WHERE id = ?',
      [name, idNumber, image, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM huespedes WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Guest;