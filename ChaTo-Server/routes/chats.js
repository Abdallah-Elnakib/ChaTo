const express = require('express');
const { body, param } = require('express-validator');
const chatController = require('../controllers/chatController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Create or get private chat
router.post('/private', auth, [
  body('otherUserId').isMongoId().withMessage('Invalid user ID.')
], chatController.createOrGetPrivateChat);

// Get all chats for user
router.get('/my', auth, chatController.getUserChats);

// Get messages for a chat
router.get('/:chatId/messages', auth, [
  param('chatId').isMongoId().withMessage('Invalid chat ID.')
], chatController.getChatMessages);

// Send message
router.post('/message', auth, [
  body('chatId').isMongoId().withMessage('Invalid chat ID.'),
  body('content').isString().notEmpty().withMessage('Message content is required.')
], chatController.sendMessage);

module.exports = router; 