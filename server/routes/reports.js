const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all reports
router.get('/', async (req, res) => {
  try {
    const { status, category, urgency, limit = 50 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (urgency) filter.urgency = urgency;

    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new report
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, location, address, media, urgency } =
      req.body;

    const report = new Report({
      title,
      description,
      category,
      location,
      address,
      media: media || [],
      urgency: urgency || 'medium',
      reportedBy: req.user.userId,
    });

    await report.save();

    // Populate user data
    await report.populate('reportedBy', 'name email');

    // Award points to user
    await User.findByIdAndUpdate(req.user.userId, { $inc: { points: 10 } });

    res.status(201).json(report);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single report
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('verifiedBy', 'name email')
      .populate('comments.user', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update report status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, assignedTo, estimatedResolution } = req.body;
    const allowedRoles = ['admin', 'technician'];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = { status };
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (estimatedResolution)
      updateData.estimatedResolution = estimatedResolution;
    if (status === 'resolved') updateData.resolvedAt = new Date();

    const report = await Report.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).populate('reportedBy assignedTo verifiedBy', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upvote report
router.patch('/:id/upvote', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const userId = req.user.userId;
    const hasUpvoted = report.upvotes.includes(userId);

    if (hasUpvoted) {
      // Remove upvote
      report.upvotes = report.upvotes.filter((id) => id.toString() !== userId);
    } else {
      // Add upvote
      report.upvotes.push(userId);
      // Award points to reporter
      await User.findByIdAndUpdate(report.reportedBy, { $inc: { points: 1 } });
    }

    await report.save();
    res.json({ upvotes: report.upvotes.length, hasUpvoted: !hasUpvoted });
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to report
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.comments.push({
      user: req.user.userId,
      text,
    });

    await report.save();
    await report.populate('comments.user', 'name email');

    res.json(report.comments[report.comments.length - 1]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
