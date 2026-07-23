const ActivityLog = require('../models/ActivityLog');

const logActivity = async (req, userEmail, module, action, entityId, meta) => {
  try {
    await ActivityLog.create({
      userEmail,
      module,
      action,
      entityId,
      meta,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

module.exports = logActivity;
