const mongoose = require('mongoose');
const crypto = require('crypto');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  encryptedContent: { type: String, required: true },
  iv: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: [v => v.length >= 2, 'يجب أن يحتوي على مشاركين على الأقل']
  }],
  messages: [messageSchema],
  lastActivity: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
