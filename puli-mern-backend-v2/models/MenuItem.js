const mongoose = require('mongoose');

// MenuItem Schema - supports both admin and customer frontend features
const MenuItemSchema = new mongoose.Schema(
  {
    // English text
    name_en: {
      type: String,
      required: true,
    },
    // Arabic text
    name_ar: {
      type: String,
      required: true,
    },
    description_en: String,
    description_ar: String,

    // Pricing
    price: {
      type: Number,
      required: true,
    },

    // Media
    image: String,

    // Location in menu hierarchy
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subcategory_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
    },
    classification_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classification',
    },

    country_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
      default: null,
    },

    // Country name snapshot to keep filter-friendly values even if relation changes
    country_name_en: {
      type: String,
      default: null,
    },
    country_name_ar: {
      type: String,
      default: null,
    },
    country_flag_url: {
      type: String,
      default: null,
    },

    // Nutrition & Allergens
    calories: {
      type: mongoose.Schema.Types.Mixed, // allow string or number
      default: null,
    },
    allergens: [String], // dairy, nuts, gluten, honey, etc.

    // Tags & Categorization
    tags: [String], // chef_special, popular, recommended, vegan, vegetarian, etc.

    // Badge flags used by admin panel
    chef_special: {
      type: Boolean,
      default: false,
    },
    popular: {
      type: Boolean,
      default: false,
    },
    recommended: {
      type: Boolean,
      default: false,
    },

    // Country/Cuisine indicator (ISO 3166-1 alpha-2 code)
    country_code: String,

    // Spice Level: 0=mild, 1=medium, 2=hot, 3=extra hot
    spice_level: {
      type: Number,
      enum: [0, 1, 2, 3],
      default: 0,
    },

    // Time-based availability
    available_from: String, // HH:MM format, e.g., "12:00"
    available_to: String,   // HH:MM format, e.g., "22:00"
    
    // Day-based availability (0=Sunday, 1=Monday, ..., 6=Saturday)
    available_days: [Number],

    // Status flags
    visible: {
      type: Boolean,
      default: true,
    },

    // Ordering
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', MenuItemSchema);
