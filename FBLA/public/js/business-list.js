let currentPage = 1;
let currentFilters = {
    search: '',
    category: '',
    city: ''
};

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
        const container = document.getElementById('businesses-container');

        hideLoading();

        if (data.businesses.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No businesses found</p></div>';
            return;
        }

        container.innerHTML = data.businesses.map(business => `
            <div class="card business-card" onclick="window.location.href='/business-detail.html?id=${business.id}'">
                ${business.image_url ? `<img src="${business.image_url}" alt="${business.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0; margin: -1rem -1rem 1rem -1rem;">` : ''}
                <span class="business-card-category">${business.category}</span>
                <h3 class="card-title">${business.name}</h3>
                <div class="flex gap-sm mb-sm">
                    ${createStarRating(Math.round(business.average_rating)).outerHTML}
                    <span class="text-secondary text-sm">(${business.review_count} reviews)</span>
                </div>
                <p class="text-secondary text-sm">${business.city}, ${business.state}</p>
                ${business.description ? `<p class="text-secondary">${business.description.substring(0, 100)}...</p>` : ''}
            </div>
        `).join('');

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
    loadBusinesses();

    // Set up filter listeners with debounce
    const searchInput = document.getElementById('search');
    const categorySelect = document.getElementById('category');
    const cityInput = document.getElementById('city');

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
