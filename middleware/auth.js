const { getOne } = require('../config/database');

// Middleware to check if user is authenticated
async function requireAuth(req, res, next) {
    try {
        const sessionId = req.cookies.session_id;

        if (!sessionId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Check if session exists and is not expired
        const session = await getOne(
            'SELECT s.*, u.id as user_id, u.email, u.username, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > datetime("now")',
            [sessionId]
        );

        if (!session) {
            return res.status(401).json({ error: 'Session expired or invalid' });
        }

        // Attach user info to request
        req.user = {
            id: session.user_id,
            email: session.email,
            username: session.username,
            role: session.role
        };

        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Authentication error' });
    }
}

// Middleware to check if user has business owner role
async function requireBusinessOwner(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.user.role !== 'business_owner' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Business owner access required' });
    }

    next();
}

// Middleware to check if user has admin role
async function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
}

// Optional auth - attaches user if authenticated but doesn't require it
async function optionalAuth(req, res, next) {
    try {
        const sessionId = req.cookies.session_id;

        if (sessionId) {
            const session = await getOne(
                'SELECT s.*, u.id as user_id, u.email, u.username, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > datetime("now")',
                [sessionId]
            );

            if (session) {
                req.user = {
                    id: session.user_id,
                    email: session.email,
                    username: session.username,
                    role: session.role
                };
            }
        }

        next();
    } catch (err) {
        console.error('Optional auth error:', err);
        next();
    }
}

module.exports = {
    requireAuth,
    requireBusinessOwner,
    requireAdmin,
    optionalAuth
};
