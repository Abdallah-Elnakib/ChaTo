const router = require('express').Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');

router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.body.participants[0];
    
    const existing = await Conversation.findOne({
      participants: { $all: [userId, friendId] }
    })
    .populate('participants', 'name avatar')
    .lean();

    if (existing) return res.send(existing);

    const newConv = await Conversation.create({
      participants: [userId, friendId]
    });
    
    const populated = await Conversation.findById(newConv._id)
      .populate('participants', 'name avatar')
      .lean();

    res.status(201).send(populated);
    
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(400).send({ error: 'فشل إنشاء المحادثة' });
  }
});