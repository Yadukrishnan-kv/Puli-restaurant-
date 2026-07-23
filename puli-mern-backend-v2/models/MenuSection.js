const mongoose = require('mongoose');

const MenuSectionSchema = new mongoose.Schema(
  {
    // English and Arabic names
    name_en: {
      type: String,
      required: true,
    },
    name_ar: {
      type: String,
      required: true,
    },

    // Status and ordering
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

module.exports = mongoose.model('MenuSection', MenuSectionSchema);
