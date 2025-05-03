const User = require('../models/User');
const Notification = require('../models/Notification');

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const { userId } = req.user; // Get the current user's ID from auth middleware
    if (!query) return res.status(400).json({ message: 'Query is required.' });
    
    // Get the current user first to check blocked status
    const currentUser = await User.findById(userId).select('blocked');
    if (!currentUser) return res.status(404).json({ message: 'User not found.' });
    
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      isEmailVerified: true
    }).select('username email avatar blocked');

    // Add isBlocked and hasBlockedMe flag to each user
    const usersWithBlockedStatus = users.map(user => ({
      ...user.toObject(),
      isBlocked: currentUser.blocked.some(blockedId => blockedId.toString() === user._id.toString()),
      hasBlockedMe: user.blocked.some(blockedId => blockedId.toString() === currentUser._id.toString())
    }));

    console.log('Search results with blocked status:', usersWithBlockedStatus);
    res.json({ users: usersWithBlockedStatus });
  } catch (err) {
    console.error('Error in searchUsers:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.user; // from auth middleware
    const { toUserId } = req.body;
    if (userId === toUserId) return res.status(400).json({ message: 'You cannot add yourself.' });
    
    const user = await User.findById(userId);
    const toUser = await User.findById(toUserId);
    
    if (!toUser) return res.status(404).json({ message: 'User not found.' });
    if (user.friends.includes(toUserId)) return res.status(400).json({ message: 'Already friends.' });
    if (toUser.friendRequests.includes(userId)) return res.status(400).json({ message: 'Friend request already sent.' });
    
    // Prevent sending requests to or from blocked users
    if (user.blocked.includes(toUserId) || toUser.blocked.includes(userId)) {
      return res.status(403).json({ message: 'Cannot send friend request to or from a blocked user.' });
    }
    
    // Add to friendRequests array
    toUser.friendRequests.push(userId);
    await toUser.save();
    
    // Create notification
    await Notification.create({
      user: toUserId,
      type: 'friend_request',
      content: `${user.username} sent you a friend request.`,
      fromUserId: userId // Add the sender's ID to the notification
    });
    
    // إرسال إشعار socket للطرف الآخر إذا كان متصلًا
    try {
      const { io, userSockets } = require('../server');
      if (userSockets[toUserId]) {
        io.to(userSockets[toUserId]).emit('friendRequest', {
          from: user.username,
          fromId: userId,
          content: `${user.username} أرسل لك طلب صداقة`
        });
      }
    } catch (err) { console.error('Socket emit error:', err); }
    
    res.json({ message: 'Friend request sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.respondToFriendRequest = async (req, res) => {
  try {
    const { userId } = req.user;
    const { notificationId, accept } = req.body;
    console.log('Responding to friend request:', { userId, notificationId, accept });
    
    // Find the notification
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    
    // Verify this is a friend request notification for the current user
    if (notification.type !== 'friend_request' || notification.user.toString() !== userId) {
      return res.status(400).json({ message: 'Invalid friend request.' });
    }
    
    // Extract sender's ID from the notification content
    const content = notification.content;
    const senderName = content.split(' sent')[0];
    const sender = await User.findOne({ username: senderName });
    
    if (!sender) {
      return res.status(404).json({ message: 'Sender not found.' });
    }
    
    // Mark notification as read
    notification.isRead = true;
    await notification.save();
    
    // Remove the friend request from the user's friendRequests array
    const user = await User.findById(userId);
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== sender._id.toString());
    await user.save();
    
    if (accept) {
      // Add each user to the other's friends list
      const user = await User.findById(userId);
      user.friends.push(sender._id);
      sender.friends.push(userId);
      await sender.save();
      await user.save();
      
      // Create acceptance notification
      await Notification.create({
        user: sender._id,
        type: 'system',
        content: `${user.username} accepted your friend request.`
      });
      
      // Real-time socket notification
      try {
        const { io, userSockets } = require('../server');
        if (userSockets[sender._id]) {
          io.to(userSockets[sender._id]).emit('friendAccepted', {
            from: user.username,
            content: `Your friend request was accepted by ${user.username}`
          });
        }
      } catch (err) { console.error('Socket emit error (accept friend):', err); }
    }
    
    res.json({ message: accept ? 'Friend request accepted.' : 'Friend request declined.' });
  } catch (err) {
    console.error('Error in respondToFriendRequest:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId).populate('friends', 'username email avatar');
    res.json({ friends: user.friends });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { userIdToBlock } = req.body;
    if (userId === userIdToBlock) return res.status(400).json({ message: 'You cannot block yourself.' });

    const user = await User.findById(userId);
    const toBlock = await User.findById(userIdToBlock);
    if (!toBlock) return res.status(404).json({ message: 'User not found.' });
    if (user.blocked.includes(userIdToBlock)) return res.status(400).json({ message: 'User already blocked.' });

    // أضف للحظر
    user.blocked.push(userIdToBlock);

    // احذف كل طرف من أصدقاء الآخر
    user.friends = user.friends.filter(id => id.toString() !== userIdToBlock);
    toBlock.friends = toBlock.friends.filter(id => id.toString() !== userId);

    // احذف أي طلب صداقة بين الطرفين
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== userIdToBlock);
    toBlock.friendRequests = toBlock.friendRequests.filter(id => id.toString() !== userId);

    await user.save();
    await toBlock.save();

    res.json({ message: 'User blocked and friendship removed from both sides.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const user = await User.findById(userId).populate('blocked', 'name username avatar email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ blocked: user.blocked });
  } catch (err) {
    console.error('Error fetching blocked users:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { userIdToUnblock } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.blocked = user.blocked.filter(id => id.toString() !== userIdToUnblock);
    await user.save();
    res.json({ message: 'User unblocked.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}; 