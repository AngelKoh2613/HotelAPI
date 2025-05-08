const pool = require('../config/db');

class User {
  static async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    return rows[0];
  }

  static async create({ username, password, role = 'receptionist', nombre }) {
    const [result] = await pool.query(
      'INSERT INTO usuarios (username, password_hash, role, nombre) VALUES (?, ?, ?, ?)',
      [username, password, role, nombre]
    );
    return { id: result.insertId, username, role, nombre };
  }
}

module.exports = User;