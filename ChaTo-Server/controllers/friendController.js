const User = require('../models/User');
const Notification = require('../models/Notification');

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Query is required.' });
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      isEmailVerified: true
    }).select('username email avatar');
    res.json({ users });
  } catch (err) {
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
    toUser.friendRequests.push(userId);
    await toUser.save();
    // Create notification
    await Notification.create({
      user: toUserId,
      type: 'friend_request',
      content: `${user.username} sent you a friend request.`
    });
    res.json({ message: 'Friend request sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.respondToFriendRequest = async (req, res) => {
  try {
    const { userId } = req.user;
    const { fromUserId, accept } = req.body;
    const user = await User.findById(userId);
    const fromUser = await User.findById(fromUserId);
    if (!fromUser) return res.status(404).json({ message: 'User not found.' });
    if (!user.friendRequests.includes(fromUserId)) return res.status(400).json({ message: 'No friend request from this user.' });
    // Remove request
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== fromUserId);
    if (accept) {
      user.friends.push(fromUserId);
      fromUser.friends.push(userId);
      await fromUser.save();
      // Notification
      await Notification.create({
        user: fromUserId,
        type: 'system',
        content: `${user.username} accepted your friend request.`
      });
    }
    await user.save();
    res.json({ message: accept ? 'Friend request accepted.' : 'Friend request declined.' });
  } catch (err) {
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
    user.blocked.push(userIdToBlock);
    // Remove from friends if present
    user.friends = user.friends.filter(id => id.toString() !== userIdToBlock);
    // Remove from friendRequests if present
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== userIdToBlock);
    await user.save();
    res.json({ message: 'User blocked.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 