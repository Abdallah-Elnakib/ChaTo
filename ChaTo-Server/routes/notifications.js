const express = require('express');
const { body } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Get all notifications
router.get('/', auth, notificationController.getNotifications);

// Mark notification as read
router.post('/read', auth, [
  body('notificationId').isMongoId().withMessage('Invalid notification ID.')
], notificationController.markAsRead);

module.exports = router; 