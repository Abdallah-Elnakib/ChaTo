const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// Create or get private chat
exports.createOrGetPrivateChat = async (req, res) => {
  try {
    const { userId } = req.user;
    const { otherUserId } = req.body;
    if (userId === otherUserId) return res.status(400).json({ message: 'Cannot chat with yourself.' });
    let chat = await Chat.findOne({
      isGroup: false,
      users: { $all: [userId, otherUserId], $size: 2 }
    });
    if (!chat) {
      chat = await Chat.create({ users: [userId, otherUserId] });
    }
    res.json({ chat });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all chats for user
exports.getUserChats = async (req, res) => {
  try {
    const { userId } = req.user;
    const chats = await Chat.find({ users: userId })
      .populate('users', 'username email avatar')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username avatar' } })
      .sort({ updatedAt: -1 });
    res.json({ chats });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get messages for a chat
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Send message (text only, for now)
exports.sendMessage = async (req, res) => {
  try {
    const { userId } = req.user;
    const { chatId, content, type } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    const message = await Message.create({
      chat: chatId,
      sender: userId,
      content,
      type: type || 'text'
    });
    chat.lastMessage = message._id;
    await chat.save();
    // Emit message via Socket.io
    req.io.to(chatId).emit('newMessage', {
      ...message.toObject(),
      sender: { _id: userId }
    });
    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 