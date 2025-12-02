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
const { execFileSync } = require('child_process');

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
    // Return JSON for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Not found' });
    }
    // Return HTML for other routes
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// ====================
// Error Handler
// ====================
app.use((err, req, res, next) => {
    // Handle Multer errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large (max 10 MB)' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }

    // Handle file type errors
    if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message });
    }

    // Handle image processing errors
    if (err.message && err.message.includes('Failed to process image')) {
        return res.status(500).json({ error: 'Failed to process image. Please try a different file.' });
    }

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
        // Run any lightweight migrations (add missing columns) synchronously
        try {
            const migPath = path.join(__dirname, 'scripts', 'add-products-column.js');
            execFileSync('node', [migPath], { stdio: 'inherit' });
            console.log('Migrations ran successfully');
        } catch (err) {
            console.error('Migration script error (non-fatal):', err.message || err);
        }
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
