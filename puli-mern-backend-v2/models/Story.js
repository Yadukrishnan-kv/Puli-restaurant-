const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema(
  {
    title_en: String,
    title_ar: String,
    description_en: String,
    description_ar: String,
    background_image: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Story', StorySchema);
