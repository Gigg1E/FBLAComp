const express = require('express');
const { getAll, getOne, runQuery } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { generateCaptcha, requireCaptcha } = require('../middleware/captcha');

const router = express.Router();

// Generate captcha for review submission
router.get('/captcha/generate', requireAuth, (req, res) => {
    try {
        const captcha = generateCaptcha();
        res.json(captcha);
    } catch (err) {
        console.error('Error generating captcha:', err);
        res.status(500).json({ error: 'Failed to generate captcha' });
    }
});

// Get reviews for a specific business
router.get('/business/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        const reviews = await getAll(`
            SELECT r.*, u.username
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.business_id = ?
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `, [businessId, limitNum, offset]);

        const countResult = await getOne(
            'SELECT COUNT(*) as total FROM reviews WHERE business_id = ?',
            [businessId]
        );

        res.json({
            reviews,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: countResult.total,
                pages: Math.ceil(countResult.total / limitNum)
            }
        });
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Get reviews by a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const reviews = await getAll(`
            SELECT r.*, b.name as business_name
            FROM reviews r
            JOIN businesses b ON r.business_id = b.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        `, [userId]);

        res.json({ reviews });
    } catch (err) {
        console.error('Error fetching user reviews:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Get current user's reviews
router.get('/my/reviews', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const reviews = await getAll(`
            SELECT r.*, b.name as business_name, b.id as business_id
            FROM reviews r
            JOIN businesses b ON r.business_id = b.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        `, [userId]);

        res.json({ reviews });
    } catch (err) {
        console.error('Error fetching user reviews:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Create a new review (requires auth and captcha)
router.post('/', requireAuth, requireCaptcha, async (req, res) => {
    try {
        const { businessId, rating, title, reviewText } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!businessId || !rating || !title || !reviewText) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate rating
        const ratingNum = parseInt(rating, 10);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Validate text length
        if (reviewText.length < 20) {
            return res.status(400).json({ error: 'Review must be at least 20 characters' });
        }

        if (reviewText.length > 1000) {
            return res.status(400).json({ error: 'Review must be less than 1000 characters' });
        }

        // Check if business exists
        const business = await getOne('SELECT id FROM businesses WHERE id = ?', [businessId]);
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Check if user already reviewed this business
        const existingReview = await getOne(
            'SELECT id FROM reviews WHERE business_id = ? AND user_id = ?',
            [businessId, userId]
        );

        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this business' });
        }

        // Insert review
        const result = await runQuery(`
            INSERT INTO reviews (business_id, user_id, rating, title, review_text)
            VALUES (?, ?, ?, ?, ?)
        `, [businessId, userId, ratingNum, title, reviewText]);

        res.status(201).json({
            reviewId: result.id,
            message: 'Review submitted successfully'
        });
    } catch (err) {
        console.error('Error creating review:', err);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

// Update own review
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, title, reviewText } = req.body;
        const userId = req.user.id;

        // Check if review exists and belongs to user
        const review = await getOne('SELECT user_id FROM reviews WHERE id = ?', [id]);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (review.user_id !== userId) {
            return res.status(403).json({ error: 'Not authorized to update this review' });
        }

        // Validate rating
        const ratingNum = parseInt(rating, 10);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Validate text length
        if (reviewText.length < 20 || reviewText.length > 1000) {
            return res.status(400).json({ error: 'Review must be between 20 and 1000 characters' });
        }

        await runQuery(`
            UPDATE reviews
            SET rating = ?, title = ?, review_text = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [ratingNum, title, reviewText, id]);

        res.json({ message: 'Review updated successfully' });
    } catch (err) {
        console.error('Error updating review:', err);
        res.status(500).json({ error: 'Failed to update review' });
    }
});

// Delete own review
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if review exists and belongs to user (or user is admin)
        const review = await getOne('SELECT user_id FROM reviews WHERE id = ?', [id]);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (review.user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this review' });
        }

        await runQuery('DELETE FROM reviews WHERE id = ?', [id]);

        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

module.exports = router;