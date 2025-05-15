const Room = require('../models/Room');
const pool = require('../config/db');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.findAll();
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (err) {
    next(err);
  }
};

// @desc    Create a room
// @route   POST /api/rooms
// @access  Private/Admin
const createRoom = async (req, res, next) => {
  try {
    const { number, type, capacity, price, services, status } = req.body;

    // Verificar si el número de habitación ya existe
    const [existingRooms] = await pool.query(
      'SELECT id FROM cuartos WHERE numero = ?',
      [number]
    );
    
    if (existingRooms.length > 0) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    const room = await Room.create({
      number,
      type,
      capacity,
      price,
      services,
      status,
      image: req.body.image || `https://via.placeholder.com/300?text=Room+${number}`
    });

    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
};

// @desc    Update a room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
const updateRoom = async (req, res, next) => {
  try {
    const { number, type, capacity, price, services, status } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Verificar si el nuevo número de habitación ya existe
    if (number && room.number !== number) {
      const [existingRooms] = await pool.query(
        'SELECT id FROM cuartos WHERE numero = ? AND id != ?',
        [number, req.params.id]
      );
      
      if (existingRooms.length > 0) {
        return res.status(400).json({ message: 'Room number already exists' });
      }
    }

    const updatedRoom = await Room.update(req.params.id, {
      number: number || room.number,
      type: type || room.type,
      capacity: capacity || room.capacity,
      price: price || room.price,
      status: status || room.status,
      image: req.body.image || room.image
    }, services || room.services);

    res.json(updatedRoom);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Verificar si la habitación está ocupada
    if (room.status === 'Ocupado') {
      return res.status(400).json({ message: 'Cannot delete an occupied room' });
    }

    await Room.delete(req.params.id);
    res.json({ message: 'Room removed' });
  } catch (err) {
    next(err);
  }
};

// @desc    Occupy a room (check-in)
// @route   POST /api/rooms/:id/occupy
// @access  Private/Receptionist
const occupyRoom = async (req, res, next) => {
  try {
    const { guestId, nights } = req.body;
    const roomId = req.params.id;

    // Verificar que la habitación existe y está disponible
    const [roomRows] = await pool.query(
      'SELECT id, estado FROM cuartos WHERE id = ?',
      [roomId]
    );
    
    if (roomRows.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (roomRows[0].estado !== 'Disponible') {
      return res.status(400).json({ message: 'Room is not available' });
    }

    // Verificar que el huésped existe
    const [guestRows] = await pool.query(
      'SELECT id FROM huespedes WHERE id = ?',
      [guestId]
    );
    
    if (guestRows.length === 0) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // Crear la ocupación
    const [result] = await pool.query(
      'INSERT INTO ocupaciones (cuarto_id, huesped_id, fecha_checkin, noches, estado) VALUES (?, ?, NOW(), ?, "Activa")',
      [roomId, guestId, nights]
    );

    // Actualizar estado de la habitación
    await pool.query(
      'UPDATE cuartos SET estado = "Ocupado" WHERE id = ?',
      [roomId]
    );

    // Obtener la ocupación creada con detalles del huésped
    const [occupationRows] = await pool.query(`
      SELECT o.*, h.nombre AS huesped_nombre, h.id_number AS huesped_identificacion
      FROM ocupaciones o
      JOIN huespedes h ON o.huesped_id = h.id
      WHERE o.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Room occupied successfully',
      occupation: occupationRows[0]
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Check out from room
// @route   POST /api/rooms/:id/checkout
// @access  Private/Receptionist
const checkOutRoom = async (req, res, next) => {
  try {
    const roomId = req.params.id;

    // Verificar que la habitación existe y está ocupada
    const [roomRows] = await pool.query(
      'SELECT id, estado FROM cuartos WHERE id = ?',
      [roomId]
    );
    
    if (roomRows.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (roomRows[0].estado !== 'Ocupado') {
      return res.status(400).json({ message: 'Room is not occupied' });
    }

    // Obtener la ocupación activa
    const [occupationRows] = await pool.query(
      'SELECT id FROM ocupaciones WHERE cuarto_id = ? AND estado = "Activa"',
      [roomId]
    );
    
    if (occupationRows.length === 0) {
      return res.status(400).json({ message: 'No active occupation found for this room' });
    }
    
    const occupationId = occupationRows[0].id;

    // Calcular el balance pendiente
    const [balanceResult] = await pool.query(`
      SELECT 
        (SELECT c.precio * o.noches FROM cuartos c WHERE c.id = ?) AS stay_total,
        COALESCE((SELECT SUM(pc.precio) FROM productos_consumidos pc WHERE pc.ocupacion_id = ?), 0) AS products_total,
        COALESCE((SELECT SUM(ce.monto) FROM cargos_extras ce WHERE ce.ocupacion_id = ?), 0) AS extras_total,
        COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.ocupacion_id = ?), 0) AS payments_total
    `, [roomId, occupationId, occupationId, occupationId]);
    
    const { stay_total, products_total, extras_total, payments_total } = balanceResult[0];
    const balance = (stay_total + products_total + extras_total) - payments_total;

    if (balance > 0) {
      return res.status(400).json({ 
        message: `Cannot check out with pending balance ($${balance.toFixed(2)})`,
        balance: balance
      });
    }

    // Finalizar la ocupación
    await pool.query(
      'UPDATE ocupaciones SET estado = "Finalizada", fecha_checkout = NOW() WHERE id = ?',
      [occupationId]
    );

    // Liberar la habitación
    await pool.query(
      'UPDATE cuartos SET estado = "Disponible" WHERE id = ?',
      [roomId]
    );

    res.json({ 
      message: 'Check-out completed successfully',
      roomId: roomId,
      occupationId: occupationId
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add consumed product
// @route   POST /api/rooms/:id/products
// @access  Private/Receptionist
const addProduct = async (req, res, next) => {
  try {
    const { name, price } = req.body;
    const roomId = req.params.id;

    // Verificar que la habitación existe y está ocupada
    const [roomRows] = await pool.query(
      'SELECT id, estado FROM cuartos WHERE id = ?',
      [roomId]
    );
    
    if (roomRows.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (roomRows[0].estado !== 'Ocupado') {
      return res.status(400).json({ message: 'Room is not occupied' });
    }

    // Obtener la ocupación activa
    const [occupationRows] = await pool.query(
      'SELECT id FROM ocupaciones WHERE cuarto_id = ? AND estado = "Activa"',
      [roomId]
    );
    
    if (occupationRows.length === 0) {
      return res.status(400).json({ message: 'No active occupation found for this room' });
    }
    
    const occupationId = occupationRows[0].id;

    // Registrar el producto consumido
    const [result] = await pool.query(
      'INSERT INTO productos_consumidos (cuarto_id, ocupacion_id, nombre, precio) VALUES (?, ?, ?, ?)',
      [roomId, occupationId, name, price]
    );

    res.status(201).json({
      message: 'Product added successfully',
      productId: result.insertId
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add extra charge
// @route   POST /api/rooms/:id/extras
// @access  Private/Receptionist
const addExtra = async (req, res, next) => {
  try {
    const { description, monto } = req.body;
    const roomId = req.params.id;

    // Verificar que la habitación existe y está ocupada
    const [roomRows] = await pool.query(
      'SELECT id, estado FROM cuartos WHERE id = ?',
      [roomId]
    );
    
    if (roomRows.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (roomRows[0].estado !== 'Ocupado') {
      return res.status(400).json({ message: 'Room is not occupied' });
    }

    // Obtener la ocupación activa
    const [occupationRows] = await pool.query(
      'SELECT id FROM ocupaciones WHERE cuarto_id = ? AND estado = "Activa"',
      [roomId]
    );
    
    if (occupationRows.length === 0) {
      return res.status(400).json({ message: 'No active occupation found for this room' });
    }
    
    const occupationId = occupationRows[0].id;

    // Registrar el cargo extra
    const [result] = await pool.query(
      'INSERT INTO cargos_extras (cuarto_id, ocupacion_id, descripcion, monto) VALUES (?, ?, ?, ?)',
      [roomId, occupationId, description, monto]
    );

    res.status(201).json({
      message: 'Extra charge added successfully',
      extraId: result.insertId
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add payment
// @route   POST /api/rooms/:id/payments
// @access  Private/Receptionist
const addPayment = async (req, res, next) => {
  try {
    const { monto, metodo_pago } = req.body;
    const roomId = req.params.id;

    // Verificar que la habitación existe y está ocupada
    const [roomRows] = await pool.query(
      'SELECT id, estado FROM cuartos WHERE id = ?',
      [roomId]
    );
    
    if (roomRows.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (roomRows[0].estado !== 'Ocupado') {
      return res.status(400).json({ message: 'Room is not occupied' });
    }

    // Obtener la ocupación activa
    const [occupationRows] = await pool.query(
      'SELECT id FROM ocupaciones WHERE cuarto_id = ? AND estado = "Activa"',
      [roomId]
    );
    
    if (occupationRows.length === 0) {
      return res.status(400).json({ message: 'No active occupation found for this room' });
    }
    
    const occupationId = occupationRows[0].id;

    // Calcular el balance actual
    const [balanceResult] = await pool.query(`
      SELECT 
        (SELECT c.precio * o.noches FROM cuartos c WHERE c.id = ?) AS stay_total,
        COALESCE((SELECT SUM(pc.precio) FROM productos_consumidos pc WHERE pc.ocupacion_id = ?), 0) AS products_total,
        COALESCE((SELECT SUM(ce.monto) FROM cargos_extras ce WHERE ce.ocupacion_id = ?), 0) AS extras_total,
        COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.ocupacion_id = ?), 0) AS payments_total
    `, [roomId, occupationId, occupationId, occupationId]);
    
    const { stay_total, products_total, extras_total, payments_total } = balanceResult[0];
    const currentBalance = (stay_total + products_total + extras_total) - payments_total;

    if (monto > currentBalance) {
      return res.status(400).json({ 
        message: `Payment amount exceeds current balance ($${currentBalance.toFixed(2)})`,
        maxAmount: currentBalance
      });
    }

    // Registrar el pago
    const [result] = await pool.query(
      'INSERT INTO pagos (cuarto_id, ocupacion_id, monto, metodo_pago) VALUES (?, ?, ?, ?)',
      [roomId, occupationId, monto, metodo_pago]
    );

    res.status(201).json({
      message: 'Payment added successfully',
      paymentId: result.insertId,
      newBalance: currentBalance - monto
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  occupyRoom,
  checkOutRoom,
  addProduct,
  addExtra,
  addPayment
};