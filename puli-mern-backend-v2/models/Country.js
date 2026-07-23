const mongoose = require('mongoose');

const CountrySchema = new mongoose.Schema(
  {
    name_en: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    name_ar: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    flag_image: {
      type: String,
      default: '',
      trim: true,
    },
    visible: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Country', CountrySchema);
