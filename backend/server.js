const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Route imports
const userRoutes = require('./src/routes/userRoutes');
const mealRoutes = require('./src/routes/mealRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const aiRoutes = require('./src/routes/aiRoutes');

// Route mounting
app.use('/api/users', userRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/users', dashboardRoutes);
app.use('/api/users', reportRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'WellMemory API is running...'
  });
});

// 404 fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'Something went wrong.'
  });
});

app.listen(PORT, () => {
  console.log('-------------------------------------------');
  console.log(`WellMemory backend running on http://localhost:${PORT}`);
  console.log('Routes ready:');
  console.log('- GET  /');
  console.log('- POST /api/users');
  console.log('- GET  /api/users/:userId');
  console.log('- PUT  /api/users/:userId');
  console.log('- POST /api/meals');
  console.log('- GET  /api/users/:userId/meals');
  console.log('- GET  /api/users/:userId/daily-summary');
  console.log('- GET  /api/users/:userId/workout-suggestions');
  console.log('- GET  /api/users/:userId/daily-nutrition');
  console.log('- POST /api/users/:userId/workout-plan/complete');
  console.log('- POST /api/users/:userId/workout-plan/regenerate');
  console.log('- GET  /api/users/:userId/memory');
  console.log('- GET  /api/users/:userId/general-report');
  console.log('- POST /api/ai/chat');
  console.log('- POST /api/ai/analyze-goals');
  console.log('- POST /api/ai/analyze-meal-photo');
  console.log('-------------------------------------------');
});