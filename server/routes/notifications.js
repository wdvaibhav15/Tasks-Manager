import express from 'express';
import db from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
router.get('/', protect, async (req, res) => {
  try {
    const list = await db.notifications.find({ user: req.user.id });
    return res.json(list);
  } catch (err) {
    console.error('Fetch notifications failed:', err);
    return res.status(500).json({ error: 'Server error retrieving notifications' });
  }
});

// @route   POST /api/notifications/read
// @desc    Mark all user's notifications as read
router.post('/read', protect, async (req, res) => {
  try {
    const result = await db.notifications.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    return res.json({ message: 'All notifications marked as read', modifiedCount: result.modifiedCount || 0 });
  } catch (err) {
    console.error('Mark all notifications failed:', err);
    return res.status(500).json({ error: 'Server error marking notifications as read' });
  }
});

// @route   PUT /api/notifications/:id
// @desc    Mark single notification as read
router.put('/:id', protect, async (req, res) => {
  try {
    const notification = await db.notifications.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.user !== req.user.id && notification.user?._id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await db.notifications.findByIdAndUpdate(req.params.id, { read: true });
    return res.json(updated);
  } catch (err) {
    console.error('Mark single notification read failed:', err);
    return res.status(500).json({ error: 'Server error marking single notification' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await db.notifications.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.user !== req.user.id && notification.user?._id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.notifications.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('Delete notification failed:', err);
    return res.status(500).json({ error: 'Server error deleting notification' });
  }
});

export default router;
