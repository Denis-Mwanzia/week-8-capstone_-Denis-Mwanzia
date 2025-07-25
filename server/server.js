const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'reports');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads/reports directory');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');

// Routes - Make sure these are registered correctly
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Tuko Maji API is running!' });
});

// Test route to verify auth routes are loaded
app.get('/api/test-routes', (req, res) => {
  res.json({
    message: 'Routes loaded',
    availableRoutes: [
      'GET /api/auth/profile',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'PUT /api/auth/profile',
      'PUT /api/auth/change-password',
      'POST /api/auth/logout',
      'GET /api/auth/verify-token',
    ],
  });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res
      .status(400)
      .json({ message: 'File too large. Maximum size is 10MB.' });
  }
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res
      .status(400)
      .json({ message: 'Too many files. Maximum is 5 files.' });
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'Unexpected file field.' });
  }

  // File type errors
  if (error.message === 'Only image and video files are allowed') {
    return res.status(400).json({ message: error.message });
  }

  // Default error
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler - should be after all routes
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/auth/profile',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/health',
    ],
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `Uploads will be served from: ${path.join(__dirname, 'uploads')}`
  );
  console.log('Available routes:');
  console.log('  GET /api/auth/profile');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/register');
  console.log('  GET /api/health');
});
