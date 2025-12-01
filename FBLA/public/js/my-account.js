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
    if (currentUser.user && (currentUser.user.role === 'business_owner' || currentUser.user.role === 'admin')) {
        document.getElementById('businesses-tab-btn').style.display = 'block';
        document.getElementById('deals-tab-btn').style.display = 'block';

        // Load businesses list
        loadMyBusinessesList();

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
    if (tabName === 'businesses') {
        loadMyBusinessesList();
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
            <span class="account-info-value">${currentUser.user.username}</span>
        </div>
        <div class="account-info-item">
            <span class="account-info-label">Email</span>
            <span class="account-info-value">${currentUser.user.email}</span>
        </div>
        <div class="account-info-item">
            <span class="account-info-label">Account Type</span>
            <span class="account-info-value">${formatRole(currentUser.user.role)}</span>
        </div>
        <div class="account-info-item">
            <span class="account-info-label">Member Since</span>
            <span class="account-info-value">${formatDate(currentUser.user.created_at)}</span>
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

// Load list of businesses for "My Businesses" tab
async function loadMyBusinessesList() {
    try {
        const data = await apiCall('/api/businesses/my/business');
        const businessesListDiv = document.getElementById('businesses-list');
        
        const businesses = Array.isArray(data.business) ? data.business : (data.business ? [data.business] : []);

        if (businesses.length === 0) {
            businessesListDiv.innerHTML = `
                <div class="empty-state">
                    <p>You haven't created any businesses yet</p>
                    <p class="text-secondary">Click the "Add Business" button to get started</p>
                </div>
            `;
            return;
        }
        
        

        if (!data.business) {
            businessesListDiv.innerHTML = `
                <div class="empty-state">
                    <p>You haven't created any businesses yet</p>
                    <p class="text-secondary">Click the "Add Business" button to get started</p>
                </div>
            `;
            return;
        }
        
        // Display the business as a card
        const business = data.business;
        businessesListDiv.innerHTML = `
            <div class="card" style="padding: 1.5rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 style="margin: 0 0 0.5rem 0;">${escapeHtml(business.name)}</h3>
                        <p class="text-secondary" style="margin: 0 0 0.5rem 0;">${escapeHtml(business.category)}</p>
                        <p class="text-secondary" style="margin: 0; font-size: 0.9rem;">
                            ${escapeHtml(business.city)}, ${escapeHtml(business.state)}
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm btn-primary" onclick="viewBusinessDetails()">View</button>
                        <button class="btn btn-sm btn-primary" onclick="loadBusinessDetails()">View</button>
                        <button class="btn btn-sm btn-outline" onclick="editBusinessFromList()">Edit</button>
                    </div>
                </div>
                <div style="margin-top: 1rem; display: flex; align-items: center; gap: 1rem;">
                    ${renderStars(business.average_rating)}
                    <span class="text-secondary">${business.review_count} reviews</span>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Error loading businesses list:', err);
        document.getElementById('businesses-list').innerHTML = `
            <div class="empty-state">
                <p>You haven't created any businesses yet</p>
            </div>
        `;
    }
}

// View business details (switch to My Business tab)
async function viewBusinessDetails(businessId) {
    const data = await apiCall('/api/businesses/my/business');
    const currentBusiness = data.business;
    const businessViewPage = `/business-detail.html?id=${currentBusiness.id}`;

    if (!businessId) {
        window.location.href = businessViewPage;
        return;
    }
}

// Edit business from list (open modal)
function editBusinessFromList() {
    showBusinessForm(true);
}

// Load user's business
async function loadMyBusiness() {
    try {
        const data = await apiCall('/api/businesses/my/business');
        currentBusiness = data.business;

        // Update deals tab visibility
        if (currentBusiness) {
            document.getElementById('no-business-deals').style.display = 'none';
            document.getElementById('deals-section').style.display = 'block';
        } else {
            document.getElementById('no-business-deals').style.display = 'block';
            document.getElementById('deals-section').style.display = 'none';
        }
    } catch (err) {
        console.error('Error loading business:', err);
    }
}

// Show business form (create or edit mode) in modal
function showBusinessForm(editing = false) {
    const modal = document.getElementById('business-form-modal');
    const formTitle = document.getElementById('business-form-title');
    
    modal.style.display = 'block';

    // Clear any previous errors
    document.getElementById('form-errors').style.display = 'none';
    document.getElementById('form-success').style.display = 'none';
    document.getElementById('contact-error').style.display = 'none';

    // If editing, populate form
    if (editing && currentBusiness) {
        formTitle.textContent = 'Edit Business';
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
        // Show delete button when editing
        document.getElementById('delete-business-btn').style.display = 'inline-block';
        document.getElementById('save-business-btn').textContent = 'Update Business';

        // Clear file input and show current image preview
        document.getElementById('business-image').value = '';
        document.getElementById('file-info').style.display = 'none';

        if (currentBusiness.image_url) {
            updateImagePreview(currentBusiness.image_url);
        }
    } else {
        // Reset form for new business
        formTitle.textContent = 'Add Business';
        document.getElementById('business-form').reset();
        document.getElementById('delete-business-btn').style.display = 'none';
        document.getElementById('save-business-btn').textContent = 'Save Business';
        document.getElementById('file-info').style.display = 'none';
        document.getElementById('image-preview').innerHTML = 'No image selected';
        document.getElementById('image-preview').className = 'image-preview empty';
    }
}

function editBusiness() {
    showBusinessForm(true);
}

function cancelBusinessForm() {
    document.getElementById('business-form-modal').style.display = 'none';
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
    preview.innerHTML = `<img src="${url}" alt="Business preview" onerror="this.parentElement.innerHTML='Invalid image'; this.parentElement.className='image-preview empty';">`;
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    const fileInfo = document.getElementById('file-info');

    if (!file) {
        fileInfo.style.display = 'none';
        updateImagePreview(null);
        return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        fileInfo.textContent = '❌ Invalid file type. Only JPG, PNG, and GIF allowed.';
        fileInfo.style.color = 'var(--error-color, #dc2626)';
        fileInfo.style.display = 'block';
        event.target.value = '';
        updateImagePreview(null);
        return;
    }

    // Validate file size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
        fileInfo.textContent = '❌ File too large. Maximum size is 10 MB.';
        fileInfo.style.color = 'var(--error-color, #dc2626)';
        fileInfo.style.display = 'block';
        event.target.value = '';
        updateImagePreview(null);
        return;
    }

    // Show file info
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    fileInfo.textContent = `✓ Selected: ${file.name} (${sizeInMB} MB)`;
    fileInfo.style.color = 'var(--success-color, #059669)';
    fileInfo.style.display = 'block';

    // Preview using FileReader
    const reader = new FileReader();
    reader.onload = (e) => updateImagePreview(e.target.result);
    reader.readAsDataURL(file);
}

// Save business (create or update)
async function saveBusiness(event) {
    event.preventDefault();

    const name = document.getElementById('business-name').value.trim();
    const category = document.getElementById('business-category').value;
    const address = document.getElementById('business-address').value.trim();
    const city = document.getElementById('business-city').value.trim();
    const state = document.getElementById('business-state').value.trim().toUpperCase();
    const zip_code = document.getElementById('business-zip').value.trim();
    const phone = document.getElementById('business-phone').value.trim();
    const email = document.getElementById('business-email').value.trim();
    const website = document.getElementById('business-website').value.trim();
    const description = document.getElementById('business-description').value.trim();
    const products = document.getElementById('business-products').value.trim();
    const imageFile = document.getElementById('business-image').files[0];

    // Validate required fields
    if (!name || !category || !address || !city || !state || !zip_code || !description) {
        showFormError('Please fill in all required fields');
        return;
    }

    // Validate image file for new businesses
    if (!currentBusiness && !imageFile) {
        showFormError('Please select an image file');
        return;
    }

    // Validate at least one contact method
    if (!phone && !email && !website) {
        document.getElementById('contact-error').textContent = 'At least one contact method is required';
        document.getElementById('contact-error').style.display = 'block';
        return;
    }

    document.getElementById('contact-error').style.display = 'none';

    try {
        // Create FormData
        const formData = new FormData();
        formData.append('name', name);
        formData.append('category', category);
        formData.append('address', address);
        formData.append('city', city);
        formData.append('state', state);
        formData.append('zip_code', zip_code);
        formData.append('phone', phone);
        formData.append('email', email);
        formData.append('website', website);
        formData.append('description', description);
        formData.append('products', products);

        if (imageFile) {
            formData.append('business_image', imageFile);
        }

        let response;
        if (currentBusiness) {
            // Update existing business
            response = await fetch(`/api/businesses/${currentBusiness.id}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            // Create new business
            response = await fetch('/api/businesses', {
                method: 'POST',
                body: formData
            });
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to save business');

        showFormSuccess(currentBusiness ? 'Business updated successfully!' : 'Business created successfully!');

        // Reload business data
        await loadMyBusiness();
        await loadMyBusinessesList();

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
        await apiCall(`/api/businesses/${currentBusiness.id}`, { method: 'DELETE' });
        showFormSuccess('Business deleted successfully');

        currentBusiness = null;

        // Reload business section
        setTimeout(() => {
            loadMyBusiness();
            loadMyBusinessesList();
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
            await apiCall(`/api/deals/${dealId}`, {
                method: 'PUT',
                body: JSON.stringify(dealData)
            });
            showDealSuccess('Deal updated successfully!');
        } else {
            // Create new deal
            await apiCall('/api/deals', {
                method: 'POST',
                body: JSON.stringify(dealData)
            });
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
        await apiCall(`/api/deals/${dealId}`, { method: 'DELETE' });
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

    // Add Business button (in My Businesses tab)
    const addBusinessBtn = document.getElementById('add-business-btn');
    if (addBusinessBtn) {
        addBusinessBtn.addEventListener('click', () => {
            showBusinessForm(false);
        });
    }

    // Business management buttons (removed create-business-btn since it's not needed anymore)

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

    // Business image file input handler
    const businessImageInput = document.getElementById('business-image');
    if (businessImageInput) {
        businessImageInput.addEventListener('change', handleFileSelect);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeAccountPage);