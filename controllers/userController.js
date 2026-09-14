// controllers/userController.js
const User = require('../models/User');

exports.updateFcmToken = async (req, res) => {
  try {
    const { userId, fcmToken } = req.body; // أو req.user.id إذا كنت تستخدم Auth Middleware

    if (!userId || !fcmToken) {
      return res.status(400).json({ message: 'userId and fcmToken are required' });
    }

    await User.findByIdAndUpdate(userId, { fcmToken });

    return res.status(200).json({ message: 'FCM Token updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};