const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Report = require('../models/Report');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'reports');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `report-${uniqueSuffix}${extension}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  },
});

// Helper function to validate required fields
const validateReportData = (data) => {
  const errors = [];

  if (!data.title || data.title.trim() === '') {
    errors.push('Title is required');
  }

  if (!data.description || data.description.trim() === '') {
    errors.push('Description is required');
  }

  if (!data.category) {
    errors.push('Category is required');
  }

  if (!data.address || data.address.trim() === '') {
    errors.push('Address is required');
  }

  return errors;
};

// Helper function to validate location
const validateLocation = (location) => {
  if (!location) {
    return ['Location is required'];
  }

  if (typeof location === 'string') {
    try {
      location = JSON.parse(location);
    } catch (error) {
      return ['Invalid location format'];
    }
  }

  if (
    !location.coordinates ||
    !Array.isArray(location.coordinates) ||
    location.coordinates.length !== 2
  ) {
    return ['Valid coordinates are required'];
  }

  const [lng, lat] = location.coordinates;
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return ['Coordinates must be numbers'];
  }

  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return ['Coordinates are out of valid range'];
  }

  return [];
};

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
      .populate('comments.user', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new report
router.post('/', auth, upload.array('media', 5), async (req, res) => {
  try {
    const { title, description, category, address, urgency } = req.body;
    let { location } = req.body;

    // Validate basic fields
    const fieldErrors = validateReportData({
      title,
      description,
      category,
      address,
    });
    if (fieldErrors.length > 0) {
      // Clean up uploaded files if validation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        });
      }

      return res.status(400).json({
        message: `Report validation failed: ${fieldErrors.join(', ')}`,
        errors: fieldErrors.reduce((acc, error) => {
          const [field] = error.split(' is required');
          acc[field.toLowerCase()] = error;
          return acc;
        }, {}),
      });
    }

    // Validate location
    const locationErrors = validateLocation(location);
    if (locationErrors.length > 0) {
      // Clean up uploaded files if validation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        });
      }

      return res.status(400).json({
        message: `Report validation failed: ${locationErrors.join(', ')}`,
        errors: { 'location.coordinates': locationErrors[0] },
      });
    }

    // Parse location if it's a string
    if (typeof location === 'string') {
      location = JSON.parse(location);
    }

    // Process uploaded files - store as URLs (your current model expects strings)
    const mediaUrls = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        // Create URL path that matches your static file serving
        const fileUrl = `/uploads/reports/${file.filename}`;
        mediaUrls.push(fileUrl);
      });
    }

    // Create the report
    const report = new Report({
      title: title.trim(),
      description: description.trim(),
      category,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
      },
      address: address.trim(),
      media: mediaUrls, // Array of URL strings as per your model
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

    // Clean up uploaded files if there was an error
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

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

// Self-assign report - NEW ENDPOINT for technicians
router.patch('/:id/assign', auth, async (req, res) => {
  try {
    const { technicianId } = req.body;
    const allowedRoles = ['admin', 'technician'];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message:
          'Access denied. Only technicians and admins can assign reports.',
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Only allow assignment of verified reports
    if (report.status !== 'verified') {
      return res.status(400).json({
        message: 'Only verified reports can be assigned to technicians',
      });
    }

    // Check if already assigned
    if (report.assignedTo) {
      return res.status(400).json({
        message: 'Report is already assigned to a technician',
      });
    }

    // For self-assignment, use the requesting user's ID
    const assigneeId = technicianId || req.user.userId;

    // Verify the assignee is a technician
    const assignee = await User.findById(assigneeId);
    if (!assignee || !['technician', 'admin'].includes(assignee.role)) {
      return res.status(400).json({
        message: 'Can only assign to technicians or admins',
      });
    }

    // Update report assignment
    report.assignedTo = assigneeId;
    await report.save();

    // Populate and return updated report
    await report.populate('reportedBy assignedTo verifiedBy', 'name email');

    res.json({
      message: 'Report assigned successfully',
      report,
    });
  } catch (error) {
    console.error('Assign report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify report - Only admin and verifier can verify
router.patch('/:id/verify', auth, async (req, res) => {
  try {
    const allowedRoles = ['admin', 'verifier'];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message:
          'Access denied. Only admin and verifier roles can verify reports.',
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if report is already verified
    if (report.status === 'verified') {
      return res.status(400).json({
        message: 'Report is already verified',
      });
    }

    // Only allow verification of pending reports
    if (report.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending reports can be verified',
      });
    }

    // Update report to verified status
    report.status = 'verified';
    report.verifiedBy = req.user.userId;

    await report.save();
    await report.populate('reportedBy assignedTo verifiedBy', 'name email');

    // Award points to the reporter for verified report
    await User.findByIdAndUpdate(report.reportedBy, { $inc: { points: 5 } });

    res.json({
      message: 'Report verified successfully',
      report,
    });
  } catch (error) {
    console.error('Verify report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject report verification - Only admin and verifier can reject
router.patch('/:id/reject', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const allowedRoles = ['admin', 'verifier'];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message:
          'Access denied. Only admin and verifier roles can reject reports.',
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Only allow rejection of pending reports
    if (report.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending reports can be rejected',
      });
    }

    // Update report to rejected status
    report.status = 'rejected';
    report.verifiedBy = req.user.userId;

    // Add rejection reason as a comment
    if (reason && reason.trim()) {
      report.comments.push({
        user: req.user.userId,
        text: `Report rejected. Reason: ${reason.trim()}`,
      });
    }

    await report.save();
    await report.populate(
      'reportedBy assignedTo verifiedBy comments.user',
      'name email'
    );

    res.json({
      message: 'Report rejected successfully',
      report,
    });
  } catch (error) {
    console.error('Reject report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update report status - Modified to prevent verification through this endpoint
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, assignedTo, estimatedResolution } = req.body;
    const allowedRoles = ['admin', 'technician'];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Prevent verification through this endpoint
    if (status === 'verified') {
      return res.status(400).json({
        message:
          'Use the /verify endpoint to verify reports. Only admin and verifier roles can verify reports.',
      });
    }

    // Prevent rejection through this endpoint
    if (status === 'rejected') {
      return res.status(400).json({
        message:
          'Use the /reject endpoint to reject reports. Only admin and verifier roles can reject reports.',
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Only allow status updates on verified reports (except for admin who can update any)
    if (
      req.user.role !== 'admin' &&
      report.status !== 'verified' &&
      report.status !== 'in_progress'
    ) {
      return res.status(400).json({
        message: 'Reports must be verified before status can be updated',
      });
    }

    // For technicians, ensure they can only update reports assigned to them
    if (
      req.user.role === 'technician' &&
      report.assignedTo &&
      report.assignedTo.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        message: 'You can only update reports assigned to you',
      });
    }

    const updateData = { status };
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (estimatedResolution)
      updateData.estimatedResolution = estimatedResolution;
    if (status === 'resolved') updateData.resolvedAt = new Date();

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('reportedBy assignedTo verifiedBy comments.user', 'name email');

    // Award points to technician for completing work
    if (status === 'resolved' && report.assignedTo) {
      await User.findByIdAndUpdate(report.assignedTo, { $inc: { points: 15 } });
    }

    res.json(updatedReport);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: error.message,
        errors: error.errors,
      });
    }
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
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: error.message,
        errors: error.errors,
      });
    }
    console.error('Upvote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to report
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.comments.push({
      user: req.user.userId,
      text: text.trim(),
    });

    await report.save();
    await report.populate('comments.user', 'name email');

    res.json(report.comments[report.comments.length - 1]);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: error.message,
        errors: error.errors,
      });
    }
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reports assigned to current technician
router.get('/technician/assigned', auth, async (req, res) => {
  try {
    if (!['technician', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. Only technicians can access this endpoint.',
      });
    }

    const reports = await Report.find({ assignedTo: req.user.userId })
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('verifiedBy', 'name email')
      .populate('comments.user', 'name email')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Get assigned reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available reports for assignment
router.get('/technician/available', auth, async (req, res) => {
  try {
    if (!['technician', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. Only technicians can access this endpoint.',
      });
    }

    const reports = await Report.find({
      status: 'verified',
      assignedTo: { $exists: false },
    })
      .populate('reportedBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ urgency: 1, createdAt: -1 }); // Sort by urgency first, then by date

    res.json(reports);
  } catch (error) {
    console.error('Get available reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
