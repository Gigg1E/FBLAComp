/**
 * Byte-Sized Business Boost - Backend Server
 * FBLA Coding & Programming Competition 2025-26
 *
 * This server provides a RESTful API for discovering and supporting
 * local businesses with features including user authentication,
 * business listings, reviews, bookmarks, and special deals.
 */

const express = require('express');
const session = require('express-session');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const svgCaptcha = require('svg-captcha');
const SqliteStore = require('connect-sqlite3')(session);
const path = require('path');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database connection with WAL mode for better concurrency
const db = new Database('business-boost.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Middleware Configuration
 */

// Parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Configure session management with SQLite store
app.use(session({
  store: new SqliteStore({
    db: 'sessions.db',
    dir: './sessions'
  }),
  secret: 'fbla-business-boost-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: false // Set to true in production with HTTPS
  }
}));

/**
 * Rate limiting to prevent abuse and bot activity
 * Limits each IP to 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

/**
 * Stricter rate limiting for authentication endpoints
 * Limits each IP to 5 requests per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.'
});

app.use('/api/', generalLimiter);

/**
 * Authentication Middleware
 * Ensures user is logged in before accessing protected routes
 */
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Input Validation Helper Functions
 */

// Validate email format using industry-standard regex
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength (min 6 characters, includes letter and number)
function validatePassword(password) {
  return password && password.length >= 6 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

// Sanitize user input to prevent XSS attacks
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '');
}

/**
 * CAPTCHA Generation Endpoint
 * Generates SVG CAPTCHA to prevent bot activity
 */
app.get('/api/captcha', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 6,
    noise: 3,
    color: true,
    background: '#f0f0f0'
  });

  req.session.captcha = captcha.text.toLowerCase();
  res.type('svg');
  res.send(captcha.data);
});

/**
 * User Registration Endpoint
 * Creates new user account with password hashing and CAPTCHA verification
 */
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password, fullName, captcha } = req.body;

    // Validate CAPTCHA to prevent bot registration
    if (!captcha || captcha.toLowerCase() !== req.session.captcha) {
      return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
    }

    // Clear CAPTCHA after use (one-time validation)
    delete req.session.captcha;

    // Validate input fields
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters and contain both letters and numbers'
      });
    }

    // Sanitize inputs to prevent XSS
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    const sanitizedFullName = sanitizeInput(fullName);

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(sanitizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password using bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new user into database
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, full_name)
      VALUES (?, ?, ?)
    `).run(sanitizedEmail, passwordHash, sanitizedFullName);

    // Create session for new user
    req.session.userId = result.lastInsertRowid;
    req.session.userEmail = sanitizedEmail;
    req.session.userName = sanitizedFullName;

    res.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: result.lastInsertRowid,
        email: sanitizedEmail,
        fullName: sanitizedFullName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/**
 * User Login Endpoint
 * Authenticates user with email and password, includes CAPTCHA verification
 */
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password, captcha } = req.body;

    // Validate CAPTCHA
    if (!captcha || captcha.toLowerCase() !== req.session.captcha) {
      return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
    }

    // Clear CAPTCHA after use
    delete req.session.captcha;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login timestamp
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    // Create user session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.full_name;

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/**
 * User Logout Endpoint
 * Destroys user session
 */
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

/**
 * Get Current User Session
 * Returns current logged-in user information
 */
app.get('/api/auth/session', (req, res) => {
  if (!req.session.userId) {
    return res.json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    user: {
      id: req.session.userId,
      email: req.session.userEmail,
      fullName: req.session.userName
    }
  });
});

/**
 * Get All Businesses with Filtering and Sorting
 * Query parameters:
 * - category: Filter by business category (food, retail, services)
 * - sort: Sort by 'rating', 'reviews', or 'name'
 * - search: Search businesses by name or description
 */
app.get('/api/businesses', (req, res) => {
  try {
    const { category, sort, search } = req.query;
    let query = 'SELECT * FROM businesses WHERE 1=1';
    const params = [];

    // Filter by category
    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    // Search by name or description
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sort results
    switch (sort) {
      case 'rating':
        query += ' ORDER BY average_rating DESC, total_reviews DESC';
        break;
      case 'reviews':
        query += ' ORDER BY total_reviews DESC, average_rating DESC';
        break;
      case 'name':
        query += ' ORDER BY name ASC';
        break;
      default:
        query += ' ORDER BY average_rating DESC, name ASC';
    }

    const businesses = db.prepare(query).all(...params);
    res.json(businesses);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

/**
 * Get Single Business Details
 * Includes business info, reviews, and active deals
 */
app.get('/api/businesses/:id', (req, res) => {
  try {
    const businessId = req.params.id;

    // Get business details
    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Get business reviews with user information
    const reviews = db.prepare(`
      SELECT r.*, u.full_name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.business_id = ?
      ORDER BY r.created_at DESC
    `).all(businessId);

    // Get active deals for this business
    const deals = db.prepare(`
      SELECT * FROM deals
      WHERE business_id = ? AND is_active = 1
      AND (valid_until IS NULL OR valid_until >= date('now'))
      ORDER BY created_at DESC
    `).all(businessId);

    res.json({
      ...business,
      reviews,
      deals
    });
  } catch (error) {
    console.error('Error fetching business details:', error);
    res.status(500).json({ error: 'Failed to fetch business details' });
  }
});

/**
 * Submit Review for Business
 * Requires authentication and CAPTCHA verification
 * Validates rating (1-5) and prevents duplicate reviews
 */
app.post('/api/businesses/:id/reviews', requireAuth, (req, res) => {
  try {
    const businessId = req.params.id;
    const { rating, reviewText, captcha } = req.body;
    const userId = req.session.userId;

    // Validate CAPTCHA
    if (!captcha || captcha.toLowerCase() !== req.session.captcha) {
      return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
    }
    delete req.session.captcha;

    // Validate rating (must be between 1 and 5)
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if business exists
    const business = db.prepare('SELECT id FROM businesses WHERE id = ?').get(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Sanitize review text
    const sanitizedReview = sanitizeInput(reviewText);

    // Begin transaction for data consistency
    const insertReview = db.transaction(() => {
      // Insert or replace review (user can update their review)
      db.prepare(`
        INSERT INTO reviews (business_id, user_id, rating, review_text)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(business_id, user_id)
        DO UPDATE SET rating = ?, review_text = ?, created_at = CURRENT_TIMESTAMP
      `).run(businessId, userId, rating, sanitizedReview, rating, sanitizedReview);

      // Update business average rating and review count
      db.prepare(`
        UPDATE businesses
        SET average_rating = (
          SELECT AVG(rating) FROM reviews WHERE business_id = ?
        ),
        total_reviews = (
          SELECT COUNT(*) FROM reviews WHERE business_id = ?
        )
        WHERE id = ?
      `).run(businessId, businessId, businessId);
    });

    insertReview();

    res.json({ success: true, message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

/**
 * Get User's Bookmarked Businesses
 * Returns all businesses bookmarked by the current user
 */
app.get('/api/bookmarks', requireAuth, (req, res) => {
  try {
    const userId = req.session.userId;

    const bookmarks = db.prepare(`
      SELECT b.*, bm.created_at as bookmarked_at
      FROM businesses b
      JOIN bookmarks bm ON b.id = bm.business_id
      WHERE bm.user_id = ?
      ORDER BY bm.created_at DESC
    `).all(userId);

    res.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

/**
 * Check if Business is Bookmarked
 * Returns bookmark status for a specific business
 */
app.get('/api/bookmarks/check/:businessId', requireAuth, (req, res) => {
  try {
    const userId = req.session.userId;
    const businessId = req.params.businessId;

    const bookmark = db.prepare(`
      SELECT id FROM bookmarks
      WHERE user_id = ? AND business_id = ?
    `).get(userId, businessId);

    res.json({ bookmarked: !!bookmark });
  } catch (error) {
    console.error('Error checking bookmark:', error);
    res.status(500).json({ error: 'Failed to check bookmark status' });
  }
});

/**
 * Add Business to Bookmarks
 * Saves a business to user's favorites
 */
app.post('/api/bookmarks/:businessId', requireAuth, (req, res) => {
  try {
    const userId = req.session.userId;
    const businessId = req.params.businessId;

    // Check if business exists
    const business = db.prepare('SELECT id FROM businesses WHERE id = ?').get(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Insert bookmark (ignore if already exists)
    db.prepare(`
      INSERT OR IGNORE INTO bookmarks (user_id, business_id)
      VALUES (?, ?)
    `).run(userId, businessId);

    res.json({ success: true, message: 'Business bookmarked successfully' });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ error: 'Failed to add bookmark' });
  }
});

/**
 * Remove Business from Bookmarks
 * Removes a business from user's favorites
 */
app.delete('/api/bookmarks/:businessId', requireAuth, (req, res) => {
  try {
    const userId = req.session.userId;
    const businessId = req.params.businessId;

    db.prepare(`
      DELETE FROM bookmarks
      WHERE user_id = ? AND business_id = ?
    `).run(userId, businessId);

    res.json({ success: true, message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

/**
 * Get All Active Deals
 * Returns all current deals and coupons
 */
app.get('/api/deals', (req, res) => {
  try {
    const deals = db.prepare(`
      SELECT d.*, b.name as business_name, b.category as business_category
      FROM deals d
      JOIN businesses b ON d.business_id = b.id
      WHERE d.is_active = 1
      AND (d.valid_until IS NULL OR d.valid_until >= date('now'))
      ORDER BY d.created_at DESC
    `).all();

    res.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

/**
 * Serve main application page
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════════════╗`);
  console.log(`║   Byte-Sized Business Boost Server Running        ║`);
  console.log(`╚════════════════════════════════════════════════════╝`);
  console.log(`\n🚀 Server: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
  console.log(`\n📝 Demo Account:`);
  console.log(`   Email: demo@example.com`);
  console.log(`   Password: demo123\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close();
  process.exit(0);
});
