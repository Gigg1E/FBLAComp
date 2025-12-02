const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getOne } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;
const SESSION_DURATION_DAYS = 7;

// Signup endpoint
router.post('/signup', async (req, res) => {
    try {
        const { email, username, password, role } = req.body;

        // Validate input
        if (!email || !username || !password) {
            return res.status(400).json({ error: 'Email, username, and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Validate role
        const userRole = role || 'user';
        if (!['user', 'business_owner'].includes(userRole)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Check if email already exists
        const existingEmail = await getOne('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Check if username already exists
        const existingUsername = await getOne('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsername) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert user
        const result = await runQuery(
            'INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)',
            [email, username, passwordHash, userRole]
        );

        const userId = result.id;

        // Create session
        const sessionId = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

        await runQuery(
            'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
            [sessionId, userId, expiresAt.toISOString()]
        );

        // Set session cookie
        res.cookie('session_id', sessionId, {
            httpOnly: true,
            maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        });

        // Return user data
        res.status(201).json({
            user: {
                id: userId,
                email,
                username,
                role: userRole
            }
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create session
        const sessionId = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

        await runQuery(
            'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
            [sessionId, user.id, expiresAt.toISOString()]
        );

        // Set session cookie
        res.cookie('session_id', sessionId, {
            httpOnly: true,
            maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        });

        // Return user data
        res.json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Logout endpoint
router.post('/logout', requireAuth, async (req, res) => {
    try {
        const sessionId = req.cookies.session_id;

        // Delete session from database
        await runQuery('DELETE FROM sessions WHERE id = ?', [sessionId]);

        // Clear cookie
        res.clearCookie('session_id');

        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

// Get current user endpoint
router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
