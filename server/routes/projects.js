import express from 'express';
import db from '../config/db.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/projects
// @desc    Get all projects for current user
router.get('/', protect, async (req, res) => {
  try {
    const allProjects = await db.projects.find();

    // If Admin, they can see/manage all projects
    if (req.user.role === 'Admin') {
      return res.json(allProjects);
    }

    // Members see projects they own or are members of
    const userProjects = allProjects.filter(project => {
      const isOwner = project.owner?._id === req.user.id || project.owner === req.user.id;
      const isMember = (project.members || []).some(m => m._id === req.user.id || m === req.user.id);
      return isOwner || isMember;
    });

    return res.json(userProjects);
  } catch (err) {
    console.error('Fetch projects failed:', err);
    return res.status(500).json({ error: 'Server error retrieving projects' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project details
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await db.projects.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Role check
    if (req.user.role !== 'Admin') {
      const isOwner = project.owner?._id === req.user.id || project.owner === req.user.id;
      const isMember = (project.members || []).some(m => m._id === req.user.id || m === req.user.id);
      if (!isOwner && !isMember) {
        return res.status(403).json({ error: 'Feedback forbidden: You are not authorized to view this project' });
      }
    }

    return res.json(project);
  } catch (err) {
    console.error('Get single project failed:', err);
    return res.status(500).json({ error: 'Server error retrieving project details' });
  }
});

// @route   POST /api/projects
// @desc    Create a project (Only Admin can create projects as per USER ROLES configuration)
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { title, description, dueDate, members } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Project Title is required' });
    }

    // Parse member IDs
    const memberIds = Array.isArray(members) ? members : [];

    const newProject = await db.projects.create({
      title,
      description: description || '',
      owner: req.user.id,
      members: memberIds,
      dueDate: dueDate || '',
      status: 'active'
    });

    // Notify all members that they have been added to a new project
    for (const mId of memberIds) {
      await db.notifications.create({
        user: mId,
        message: `You have been added to the project: "${title}"`,
        type: 'project_invite'
      });
    }

    // Also fetch populated project to return
    const populated = await db.projects.findById(newProject._id);

    // Socket.io emit will be invoked in server.ts
    if (req.app.get('io')) {
      req.app.get('io').emit('project:created', populated);
    }

    return res.status(201).json(populated);
  } catch (err) {
    console.error('Create project failed:', err);
    return res.status(500).json({ error: 'Server error creating project' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project parameters
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, dueDate, status, members } = req.body;
    let project = await db.projects.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Permissions check (Admin or Owner only)
    const isOwner = project.owner?._id === req.user.id || project.owner === req.user.id;
    if (req.user.role !== 'Admin' && !isOwner) {
      return res.status(403).json({ error: 'Only owners or admins can modify projects' });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (status) updates.status = status;
    if (Array.isArray(members)) updates.members = members;

    const updated = await db.projects.findByIdAndUpdate(req.params.id, updates);

    // Socket publish
    if (req.app.get('io')) {
      req.app.get('io').to(`project:${req.params.id}`).emit('project:updated', updated);
      req.app.get('io').emit('project:updated_globally', updated);
    }

    return res.json(updated);
  } catch (err) {
    console.error('Update project failed:', err);
    return res.status(500).json({ error: 'Server error updating project' });
  }
});

// @route   POST /api/projects/invite
// @desc    Add member to project
router.post('/invite', protect, async (req, res) => {
  try {
    const { projectId, userId } = req.body;

    if (!projectId || !userId) {
      return res.status(400).json({ error: 'projectId and userId are required' });
    }

    const project = await db.projects.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Role check (Admin or Project Owner)
    const isOwner = project.owner?._id === req.user.id || project.owner === req.user.id;
    if (req.user.role !== 'Admin' && !isOwner) {
      return res.status(403).json({ error: 'Only project owners or admins can invite members' });
    }

    // Check if already a member
    const currentMembers = project.members.map(m => m._id?.toString() || m.toString());
    if (currentMembers.includes(userId)) {
      return res.status(400).json({ error: 'User is already a project member' });
    }

    const updated = await db.projects.findByIdAndUpdate(projectId, {
      $push: { members: userId }
    });

    // Create Notification
    await db.notifications.create({
      user: userId,
      message: `You have been added to the project: "${project.title}" by ${req.user.name}`,
      type: 'project_invite'
    });

    if (req.app.get('io')) {
      req.app.get('io').to(`project:${projectId}`).emit('project:updated', updated);
      req.app.get('io').to(userId).emit('notification:received', {
        message: `You have been added to project "${project.title}"`
      });
    }

    return res.json(updated);
  } catch (err) {
    console.error('Invite member failed:', err);
    return res.status(500).json({ error: 'Server error inviting member' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project (Only Admin can delete projects)
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const project = await db.projects.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await db.projects.findByIdAndDelete(req.params.id);

    if (req.app.get('io')) {
      req.app.get('io').emit('project:deleted', req.params.id);
    }

    return res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project failed:', err);
    return res.status(500).json({ error: 'Server error deleting project' });
  }
});

export default router;
