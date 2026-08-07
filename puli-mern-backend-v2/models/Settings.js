const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    restaurant_name: String,
    restaurant_name_ar: String,
    address_en: String,
    address_ar: String,
    // Contact details shown in the customer footer
    phone: String,      // mobile
    telephone: String,  // landline
    email: String,
    logo_url: String,
    // English logos (theme-specific)
    logo_dark_url: String,
    logo_light_url: String,
    // Arabic logos (theme-specific) - shown when site language is Arabic
    logo_dark_ar_url: String,
    logo_light_ar_url: String,
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
