/**
 * Database Initialization Script
 * Creates all necessary tables and populates with sample data
 * for the Byte-Sized Business Boost application
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Create database connection
const db = new Database('business-boost.db');

console.log('Initializing database...');

// Enable foreign keys for referential integrity
db.pragma('foreign_keys = ON');

/**
 * Create Users table for account management
 * Stores user credentials and profile information
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  )
`);

/**
 * Create Businesses table
 * Stores information about local businesses
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    website TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    average_rating REAL DEFAULT 0,
    total_reviews INTEGER DEFAULT 0
  )
`);

/**
 * Create Reviews table
 * Stores user reviews and ratings for businesses
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(business_id, user_id)
  )
`);

/**
 * Create Bookmarks table
 * Stores user's favorite/saved businesses
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    business_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    UNIQUE(user_id, business_id)
  )
`);

/**
 * Create Deals table
 * Stores special deals and coupons for businesses
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    discount_percent INTEGER,
    coupon_code TEXT,
    valid_until DATE,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  )
`);

/**
 * Create indexes for better query performance
 */
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
  CREATE INDEX IF NOT EXISTS idx_businesses_rating ON businesses(average_rating);
  CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
  CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
  CREATE INDEX IF NOT EXISTS idx_deals_business ON deals(business_id);
`);

console.log('Tables created successfully!');

// Insert sample data
console.log('Inserting sample data...');

/**
 * Insert sample businesses across different categories
 */
const insertBusiness = db.prepare(`
  INSERT INTO businesses (name, category, description, address, phone, email, website, image_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const sampleBusinesses = [
  // Food category
  ['The Daily Grind Cafe', 'food', 'Cozy coffee shop serving artisan coffee, fresh pastries, and light lunch options.', '123 Main St, Downtown', '(555) 123-4567', 'info@dailygrind.com', 'www.dailygrind.com', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400'],
  ['Mama Mia Italian Kitchen', 'food', 'Family-owned Italian restaurant featuring authentic homemade pasta and wood-fired pizza.', '456 Oak Avenue', '(555) 234-5678', 'contact@mamamia.com', 'www.mamamia.com', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'],
  ['Green Bowl Organic', 'food', 'Health-focused eatery specializing in organic salads, smoothie bowls, and vegan options.', '789 Elm Street', '(555) 345-6789', 'hello@greenbowl.com', 'www.greenbowl.com', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400'],
  ['Smokey BBQ Shack', 'food', 'Award-winning BBQ restaurant with slow-smoked meats and homemade sauces.', '321 Pine Road', '(555) 456-7890', 'orders@smokeybbq.com', 'www.smokeybbq.com', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400'],

  // Retail category
  ['BookNook Bookstore', 'retail', 'Independent bookstore with curated selections, cozy reading nooks, and weekly author events.', '567 Maple Drive', '(555) 567-8901', 'info@booknook.com', 'www.booknook.com', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400'],
  ['Artisan Craft Gallery', 'retail', 'Local artisan marketplace featuring handmade jewelry, pottery, paintings, and crafts.', '890 Cedar Lane', '(555) 678-9012', 'gallery@artisancraft.com', 'www.artisancraft.com', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400'],
  ['Green Thumb Garden Center', 'retail', 'Full-service garden center with plants, tools, and expert gardening advice.', '234 Birch Street', '(555) 789-0123', 'help@greenthumb.com', 'www.greenthumb.com', 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400'],
  ['Vintage Threads Boutique', 'retail', 'Curated vintage and sustainable fashion boutique with unique clothing and accessories.', '678 Willow Avenue', '(555) 890-1234', 'shop@vintagethreads.com', 'www.vintagethreads.com', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400'],

  // Services category
  ['Paws & Claws Pet Grooming', 'services', 'Professional pet grooming service with caring staff and gentle handling techniques.', '345 Spruce Road', '(555) 901-2345', 'appointments@pawsandclaws.com', 'www.pawsandclaws.com', 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400'],
  ['FitLife Gym & Wellness', 'services', '24/7 fitness center with personal training, group classes, and state-of-the-art equipment.', '901 Ash Boulevard', '(555) 012-3456', 'join@fitlifegym.com', 'www.fitlifegym.com', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'],
  ['Serenity Day Spa', 'services', 'Luxury day spa offering massages, facials, and relaxation treatments in a tranquil setting.', '456 Redwood Place', '(555) 123-4568', 'booking@serenityspa.com', 'www.serenityspa.com', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400'],
  ['TechFix Repair Shop', 'services', 'Expert electronics repair for phones, computers, and tablets with same-day service available.', '789 Hickory Court', '(555) 234-5679', 'support@techfix.com', 'www.techfix.com', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400']
];

for (const business of sampleBusinesses) {
  insertBusiness.run(...business);
}

console.log(`Inserted ${sampleBusinesses.length} sample businesses!`);

/**
 * Insert sample deals/coupons
 */
const insertDeal = db.prepare(`
  INSERT INTO deals (business_id, title, description, discount_percent, coupon_code, valid_until, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const sampleDeals = [
  [1, 'Morning Special', 'Buy one coffee, get a free pastry!', 0, 'MORNING2024', '2025-12-31', 1],
  [2, '20% Off Family Dinner', 'Get 20% off your total bill for parties of 4 or more', 20, 'FAMILY20', '2025-12-31', 1],
  [3, 'First-Time Customer Discount', '15% off your first order', 15, 'WELCOME15', '2025-12-31', 1],
  [5, 'Book Lovers Special', 'Buy 2 books, get 1 free!', 0, 'READMORE', '2025-12-31', 1],
  [6, 'Local Artist Appreciation', '10% off all locally made items', 10, 'LOCAL10', '2025-12-31', 1],
  [10, 'New Year Fitness Deal', 'First month 50% off new memberships', 50, 'NEWYEAR50', '2025-12-31', 1],
  [11, 'Spa Day Special', 'Book 2 treatments and get 25% off', 25, 'RELAX25', '2025-12-31', 1]
];

for (const deal of sampleDeals) {
  insertDeal.run(...deal);
}

console.log(`Inserted ${sampleDeals.length} sample deals!`);

/**
 * Create sample user account
 * Password: demo123
 */
const hashedPassword = bcrypt.hashSync('demo123', 10);
const insertUser = db.prepare(`
  INSERT INTO users (email, password_hash, full_name)
  VALUES (?, ?, ?)
`);

insertUser.run('demo@example.com', hashedPassword, 'Demo User');
console.log('Created demo user account (email: demo@example.com, password: demo123)');

/**
 * Insert sample reviews from demo user
 */
const insertReview = db.prepare(`
  INSERT INTO reviews (business_id, user_id, rating, review_text)
  VALUES (?, ?, ?, ?)
`);

const sampleReviews = [
  [1, 1, 5, 'Best coffee in town! The baristas are friendly and the atmosphere is perfect for working.'],
  [2, 1, 5, 'Incredible authentic Italian food. The homemade pasta is to die for!'],
  [5, 1, 4, 'Great selection of books and very knowledgeable staff. Cozy reading area is a plus.']
];

for (const review of sampleReviews) {
  insertReview.run(...review);
}

console.log(`Inserted ${sampleReviews.length} sample reviews!`);

/**
 * Update average ratings for businesses with reviews
 */
const updateRatings = db.prepare(`
  UPDATE businesses
  SET average_rating = (
    SELECT AVG(rating)
    FROM reviews
    WHERE reviews.business_id = businesses.id
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM reviews
    WHERE reviews.business_id = businesses.id
  )
  WHERE id IN (SELECT DISTINCT business_id FROM reviews)
`);

updateRatings.run();
console.log('Updated business ratings!');

db.close();
console.log('\nDatabase initialization complete!');
console.log('Database file: business-boost.db');
console.log('\nDemo account credentials:');
console.log('Email: demo@example.com');
console.log('Password: demo123');
