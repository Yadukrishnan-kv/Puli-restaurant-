const mongoose = require('mongoose');

const FilterTagSchema = new mongoose.Schema(
  {
    // English and Arabic labels
    label_en: {
      type: String,
      required: true,
    },
    label_ar: {
      type: String,
      required: true,
    },

    // Tag type: 'badge' for special items (chef special, popular, etc.)
    // 'allergen' for dietary restrictions
    type: {
      type: String,
      enum: ['badge', 'allergen'],
      required: true,
    },

    // Status and ordering
    enabled: {
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

module.exports = mongoose.model('FilterTag', FilterTagSchema);
