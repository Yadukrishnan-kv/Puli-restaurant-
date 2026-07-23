const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema(
  {
    title_en: String,
    title_ar: String,
    subtitle_en: String,
    subtitle_ar: String,
    background_image: String,
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', BannerSchema);
