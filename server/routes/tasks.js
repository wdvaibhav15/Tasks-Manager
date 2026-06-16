import express from 'express';
import db from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get tasks with optional filters (project, priority, status, assignedTo, search)
router.get('/', protect, async (req, res) => {
  try {
    const { project, priority, status, assignedTo, search } = req.query;

    if (!project) {
      return res.status(400).json({ error: 'project ID parameter is required' });
    }

    const filter = { project };

    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    let tasks = await db.tasks.find(filter);

    // Apply client-side text search if query is specified
    if (search) {
      const s = search.toLowerCase();
      tasks = tasks.filter(t => 
        (t.title && t.title.toLowerCase().includes(s)) ||
        (t.description && t.description.toLowerCase().includes(s))
      );
    }

    return res.json(tasks);
  } catch (err) {
    console.error('Fetch tasks failed:', err);
    return res.status(500).json({ error: 'Server error retrieving tasks' });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task information
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await db.tasks.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.json(task);
  } catch (err) {
    console.error('Fetch task details failed:', err);
    return res.status(500).json({ error: 'Server error retrieving task details' });
  }
});

// @route   POST /api/tasks
// @desc    Create a task (Members & Admin can create tasks in their assigned projects)
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, project, priority, status, dueDate, assignedTo, attachments } = req.body;

    if (!title || !project) {
      return res.status(400).json({ error: 'title and project are required fields' });
    }

    const parsedAttachments = Array.isArray(attachments) ? attachments : [];

    const newTask = await db.tasks.create({
      title,
      description: description || '',
      project,
      priority: priority || 'Medium',
      status: status || 'To Do',
      dueDate: dueDate || '',
      assignedTo: assignedTo || null,
      attachments: parsedAttachments
    });

    const populatedTask = await db.tasks.findById(newTask._id);

    // Notify assigned user
    if (assignedTo && assignedTo !== req.user.id) {
      await db.notifications.create({
        user: assignedTo,
        message: `Task assigned to you: "${title}"`,
        type: 'task_assigned'
      });
    }

    // Socket.io emit
    if (req.app.get('io')) {
      req.app.get('io').to(`project:${project}`).emit('task:created', populatedTask);
      if (assignedTo) {
        req.app.get('io').to(assignedTo).emit('notification:received', {
          message: `You were assigned a new task: "${title}"`
        });
      }
    }

    return res.status(201).json(populatedTask);
  } catch (err) {
    console.error('Create task failed:', err);
    return res.status(500).json({ error: 'Server error creating task' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task details (including title, description, priority, status, assignedTo, attachments)
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, priority, status, dueDate, assignedTo, attachments } = req.body;
    let task = await db.tasks.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (attachments !== undefined) updates.attachments = attachments;

    const originalStatus = task.status;
    const originalAssigned = task.assignedTo?._id || task.assignedTo;

    const updatedTask = await db.tasks.findByIdAndUpdate(req.params.id, updates);

    // If status changed, let's create dynamic activity timeline or notify members
    if (status && status !== originalStatus) {
      // Find project details to know members
      const projectObj = await db.projects.findById(task.project);
      if (projectObj) {
        const notifyMembers = [projectObj.owner?._id || projectObj.owner, ...(projectObj.members || []).map(m => m._id || m)].filter(id => id !== req.user.id);
        
        for (const mId of notifyMembers) {
          await db.notifications.create({
            user: mId,
            message: `Task "${updatedTask.title}" status updated from "${originalStatus}" to "${status}" by ${req.user.name}`,
            type: 'task_updated'
          });
        }
      }
    }

    // If reassigned, notify new assignee
    const newAssigned = updatedTask.assignedTo?._id || updatedTask.assignedTo;
    if (newAssigned && newAssigned !== originalAssigned && newAssigned !== req.user.id) {
      await db.notifications.create({
        user: newAssigned,
        message: `Task re-assigned to you: "${updatedTask.title}"`,
        type: 'task_assigned'
      });
    }

    // Socket publish
    if (req.app.get('io')) {
      req.app.get('io').to(`project:${task.project}`).emit('task:updated', updatedTask);
    }

    return res.json(updatedTask);
  } catch (err) {
    console.error('Update task failed:', err);
    return res.status(500).json({ error: 'Server error updating task' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task (Admins or Project owners/assigned users can delete tasks)
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await db.tasks.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await db.tasks.findByIdAndDelete(req.params.id);

    // Socket publish
    if (req.app.get('io')) {
      req.app.get('io').to(`project:${task.project}`).emit('task:deleted', req.params.id);
    }

    return res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task failed:', err);
    return res.status(500).json({ error: 'Server error deleting task' });
  }
});

export default router;
