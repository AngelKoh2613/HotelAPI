const Room = require('../models/Room');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find().sort({ number: 1 });
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

    // Check if room number already exists
    const roomExists = await Room.findOne({ number });
    if (roomExists) {
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

    // Check if room number is being changed to one that already exists
    if (number && room.number !== number) {
      const roomExists = await Room.findOne({ number });
      if (roomExists) {
        return res.status(400).json({ message: 'Room number already exists' });
      }
    }

    room.number = number || room.number;
    room.type = type || room.type;
    room.capacity = capacity || room.capacity;
    room.price = price || room.price;
    room.services = services || room.services;
    room.status = status || room.status;
    room.image = req.body.image || room.image;

    const updatedRoom = await room.save();
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

    await room.remove();
    res.json({ message: 'Room removed' });
  } catch (err) {
    next(err);
  }
};

// @desc    Occupy a room
// @route   PUT /api/rooms/:id/occupy
// @access  Private
const occupyRoom = async (req, res, next) => {
  try {
    const { nights, guestId } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status !== 'Disponible') {
      return res.status(400).json({ message: 'Room is not available' });
    }

    room.status = 'Ocupado';
    room.nights = nights;
    room.checkInDate = new Date();
    room.guest = guestId;

    const updatedRoom = await room.save();
    res.json(updatedRoom);
  } catch (err) {
    next(err);
  }
};

// @desc    Check out from a room
// @route   PUT /api/rooms/:id/checkout
// @access  Private
const checkOutRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status !== 'Ocupado') {
      return res.status(400).json({ message: 'Room is not occupied' });
    }

    // Calculate balance
    const stayTotal = room.nights * room.price;
    const productsTotal = room.products.reduce((sum, product) => sum + product.price, 0);
    const extrasTotal = room.extras.reduce((sum, extra) => sum + extra.amount, 0);
    const paymentsTotal = room.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const balance = (stayTotal + productsTotal + extrasTotal) - paymentsTotal;

    if (balance > 0) {
      return res.status(400).json({ 
        message: `Cannot check out with pending balance ($${balance.toFixed(2)})`,
        balance: balance
      });
    }

    room.status = 'Disponible';
    room.nights = 0;
    room.checkInDate = null;
    room.guest = null;
    room.products = [];
    room.extras = [];
    room.payments = [];

    const updatedRoom = await room.save();
    res.json(updatedRoom);
  } catch (err) {
    next(err);
  }
};

// @desc    Add product to room
// @route   POST /api/rooms/:id/products
// @access  Private
const addProduct = async (req, res, next) => {
  try {
    const { name, price } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status !== 'Ocupado') {
      return res.status(400).json({ message: 'Room is not occupied' });
    }

    room.products.push({ name, price });
    const updatedRoom = await room.save();
    res.json(updatedRoom);
  } catch (err) {
    next(err);
  }
};

// @desc    Add extra charge to room
// @route   POST /api/rooms/:id/extras
// @access  Private
const addExtra = async (req, res, next) => {
  try {
    const { description, amount } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status !== 'Ocupado') {
      return res.status(400).json({ message: 'Room is not occupied' });
    }

    room.extras.push({ description, amount });
    const updatedRoom = await room.save();
    res.json(updatedRoom);
  } catch (err) {
    next(err);
  }
};

// @desc    Add payment to room
// @route   POST /api/rooms/:id/payments
// @access  Private
const addPayment = async (req, res, next) => {
  try {
    const { amount } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status !== 'Ocupado') {
      return res.status(400).json({ message: 'Room is not occupied' });
    }

    // Calculate current balance
    const stayTotal = room.nights * room.price;
    const productsTotal = room.products.reduce((sum, product) => sum + product.price, 0);
    const extrasTotal = room.extras.reduce((sum, extra) => sum + extra.amount, 0);
    const paymentsTotal = room.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const currentBalance = (stayTotal + productsTotal + extrasTotal) - paymentsTotal;

    if (amount > currentBalance) {
      return res.status(400).json({ 
        message: `Payment amount exceeds current balance ($${currentBalance.toFixed(2)})`,
        maxAmount: currentBalance
      });
    }

    room.payments.push({ 
      amount,
      date: new Date()
    });
    
    const updatedRoom = await room.save();
    res.json(updatedRoom);
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