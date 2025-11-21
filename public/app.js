/**
 * Byte-Sized Business Boost - Frontend Application
 * FBLA Coding & Programming Competition 2025-26
 *
 * This JavaScript file handles all client-side functionality including:
 * - User authentication (login/register)
 * - Business listing, searching, filtering, and sorting
 * - Reviews and ratings
 * - Bookmark management
 * - Deals and coupons
 * - CAPTCHA verification
 */

// Global state management
const appState = {
  currentUser: null,
  currentSection: 'home',
  businesses: [],
  deals: [],
  bookmarks: [],
  currentBusinessId: null
};

/**
 * Initialize application on page load
 * Checks user session and loads initial data
 */
document.addEventListener('DOMContentLoaded', async () => {
  await checkSession();
  await loadBusinesses();
  await loadDeals();
  updateStats();
  initializeEventListeners();
});

/**
 * Initialize event listeners for search, filters, and star rating
 */
function initializeEventListeners() {
  // Search input with debouncing for better performance
  const searchInput = document.getElementById('searchInput');
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadBusinesses();
    }, 300); // Wait 300ms after user stops typing
  });

  // Category filter
  document.getElementById('categoryFilter').addEventListener('change', loadBusinesses);

  // Sort select
  document.getElementById('sortSelect').addEventListener('change', loadBusinesses);

  // Star rating interaction
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', function() {
      const rating = this.getAttribute('data-rating');
      document.getElementById('reviewRating').value = rating;

      // Update star display
      stars.forEach((s, index) => {
        if (index < rating) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });

    // Hover effect for stars
    star.addEventListener('mouseenter', function() {
      const rating = this.getAttribute('data-rating');
      stars.forEach((s, index) => {
        if (index < rating) {
          s.style.color = '#f59e0b';
        }
      });
    });
  });

  // Reset stars on mouse leave
  const starRating = document.getElementById('starRating');
  starRating.addEventListener('mouseleave', () => {
    const currentRating = document.getElementById('reviewRating').value;
    stars.forEach((s, index) => {
      if (index < currentRating) {
        s.style.color = '#f59e0b';
      } else {
        s.style.color = '#e2e8f0';
      }
    });
  });
}

/**
 * Check if user is logged in
 * Updates UI based on authentication status
 */
async function checkSession() {
  try {
    const response = await fetch('/api/auth/session');
    const data = await response.json();

    if (data.authenticated) {
      appState.currentUser = data.user;
      updateUIForLoggedInUser();
      if (appState.currentSection === 'bookmarks') {
        await loadBookmarks();
      }
    } else {
      appState.currentUser = null;
      updateUIForLoggedOutUser();
    }
  } catch (error) {
    console.error('Session check error:', error);
  }
}

/**
 * Update UI elements for authenticated user
 */
function updateUIForLoggedInUser() {
  document.getElementById('loginBtn').style.display = 'none';
  document.getElementById('registerBtn').style.display = 'none';
  document.getElementById('userMenu').style.display = 'flex';
  document.getElementById('userName').textContent = appState.currentUser.fullName;
  document.getElementById('bookmarksLink').style.display = 'block';
}

/**
 * Update UI elements for unauthenticated user
 */
function updateUIForLoggedOutUser() {
  document.getElementById('loginBtn').style.display = 'inline-block';
  document.getElementById('registerBtn').style.display = 'inline-block';
  document.getElementById('userMenu').style.display = 'none';
  document.getElementById('bookmarksLink').style.display = 'none';
}

/**
 * Load and display all businesses with filtering and sorting
 */
async function loadBusinesses() {
  try {
    const category = document.getElementById('categoryFilter').value;
    const sort = document.getElementById('sortSelect').value;
    const search = document.getElementById('searchInput').value;

    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (sort) params.append('sort', sort);
    if (search) params.append('search', search);

    const response = await fetch(`/api/businesses?${params}`);
    appState.businesses = await response.json();

    displayBusinesses(appState.businesses, 'businessGrid');
  } catch (error) {
    console.error('Error loading businesses:', error);
    showError('Failed to load businesses. Please try again.');
  }
}

/**
 * Display businesses in a grid layout
 * @param {Array} businesses - Array of business objects
 * @param {string} containerId - ID of the container element
 */
function displayBusinesses(businesses, containerId) {
  const container = document.getElementById(containerId);

  if (!businesses || businesses.length === 0) {
    container.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-tertiary);">
        <h3>No businesses found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    `;
    return;
  }

  container.innerHTML = businesses.map(business => `
    <div class="business-card" onclick="showBusinessDetails(${business.id})">
      <img src="${business.image_url}" alt="${business.name}" class="business-image" onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
      <div class="business-content">
        <div class="business-header">
          <h3 class="business-name">${escapeHtml(business.name)}</h3>
          <span class="business-category">${escapeHtml(business.category)}</span>
        </div>
        <div class="business-rating">
          <span class="stars">${renderStars(business.average_rating)}</span>
          <span class="rating-text">
            ${business.average_rating ? business.average_rating.toFixed(1) : 'No ratings'}
            ${business.total_reviews ? `(${business.total_reviews} reviews)` : ''}
          </span>
        </div>
        <p class="business-description">${escapeHtml(business.description) || 'No description available'}</p>
        <div class="business-actions">
          <button class="btn-icon" onclick="event.stopPropagation(); showBusinessDetails(${business.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            View Details
          </button>
          ${appState.currentUser ? `
            <button class="btn-icon bookmark-btn" id="bookmark-${business.id}" onclick="event.stopPropagation(); toggleBookmark(${business.id})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Save
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');

  // Update bookmark button states
  if (appState.currentUser) {
    businesses.forEach(business => {
      checkBookmarkStatus(business.id);
    });
  }
}

/**
 * Render star rating visualization
 * @param {number} rating - Rating value (0-5)
 * @returns {string} HTML string of star icons
 */
function renderStars(rating) {
  const fullStars = Math.floor(rating || 0);
  const hasHalfStar = (rating % 1) >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let stars = '★'.repeat(fullStars);
  if (hasHalfStar) stars += '⯨';
  stars += '☆'.repeat(emptyStars);

  return stars;
}

/**
 * Show detailed view of a business
 * Includes full information, reviews, and deals
 * @param {number} businessId - ID of the business to display
 */
async function showBusinessDetails(businessId) {
  try {
    const response = await fetch(`/api/businesses/${businessId}`);
    const business = await response.json();

    appState.currentBusinessId = businessId;

    document.getElementById('businessModalTitle').textContent = business.name;
    document.getElementById('businessModalContent').innerHTML = `
      <div class="business-detail-header">
        <img src="${business.image_url}" alt="${business.name}" class="business-detail-image" onerror="this.src='https://via.placeholder.com/800x300?text=No+Image'">

        <div class="business-detail-info">
          <div class="info-row">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>${escapeHtml(business.address)}</span>
          </div>
          ${business.phone ? `
            <div class="info-row">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 16.92V19.92C22 20.4728 21.5523 20.92 21 20.92H3C2.44772 20.92 2 20.4728 2 19.92V16.92" stroke="currentColor" stroke-width="2"/>
                <path d="M15.5 5.5L12 2L8.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>${escapeHtml(business.phone)}</span>
            </div>
          ` : ''}
          ${business.email ? `
            <div class="info-row">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M2 7L12 13L22 7" stroke="currentColor" stroke-width="2"/>
              </svg>
              <span>${escapeHtml(business.email)}</span>
            </div>
          ` : ''}
          ${business.website ? `
            <div class="info-row">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M2 12H22M12 2C14.5 4.5 16 8 16 12C16 16 14.5 19.5 12 22M12 2C9.5 4.5 8 8 8 12C8 16 9.5 19.5 12 22" stroke="currentColor" stroke-width="2"/>
              </svg>
              <a href="${escapeHtml(business.website)}" target="_blank">${escapeHtml(business.website)}</a>
            </div>
          ` : ''}
          <div class="info-row">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span class="stars" style="color: #f59e0b;">${renderStars(business.average_rating)}</span>
            <span>${business.average_rating ? business.average_rating.toFixed(1) : 'No ratings'} (${business.total_reviews || 0} reviews)</span>
          </div>
        </div>

        <p style="margin-top: 1rem; color: var(--text-secondary);">${escapeHtml(business.description)}</p>
      </div>

      ${business.deals && business.deals.length > 0 ? `
        <div class="business-detail-section">
          <h4 class="section-title-small">Active Deals & Coupons</h4>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${business.deals.map(deal => `
              <div class="deal-card" style="margin-bottom: 0;">
                <div class="deal-header">
                  <div class="deal-title">${escapeHtml(deal.title)}</div>
                  ${deal.discount_percent ? `<div style="color: var(--accent-color); font-weight: 700;">${deal.discount_percent}% OFF</div>` : ''}
                </div>
                <div class="deal-description">${escapeHtml(deal.description)}</div>
                ${deal.coupon_code ? `
                  <div class="deal-details">
                    <div class="deal-code">${escapeHtml(deal.coupon_code)}</div>
                    ${deal.valid_until ? `<div class="deal-expiry">Valid until ${new Date(deal.valid_until).toLocaleDateString()}</div>` : ''}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="business-detail-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h4 class="section-title-small">Customer Reviews</h4>
          ${appState.currentUser ? `
            <button class="btn btn-primary" onclick="openReviewModal(${businessId})">Write a Review</button>
          ` : `
            <button class="btn btn-outline" onclick="showModal('loginModal')">Login to Review</button>
          `}
        </div>

        ${business.reviews && business.reviews.length > 0 ? `
          <div class="reviews-list">
            ${business.reviews.map(review => `
              <div class="review-item">
                <div class="review-header">
                  <span class="review-author">${escapeHtml(review.user_name)}</span>
                  <span class="review-date">${new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                <div class="review-stars">${renderStars(review.rating)}</div>
                ${review.review_text ? `<div class="review-text">${escapeHtml(review.review_text)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="no-reviews">
            <p>No reviews yet. Be the first to review this business!</p>
          </div>
        `}
      </div>
    `;

    showModal('businessModal');
  } catch (error) {
    console.error('Error loading business details:', error);
    showError('Failed to load business details');
  }
}

/**
 * Load and display all active deals
 */
async function loadDeals() {
  try {
    const response = await fetch('/api/deals');
    appState.deals = await response.json();
    displayDeals();
  } catch (error) {
    console.error('Error loading deals:', error);
  }
}

/**
 * Display deals in the deals section
 */
function displayDeals() {
  const container = document.getElementById('dealsGrid');

  if (!appState.deals || appState.deals.length === 0) {
    container.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-tertiary);">
        <h3>No active deals at the moment</h3>
        <p>Check back soon for exclusive offers!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = appState.deals.map(deal => `
    <div class="deal-card">
      <div class="deal-header">
        <div class="deal-title">${escapeHtml(deal.title)}</div>
        <div class="deal-business">${escapeHtml(deal.business_name)} • ${escapeHtml(deal.business_category)}</div>
      </div>
      <div class="deal-description">${escapeHtml(deal.description)}</div>
      <div class="deal-details">
        ${deal.discount_percent ? `
          <div style="text-align: center; font-size: 1.5rem; font-weight: 700; color: var(--accent-color);">
            ${deal.discount_percent}% OFF
          </div>
        ` : ''}
        ${deal.coupon_code ? `<div class="deal-code">${escapeHtml(deal.coupon_code)}</div>` : ''}
        ${deal.valid_until ? `<div class="deal-expiry">Valid until ${new Date(deal.valid_until).toLocaleDateString()}</div>` : ''}
      </div>
    </div>
  `).join('');
}

/**
 * Load and display user's bookmarked businesses
 */
async function loadBookmarks() {
  if (!appState.currentUser) {
    showSection('home');
    showError('Please login to view your bookmarks');
    return;
  }

  try {
    const response = await fetch('/api/bookmarks');
    appState.bookmarks = await response.json();
    displayBusinesses(appState.bookmarks, 'bookmarksGrid');
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    showError('Failed to load bookmarks');
  }
}

/**
 * Check if a business is bookmarked
 * @param {number} businessId - ID of the business
 */
async function checkBookmarkStatus(businessId) {
  if (!appState.currentUser) return;

  try {
    const response = await fetch(`/api/bookmarks/check/${businessId}`);
    const data = await response.json();

    const btn = document.getElementById(`bookmark-${businessId}`);
    if (btn) {
      if (data.bookmarked) {
        btn.classList.add('bookmarked');
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"/>
          </svg>
          Saved
        `;
      }
    }
  } catch (error) {
    console.error('Error checking bookmark:', error);
  }
}

/**
 * Toggle bookmark status for a business
 * @param {number} businessId - ID of the business
 */
async function toggleBookmark(businessId) {
  if (!appState.currentUser) {
    showModal('loginModal');
    return;
  }

  try {
    const btn = document.getElementById(`bookmark-${businessId}`);
    const isBookmarked = btn.classList.contains('bookmarked');

    if (isBookmarked) {
      // Remove bookmark
      await fetch(`/api/bookmarks/${businessId}`, { method: 'DELETE' });
      btn.classList.remove('bookmarked');
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Save
      `;
    } else {
      // Add bookmark
      await fetch(`/api/bookmarks/${businessId}`, { method: 'POST' });
      btn.classList.add('bookmarked');
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"/>
        </svg>
        Saved
      `;
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    showError('Failed to update bookmark');
  }
}

/**
 * Open review modal and load CAPTCHA
 * @param {number} businessId - ID of business to review
 */
function openReviewModal(businessId) {
  document.getElementById('reviewBusinessId').value = businessId;
  document.getElementById('reviewForm').reset();
  document.getElementById('reviewRating').value = '';

  // Reset stars
  document.querySelectorAll('.star').forEach(star => {
    star.classList.remove('active');
    star.style.color = '#e2e8f0';
  });

  refreshCaptcha('review');
  closeModal('businessModal');
  showModal('reviewModal');
}

/**
 * Handle review form submission
 * @param {Event} event - Form submit event
 */
async function handleReviewSubmit(event) {
  event.preventDefault();

  const businessId = document.getElementById('reviewBusinessId').value;
  const rating = document.getElementById('reviewRating').value;
  const reviewText = document.getElementById('reviewText').value;
  const captcha = document.getElementById('reviewCaptcha').value;

  if (!rating) {
    showFormError('reviewError', 'Please select a rating');
    return;
  }

  try {
    const response = await fetch(`/api/businesses/${businessId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, reviewText, captcha })
    });

    const data = await response.json();

    if (response.ok) {
      closeModal('reviewModal');
      showSuccess('Review submitted successfully!');
      await loadBusinesses();
      showBusinessDetails(businessId);
    } else {
      showFormError('reviewError', data.error || 'Failed to submit review');
      refreshCaptcha('review');
    }
  } catch (error) {
    console.error('Review submission error:', error);
    showFormError('reviewError', 'Failed to submit review. Please try again.');
    refreshCaptcha('review');
  }
}

/**
 * Handle user registration
 * @param {Event} event - Form submit event
 */
async function handleRegister(event) {
  event.preventDefault();

  const fullName = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const captcha = document.getElementById('registerCaptcha').value;

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, captcha })
    });

    const data = await response.json();

    if (response.ok) {
      closeModal('registerModal');
      await checkSession();
      showSuccess('Account created successfully!');
    } else {
      showFormError('registerError', data.error || 'Registration failed');
      refreshCaptcha('register');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showFormError('registerError', 'Registration failed. Please try again.');
    refreshCaptcha('register');
  }
}

/**
 * Handle user login
 * @param {Event} event - Form submit event
 */
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const captcha = document.getElementById('loginCaptcha').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, captcha })
    });

    const data = await response.json();

    if (response.ok) {
      closeModal('loginModal');
      await checkSession();
      showSuccess(`Welcome back, ${data.user.fullName}!`);
    } else {
      showFormError('loginError', data.error || 'Login failed');
      refreshCaptcha('login');
    }
  } catch (error) {
    console.error('Login error:', error);
    showFormError('loginError', 'Login failed. Please try again.');
    refreshCaptcha('login');
  }
}

/**
 * Handle user logout
 */
async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    appState.currentUser = null;
    updateUIForLoggedOutUser();
    showSection('home');
    showSuccess('Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Refresh CAPTCHA image
 * @param {string} type - Type of CAPTCHA (login, register, review)
 */
function refreshCaptcha(type) {
  const img = document.getElementById(`${type}CaptchaImage`);
  img.src = `/api/captcha?t=${Date.now()}`;
}

/**
 * Show modal dialog
 * @param {string} modalId - ID of modal to show
 */
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add('active');

  // Load CAPTCHA for auth modals
  if (modalId === 'loginModal') {
    refreshCaptcha('login');
  } else if (modalId === 'registerModal') {
    refreshCaptcha('register');
  }
}

/**
 * Close modal dialog
 * @param {string} modalId - ID of modal to close
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove('active');

  // Clear form errors
  const errorElements = modal.querySelectorAll('.error-message');
  errorElements.forEach(el => el.classList.remove('active'));
}

/**
 * Show section and update navigation
 * @param {string} sectionId - ID of section to display
 */
async function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.section, .hero').forEach(section => {
    section.style.display = 'none';
  });

  // Show selected section
  const section = document.getElementById(sectionId);
  if (section) {
    section.style.display = 'block';
  }

  // Update navigation links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });

  const activeLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  appState.currentSection = sectionId;

  // Load section-specific data
  if (sectionId === 'bookmarks') {
    await loadBookmarks();
  } else if (sectionId === 'businesses' && appState.businesses.length === 0) {
    await loadBusinesses();
  } else if (sectionId === 'deals' && appState.deals.length === 0) {
    await loadDeals();
  }
}

/**
 * Update statistics on home page
 */
function updateStats() {
  fetch('/api/businesses')
    .then(res => res.json())
    .then(businesses => {
      const totalReviews = businesses.reduce((sum, b) => sum + (b.total_reviews || 0), 0);
      document.getElementById('totalBusinesses').textContent = businesses.length;
      document.getElementById('totalReviews').textContent = totalReviews;
    });

  fetch('/api/deals')
    .then(res => res.json())
    .then(deals => {
      document.getElementById('totalDeals').textContent = deals.length;
    });
}

/**
 * Display form error message
 * @param {string} elementId - ID of error element
 * @param {string} message - Error message to display
 */
function showFormError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.classList.add('active');

  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorElement.classList.remove('active');
  }, 5000);
}

/**
 * Display success notification
 * @param {string} message - Success message
 */
function showSuccess(message) {
  // Simple alert for now - could be enhanced with custom notification component
  alert(message);
}

/**
 * Display error notification
 * @param {string} message - Error message
 */
function showError(message) {
  alert(message);
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Close modals when clicking outside
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('active');
  }
};
