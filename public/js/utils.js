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

// Show alert message as a toast notification at bottom-center
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-toast`;
    alertDiv.textContent = message;

    // Create a toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    toastContainer.appendChild(alertDiv);

    // Add animation class after a tiny delay to trigger CSS transition
    setTimeout(() => {
        alertDiv.classList.add('alert-show');
    }, 10);

    // Remove after 3 seconds with fade-out animation
    setTimeout(() => {
        alertDiv.classList.remove('alert-show');
        setTimeout(() => {
            alertDiv.remove();
        }, 300); // match CSS transition duration
    }, 3000);
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
            <li><a href="/deals.html">Deals</a></li>
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
            <li><a href="/deals.html">Deals</a></li>
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

/* Theme utilities: set, toggle, and load saved/system theme */
function setTheme(name) {
    if (name === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    try {
        localStorage.setItem('site-theme', name);
    } catch (e) {
        // ignore storage errors
    }
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(isDark ? 'light' : 'dark');
}

function loadSavedTheme() {
    // Always force dark theme for the site per project requirement
    try {
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch (e) {
        // ignore
    }
}

// Force dark theme immediately
loadSavedTheme();

/* Scroll reveal animations using IntersectionObserver */
function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    const reveals = Array.from(document.querySelectorAll('.reveal'));
    // assign an index so we can stagger reveals in document order
    reveals.forEach((el, i) => el.dataset.revealIndex = i);

    const observer = new IntersectionObserver((entries) => {
        // sort entries so reveal order follows document flow
        entries.sort((a, b) => (a.target.dataset.revealIndex - b.target.dataset.revealIndex));
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const idx = parseInt(entry.target.dataset.revealIndex || 0, 10);
                // staggered delay: 120ms per index (clamped)
                const delay = Math.min(idx * 120, 700);
                entry.target.style.transitionDelay = delay + 'ms';
                // ensure CSS animations respect the same stagger
                entry.target.style.animationDelay = delay + 'ms';
                entry.target.classList.add('revealed');
                // optionally add a stronger animation class for larger elements
                entry.target.classList.add('animate-strong');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    reveals.forEach(el => observer.observe(el));
}

/* Smooth anchor link scrolling */
function initSmoothLinks() {
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const href = a.getAttribute('href');
        if (href === '#' || href === '') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

/* Cursor follower: subtle circle that lags behind the cursor */
function initCursorFollower() {
    try {
        const follower = document.createElement('div');
        follower.id = 'cursor-follower';
        document.body.appendChild(follower);

        let mouseX = 0, mouseY = 0;
        let posX = 0, posY = 0;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animate() {
            posX += (mouseX - posX) * 0.15;
            posY += (mouseY - posY) * 0.15;
            follower.style.left = posX + 'px';
            follower.style.top = posY + 'px';
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);

        // enlarge on hover of interactive elements
        const interactiveSelectors = 'a, button, .btn, .card, .form-input, input[type="submit"]';
        document.querySelectorAll(interactiveSelectors).forEach(el => {
            el.addEventListener('mouseenter', () => follower.classList.add('cursor-enlarge'));
            el.addEventListener('mouseleave', () => follower.classList.remove('cursor-enlarge'));
        });
    } catch (e) {
        // fail silently
    }
}

// Initialize UI helpers
document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initSmoothLinks();
    initCursorFollower();
    // Hero intro: add entrance classes to title and subtitle
    try {
        const heroTitle = document.querySelector('.hero-title');
        const heroSub = document.querySelector('.hero-subtitle');
        if (heroTitle) heroTitle.classList.add('hero-entrance');
        if (heroSub) heroSub.classList.add('hero-entrance');
    } catch (e) {}

    // Hide hero arrow once the user scrolls a bit
    try {
        const arrow = document.querySelector('.hero-arrow');
        if (arrow) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 40) arrow.classList.add('hidden');
                else arrow.classList.remove('hidden');
            }, { passive: true });
        }
    } catch (e) {}
});

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
