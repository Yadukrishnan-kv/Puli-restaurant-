const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    restaurant_name: String,
    restaurant_name_ar: String,
    address_en: String,
    address_ar: String,
    logo_url: String,
    logo_dark_url: String,
    logo_light_url: String,
    favicon_url: String,
    theme_mode: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);
