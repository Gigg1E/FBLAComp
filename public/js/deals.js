document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();

    // Check if user is logged in and is a business owner
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    if (user.user.role !== 'business_owner' && user.user.role !== 'admin') {
        showAlert('Only business owners can post deals', 'error');
        setTimeout(() => window.location.href = '/', 2000);
        return;
    }

    // Load businesses owned by user
    await loadUserBusinesses(user.user.id);

    // Form submission
    document.getElementById('deal-form').addEventListener('submit', handleSubmit);

    // Set default start date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
});

async function loadUserBusinesses(userId) {
    try {
        const data = await apiCall('/api/businesses');
        const select = document.getElementById('businessId');

        // Filter businesses owned by user
        const userBusinesses = data.businesses.filter(b => b.owner_id === userId);

        if (userBusinesses.length === 0) {
            select.innerHTML = '<option value="">No businesses found. Contact admin to add your business.</option>';
            return;
        }

        select.innerHTML = '<option value="">Select a business...</option>' +
            userBusinesses.map(business => `
                <option value="${business.id}">${business.name}</option>
            `).join('');

    } catch (err) {
        console.error('Error loading businesses:', err);
        showAlert('Failed to load businesses', 'error');
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const businessId = document.getElementById('businessId').value;
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const discountAmount = document.getElementById('discountAmount').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Validate
    if (!businessId) {
        showAlert('Please select a business', 'error');
        return;
    }

    if (!title || !description) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    if (!startDate || !endDate) {
        showAlert('Please select start and end dates', 'error');
        return;
    }

    if (new Date(endDate) < new Date(startDate)) {
        showAlert('End date must be after start date', 'error');
        return;
    }

    // Submit
    try {
        showLoading();

        await apiCall('/api/deals', {
            method: 'POST',
            body: JSON.stringify({
                businessId,
                title,
                description,
                discountAmount,
                startDate,
                endDate
            })
        });

        hideLoading();

        // Show success message
        document.getElementById('success-message').textContent = 'Deal posted successfully!';
        document.getElementById('success-message').style.display = 'block';

        // Reset form
        document.getElementById('deal-form').reset();

        // Scroll to top
        window.scrollTo(0, 0);

        // Redirect after delay
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);

    } catch (err) {
        hideLoading();
        document.getElementById('error-message').textContent = err.message || 'Failed to post deal';
        document.getElementById('error-message').style.display = 'block';
    }
}
