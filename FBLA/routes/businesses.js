const express = require('express');
const { getAll, getOne, runQuery } = require('../config/database');
const { requireAuth, requireAdmin, requireBusinessOwner, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all businesses with search and filtering
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { search, category, city, page = 1, limit = 12 } = req.query;

        let query = `
            SELECT b.*,
                   COALESCE(AVG(r.rating), 0) as average_rating,
                   COUNT(r.id) as review_count
            FROM businesses b
            LEFT JOIN reviews r ON b.id = r.business_id
        `;
        const params = [];
        const conditions = [];

        // Add search filter
        if (search) {
            conditions.push('(b.name LIKE ? OR b.description LIKE ? OR b.category LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Add category filter
        if (category) {
            conditions.push('b.category = ?');
            params.push(category);
        }

        // Add city filter
        if (city) {
            conditions.push('b.city = ?');
            params.push(city);
        }

        // Apply filters
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY b.id ORDER BY average_rating DESC, review_count DESC';

        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        query += ` LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);

        const businesses = await getAll(query, params);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM businesses b';
        const countParams = [];
        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
            // Only use search/category/city params for count
            if (search) {
                const searchTerm = `%${search}%`;
                countParams.push(searchTerm, searchTerm, searchTerm);
            }
            if (category) {
                countParams.push(category);
            }
            if (city) {
                countParams.push(city);
            }
        }

        const countResult = await getOne(countQuery, countParams);
        const total = countResult.total;

        res.json({
            businesses,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        console.error('Error fetching businesses:', err);
        res.status(500).json({ error: 'Failed to fetch businesses' });
    }
});

// Get single business by ID
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const business = await getOne(`
            SELECT b.*,
                   COALESCE(AVG(r.rating), 0) as average_rating,
                   COUNT(r.id) as review_count
            FROM businesses b
            LEFT JOIN reviews r ON b.id = r.business_id
            WHERE b.id = ?
            GROUP BY b.id
        `, [id]);

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        res.json({ business });
    } catch (err) {
        console.error('Error fetching business:', err);
        res.status(500).json({ error: 'Failed to fetch business' });
    }
});

// Get current user's business
router.get('/my/business', requireAuth, async (req, res) => {
    try {
        // Only business owners and admins can access this
        if (req.user.role !== 'business_owner' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only business owners can access this endpoint' });
        }

        const business = await getOne(`
            SELECT b.*,
                   COALESCE(AVG(r.rating), 0) as average_rating,
                   COUNT(r.id) as review_count
            FROM businesses b
            LEFT JOIN reviews r ON b.id = r.business_id
            WHERE b.owner_id = ?
            GROUP BY b.id
        `, [req.user.id]);

        res.json({ business: business || null });
    } catch (err) {
        console.error('Error fetching user business:', err);
        res.status(500).json({ error: 'Failed to fetch business' });
    }
});

// Get business statistics
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;

        const stats = await getOne(`
            SELECT
                COUNT(r.id) as review_count,
                COALESCE(AVG(r.rating), 0) as average_rating,
                COUNT(CASE WHEN r.rating = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN r.rating = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN r.rating = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN r.rating = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN r.rating = 1 THEN 1 END) as one_star
            FROM reviews r
            WHERE r.business_id = ?
        `, [id]);

        res.json({ stats });
    } catch (err) {
        console.error('Error fetching business stats:', err);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Create new business (business owners and admins)
router.post('/', requireAuth, async (req, res) => {
    try {
        // Check if user is business owner or admin
        if (req.user.role !== 'business_owner' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only business owners can create businesses' });
        }

        const { name, category, address, city, state, zip_code, phone, email, website, description, image_url, products } = req.body;

        // Validate required fields
        if (!name || !category || !address || !city || !state || !zip_code) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        if (!image_url) {
            return res.status(400).json({ error: 'At least one business image is required' });
        }

        // Validate at least one contact method
        if (!phone && !email && !website) {
            return res.status(400).json({ error: 'At least one contact method (phone, email, or website) is required' });
        }

        // Check if user already has a business (one per account limit)
        const existingBusiness = await getOne('SELECT id FROM businesses WHERE owner_id = ?', [req.user.id]);
        if (existingBusiness) {
            return res.status(400).json({ error: 'You can only create one business per account' });
        }

        const result = await runQuery(`
            INSERT INTO businesses (name, category, address, city, state, zip_code, phone, email, website, description, image_url, products, owner_id, verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [name, category, address, city, state, zip_code, phone, email, website, description, image_url, products, req.user.id]);

        res.status(201).json({ businessId: result.id });
    } catch (err) {
        console.error('Error creating business:', err);
        res.status(500).json({ error: 'Failed to create business' });
    }
});

// Update business
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, address, city, state, zip_code, phone, email, website, description, image_url, products } = req.body;

        // Check if user owns this business or is admin
        const business = await getOne('SELECT owner_id FROM businesses WHERE id = ?', [id]);

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        if (business.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this business' });
        }

        // Validate required fields
        if (!name || !category || !address || !city || !state || !zip_code || !description || !image_url) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate at least one contact method
        if (!phone && !email && !website) {
            return res.status(400).json({ error: 'At least one contact method (phone, email, or website) is required' });
        }

        await runQuery(`
            UPDATE businesses
            SET name = ?, category = ?, address = ?, city = ?, state = ?, zip_code = ?,
                phone = ?, email = ?, website = ?, description = ?, image_url = ?, products = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [name, category, address, city, state, zip_code, phone, email, website, description, image_url, products, id]);

        res.json({ message: 'Business updated successfully' });
    } catch (err) {
        console.error('Error updating business:', err);
        res.status(500).json({ error: 'Failed to update business' });
    }
});

// Delete business
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user owns this business or is admin
        const business = await getOne('SELECT owner_id FROM businesses WHERE id = ?', [id]);

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        if (business.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this business' });
        }

        // Delete business (CASCADE will handle reviews and deals)
        await runQuery('DELETE FROM businesses WHERE id = ?', [id]);

        res.json({ message: 'Business deleted successfully' });
    } catch (err) {
        console.error('Error deleting business:', err);
        res.status(500).json({ error: 'Failed to delete business' });
    }
});

// Get categories (for filter dropdown)
router.get('/meta/categories', async (req, res) => {
    try {
        const categories = await getAll('SELECT DISTINCT category FROM businesses ORDER BY category');
        res.json({ categories: categories.map(c => c.category) });
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

module.exports = router;
