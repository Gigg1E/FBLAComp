# Byte-Sized Business Boost - Setup Guide

## FBLA Coding & Programming Competition 2025-26

This guide will help you set up and run the Byte-Sized Business Boost application.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)

To check if you have Node.js installed, run:
```bash
node --version
npm --version
```

If you don't have Node.js, download it from: https://nodejs.org/

---

## Installation Steps

### 1. Install Dependencies

Navigate to the project directory and install all required packages:

```bash
npm install
```

This will install:
- Express (web server framework)
- bcryptjs (password hashing)
- better-sqlite3 (database)
- express-session (session management)
- express-rate-limit (rate limiting for security)
- svg-captcha (CAPTCHA generation)
- connect-sqlite3 (session storage)

### 2. Initialize the Database

Create the database and populate it with sample data:

```bash
npm run init-db
```

This will:
- Create a SQLite database file (`business-boost.db`)
- Create all necessary tables (users, businesses, reviews, bookmarks, deals)
- Insert sample businesses, deals, and a demo user account
- Set up proper indexes for optimal performance

---

## Running the Application

### Start the Server

```bash
npm start
```

Or for development with auto-restart on file changes:

```bash
npm run dev
```

The server will start on port 3000. You should see:

```
╔════════════════════════════════════════════════════╗
║   Byte-Sized Business Boost Server Running        ║
╚════════════════════════════════════════════════════╝

🚀 Server: http://localhost:3000
📊 API: http://localhost:3000/api

📝 Demo Account:
   Email: demo@example.com
   Password: demo123
```

### Access the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

---

## Demo Account

A demo account has been created for testing:

- **Email:** demo@example.com
- **Password:** demo123

You can also create your own account using the "Sign Up" button.

---

## Features Overview

### User Features

1. **Account Management**
   - Register new account with CAPTCHA verification
   - Login with email and password
   - Secure password hashing with bcrypt
   - Session-based authentication

2. **Browse Businesses**
   - View all local businesses
   - Filter by category (Food, Retail, Services)
   - Sort by rating, number of reviews, or name
   - Search by name or description

3. **Business Details**
   - View full business information
   - See customer reviews and ratings
   - View active deals and coupons
   - Contact information and address

4. **Reviews & Ratings**
   - Leave reviews for businesses (authenticated users only)
   - Rate businesses from 1-5 stars
   - CAPTCHA verification to prevent bot reviews
   - One review per user per business

5. **Bookmarks**
   - Save favorite businesses
   - Quick access to saved businesses
   - Toggle bookmark status easily

6. **Deals & Coupons**
   - Browse all active deals
   - View coupon codes
   - See expiration dates
   - Filter by business category

### Security Features

1. **CAPTCHA Verification**
   - Required for registration
   - Required for login
   - Required for submitting reviews
   - Auto-generated SVG CAPTCHA

2. **Rate Limiting**
   - General API limit: 100 requests per 15 minutes
   - Auth endpoints: 5 attempts per 15 minutes
   - Prevents brute force attacks

3. **Input Validation**
   - Email format validation
   - Password strength requirements (min 6 chars, letters + numbers)
   - XSS prevention through input sanitization
   - SQL injection prevention through prepared statements

4. **Password Security**
   - Bcrypt hashing with 10 rounds
   - Never stored in plain text
   - Secure password comparison

---

## Database Structure

The application uses SQLite with the following tables:

### Users
- id, email, password_hash, full_name, created_at, last_login

### Businesses
- id, name, category, description, address, phone, email, website, image_url, average_rating, total_reviews

### Reviews
- id, business_id, user_id, rating, review_text, created_at
- Constraint: One review per user per business

### Bookmarks
- id, user_id, business_id, created_at
- Constraint: Unique user-business pairs

### Deals
- id, business_id, title, description, discount_percent, coupon_code, valid_until, is_active

---

## API Endpoints

### Authentication
- `GET /api/auth/session` - Check current session
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Businesses
- `GET /api/businesses` - List all businesses (with filters)
- `GET /api/businesses/:id` - Get business details
- `POST /api/businesses/:id/reviews` - Submit review (auth required)

### Bookmarks
- `GET /api/bookmarks` - Get user's bookmarks (auth required)
- `GET /api/bookmarks/check/:id` - Check if bookmarked (auth required)
- `POST /api/bookmarks/:id` - Add bookmark (auth required)
- `DELETE /api/bookmarks/:id` - Remove bookmark (auth required)

### Deals
- `GET /api/deals` - Get all active deals

### CAPTCHA
- `GET /api/captcha` - Generate new CAPTCHA image

---

## Project Structure

```
FBLAComp/
├── public/               # Frontend files
│   ├── index.html       # Main HTML page
│   ├── styles.css       # Professional CSS styling
│   └── app.js           # Frontend JavaScript
├── sessions/            # Session storage (auto-created)
├── server.js            # Backend Express server
├── init-database.js     # Database initialization script
├── package.json         # Node.js dependencies
├── SETUP.md            # This setup guide
├── business-boost.db   # SQLite database (created after init)
└── sessions.db         # Session database (auto-created)
```

---

## Troubleshooting

### Port 3000 Already in Use

If you see an error that port 3000 is in use, you can:

1. Stop the other application using port 3000, or
2. Change the port by setting the PORT environment variable:

```bash
PORT=3001 npm start
```

### Database Errors

If you encounter database errors:

1. Delete the existing database:
   ```bash
   rm business-boost.db
   ```

2. Reinitialize:
   ```bash
   npm run init-db
   ```

### Dependencies Not Installing

If `npm install` fails:

1. Delete node_modules and package-lock.json:
   ```bash
   rm -rf node_modules package-lock.json
   ```

2. Try installing again:
   ```bash
   npm install
   ```

---

## Development Notes

### Code Quality

The application follows industry best practices:

- **Modular code structure** - Separated concerns (frontend/backend)
- **Comprehensive comments** - Every function documented
- **Logical organization** - Clear file structure
- **Readable code** - Descriptive variable names, consistent formatting

### User Experience

Professional UX design includes:

- **User journey mapping** - Clear navigation flow
- **Responsive design** - Works on all screen sizes
- **Accessibility features** - Semantic HTML, proper labels
- **Intuitive interface** - Self-explanatory UI elements
- **Input validation** - Real-time feedback
- **Error handling** - Clear error messages

### Functionality

Complete implementation of all requirements:

- **Business sorting** by category, rating, and reviews
- **User reviews** with star ratings
- **Bookmark system** for favorite businesses
- **Deals and coupons** with expiration tracking
- **Bot prevention** through CAPTCHA and rate limiting

---

## Support

For issues or questions about this FBLA competition project, please refer to:

- FBLA Coding & Programming Competition Guidelines
- Project rubric and evaluation criteria

---

## License

This project was created for the FBLA Coding & Programming Competition 2025-26.

---

**Good luck with your FBLA presentation!**
