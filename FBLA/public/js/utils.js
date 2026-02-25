// API utility functions

async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (err) {
        console.error('API call error:', err);
        throw err;
    }
}

// Get current user
async function getCurrentUser() {
    try {
        return await apiCall('/api/auth/me');
    } catch (err) {
        return null;
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Show loading spinner
function showLoading(element) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.id = 'loading-spinner';

    if (element) {
        element.appendChild(spinner);
    } else {
        document.body.appendChild(spinner);
    }
}

// Hide loading spinner
function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Create star rating display
function createStarRating(rating, maxStars = 5) {
    const container = document.createElement('div');
    container.className = 'star-rating';

    for (let i = 1; i <= maxStars; i++) {
        const star = document.createElement('span');
        star.className = i <= rating ? 'star filled' : 'star';
        star.textContent = '★';
        container.appendChild(star);
    }

    return container;
}

// Create interactive star rating input
function createStarRatingInput(onChange) {
    const container = document.createElement('div');
    container.className = 'star-rating-input';
    let currentRating = 0;

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = '★';
        star.dataset.rating = i;

        star.addEventListener('click', () => {
            currentRating = i;
            updateStars();
            if (onChange) onChange(currentRating);
        });

        star.addEventListener('mouseenter', () => {
            highlightStars(i);
        });

        container.appendChild(star);
    }

    container.addEventListener('mouseleave', () => {
        updateStars();
    });

    function highlightStars(count) {
        const stars = container.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < count) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    function updateStars() {
        highlightStars(currentRating);
    }

    container.getRating = () => currentRating;
    container.setRating = (rating) => {
        currentRating = rating;
        updateStars();
    };

    return container;
}

// Update navigation based on auth state
async function updateNavigation() {
    const user = await getCurrentUser();
    const navLinks = document.querySelector('.nav-links');

    if (!navLinks) return;

    if (user) {
        navLinks.innerHTML = `
            <li><a href="/">Home</a></li>
            <li><a href="/businesses.html">Businesses</a></li>
            <li><a href="/my-account.html">Account</a></li>
            <li><a href="/help.html">Help</a></li>
            <li><a href="#" id="logout-btn">Logout</a></li>
        `;

        document.getElementById('logout-btn').addEventListener('click', async (e) => {
            e.preventDefault();
            await logout();
        });
    } else {
        navLinks.innerHTML = `
            <li><a href="/">Home</a></li>
            <li><a href="/businesses.html">Businesses</a></li>
            <li><a href="/help.html">Help</a></li>
            <li><a href="/login.html">Login</a></li>
            <li><a href="/signup.html">Sign Up</a></li>
        `;
    }
}

// Logout function
async function logout() {
    try {
        await apiCall('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (err) {
        showAlert('Logout failed', 'error');
    }
}

// Get query parameter from URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Update query parameter in URL without reload
function updateQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize page - run common setup
async function initializePage() {
    await updateNavigation();
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiCall,
        getCurrentUser,
        showAlert,
        showLoading,
        hideLoading,
        formatDate,
        createStarRating,
        createStarRatingInput,
        updateNavigation,
        logout,
        getQueryParam,
        updateQueryParam,
        isValidEmail,
        debounce,
        initializePage
    };
}
