const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controllers/aiController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.post('/ask', auth, [
  body('prompt').isString().notEmpty().withMessage('Prompt is required.')
], aiController.askAI);

module.exports = router; 