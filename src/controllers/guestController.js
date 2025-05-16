const Guest = require('../models/Guest');

// @desc    Get all guests
// @route   GET /api/guests
// @access  Private
const getGuests = async (req, res, next) => {
  try {
    const guests = await Guest.findAll();
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
    const { name, idNumber, image } = req.body;

    // Check if guest ID already exists
    const guestExists = await Guest.findOneByIdNumber(idNumber);
    if (guestExists) {
      return res.status(400).json({ message: 'Guest with this ID already exists' });
    }

    const guest = await Guest.create({
      name,
      idNumber,
      image: image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
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
    const { name, idNumber, image } = req.body;

    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // Check if ID is being changed to one that already exists
    if (idNumber && guest.idNumber !== idNumber) {
      const guestExists = await Guest.findOneByIdNumber(idNumber);
      if (guestExists) {
        return res.status(400).json({ message: 'Guest with this ID already exists' });
      }
    }

    const updatedGuest = await Guest.update(req.params.id, {
      name: name || guest.name,
      idNumber: idNumber || guest.idNumber,
      image: image || guest.image
    });
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

    await Guest.delete(req.params.id);
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