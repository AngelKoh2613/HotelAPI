const mongoose = require('mongoose');

const guestSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    idNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    image: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Guest', guestSchema);