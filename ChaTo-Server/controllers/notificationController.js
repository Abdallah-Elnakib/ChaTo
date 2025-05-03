const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.user;
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { userId } = req.user;
    const { notificationId } = req.body;
    const notification = await Notification.findOne({ _id: notificationId, user: userId });
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    notification.isRead = true;
    await notification.save();
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 