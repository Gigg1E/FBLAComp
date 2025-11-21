# Byte-Sized Business Boost

**FBLA Coding & Programming Competition 2025-26**

A professional web application designed to help users discover and support small, local businesses in their community.

---

## 🎯 Project Overview

Byte-Sized Business Boost is a comprehensive web platform that connects community members with local businesses. The application provides an intuitive interface for browsing businesses, reading and writing reviews, discovering special deals, and saving favorite businesses.

### Competition Requirements

This project fulfills all requirements for the FBLA Coding & Programming Competition:

- ✅ **Sorting businesses by category** (food, retail, services)
- ✅ **User reviews and ratings system**
- ✅ **Sorting by reviews and ratings**
- ✅ **Bookmark/save favorite businesses**
- ✅ **Display special deals and coupons**
- ✅ **Bot prevention verification** (CAPTCHA)
- ✅ **Professional account management system**

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

```bash
# Install dependencies
npm install

# Initialize database with sample data
npm run init-db

# Start the server
npm start
```

The application will be available at **http://localhost:3000**

### Demo Account
- **Email:** demo@example.com
- **Password:** demo123

📖 For detailed setup instructions, see [SETUP.md](SETUP.md)

---

## ✨ Features

### For Users

**Browse & Search**
- View all local businesses with beautiful card layouts
- Filter businesses by category (Food, Retail, Services)
- Search by business name or description
- Sort by highest rated, most reviews, or alphabetically

**Reviews & Ratings**
- Leave detailed reviews for businesses
- Rate businesses from 1-5 stars
- View all customer reviews with timestamps
- One review per user per business

**Bookmarks**
- Save favorite businesses for quick access
- View all bookmarked businesses in one place
- Toggle bookmark status with one click

**Deals & Coupons**
- Browse all active deals and special offers
- View coupon codes and discount percentages
- See expiration dates for time-sensitive offers
- Filter deals by business category

**Account Management**
- Secure registration with email verification
- Login with persistent sessions
- Password strength requirements
- User profile with activity history

### Security Features

**CAPTCHA Verification**
- Required for user registration
- Required for login attempts
- Required for submitting reviews
- Auto-generated SVG CAPTCHA with refresh option

**Rate Limiting**
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Prevents brute force attacks and abuse

**Data Security**
- Bcrypt password hashing (10 rounds)
- SQL injection prevention via prepared statements
- XSS prevention through input sanitization
- Session-based authentication with secure cookies

**Input Validation**
- Email format validation
- Password strength enforcement (6+ chars, letters + numbers)
- Rating bounds checking (1-5 stars)
- Sanitization of all user inputs

---

## 🏗️ Technical Architecture

### Technology Stack

**Frontend**
- HTML5 with semantic markup
- CSS3 with modern features (Grid, Flexbox, CSS Variables)
- Vanilla JavaScript (ES6+)
- Responsive design for all devices

**Backend**
- Node.js runtime environment
- Express.js web framework
- better-sqlite3 for database operations
- express-session for authentication
- express-rate-limit for security
- svg-captcha for bot prevention

**Database**
- SQLite (portable, zero-configuration)
- Relational schema with foreign keys
- Indexed columns for performance
- WAL mode for better concurrency

### Project Structure

```
FBLAComp/
├── public/
│   ├── index.html          # Main application page
│   ├── styles.css          # Professional CSS styling
│   └── app.js              # Frontend JavaScript
├── server.js               # Express backend server
├── init-database.js        # Database setup script
├── package.json            # Dependencies and scripts
├── README.md              # This file
├── SETUP.md               # Detailed setup guide
└── .gitignore             # Git ignore rules
```

### Database Schema

**users**
- User accounts with encrypted passwords
- Email, full name, timestamps

**businesses**
- Business information and details
- Category, contact info, average rating

**reviews**
- User reviews with ratings (1-5 stars)
- Unique constraint: one review per user per business

**bookmarks**
- User's saved/favorite businesses
- Unique user-business pairs

**deals**
- Special offers and coupons
- Expiration dates, discount percentages

---

## 📊 API Documentation

### Authentication Endpoints

```
GET  /api/auth/session      # Check current session
POST /api/auth/register     # Create new account
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
```

### Business Endpoints

```
GET  /api/businesses                  # List all businesses
     ?category=food                   # Filter by category
     &sort=rating                     # Sort by rating/reviews/name
     &search=coffee                   # Search query

GET  /api/businesses/:id              # Get business details
POST /api/businesses/:id/reviews      # Submit review (auth required)
```

### Bookmark Endpoints

```
GET    /api/bookmarks                 # Get user bookmarks (auth)
GET    /api/bookmarks/check/:id       # Check bookmark status (auth)
POST   /api/bookmarks/:id             # Add bookmark (auth)
DELETE /api/bookmarks/:id             # Remove bookmark (auth)
```

### Other Endpoints

```
GET /api/deals          # Get all active deals
GET /api/captcha        # Generate CAPTCHA image
```

---

## 🎨 Design Philosophy

### Code Quality

**Modular Architecture**
- Separation of concerns (frontend/backend)
- Reusable functions and components
- Clear file organization

**Comprehensive Documentation**
- Every function has descriptive comments
- Inline explanations for complex logic
- Industry-standard JSDoc format

**Best Practices**
- Consistent code formatting
- Descriptive variable names
- Error handling throughout
- Input validation at all entry points

### User Experience

**Intuitive Interface**
- Self-explanatory navigation
- Clear call-to-action buttons
- Consistent design language
- Visual feedback for all actions

**Professional Design**
- Modern color palette
- Smooth animations and transitions
- Card-based layouts
- Mobile-responsive design

**Accessibility**
- Semantic HTML elements
- Proper form labels
- Keyboard navigation support
- High contrast ratios

---

## 🔒 Security Measures

### Authentication & Authorization

1. **Password Security**
   - Bcrypt hashing with salt (10 rounds)
   - Never stored in plain text
   - Minimum strength requirements

2. **Session Management**
   - Secure HTTP-only cookies
   - 7-day session expiration
   - SQLite session storage

3. **Rate Limiting**
   - IP-based request throttling
   - Stricter limits on auth endpoints
   - Prevents brute force attacks

### Input Validation

1. **Client-Side Validation**
   - Immediate user feedback
   - Format checking (email, etc.)
   - Required field enforcement

2. **Server-Side Validation**
   - Re-validation of all inputs
   - Type checking and bounds validation
   - Sanitization to prevent XSS

3. **CAPTCHA Verification**
   - Visual challenge-response test
   - Session-based validation
   - One-time use per submission

### Database Security

1. **SQL Injection Prevention**
   - Prepared statements for all queries
   - Parameterized inputs
   - No string concatenation in queries

2. **Data Integrity**
   - Foreign key constraints
   - Unique constraints where appropriate
   - Default values and NULL handling

---

## 📈 Performance Optimizations

### Frontend

- Debounced search input (300ms delay)
- Efficient DOM manipulation
- CSS variables for consistency
- Optimized asset loading

### Backend

- Database connection pooling
- WAL mode for concurrent reads
- Indexed columns for fast queries
- Session caching

### Database

- Composite indexes on frequently queried columns
- Foreign key indexes for joins
- Average rating computed on write (not read)
- Efficient query structure

---

## 🎓 FBLA Competition Alignment

### Code Quality (35 points)

✅ **Coding language selection** - JavaScript/Node.js chosen for full-stack capabilities
✅ **Comments and conventions** - Comprehensive documentation throughout
✅ **Modular and readable** - Clean separation, logical structure

### User Experience (35 points)

✅ **UX Design** - Professional journey from landing to conversion
✅ **Intuitive interface** - Self-explanatory with clear instructions
✅ **Easy navigation** - Logical flow between sections
✅ **Input validation** - Both syntactical and semantic validation

### Functionality (100 points)

✅ **Addresses all requirements** - Complete implementation
✅ **Presentable reports** - Clean business listings and reviews
✅ **Data storage** - Proper database with complex relationships

**Total Potential:** 100 points

---

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start with auto-reload (nodemon)
npm run init-db    # Initialize/reset database
```

### Adding Sample Data

The database initialization script (`init-database.js`) includes:
- 12 sample businesses across 3 categories
- 7 active deals and coupons
- 1 demo user account
- 3 sample reviews

You can modify this file to add your own sample data.

---

## 📝 License

This project was created for the FBLA Coding & Programming Competition 2025-26.

---

## 🏆 Competition Information

**Event:** Coding & Programming
**Topic:** Byte-Sized Business Boost
**Year:** 2025-26
**Organization:** Future Business Leaders of America (FBLA)

**Project Completion Date:** December 1st

---

## 👥 About

This web application demonstrates professional-grade software development practices suitable for real-world business applications. It showcases skills in:

- Full-stack web development
- Database design and management
- User authentication and security
- Modern UI/UX design
- API development
- Input validation and error handling

Created with attention to industry best practices and FBLA competition requirements.

---

**Good luck with your presentation! 🎉**
