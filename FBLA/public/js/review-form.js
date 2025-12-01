let captchaId = null;
let selectedRating = 0;

// Initialize review form
document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();

    // Check if user is logged in
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        return;
    }

    // Check if business ID is in sessionStorage
    const businessId = sessionStorage.getItem('reviewBusinessId');
    if (!businessId) {
        showAlert('Invalid review request', 'error');
        setTimeout(() => window.location.href = '/businesses.html', 2000);
        return;
    }

    // Set up star rating input
    const ratingContainer = document.getElementById('rating-input');
    const ratingInput = createStarRatingInput((rating) => {
        selectedRating = rating;
    });
    ratingContainer.appendChild(ratingInput);

    // Character counter
    const reviewText = document.getElementById('reviewText');
    const charCount = document.getElementById('char-count');

    reviewText.addEventListener('input', () => {
        charCount.textContent = reviewText.value.length;
    });

    // Load captcha
    await loadCaptcha();

    // Form submission
    document.getElementById('review-form').addEventListener('submit', handleSubmit);
});

// Load captcha
async function loadCaptcha() {
    try {
        const data = await apiCall('/api/reviews/captcha/generate');
        captchaId = data.captchaId;
        document.getElementById('captcha-question').textContent = data.question;
    } catch (err) {
        console.error('Error loading captcha:', err);
        showAlert('Failed to load captcha', 'error');
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    // Clear errors
    hideErrors();

    // Get form data
    const title = document.getElementById('title').value.trim();
    const reviewText = document.getElementById('reviewText').value.trim();
    const captchaAnswer = document.getElementById('captcha-answer').value;
    const businessId = sessionStorage.getItem('reviewBusinessId');

    // Validate
    if (selectedRating === 0) {
        showError('rating-error', 'Please select a rating');
        return;
    }

    if (!title) {
        showAlert('Please enter a review title', 'error');
        return;
    }

    if (reviewText.length < 20) {
        showAlert('Review must be at least 20 characters', 'error');
        return;
    }

    if (!captchaAnswer) {
        showError('captcha-error', 'Please answer the captcha');
        return;
    }

    // Submit review
    try {
        showLoading();

        await apiCall('/api/reviews', {
            method: 'POST',
            body: JSON.stringify({
                businessId,
                rating: selectedRating,
                title,
                reviewText,
                captchaId,
                captchaAnswer
            })
        });

        hideLoading();

        // Clear sessionStorage
        sessionStorage.removeItem('reviewBusinessId');

        // Redirect to business page with success message
        showAlert('Review submitted successfully!', 'success');
        setTimeout(() => {
            window.location.href = `/business-detail.html?id=${businessId}`;
        }, 1500);

    } catch (err) {
        hideLoading();

        // If captcha failed, reload it
        if (err.message.includes('Captcha') || err.message.includes('captcha')) {
            await loadCaptcha();
            document.getElementById('captcha-answer').value = '';
            showError('captcha-error', err.message);
        } else {
            showAlert(err.message || 'Failed to submit review', 'error');
        }
    }
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function hideErrors() {
    const errorElements = document.querySelectorAll('.form-error, .alert-error');
    errorElements.forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
}
