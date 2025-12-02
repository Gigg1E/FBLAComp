const { v4: uuidv4 } = require('uuid');

// In-memory storage for captchas
// In production, consider using Redis or database
const captchaStore = new Map();

// Captcha expiration time (5 minutes)
const CAPTCHA_EXPIRATION = 5 * 60 * 1000;

// Clean up expired captchas periodically
setInterval(() => {
    const now = Date.now();
    for (const [id, captcha] of captchaStore.entries()) {
        if (captcha.expiresAt < now) {
            captchaStore.delete(id);
        }
    }
}, 60 * 1000); // Run every minute

// Generate a simple math captcha
function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operators = ['+', '-'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let answer;
    let question;

    if (operator === '+') {
        answer = num1 + num2;
        question = `What is ${num1} + ${num2}?`;
    } else {
        // Ensure non-negative result
        if (num1 >= num2) {
            answer = num1 - num2;
            question = `What is ${num1} - ${num2}?`;
        } else {
            answer = num2 - num1;
            question = `What is ${num2} - ${num1}?`;
        }
    }

    const captchaId = uuidv4();
    const expiresAt = Date.now() + CAPTCHA_EXPIRATION;

    captchaStore.set(captchaId, {
        answer,
        expiresAt
    });

    return {
        captchaId,
        question
    };
}

// Validate captcha answer
function validateCaptcha(captchaId, userAnswer) {
    const captcha = captchaStore.get(captchaId);

    if (!captcha) {
        return { valid: false, error: 'Captcha not found or expired' };
    }

    if (captcha.expiresAt < Date.now()) {
        captchaStore.delete(captchaId);
        return { valid: false, error: 'Captcha expired' };
    }

    const answer = parseInt(userAnswer, 10);

    if (isNaN(answer)) {
        return { valid: false, error: 'Invalid answer format' };
    }

    if (answer !== captcha.answer) {
        return { valid: false, error: 'Incorrect answer' };
    }

    // Delete captcha after successful validation (one-time use)
    captchaStore.delete(captchaId);

    return { valid: true };
}

// Middleware to validate captcha in requests
function requireCaptcha(req, res, next) {
    const { captchaId, captchaAnswer } = req.body;

    if (!captchaId || captchaAnswer === undefined) {
        return res.status(400).json({ error: 'Captcha is required' });
    }

    const validation = validateCaptcha(captchaId, captchaAnswer);

    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    next();
}

module.exports = {
    generateCaptcha,
    validateCaptcha,
    requireCaptcha
};
