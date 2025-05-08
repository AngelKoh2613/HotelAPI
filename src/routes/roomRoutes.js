const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/roomController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getRooms)
  .post(protect, admin, createRoom);

router.route('/:id')
  .get(protect, getRoomById)
  .put(protect, admin, updateRoom)
  .delete(protect, admin, deleteRoom);

router.put('/:id/occupy', protect, occupyRoom);
router.put('/:id/checkout', protect, checkOutRoom);
router.post('/:id/products', protect, addProduct);
router.post('/:id/extras', protect, addExtra);
router.post('/:id/payments', protect, addPayment);

module.exports = router;