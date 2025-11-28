const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const { initializeDatabase, cleanupExpiredSessions } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML files from views directory
app.use(express.static(path.join(__dirname, 'views')));

// Import routes
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/businesses');
const reviewRoutes = require('./routes/reviews');
const dealRoutes = require('./routes/deals');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/deals', dealRoutes);

// Root route - serve homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();
        console.log('Database initialized');

        // Clean up expired sessions on startup
        await cleanupExpiredSessions();

        // Set up periodic session cleanup (every hour)
        setInterval(async () => {
            await cleanupExpiredSessions();
        }, 60 * 60 * 1000);

        // Start listening
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log('Press Ctrl+C to stop the server');
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
