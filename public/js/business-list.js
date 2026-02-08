let currentPage = 1;
let currentFilters = {
    search: '',
    category: '',
    city: ''
};
let userBookmarks = new Set();

// Load businesses with filters
async function loadBusinesses() {
    try {
        showLoading(document.getElementById('businesses-container'));

        const params = new URLSearchParams({
            page: currentPage,
            limit: 12,
            ...currentFilters
        });

        // Remove empty filters
        for (const [key, value] of [...params.entries()]) {
            if (!value) params.delete(key);
        }

        const data = await apiCall(`/api/businesses?${params.toString()}`);

        // Load bookmarks if user is logged in
        const currentUser = await getCurrentUser();
        if (currentUser) {
            await loadUserBookmarks();
        }

        const container = document.getElementById('businesses-container');

        hideLoading();

        if (data.businesses.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No businesses found</p></div>';
            return;
        }

        container.innerHTML = data.businesses.map(business => createBusinessCard(business, currentUser)).join('');

        renderPagination(data.pagination);
    } catch (err) {
        hideLoading();
        console.error('Error loading businesses:', err);
        showAlert('Failed to load businesses', 'error');
    }
}

// Render pagination controls
function renderPagination(pagination) {
    const container = document.getElementById('pagination');

    if (pagination.pages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `
        <button class="pagination-btn" ${pagination.page === 1 ? 'disabled' : ''} onclick="goToPage(${pagination.page - 1})">
            Previous
        </button>
    `;

    // Page numbers
    for (let i = 1; i <= pagination.pages; i++) {
        if (i === 1 || i === pagination.pages || (i >= pagination.page - 1 && i <= pagination.page + 1)) {
            html += `
                <button class="pagination-btn ${i === pagination.page ? 'active' : ''}" onclick="goToPage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === pagination.page - 2 || i === pagination.page + 2) {
            html += '<span>...</span>';
        }
    }

    // Next button
    html += `
        <button class="pagination-btn" ${pagination.page === pagination.pages ? 'disabled' : ''} onclick="goToPage(${pagination.page + 1})">
            Next
        </button>
    `;

    container.innerHTML = html;
}

// Go to specific page
function goToPage(page) {
    currentPage = page;
    loadBusinesses();
    window.scrollTo(0, 0);
}

// Load categories for dropdown
async function loadCategories() {
    try {
        const data = await apiCall('/api/businesses/meta/categories');
        const select = document.getElementById('category');

        data.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading categories:', err);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();
    loadCategories();

    // Check for URL parameters and pre-fill filters
    const urlParams = new URLSearchParams(window.location.search);
    const searchInput = document.getElementById('search');
    const categorySelect = document.getElementById('category');
    const cityInput = document.getElementById('city');

    // Pre-fill search from URL parameter
    if (urlParams.has('search')) {
        const searchTerm = urlParams.get('search');
        searchInput.value = searchTerm;
        currentFilters.search = searchTerm;
    }

    // Pre-fill category from URL parameter
    if (urlParams.has('category')) {
        const category = urlParams.get('category');
        categorySelect.value = category;
        currentFilters.category = category;
    }

    // Pre-fill city from URL parameter
    if (urlParams.has('city')) {
        const city = urlParams.get('city');
        cityInput.value = city;
        currentFilters.city = city;
    }

    loadBusinesses();

    // Set up filter listeners with debounce

    const debouncedSearch = debounce(() => {
        currentFilters.search = searchInput.value.trim();
        currentPage = 1;
        loadBusinesses();
    }, 500);

    searchInput.addEventListener('input', debouncedSearch);

    categorySelect.addEventListener('change', () => {
        currentFilters.category = categorySelect.value;
        currentPage = 1;
        loadBusinesses();
    });

    const debouncedCity = debounce(() => {
        currentFilters.city = cityInput.value.trim();
        currentPage = 1;
        loadBusinesses();
    }, 500);

    cityInput.addEventListener('input', debouncedCity);
});

// Load user's bookmarks
async function loadUserBookmarks() {
    try {
        const data = await apiCall('/api/bookmarks/my/bookmarks');
        userBookmarks = new Set(data.bookmarks.map(b => b.id));
    } catch (err) {
        console.error('Error loading bookmarks:', err);
        userBookmarks = new Set();
    }
}

// Create business card HTML
function createBusinessCard(business, currentUser) {
    const isBookmarked = userBookmarks.has(business.id);
    const bookmarkBtn = currentUser ? `
        <button
            class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}"
            onclick="event.stopPropagation(); toggleBookmark(${business.id})"
            aria-label="${isBookmarked ? 'Remove bookmark' : 'Add bookmark'}"
            title="${isBookmarked ? 'Remove bookmark' : 'Save business'}"
        >
            ${isBookmarked ? '⛊' : '⛉'}
        </button>
    ` : `
        <button
            class="bookmark-btn"
            onclick="event.stopPropagation(); showLoginPrompt()"
            aria-label="Login to bookmark"
            title="Login to save businesses"
        >
            ${isBookmarked ? '⛊' : '⛉'}
        </button>
    `;

    return `
        <div class="card business-card" onclick="window.location.href='/business-detail.html?id=${business.id}'">
            ${bookmarkBtn}
            ${business.image_url ? `<img src="${business.image_url}" alt="${business.name}" class="business-card-image">` : ''}
            <span class="business-card-category">${business.category}</span>
            <h3 class="card-title">${business.name}</h3>
            <div class="flex gap-sm mb-sm">
                ${createStarRating(Math.round(business.average_rating)).outerHTML}
                <span class="text-secondary text-sm">(${business.review_count} reviews)</span>
            </div>
            <p class="text-secondary text-sm">${business.city}, ${business.state}</p>
            ${business.description ? `<p class="text-secondary">${business.description.substring(0, 100)}...</p>` : ''}
        </div>
    `;
}

// Toggle bookmark
async function toggleBookmark(businessId) {
    try {
        const isBookmarked = userBookmarks.has(businessId);

        if (isBookmarked) {
            // Remove bookmark
            await apiCall(`/api/bookmarks/${businessId}`, { method: 'DELETE' });
            userBookmarks.delete(businessId);
            showAlert('Bookmark removed', 'success');
        } else {
            // Add bookmark
            await apiCall('/api/bookmarks', {
                method: 'POST',
                body: JSON.stringify({ businessId })
            });
            userBookmarks.add(businessId);
            showAlert('Business bookmarked', 'success');
        }

        // Update the button in the UI
        updateBookmarkButton(businessId, !isBookmarked);
    } catch (err) {
        console.error('Error toggling bookmark:', err);
        showAlert(err.message || 'Failed to update bookmark', 'error');
    }
}

// Update bookmark button appearance
function updateBookmarkButton(businessId, isBookmarked) {
    const cards = document.querySelectorAll('.business-card');
    cards.forEach(card => {
        const cardLink = card.getAttribute('onclick');
        if (cardLink && cardLink.includes(`id=${businessId}`)) {
            const btn = card.querySelector('.bookmark-btn');
            if (btn) {
                btn.innerHTML = isBookmarked ? '⛊' : '⛉';
                btn.classList.toggle('bookmarked', isBookmarked);
                btn.setAttribute('aria-label', isBookmarked ? 'Remove bookmark' : 'Add bookmark');
                btn.setAttribute('title', isBookmarked ? 'Remove bookmark' : 'Save business');
            }
        }
    });
}

// Show login prompt
function showLoginPrompt() {
    if (confirm('Please log in to save businesses. Go to login page?')) {
        window.location.href = '/login.html';
    }
}
