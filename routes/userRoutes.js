// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// توجيه الطلب إلى دالة الـ Controller المخصصة
router.patch('/fcm-token', userController.updateFcmToken);

module.exports = router;