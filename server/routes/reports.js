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

module.exports = router;
