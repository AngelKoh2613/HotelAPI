const Guest = require('../models/Guest');

// @desc    Get all guests
// @route   GET /api/guests
// @access  Private
const getGuests = async (req, res, next) => {
  try {
    const guests = await Guest.find().sort({ name: 1 });
    res.json(guests);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single guest
// @route   GET /api/guests/:id
// @access  Private
const getGuestById = async (req, res, next) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }
    res.json(guest);
  } catch (err) {
    next(err);
  }
};

// @desc    Create a guest
// @route   POST /api/guests
// @access  Private
const createGuest = async (req, res, next) => {
  try {
    const { name, idNumber } = req.body;

    // Check if guest ID already exists
    const guestExists = await Guest.findOne({ idNumber });
    if (guestExists) {
      return res.status(400).json({ message: 'Guest with this ID already exists' });
    }

    const guest = await Guest.create({
      name,
      idNumber,
      image: req.body.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    });

    res.status(201).json(guest);
  } catch (err) {
    next(err);
  }
};

// @desc    Update a guest
// @route   PUT /api/guests/:id
// @access  Private
const updateGuest = async (req, res, next) => {
  try {
    const { name, idNumber } = req.body;

    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // Check if ID is being changed to one that already exists
    if (idNumber && guest.idNumber !== idNumber) {
      const guestExists = await Guest.findOne({ idNumber });
      if (guestExists) {
        return res.status(400).json({ message: 'Guest with this ID already exists' });
      }
    }

    guest.name = name || guest.name;
    guest.idNumber = idNumber || guest.idNumber;
    guest.image = req.body.image || guest.image;

    const updatedGuest = await guest.save();
    res.json(updatedGuest);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a guest
// @route   DELETE /api/guests/:id
// @access  Private/Admin
const deleteGuest = async (req, res, next) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    await guest.remove();
    res.json({ message: 'Guest removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest
};