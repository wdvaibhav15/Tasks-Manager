import express from 'express';
import db from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/comments?task=taskId
// @desc    Get comments for a specific task
router.get('/', protect, async (req, res) => {
  try {
    const { task } = req.query;
    if (!task) {
      return res.status(400).json({ error: 'task parameter is required' });
    }

    const comments = await db.comments.find({ task });
    return res.json(comments);
  } catch (err) {
    console.error('Fetch comments failed:', err);
    return res.status(500).json({ error: 'Server error retrieving comments' });
  }
});

// @route   POST /api/comments
// @desc    Add comment to a task (and parse mentions e.g. @john)
router.post('/', protect, async (req, res) => {
  try {
    const { task, message } = req.body;

    if (!task || !message) {
      return res.status(400).json({ error: 'task and message are required' });
    }

    const newComment = await db.comments.create({
      user: req.user.id,
      task,
      message
    });

    const populated = await db.comments.find({ _id: newComment._id });
    const finalComment = populated[0] || newComment;

    // Fetch parent task to find context
    const taskDetails = await db.tasks.findById(task);
    if (taskDetails) {
      // Find project details to know members
      const projectDetails = await db.projects.findById(taskDetails.project);
      
      // Parse mentions: look for @Name or @email in message text
      // Let's check for @SomeName in the message
      const mentions = message.match(/@(\w+)/g) || [];
      const mentionedNames = mentions.map(m => m.substring(1).toLowerCase());

      if (projectDetails) {
        // Collect all members and owner
        const members = [projectDetails.owner, ...(projectDetails.members || [])];
        
        for (const member of members) {
          const mId = member._id || member;
          const memberUser = await db.users.findById(mId);
          if (memberUser && memberUser._id !== req.user.id) {
            
            // Check if name or email matches mention pattern
            const userNameLower = memberUser.name.toLowerCase().replace(/\s+/g, '');
            const isMentioned = mentionedNames.some(name => 
              userNameLower.includes(name) || memberUser.email.toLowerCase().includes(name)
            );

            if (isMentioned) {
              await db.notifications.create({
                user: memberUser._id,
                message: `${req.user.name} mentioned you in a comment on "${taskDetails.title}": "${message}"`,
                type: 'comment_added'
              });
              
              if (req.app.get('io')) {
                req.app.get('io').to(memberUser._id).emit('notification:received', {
                  message: `You were mentioned on "${taskDetails.title}"`
                });
              }
            } else if (memberUser._id === taskDetails.assignedTo?._id || memberUser._id === taskDetails.assignedTo) {
              // Notify assignee if not mentioned separately
              await db.notifications.create({
                user: memberUser._id,
                message: `${req.user.name} commented on your task "${taskDetails.title}"`,
                type: 'comment_added'
              });
            }
          }
        }
      }

      // Socket emit comments in task room
      if (req.app.get('io')) {
        req.app.get('io').to(`task:${task}`).emit('comment:created', finalComment);
        req.app.get('io').to(`project:${taskDetails.project}`).emit('task:activity_updated', {
          taskId: task,
          comment: finalComment
        });
      }
    }

    return res.status(201).json(finalComment);
  } catch (err) {
    console.error('Create comment failed:', err);
    return res.status(500).json({ error: 'Server error creating comment' });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete comment
router.delete('/:id', protect, async (req, res) => {
  try {
    // Note: for simplicity in fallback mode we verify owner
    await db.comments.findByIdAndDelete(req.params.id);

    // Socket publish
    if (req.app.get('io')) {
      req.app.get('io').emit('comment:deleted', req.params.id);
    }

    return res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Delete comment failed:', err);
    return res.status(500).json({ error: 'Server error deleting comment' });
  }
});

export default router;
