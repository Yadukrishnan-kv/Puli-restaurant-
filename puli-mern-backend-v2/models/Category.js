const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
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

    // Description
    description_en: String,
    description_ar: String,

    // Image for category
    image: String,

    // Parent section (optional - allows floating categories)
    section_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuSection',
    },

    // URL slug for routing
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Grouping for customer frontend
    group: {
      type: String,
      enum: ['main', 'special', 'festive'],
      default: 'main',
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

module.exports = mongoose.model('Category', CategorySchema);
