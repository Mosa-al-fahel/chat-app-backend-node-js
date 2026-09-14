// routes/friendRoutes.js
const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const authMiddleware = require('../middleware/authMiddleware');  
 

router.post('/add', authMiddleware, friendController.sendFriendRequest);
router.get('/list', authMiddleware, friendController.getFriendsList);
router.post('/remove', authMiddleware, friendController.removeFriend);
router.get('/explore', authMiddleware, friendController.getExploreUsers);
router.get('/requests', authMiddleware, friendController.getFriendRequests);
router.post('/acceptrequest', authMiddleware, friendController.acceptFriendRequest);


module.exports = router;
