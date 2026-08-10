const mongoose = require('mongoose');

// A single opening-hours group, e.g. { days: "THURSDAY & FRIDAY", meals: ["Restaurant: 11.30am to 12.00am"] }
const OpeningHoursGroupSchema = new mongoose.Schema(
  {
    days: String,
    meals: [String],
  },
  { _id: false }
);

const SettingsSchema = new mongoose.Schema(
  {
    restaurant_name: String,
    restaurant_name_ar: String,
    address_en: String,
    address_ar: String,
    // Opening-hours groups shown in the customer footer
    opening_hours: [OpeningHoursGroupSchema],
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
