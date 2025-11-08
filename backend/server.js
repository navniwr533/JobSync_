// JobSync Backend Server
// Built by Prince Barnwal - Backend Developer
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8000',
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'JobSync API Server',
        version: '1.0.0',
        status: 'Running',
        team: {
            'Backend Developer': 'Prince Barnwal',
            'AI Integration': 'Navneet Panwar',
            'Frontend Developer': 'Praful kr. Singh',
            'Database & Integration': 'Preet Verma'
        }
    });
});

// API Routes (to be implemented)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/analytics', require('./routes/analytics'));

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: 'The requested endpoint does not exist'
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`
🚀 JobSync Backend Server Started!
📍 Server running on port ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
👥 Built by: Prince Barnwal & JobSync Team
    `);
});

module.exports = app;