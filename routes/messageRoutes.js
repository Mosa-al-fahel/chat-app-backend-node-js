// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware'); // لحماية المسار

router.get('/:senderId/:receiverId', authMiddleware, getMessages);

module.exports = router;