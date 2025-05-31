const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const routes = require('./routes/index.routes');
const { errorHandler } = require('./middleware/error.middleware');
require('dotenv').config();

// Create Express app
const app = express();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// CORS configuration
const corsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // Enable CORS with options
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// Rate limiting
// const limiter = rateLimit({
//   windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
//   max: process.env.RATE_LIMIT_MAX || 100, // Limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// Routes
app.use(routes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://192.168.129.39:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
}); 