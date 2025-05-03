const express = require('express');
const { body } = require('express-validator');
const friendController = require('../controllers/friendController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Search users
router.get('/search', auth, async (req, res, next) => {
  console.log('وصل طلب بحث عن صديق:', req.query);
  friendController.searchUsers(req, res, next);
});

// Send friend request
router.post('/request', auth, [
  body('toUserId').isMongoId().withMessage('Invalid user ID.')
], friendController.sendFriendRequest);

// Respond to friend request
router.post('/respond', auth, [
  body('fromUserId').isMongoId().withMessage('Invalid user ID.'),
  body('accept').isBoolean().withMessage('Accept must be boolean.')
], friendController.respondToFriendRequest);

// Get friends list
router.get('/list', auth, friendController.getFriends);

// Block user
router.post('/block', auth, [
  body('userIdToBlock').isMongoId().withMessage('Invalid user ID.')
], friendController.blockUser);

module.exports = router; 