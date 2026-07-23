const mongoose = require('mongoose');

const MediaItemSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    name: String,
    size: Number,
    uploaded_at: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MediaItem', MediaItemSchema);
