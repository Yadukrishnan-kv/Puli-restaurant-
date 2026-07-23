const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    userEmail: String,
    module: String,
    action: String,
    entityId: mongoose.Schema.Types.ObjectId,
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Create index for efficient queries
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ userEmail: 1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
