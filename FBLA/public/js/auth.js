// Login form handling
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
});

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Clear previous errors
    hideErrors();

    // Validate
    if (!email || !password) {
        showError('error-message', 'Please fill in all fields');
        return;
    }

    if (!isValidEmail(email)) {
        showError('email-error', 'Please enter a valid email');
        return;
    }

    // Submit
    try {
        showLoading();

        const response = await apiCall('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        hideLoading();

        // Redirect to home or previous page
        const returnUrl = getQueryParam('return') || '/';
        window.location.href = returnUrl;

    } catch (err) {
        hideLoading();
        showError('error-message', err.message || 'Login failed. Please check your credentials.');
    }
}

async function handleSignup(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    // Clear previous errors
    hideErrors();

    // Validate
    if (!email || !username || !password) {
        showError('error-message', 'Please fill in all fields');
        return;
    }

    if (!isValidEmail(email)) {
        showError('email-error', 'Please enter a valid email');
        return;
    }

    if (username.length < 3) {
        showError('username-error', 'Username must be at least 3 characters');
        return;
    }

    if (password.length < 8) {
        showError('password-error', 'Password must be at least 8 characters');
        return;
    }

    // Submit
    try {
        showLoading();

        const response = await apiCall('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, username, password, role })
        });

        hideLoading();

        // Redirect to home
        window.location.href = '/';

    } catch (err) {
        hideLoading();
        showError('error-message', err.message || 'Signup failed. Please try again.');
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
