const express = require('express');
const router = express.Router();
const { 
  getGuests, 
  getGuestById, 
  createGuest, 
  updateGuest, 
  deleteGuest 
} = require('../controllers/guestController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getGuests)
  .post(protect, createGuest);

router.route('/:id')
  .get(protect, getGuestById)
  .put(protect, updateGuest)
  .delete(protect, admin, deleteGuest);

module.exports = router;