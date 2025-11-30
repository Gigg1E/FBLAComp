// ===============================================
// server.js
// Main server entry for Local Business Reviews
// ===============================================

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import database functions
// Make sure this path is correct: server.js and config/ are in the same folder
const { initializeDatabase, cleanupExpiredSessions } = require('./config/database');

// Import route modules
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/businesses');
const reviewRoutes = require('./routes/reviews');
const dealRoutes = require('./routes/deals');

const app = express();
const PORT = process.env.PORT || 3000;

// ====================
// Middleware
// ====================

// Parse JSON bodies
app.use(bodyParser.json());

// Parse URL-encoded bodies (form submissions)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Serve static files (CSS, JS, images) from "public"
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML pages from "views"
app.use(express.static(path.join(__dirname, 'views')));

// ====================
// Routes
// ====================

// Auth routes (login, register)
app.use('/api/auth', authRoutes);

// Business routes (CRUD, search, filters)
app.use('/api/businesses', businessRoutes);

// Review routes
app.use('/api/reviews', reviewRoutes);

// Deal routes
app.use('/api/deals', dealRoutes);

// Root route - serve homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// ====================
// 404 Handler
// ====================
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// ====================
// Error Handler
// ====================
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ====================
// Start Server
// ====================
async function startServer() {
    try {
        // Initialize database tables if not exist
        await initializeDatabase();
        console.log('Database initialized');

        // Clean up expired sessions on startup
        await cleanupExpiredSessions();

        // Periodically clean expired sessions every hour
        setInterval(async () => {
            await cleanupExpiredSessions();
        }, 60 * 60 * 1000); // 1 hour

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

// Run the server
startServer();
