let businessId = null;
let currentReviewPage = 1;

// Load business details
async function loadBusinessDetails() {
    try {
        businessId = getQueryParam('id');

        if (!businessId) {
            window.location.href = '/businesses.html';
            return;
        }

        const data = await apiCall(`/api/businesses/${businessId}`);
        const business = data.business;

        document.title = `${business.name} - LocalReviews`;

        const container = document.getElementById('business-header');
        container.innerHTML = `
            <h1 class="business-title">${business.name}</h1>
            <span class="business-card-category">${business.category}</span>

            <div class="business-rating-summary">
                <div class="rating-number">${business.average_rating.toFixed(1)}</div>
                <div class="rating-details">
                    ${createStarRating(Math.round(business.average_rating)).outerHTML}
                    <span class="text-secondary">${business.review_count} reviews</span>
                </div>
            </div>

            <div class="business-info">
                <div class="business-info-item">
                    <span>📍</span>
                    <span>${business.address}, ${business.city}, ${business.state} ${business.zip_code}</span>
                </div>
                ${business.phone ? `
                    <div class="business-info-item">
                        <span>📞</span>
                        <span>${business.phone}</span>
                    </div>
                ` : ''}
                ${business.email ? `
                    <div class="business-info-item">
                        <span>📧</span>
                        <a href="mailto:${business.email}">${business.email}</a>
                    </div>
                ` : ''}
                ${business.website ? `
                    <div class="business-info-item">
                        <span>🌐</span>
                        <a href="${business.website}" target="_blank">${business.website}</a>
                    </div>
                ` : ''}
            </div>

            ${business.description ? `<p class="mt-md">${business.description}</p>` : ''}
        `;

        // Show write review button if logged in
        const user = await getCurrentUser();
        if (user) {
            document.getElementById('write-review-btn').style.display = 'block';
        }

    } catch (err) {
        console.error('Error loading business:', err);
        showAlert('Failed to load business details', 'error');
    }
}

// Load active deals
async function loadDeals() {
    try {
        const data = await apiCall(`/api/deals/business/${businessId}`);

        if (data.deals.length === 0) {
            return;
        }

        const container = document.getElementById('deals-section');
        container.innerHTML = `
            <h2 class="mb-md">Active Deals</h2>
            <div class="deals-grid">
                ${data.deals.map(deal => `
                    <div class="card deal-card">
                        <div class="deal-card-header">
                            <h3 class="deal-title">${deal.title}</h3>
                            <div class="deal-tag">${deal.discount_amount}</div>
                        </div>
                        <p class="text-secondary">${deal.description}</p>
                        <p class="deal-dates text-sm">Valid until ${formatDate(deal.end_date)}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error('Error loading deals:', err);
    }
}

// Load reviews
async function loadReviews() {
    try {
        const data = await apiCall(`/api/reviews/business/${businessId}?page=${currentReviewPage}&limit=10`);
        const container = document.getElementById('reviews-container');

        if (data.reviews.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No reviews yet. Be the first to review!</p></div>';
            return;
        }

        container.innerHTML = data.reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div>
                        <div class="review-author">${review.username}</div>
                        ${createStarRating(review.rating).outerHTML}
                    </div>
                    <div class="review-date">${formatDate(review.created_at)}</div>
                </div>
                <h4 class="review-title">${review.title}</h4>
                <p class="review-text">${review.review_text}</p>
            </div>
        `).join('');

        renderReviewPagination(data.pagination);
    } catch (err) {
        console.error('Error loading reviews:', err);
    }
}

// Render review pagination
function renderReviewPagination(pagination) {
    const container = document.getElementById('reviews-pagination');

    if (pagination.pages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <button class="pagination-btn" ${pagination.page === 1 ? 'disabled' : ''} onclick="goToReviewPage(${pagination.page - 1})">
            Previous
        </button>
    `;

    for (let i = 1; i <= pagination.pages; i++) {
        html += `
            <button class="pagination-btn ${i === pagination.page ? 'active' : ''}" onclick="goToReviewPage(${i})">
                ${i}
            </button>
        `;
    }

    html += `
        <button class="pagination-btn" ${pagination.page === pagination.pages ? 'disabled' : ''} onclick="goToReviewPage(${pagination.page + 1})">
            Next
        </button>
    `;

    container.innerHTML = html;
}

function goToReviewPage(page) {
    currentReviewPage = page;
    loadReviews();
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();
    await loadBusinessDetails();
    loadDeals();
    loadReviews();

    // Write review button handler
    document.getElementById('write-review-btn').addEventListener('click', () => {
        // Save business ID to sessionStorage for review form
        sessionStorage.setItem('reviewBusinessId', businessId);
        window.location.href = '/review-confirm.html';
    });
});
