/**
 * Client-Side Rate Limiting
 * 
 * Simple rate limiting mechanism to prevent abuse.
 * Uses sessionStorage for tracking attempts.
 * 
 * Note: This is client-side only and can be bypassed. For production,
 * implement proper server-side rate limiting.
 */

const STORAGE_KEY_PREFIX = 'rateLimit_';
const ATTEMPT_KEY_PREFIX = 'attempts_';

/**
 * Rate limiter class
 */
class RateLimiter {
    constructor(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
        this.key = key;
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
        this.storageKey = STORAGE_KEY_PREFIX + key;
        this.attemptKey = ATTEMPT_KEY_PREFIX + key;
    }

    /**
     * Get current attempt data from storage
     */
    _getData() {
        try {
            const data = sessionStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Save attempt data to storage
     */
    _setData(data) {
        try {
            sessionStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save rate limit data:', e);
        }
    }

    /**
     * Check if action is allowed
     * @returns {{allowed: boolean, remainingAttempts: number, retryAfter: number}}
     */
    check() {
        const now = Date.now();
        const data = this._getData();

        // No previous attempts
        if (!data) {
            return {
                allowed: true,
                remainingAttempts: this.maxAttempts - 1,
                retryAfter: 0
            };
        }

        // Check if window has expired
        if (now - data.firstAttempt > this.windowMs) {
            // Reset
            this._setData(null);
            return {
                allowed: true,
                remainingAttempts: this.maxAttempts - 1,
                retryAfter: 0
            };
        }

        // Check if max attempts exceeded
        if (data.attempts >= this.maxAttempts) {
            const retryAfter = this.windowMs - (now - data.firstAttempt);
            return {
                allowed: false,
                remainingAttempts: 0,
                retryAfter: Math.ceil(retryAfter / 1000) // Return seconds
            };
        }

        return {
            allowed: true,
            remainingAttempts: this.maxAttempts - data.attempts - 1,
            retryAfter: 0
        };
    }

    /**
     * Record an attempt
     */
    recordAttempt() {
        const now = Date.now();
        const data = this._getData();

        if (!data || (now - data.firstAttempt > this.windowMs)) {
            // Start new window
            this._setData({
                firstAttempt: now,
                attempts: 1,
                lastAttempt: now
            });
        } else {
            // Increment attempts
            data.attempts += 1;
            data.lastAttempt = now;
            this._setData(data);
        }
    }

    /**
     * Reset rate limiter
     */
    reset() {
        try {
            sessionStorage.removeItem(this.storageKey);
        } catch (e) {
            console.error('Failed to reset rate limiter:', e);
        }
    }

    /**
     * Get current status
     */
    getStatus() {
        const data = this._getData();
        if (!data) {
            return {
                attempts: 0,
                maxAttempts: this.maxAttempts,
                isLocked: false
            };
        }

        const now = Date.now();
        const isLocked = data.attempts >= this.maxAttempts && (now - data.firstAttempt <= this.windowMs);

        return {
            attempts: data.attempts,
            maxAttempts: this.maxAttempts,
            isLocked,
            retryAfter: isLocked ? Math.ceil((this.windowMs - (now - data.firstAttempt)) / 1000) : 0
        };
    }
}

/**
 * Create a rate limiter for admin login
 * 5 attempts per 15 minutes
 */
export const adminLoginLimiter = new RateLimiter('admin_login', 5, 15 * 60 * 1000);

/**
 * Create a rate limiter for chatbot messages
 * 20 messages per minute
 */
export const chatbotLimiter = new RateLimiter('chatbot_msg', 20, 60 * 1000);

/**
 * Create a rate limiter for booking submissions
 * 3 submissions per hour
 */
export const bookingLimiter = new RateLimiter('booking_submit', 3, 60 * 60 * 1000);

/**
 * Generic function to check and record rate limit
 * @param {RateLimiter} limiter - Rate limiter instance
 * @param {string} actionName - Name of the action for error messages
 * @returns {{allowed: boolean, message: string}}
 */
export function checkRateLimit(limiter, actionName = 'this action') {
    const result = limiter.check();

    if (!result.allowed) {
        return {
            allowed: false,
            message: `Too many attempts. Please try ${actionName} again in ${result.retryAfter} seconds.`
        };
    }

    limiter.recordAttempt();

    return {
        allowed: true,
        message: '',
        remainingAttempts: result.remainingAttempts
    };
}

/**
 * Export RateLimiter class for custom use cases
 */
export { RateLimiter };
