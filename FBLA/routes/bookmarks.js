const express = require('express');
const { getAll, getOne, runQuery } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get current user's bookmarked businesses
router.get('/my/bookmarks', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const bookmarks = await getAll(`
            SELECT
                b.*,
                bm.created_at as bookmarked_at,
                COALESCE(AVG(r.rating), 0) as average_rating,
                COUNT(DISTINCT r.id) as review_count
            FROM bookmarks bm
            JOIN businesses b ON bm.business_id = b.id
            LEFT JOIN reviews r ON b.id = r.business_id
            WHERE bm.user_id = ?
            GROUP BY b.id, bm.created_at
            ORDER BY bm.created_at DESC
        `, [userId]);

        res.json({ bookmarks });
    } catch (err) {
        console.error('Error fetching bookmarks:', err);
        res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
});

// Check if current user has bookmarked a specific business
router.get('/check/:businessId', requireAuth, async (req, res) => {
    try {
        const { businessId } = req.params;
        const userId = req.user.id;

        const bookmark = await getOne(
            'SELECT id FROM bookmarks WHERE business_id = ? AND user_id = ?',
            [businessId, userId]
        );

        res.json({ bookmarked: !!bookmark });
    } catch (err) {
        console.error('Error checking bookmark:', err);
        res.status(500).json({ error: 'Failed to check bookmark status' });
    }
});

// Add a bookmark
router.post('/', requireAuth, async (req, res) => {
    try {
        const { businessId } = req.body;
        const userId = req.user.id;

        if (!businessId) {
            return res.status(400).json({ error: 'Business ID is required' });
        }

        // Check if business exists
        const business = await getOne('SELECT id FROM businesses WHERE id = ?', [businessId]);
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Check if already bookmarked
        const existing = await getOne(
            'SELECT id FROM bookmarks WHERE business_id = ? AND user_id = ?',
            [businessId, userId]
        );

        if (existing) {
            return res.status(400).json({ error: 'Business already bookmarked' });
        }

        // Insert bookmark
        await runQuery(
            'INSERT INTO bookmarks (business_id, user_id) VALUES (?, ?)',
            [businessId, userId]
        );

        res.status(201).json({ message: 'Bookmark added successfully', bookmarked: true });
    } catch (err) {
        console.error('Error adding bookmark:', err);
        res.status(500).json({ error: 'Failed to add bookmark' });
    }
});

// Remove a bookmark
router.delete('/:businessId', requireAuth, async (req, res) => {
    try {
        const { businessId } = req.params;
        const userId = req.user.id;

        // Check if bookmark exists
        const bookmark = await getOne(
            'SELECT id FROM bookmarks WHERE business_id = ? AND user_id = ?',
            [businessId, userId]
        );

        if (!bookmark) {
            return res.status(404).json({ error: 'Bookmark not found' });
        }

        // Delete bookmark
        await runQuery(
            'DELETE FROM bookmarks WHERE business_id = ? AND user_id = ?',
            [businessId, userId]
        );

        res.json({ message: 'Bookmark removed successfully', bookmarked: false });
    } catch (err) {
        console.error('Error removing bookmark:', err);
        res.status(500).json({ error: 'Failed to remove bookmark' });
    }
});

module.exports = router;
