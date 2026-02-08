const express = require('express');
const { getAll, getOne, runQuery } = require('../config/database');
const { requireAuth, requireBusinessOwner } = require('../middleware/auth');

const router = express.Router();

// Get all active deals
router.get('/', async (req, res) => {
    try {
        const deals = await getAll(`
            SELECT d.*, b.name as business_name, b.category
            FROM deals d
            JOIN businesses b ON d.business_id = b.id
            WHERE d.active = 1 AND d.end_date >= date('now')
            ORDER BY d.created_at DESC
        `);

        res.json({ deals });
    } catch (err) {
        console.error('Error fetching deals:', err);
        res.status(500).json({ error: 'Failed to fetch deals' });
    }
});

// Get deals for a specific business
router.get('/business/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;
        const { includeInactive = false } = req.query;

        let query = `
            SELECT * FROM deals
            WHERE business_id = ?
        `;

        if (!includeInactive) {
            query += ' AND active = 1 AND end_date >= date("now")';
        }

        query += ' ORDER BY created_at DESC';

        const deals = await getAll(query, [businessId]);

        res.json({ deals });
    } catch (err) {
        console.error('Error fetching business deals:', err);
        res.status(500).json({ error: 'Failed to fetch deals' });
    }
});

// Get deals for businesses owned by current user
router.get('/my/deals', requireAuth, requireBusinessOwner, async (req, res) => {
    try {
        const deals = await getAll(`
            SELECT d.*, b.name as business_name
            FROM deals d
            JOIN businesses b ON d.business_id = b.id
            WHERE b.owner_id = ?
            ORDER BY d.created_at DESC
        `, [req.user.id]);

        res.json({ deals });
    } catch (err) {
        console.error('Error fetching my deals:', err);
        res.status(500).json({ error: 'Failed to fetch deals' });
    }
});

// Get single deal by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deal = await getOne(`
            SELECT d.*, b.name as business_name
            FROM deals d
            JOIN businesses b ON d.business_id = b.id
            WHERE d.id = ?
        `, [id]);

        if (!deal) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        res.json({ deal });
    } catch (err) {
        console.error('Error fetching deal:', err);
        res.status(500).json({ error: 'Failed to fetch deal' });
    }
});

// Create new deal (business owners only)
router.post('/', requireAuth, requireBusinessOwner, async (req, res) => {
    try {
        const { businessId, title, description, discountAmount, startDate, endDate } = req.body;

        // Validate required fields
        if (!businessId || !title || !description || !startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if business exists
        const business = await getOne('SELECT owner_id FROM businesses WHERE id = ?', [businessId]);

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Check if user owns this business (or is admin)
        if (business.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to create deals for this business' });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        if (end < start) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        // Insert deal
        const result = await runQuery(`
            INSERT INTO deals (business_id, title, description, discount_amount, start_date, end_date, active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `, [businessId, title, description, discountAmount, startDate, endDate]);

        res.status(201).json({
            dealId: result.id,
            message: 'Deal created successfully'
        });
    } catch (err) {
        console.error('Error creating deal:', err);
        res.status(500).json({ error: 'Failed to create deal' });
    }
});

// Update deal
router.put('/:id', requireAuth, requireBusinessOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, discountAmount, startDate, endDate, active } = req.body;

        // Get deal and check ownership
        const deal = await getOne(`
            SELECT d.*, b.owner_id
            FROM deals d
            JOIN businesses b ON d.business_id = b.id
            WHERE d.id = ?
        `, [id]);

        if (!deal) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        if (deal.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this deal' });
        }

        // Validate dates if provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            if (end < start) {
                return res.status(400).json({ error: 'End date must be after start date' });
            }
        }

        // If active is not provided, preserve the current value
        const newActive = active !== undefined ? (active ? 1 : 0) : deal.active;

        await runQuery(`
            UPDATE deals
            SET title = ?, description = ?, discount_amount = ?,
                start_date = ?, end_date = ?, active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [title, description, discountAmount, startDate, endDate, newActive, id]);

        res.json({ message: 'Deal updated successfully' });
    } catch (err) {
        console.error('Error updating deal:', err);
        res.status(500).json({ error: 'Failed to update deal' });
    }
});

// Delete deal
router.delete('/:id', requireAuth, requireBusinessOwner, async (req, res) => {
    try {
        const { id } = req.params;

        // Get deal and check ownership
        const deal = await getOne(`
            SELECT d.*, b.owner_id
            FROM deals d
            JOIN businesses b ON d.business_id = b.id
            WHERE d.id = ?
        `, [id]);

        if (!deal) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        if (deal.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this deal' });
        }

        await runQuery('DELETE FROM deals WHERE id = ?', [id]);

        res.json({ message: 'Deal deleted successfully' });
    } catch (err) {
        console.error('Error deleting deal:', err);
        res.status(500).json({ error: 'Failed to delete deal' });
    }
});

module.exports = router;
