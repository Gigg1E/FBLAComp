// My Account page functionality
let currentUser = null;
let currentBusiness = null;
let editingDeal = null;

// Helper functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHtml = '<div class="star-rating">';

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHtml += '<span class="star filled">★</span>';
        } else if (i === fullStars && hasHalfStar) {
            starsHtml += '<span class="star half">★</span>';
        } else {
            starsHtml += '<span class="star">★</span>';
        }
    }

    starsHtml += '</div>';
    return starsHtml;
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="alert alert-error">${message}</div>`;
    }
}

// Initialize page
async function initializeAccountPage() {
    currentUser = await getCurrentUser();

    if (!currentUser) {
        window.location.href = '/login.html';
        return;
    }

    // Set up tab switching
    setupTabs();

    // Load account info
    loadAccountInfo();

    // Load user's reviews
    loadMyReviews();

    // Only show business/deals tabs for business owners and admins
    if (currentUser.role === 'business_owner' || currentUser.role === 'admin') {
        document.getElementById('business-tab-btn').style.display = 'block';
        document.getElementById('deals-tab-btn').style.display = 'block';

        // Load business data
        await loadMyBusiness();

        // Load deals if they have a business
        if (currentBusiness) {
            loadMyDeals();
        }
    }

    // Set up event listeners
    setupEventListeners();
}

// Tab switching
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load data for specific tabs
    if (tabName === 'business' && currentBusiness) {
        loadMyBusiness();
    } else if (tabName === 'deals' && currentBusiness) {
        loadMyDeals();
    }
}

// Load account information
function loadAccountInfo() {
    const accountInfoDiv = document.getElementById('account-info');

    accountInfoDiv.innerHTML = `
        <div class="account-info-item">
            <span class="account-info-label">Username</span>
            <span class="account-info-value">${currentUser.username}</span>
        </div>
        <div class="account-info-item">
            <span class="account-info-label">Email</span>
            <span class="account-info-value">${currentUser.email}</span>
        </div>
        <div class="account-info-item">
            <span class="account-info-label">Account Type</span>
            <span class="account-info-value">${formatRole(currentUser.role)}</span>
        </div>
        <div class="account-info-item">
            <span class="account-info-label">Member Since</span>
            <span class="account-info-value">${formatDate(currentUser.created_at)}</span>
        </div>
    `;
}

function formatRole(role) {
    const roleMap = {
        'user': 'Regular User',
        'business_owner': 'Business Owner',
        'admin': 'Administrator'
    };
    return roleMap[role] || role;
}

// Load user's reviews
async function loadMyReviews() {
    try {
        const data = await apiCall('/api/reviews/my/reviews');
        const reviewsDiv = document.getElementById('my-reviews');

        if (!data.reviews || data.reviews.length === 0) {
            reviewsDiv.innerHTML = '<div class="empty-state"><p>You haven\'t written any reviews yet</p></div>';
            return;
        }

        reviewsDiv.innerHTML = data.reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div>
                        <div class="review-author">
                            <a href="/business.html?id=${review.business_id}">${review.business_name}</a>
                        </div>
                        ${renderStars(review.rating)}
                    </div>
                    <div class="review-date">${formatDate(review.created_at)}</div>
                </div>
                ${review.title ? `<div class="review-title">${escapeHtml(review.title)}</div>` : ''}
                <div class="review-text">${escapeHtml(review.comment)}</div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading reviews:', err);
        showError('my-reviews', 'Failed to load your reviews');
    }
}

// Load user's business
async function loadMyBusiness() {
    try {
        const data = await apiCall('/api/businesses/my/business');
        currentBusiness = data.business;

        const noBusiness = document.getElementById('no-business');
        const businessForm = document.getElementById('business-form-container');
        const businessDisplay = document.getElementById('business-display');

        if (!currentBusiness) {
            // Show "no business" state
            noBusiness.style.display = 'block';
            businessForm.style.display = 'none';
            businessDisplay.style.display = 'none';

            // Update deals tab
            document.getElementById('no-business-deals').style.display = 'block';
            document.getElementById('deals-section').style.display = 'none';
        } else {
            // Show business display
            noBusiness.style.display = 'none';
            businessForm.style.display = 'none';
            businessDisplay.style.display = 'block';

            displayBusiness(currentBusiness);

            // Update deals tab
            document.getElementById('no-business-deals').style.display = 'none';
            document.getElementById('deals-section').style.display = 'block';
        }
    } catch (err) {
        console.error('Error loading business:', err);
        showError('business-tab', 'Failed to load business information');
    }
}

// Display business information
function displayBusiness(business) {
    const displayDiv = document.getElementById('business-summary');

    displayDiv.innerHTML = `
        <div class="business-header">
            <h3>${escapeHtml(business.name)}</h3>
            <div class="business-rating-summary">
                <div class="rating-number">${business.average_rating.toFixed(1)}</div>
                <div class="rating-details">
                    ${renderStars(business.average_rating)}
                    <div>${business.review_count} reviews</div>
                </div>
            </div>
        </div>

        ${business.image_url ? `<img src="${business.image_url}" alt="${escapeHtml(business.name)}" style="max-width: 100%; border-radius: var(--border-radius); margin: var(--spacing-md) 0;">` : ''}

        <div class="business-info">
            <div class="business-info-item"><strong>Category:</strong> ${escapeHtml(business.category)}</div>
            <div class="business-info-item"><strong>Address:</strong> ${escapeHtml(business.address)}, ${escapeHtml(business.city)}, ${escapeHtml(business.state)} ${escapeHtml(business.zip_code)}</div>
            ${business.phone ? `<div class="business-info-item"><strong>Phone:</strong> ${escapeHtml(business.phone)}</div>` : ''}
            ${business.email ? `<div class="business-info-item"><strong>Email:</strong> ${escapeHtml(business.email)}</div>` : ''}
            ${business.website ? `<div class="business-info-item"><strong>Website:</strong> <a href="${business.website}" target="_blank">${escapeHtml(business.website)}</a></div>` : ''}
            <div class="business-info-item"><strong>Description:</strong> ${escapeHtml(business.description)}</div>
            ${business.products ? `<div class="business-info-item"><strong>Products/Services:</strong> ${escapeHtml(business.products)}</div>` : ''}
        </div>

        <div class="business-summary-actions">
            <button class="btn btn-primary" onclick="editBusiness()">Edit Business</button>
        </div>
    `;
}

// Show business form (create or edit mode)
function showBusinessForm(editing = false) {
    document.getElementById('no-business').style.display = 'none';
    document.getElementById('business-form-container').style.display = 'block';
    document.getElementById('business-display').style.display = 'none';

    // Clear any previous errors
    document.getElementById('form-errors').style.display = 'none';
    document.getElementById('form-success').style.display = 'none';
    document.getElementById('contact-error').style.display = 'none';

    // If editing, populate form
    if (editing && currentBusiness) {
        document.getElementById('business-name').value = currentBusiness.name || '';
        document.getElementById('business-category').value = currentBusiness.category || '';
        document.getElementById('business-address').value = currentBusiness.address || '';
        document.getElementById('business-city').value = currentBusiness.city || '';
        document.getElementById('business-state').value = currentBusiness.state || '';
        document.getElementById('business-zip').value = currentBusiness.zip_code || '';
        document.getElementById('business-phone').value = currentBusiness.phone || '';
        document.getElementById('business-email').value = currentBusiness.email || '';
        document.getElementById('business-website').value = currentBusiness.website || '';
        document.getElementById('business-description').value = currentBusiness.description || '';
        document.getElementById('business-products').value = currentBusiness.products || '';
        document.getElementById('business-image').value = currentBusiness.image_url || '';

        // Show delete button when editing
        document.getElementById('delete-business-btn').style.display = 'inline-block';
        document.getElementById('save-business-btn').textContent = 'Update Business';

        // Update image preview
        if (currentBusiness.image_url) {
            updateImagePreview(currentBusiness.image_url);
        }
    } else {
        // Reset form for new business
        document.getElementById('business-form').reset();
        document.getElementById('delete-business-btn').style.display = 'none';
        document.getElementById('save-business-btn').textContent = 'Save Business';
        document.getElementById('image-preview').innerHTML = 'No image selected';
        document.getElementById('image-preview').className = 'image-preview empty';
    }
}

function editBusiness() {
    showBusinessForm(true);
}

function cancelBusinessForm() {
    if (currentBusiness) {
        // Go back to display mode
        document.getElementById('business-form-container').style.display = 'none';
        document.getElementById('business-display').style.display = 'block';
    } else {
        // Go back to no business state
        document.getElementById('business-form-container').style.display = 'none';
        document.getElementById('no-business').style.display = 'block';
    }
}

// Image preview
function updateImagePreview(url) {
    const preview = document.getElementById('image-preview');

    if (!url) {
        preview.innerHTML = 'No image selected';
        preview.className = 'image-preview empty';
        return;
    }

    preview.className = 'image-preview';
    preview.innerHTML = `<img src="${url}" alt="Business preview" onerror="this.parentElement.innerHTML='Invalid image URL'; this.parentElement.className='image-preview empty';">`;
}

// Save business (create or update)
async function saveBusiness(event) {
    event.preventDefault();

    const formData = {
        name: document.getElementById('business-name').value.trim(),
        category: document.getElementById('business-category').value,
        address: document.getElementById('business-address').value.trim(),
        city: document.getElementById('business-city').value.trim(),
        state: document.getElementById('business-state').value.trim().toUpperCase(),
        zip_code: document.getElementById('business-zip').value.trim(),
        phone: document.getElementById('business-phone').value.trim(),
        email: document.getElementById('business-email').value.trim(),
        website: document.getElementById('business-website').value.trim(),
        description: document.getElementById('business-description').value.trim(),
        products: document.getElementById('business-products').value.trim(),
        image_url: document.getElementById('business-image').value.trim()
    };

    // Validate required fields
    if (!formData.name || !formData.category || !formData.address || !formData.city ||
        !formData.state || !formData.zip_code || !formData.description || !formData.image_url) {
        showFormError('Please fill in all required fields');
        return;
    }

    // Validate at least one contact method
    if (!formData.phone && !formData.email && !formData.website) {
        document.getElementById('contact-error').textContent = 'At least one contact method is required';
        document.getElementById('contact-error').style.display = 'block';
        return;
    }

    document.getElementById('contact-error').style.display = 'none';

    try {
        if (currentBusiness) {
            // Update existing business
            await apiCall(`/api/businesses/${currentBusiness.id}`, 'PUT', formData);
            showFormSuccess('Business updated successfully!');
        } else {
            // Create new business
            await apiCall('/api/businesses', 'POST', formData);
            showFormSuccess('Business created successfully!');
        }

        // Reload business data
        await loadMyBusiness();

        // Switch to display mode after short delay
        setTimeout(() => {
            cancelBusinessForm();
        }, 1500);

    } catch (err) {
        console.error('Error saving business:', err);
        showFormError(err.message || 'Failed to save business');
    }
}

// Delete business
async function deleteBusiness() {
    if (!currentBusiness) return;

    if (!confirm('Are you sure you want to delete your business? This will also delete all associated deals and cannot be undone.')) {
        return;
    }

    try {
        await apiCall(`/api/businesses/${currentBusiness.id}`, 'DELETE');
        showFormSuccess('Business deleted successfully');

        currentBusiness = null;

        // Reload business section
        setTimeout(() => {
            loadMyBusiness();
        }, 1500);

    } catch (err) {
        console.error('Error deleting business:', err);
        showFormError(err.message || 'Failed to delete business');
    }
}

function showFormError(message) {
    const errorDiv = document.getElementById('form-errors');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('form-success').style.display = 'none';
}

function showFormSuccess(message) {
    const successDiv = document.getElementById('form-success');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    document.getElementById('form-errors').style.display = 'none';
}

// Load user's deals
async function loadMyDeals() {
    if (!currentBusiness) {
        return;
    }

    try {
        const data = await apiCall('/api/deals/my/deals');
        const dealsListDiv = document.getElementById('deals-list');

        if (!data.deals || data.deals.length === 0) {
            dealsListDiv.innerHTML = '<div class="empty-state"><p>No deals posted yet</p></div>';
            return;
        }

        dealsListDiv.innerHTML = `
            <table class="deals-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Discount</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.deals.map(deal => `
                        <tr>
                            <td>${escapeHtml(deal.title)}</td>
                            <td>${deal.discount_amount ? escapeHtml(deal.discount_amount) : '-'}</td>
                            <td>${formatDate(deal.start_date)}</td>
                            <td>${formatDate(deal.end_date)}</td>
                            <td class="deal-actions">
                                <button class="btn btn-sm btn-outline" onclick="editDeal(${deal.id})">Edit</button>
                                <button class="btn btn-sm btn-secondary" onclick="deleteDeal(${deal.id})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error('Error loading deals:', err);
        showError('deals-list', 'Failed to load deals');
    }
}

// Show deal form
function showDealForm(deal = null) {
    editingDeal = deal;

    document.getElementById('deal-form-container').style.display = 'block';
    document.getElementById('deal-errors').style.display = 'none';
    document.getElementById('deal-success').style.display = 'none';

    if (deal) {
        document.getElementById('deal-form-title').textContent = 'Edit Deal';
        document.getElementById('deal-id').value = deal.id;
        document.getElementById('deal-title').value = deal.title;
        document.getElementById('deal-description').value = deal.description;
        document.getElementById('deal-discount').value = deal.discount_amount || '';
        document.getElementById('deal-start').value = deal.start_date.split('T')[0];
        document.getElementById('deal-end').value = deal.end_date.split('T')[0];
    } else {
        document.getElementById('deal-form-title').textContent = 'Add New Deal';
        document.getElementById('deal-form').reset();
        document.getElementById('deal-id').value = '';
    }
}

async function editDeal(dealId) {
    try {
        const data = await apiCall(`/api/deals/${dealId}`);
        showDealForm(data.deal);
    } catch (err) {
        console.error('Error loading deal:', err);
        alert('Failed to load deal information');
    }
}

function cancelDealForm() {
    document.getElementById('deal-form-container').style.display = 'none';
    editingDeal = null;
}

// Save deal
async function saveDeal(event) {
    event.preventDefault();

    if (!currentBusiness) {
        showDealError('You must create a business first');
        return;
    }

    const dealData = {
        business_id: currentBusiness.id,
        title: document.getElementById('deal-title').value.trim(),
        description: document.getElementById('deal-description').value.trim(),
        discount_amount: document.getElementById('deal-discount').value.trim(),
        start_date: document.getElementById('deal-start').value,
        end_date: document.getElementById('deal-end').value
    };

    if (!dealData.title || !dealData.description || !dealData.start_date || !dealData.end_date) {
        showDealError('Please fill in all required fields');
        return;
    }

    try {
        const dealId = document.getElementById('deal-id').value;

        if (dealId) {
            // Update existing deal
            await apiCall(`/api/deals/${dealId}`, 'PUT', dealData);
            showDealSuccess('Deal updated successfully!');
        } else {
            // Create new deal
            await apiCall('/api/deals', 'POST', dealData);
            showDealSuccess('Deal created successfully!');
        }

        // Reload deals
        await loadMyDeals();

        // Hide form after short delay
        setTimeout(() => {
            cancelDealForm();
        }, 1500);

    } catch (err) {
        console.error('Error saving deal:', err);
        showDealError(err.message || 'Failed to save deal');
    }
}

// Delete deal
async function deleteDeal(dealId) {
    if (!confirm('Are you sure you want to delete this deal?')) {
        return;
    }

    try {
        await apiCall(`/api/deals/${dealId}`, 'DELETE');
        await loadMyDeals();
    } catch (err) {
        console.error('Error deleting deal:', err);
        alert('Failed to delete deal');
    }
}

function showDealError(message) {
    const errorDiv = document.getElementById('deal-errors');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('deal-success').style.display = 'none';
}

function showDealSuccess(message) {
    const successDiv = document.getElementById('deal-success');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    document.getElementById('deal-errors').style.display = 'none';
}

// Set up all event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Business management buttons
    const createBusinessBtn = document.getElementById('create-business-btn');
    if (createBusinessBtn) {
        createBusinessBtn.addEventListener('click', () => showBusinessForm(false));
    }

    document.getElementById('cancel-business-btn').addEventListener('click', cancelBusinessForm);
    document.getElementById('delete-business-btn').addEventListener('click', deleteBusiness);

    // Business form
    document.getElementById('business-form').addEventListener('submit', saveBusiness);

    // Image preview
    document.getElementById('business-image').addEventListener('input', (e) => {
        updateImagePreview(e.target.value);
    });

    // Deal management buttons
    const addDealBtn = document.getElementById('add-deal-btn');
    if (addDealBtn) {
        addDealBtn.addEventListener('click', () => showDealForm(null));
    }

    const cancelDealBtn = document.getElementById('cancel-deal-btn');
    if (cancelDealBtn) {
        cancelDealBtn.addEventListener('click', cancelDealForm);
    }

    // Deal form
    const dealForm = document.getElementById('deal-form');
    if (dealForm) {
        dealForm.addEventListener('submit', saveDeal);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeAccountPage);
