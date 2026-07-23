const mongoose = require('mongoose');

const SubCategorySchema = new mongoose.Schema(
  {
    name_en: {
      type: String,
      required: true,
      trim: true,
    },
    name_ar: {
      type: String,
      required: true,
      trim: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
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

SubCategorySchema.index({ category_id: 1, name_en: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
SubCategorySchema.index({ category_id: 1, name_ar: 1 }, { unique: true, collation: { locale: 'ar', strength: 2 } });

module.exports = mongoose.model('SubCategory', SubCategorySchema);
