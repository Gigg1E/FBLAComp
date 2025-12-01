// ===============================================
// businesses.js
// Handles all business CRUD, search, filters, stats
// ===============================================

const express = require('express');
const { getAll, getOne, runQuery } = require('../config/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { upload, processImage } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// ==========================================================
// GET /api/businesses
// Fetch all businesses with optional search, category, city, pagination
// ==========================================================
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { search, category, city, page = 1, limit = 12 } = req.query;

        let query = `
            SELECT b.*, COALESCE(AVG(r.rating),0) AS average_rating,
                   COUNT(r.id) AS review_count
            FROM businesses b
            LEFT JOIN reviews r ON b.id = r.business_id
        `;
        const params = [];
        const conditions = [];

        if (search) {
            const term = `%${search}%`;
            conditions.push('(b.name LIKE ? OR b.description LIKE ? OR b.category LIKE ?)');
            params.push(term, term, term);
        }
        if (category) {
            conditions.push('b.category = ?');
            params.push(category);
        }
        if (city) {
            conditions.push('b.city = ?');
            params.push(city);
        }

        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');

        query += ' GROUP BY b.id ORDER BY average_rating DESC, review_count DESC';
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const businesses = await getAll(query, params);

        // total count
        let countQuery = 'SELECT COUNT(*) AS total FROM businesses b';
        const countParams = [];
        if (conditions.length > 0) countQuery += ' WHERE ' + conditions.join(' AND ');

        const totalRes = await getOne(countQuery, countParams);
        const total = totalRes.total;

        res.json({
            businesses,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('Error fetching businesses:', err);
        res.status(500).json({ error: 'Failed to fetch businesses' });
    }
});

// ==========================================================
// GET /api/businesses/my/business
// Get current user's business
// ==========================================================
router.get('/my/business', requireAuth, async (req, res) => {
    try {
        const business = await getOne(`
            SELECT b.*, COALESCE(AVG(r.rating),0) AS average_rating,
                   COUNT(r.id) AS review_count
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

// ==========================================================
// POST /api/businesses
// Create a new business
// ==========================================================
router.post('/', requireAuth, upload, processImage, async (req, res) => {
    try {
        if (req.user.role !== 'business_owner' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only business owners can create businesses' });
        }

        const { name, category, address, city, state, zip_code, phone, email, website, description, products } = req.body;

        // Check if image was uploaded
        if (!req.processedFile) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        if (!name || !category || !address || !city || !state || !zip_code || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existing = await getOne('SELECT id FROM businesses WHERE owner_id = ?', [req.user.id]);
        if (existing) return res.status(400).json({ error: 'You already have a business.' });

        // Use processed image path
        const image_url = req.processedFile.path;

        const result = await runQuery(`
            INSERT INTO businesses
            (name, category, address, city, state, zip_code, phone, email, website, description, image_url, products, owner_id, verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            name, category, address, city, state, zip_code,
            phone || null, email || null, website || null,
            description, image_url, products || null, req.user.id
        ]);

        console.log('Inserted business ID:', result.id);

        const newBusiness = await getOne(`
            SELECT b.*, COALESCE(AVG(r.rating),0) AS average_rating, COUNT(r.id) AS review_count
            FROM businesses b
            LEFT JOIN reviews r ON b.id = r.business_id
            WHERE b.id = ?
            GROUP BY b.id
        `, [result.id]);

        res.status(201).json({ business: newBusiness });
    } catch (err) {
        console.error('Error creating business:', err);
        res.status(500).json({ error: 'Failed to create business' });
    }
});

// ==========================================================
// PUT /api/businesses/:id
// Update a business
// ==========================================================
router.put('/:id', requireAuth, upload, processImage, async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await getOne('SELECT owner_id, image_url FROM businesses WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ error: 'Business not found' });
        if (existing.owner_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not allowed' });

        console.log('PUT req.body:', req.body);
        console.log('PUT req.file:', req.file);
        console.log('PUT req.processedFile:', req.processedFile);

        const { name, category, address, city, state, zip_code, phone, email, website, description, products } = req.body;

        // Determine image URL
        let finalImageUrl;
        if (req.processedFile) {
            // New file uploaded - use new file
            finalImageUrl = req.processedFile.path;

            // Delete old uploaded file if it exists and is local
            if (existing.image_url && existing.image_url.startsWith('/uploads/')) {
                const oldFilePath = path.join(__dirname, '..', 'public', existing.image_url);
                try {
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                } catch (err) {
                    console.error('Error deleting old image:', err);
                }
            }
        } else {
            // No new file - keep existing
            finalImageUrl = existing.image_url;
        }

        await runQuery(`
            UPDATE businesses SET
            name=?, category=?, address=?, city=?, state=?, zip_code=?,
            phone=?, email=?, website=?, description=?, image_url=?, products=?,
            updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        `, [name, category, address, city, state, zip_code, phone, email, website, description, finalImageUrl, products, id]);

        res.json({ message: 'Updated successfully' });
    } catch (err) {
        console.error('Error updating business:', err);
        res.status(500).json({ error: 'Failed to update business' });
    }
});

// ==========================================================
// DELETE /api/businesses/:id
// Delete a business
// ==========================================================
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await getOne('SELECT owner_id, image_url FROM businesses WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ error: 'Business not found' });
        if (existing.owner_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not allowed' });

        // Delete uploaded file if it exists and is local
        if (existing.image_url && existing.image_url.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', 'public', existing.image_url);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error('Error deleting image file:', err);
            }
        }

        await runQuery('DELETE FROM businesses WHERE id = ?', [id]);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting business:', err);
        res.status(500).json({ error: 'Failed to delete business' });
    }
});

// ==========================================================
// GET /api/businesses/meta/categories
// Get all unique business categories
// ==========================================================
router.get('/meta/categories', async (req, res) => {
    try {
        const rows = await getAll('SELECT DISTINCT category FROM businesses ORDER BY category ASC');
        const categories = rows.map(row => row.category);
        res.json({ categories });
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// ==========================================================
// GET /api/businesses/:id
// Get a single business by ID
// ==========================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const business = await getOne(`
            SELECT b.*, COALESCE(AVG(r.rating),0) AS average_rating,
                   COUNT(r.id) AS review_count
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

module.exports = router;
