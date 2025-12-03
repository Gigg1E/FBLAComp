# Local Business Reviews Website

A full-stack web application for reviewing and finding local businesses. Users can browse businesses, write reviews with star ratings, and discover deals. Business owners can post promotional deals for their businesses.

## Features

- **User Authentication**: Secure signup and login system with session-based authentication
- **Business Browsing**: Search and filter local businesses by name, category, and city
- **Review System**: Write detailed reviews with 1-5 star ratings (protected by captcha)
- **Deals**: Business owners can post time-limited deals and promotions
- **User Accounts**: View and manage your reviews from your account page
- **Help Center**: Comprehensive how-to guides and FAQs

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js with Express.js
- **Database**: SQLite
- **Authentication**: bcrypt password hashing, HTTP-only cookies
- **Security**: Custom math captcha for spam prevention

## Project Structure

```
FBLA/
├── config/
│   └── database.js           # Database configuration and helpers
├── database/
│   ├── schema.sql            # Database schema
│   ├── seed.sql              # Sample data
│   └── reviews.db            # SQLite database (auto-generated)
├── middleware/
│   ├── auth.js               # Authentication middleware
│   └── captcha.js            # Captcha generation and validation
├── routes/
│   ├── auth.js               # Authentication endpoints
│   ├── businesses.js         # Business CRUD operations
│   ├── reviews.js            # Review management with captcha
│   └── deals.js              # Deal posting and retrieval
├── public/
│   ├── css/                  # Stylesheets
│   └── js/                   # Client-side JavaScript
├── views/                    # HTML pages
├── scripts/                  # Utility scripts
├── server.js                 # Main application entry point
└── package.json              # Dependencies
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Setup Steps

1. **Install dependencies**
   
   ```bash
   npm install
   ```

2. **Initialize the database**
   
   ```bash
   npm run init-db
   ```

3. **Start the server**
   
   ```bash
   npm start
   ```

4. **Access the application**
   Open your browser and navigate to:
   
   ```
   http://localhost:3000
   ```

## Usage

### For Regular Users

1. **Create an Account**
   
   - Click "Sign Up" in the navigation
   - Fill in your email, username, and password
   - Select "Regular User" as account type
   - Submit the form

2. **Browse Businesses**
   
   - Click "Businesses" to view all businesses
   - Use the search bar to find specific businesses
   - Filter by category or city
   - Click on any business to view details

3. **Write a Review**
   
   - Navigate to a business detail page
   - Click "Write a Review" (must be logged in)
   - Select a star rating (1-5)
   - Enter a title and review text (minimum 20 characters)
   - Complete the math captcha
   - Submit your review

4. **View Your Reviews**
   
   - Click "Account" to see your profile
   - All your reviews are listed with links to businesses

### For Business Owners

1. **Create a Business Owner Account**
   
   - Sign up and select "Business Owner" as account type

2. **Post Deals**
   
   - After logging in, click "Post Deal"
   - Select your business from the dropdown
   - Enter deal details (title, description, discount amount)
   - Set start and end dates
   - Submit the deal

**Note**: To add a business to the system, contact an administrator or use the API endpoint (admin access required).

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Businesses

- `GET /api/businesses` - Get all businesses (with filters)
- `GET /api/businesses/:id` - Get single business
- `GET /api/businesses/:id/stats` - Get business statistics
- `POST /api/businesses` - Create business (admin only)

### Reviews

- `GET /api/reviews/business/:id` - Get reviews for a business
- `POST /api/reviews` - Create review (requires auth + captcha)
- `PUT /api/reviews/:id` - Update own review
- `DELETE /api/reviews/:id` - Delete own review

### Deals

- `GET /api/deals` - Get all active deals
- `GET /api/deals/business/:id` - Get deals for a business
- `POST /api/deals` - Create deal (business owner only)
- `PUT /api/deals/:id` - Update deal
- `DELETE /api/deals/:id` - Delete deal

### Captcha

- `GET /api/reviews/captcha/generate` - Generate math captcha
- Captcha is validated automatically on review submission

## Database Schema

### Users Table

- id, email, password_hash, username, role (user/business_owner/admin)

### Businesses Table

- id, name, category, address, city, state, zip_code, phone, email, website, description, owner_id

### Reviews Table

- id, business_id, user_id, rating (1-5), title, review_text
- Unique constraint: one review per user per business

### Deals Table

- id, business_id, title, description, discount_amount, start_date, end_date, active

### Sessions Table

- id, user_id, expires_at

## Security Features

- **Password Security**: Passwords hashed with bcrypt (10 rounds)
- **Session Management**: HTTP-only cookies, 7-day expiration
- **SQL Injection Prevention**: Parameterized queries
- **Captcha Protection**: Simple math captcha prevents spam reviews
- **One Review Per Business**: Database constraint prevents duplicate reviews
- **Role-Based Access**: Middleware enforces business owner and admin permissions

## Configuration

### Port Configuration

The server runs on port 3000 by default. To change this, set the `PORT` environment variable:

```bash
PORT=8080 npm start
```

### Session Duration

Sessions expire after 7 days. To modify this, edit `SESSION_DURATION_DAYS` in `routes/auth.js`.

### Captcha Expiration

Captchas expire after 5 minutes. To modify this, edit `CAPTCHA_EXPIRATION` in `middleware/captcha.js`.

## Sample Data

The seed file includes:

- 5 sample users (all with password: `password123`)
- 8 sample businesses across various categories
- 8 sample reviews
- 4 sample active deals

To reset the database with sample data:

```bash
npm run init-db
```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Adding New Routes

1. Create a new route file in `routes/`
2. Import and mount it in `server.js`

### Adding New Pages

1. Create HTML file in `views/`
2. Create corresponding JavaScript in `public/js/`
3. Link CSS files as needed

## Troubleshooting

### Database Issues

If you encounter database errors:

```bash
# Delete the database file
rm database/reviews.db

# Reinitialize
npm run init-db
```

### Port Already in Use

If port 3000 is already in use:

```bash
PORT=3001 npm start
```

### Module Not Found Errors

Reinstall dependencies:

```bash
rm -rf node_modules
npm install
```

## Future Enhancements

Potential features for future versions:

- Image uploads for businesses and reviews
- Email verification for new accounts
- Password reset functionality
- Business claim/verification process
- Advanced search with multiple filters
- User profile pictures
- Review voting (helpful/not helpful)
- Business categories with icons
- Map integration for business locations

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Support

For questions or issues:

- Check the Help page within the application
- Review this README
- Contact: support@localreviews.com

## Credits

Built for FBLA Web Development Competition 2025
