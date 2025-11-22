# Security Utilities

This folder contains client-side security utilities for the Hotel Madagascar website.

## Contents

- **[sanitizer.js](./sanitizer.js)** - Input validation and sanitization functions
- **[rateLimit.js](./rateLimit.js)** - Client-side rate limiting implementation

## Usage

### Input Sanitization

```javascript
import { sanitizeText, isValidEmail, validateBookingForm } from './security/sanitizer.js';

// Sanitize user input
const safeName = sanitizeText(userInput, 100);

// Validate email
if (!isValidEmail(email)) {
  showError('Invalid email');
}

// Validate entire form
const validation = validateBookingForm(formData);
if (!validation.isValid) {
  displayErrors(validation.errors);
}
```

### Rate Limiting

```javascript
import { adminLoginLimiter, bookingLimiter, checkRateLimit } from './security/rateLimit.js';

// Check if action is allowed
const result = checkRateLimit(bookingLimiter, 'booking');
if (!result.allowed) {
  alert(result.message); // Shows countdown
  return;
}

// Get current status
const status = adminLoginLimiter.getStatus();
console.log(`Attempts: ${status.attempts}/${status.maxAttempts}`);
```

## Important Notes

⚠️ **Client-Side Limitations**: These are client-side only protections and can be bypassed. For production:

1. **Always validate server-side** - Never trust client-side validation
2. **Use server-side rate limiting** - Implement proper API rate limiting (e.g., Express Rate Limit)
3. **Sanitize on the server** - Use libraries like DOMPurify on the backend

## Security Functions Reference

### sanitizer.js

| Function | Purpose | Example |
|----------|---------|---------|
| `escapeHtml(str)` | Escapes HTML special characters | `escapeHtml('<script>')` → `'&lt;script&gt;'` |
| `isValidEmail(email)` | Validates email format | `isValidEmail('test@example.com')` → `true` |
| `isValidPhone(phone)` | Validates Mexican phone format | `isValidPhone('+52 449 123 4567')` → `true` |
| `sanitizeText(input, maxLength)` | Sanitizes and limits text | `sanitizeText(input, 100)` |
| `validateBookingForm(formData)` | Validates booking form | Returns `{isValid, errors}` |

### rateLimit.js

| Export | Type | Purpose |
|--------|------|---------|
| `RateLimiter` | Class | Create custom rate limiters |
| `adminLoginLimiter` | Instance | Admin login rate limiter (5/15min) |
| `chatbotLimiter` | Instance | Chatbot message limiter (20/min) |
| `bookingLimiter` | Instance | Booking submission limiter (3/hour) |
| `checkRateLimit(limiter, actionName)` | Function | Check and record attempt |

## Adding New Validators

To add a new validation function:

1. Add the function to `sanitizer.js`
2. Export it
3. Add tests (when test suite is set up)
4. Document it here

Example:
```javascript
// In sanitizer.js
export function isValidPostalCode(code) {
  // Mexican postal code: 5 digits
  return /^\d{5}$/.test(code);
}
```

## Production Recommendations

For production deployment with a backend:

1. **Server-side validation**
   ```javascript
   // Express example
   const { body, validationResult } = require('express-validator');
   
   app.post('/api/booking', [
     body('email').isEmail(),
     body('phone').matches(/^(\+?52)?[0-9]{10}$/),
     body('petName').trim().isLength({ min: 1, max: 100 })
   ], async (req, res) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }
     // Process booking...
   });
   ```

2. **Server-side rate limiting**
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const bookingLimiter = rateLimit({
     windowMs: 60 * 60 * 1000, // 1 hour
     max: 3, // 3 requests per hour
     message: 'Too many bookings from this IP'
   });
   
   app.post('/api/booking', bookingLimiter, handleBooking);
   ```

3. **CSRF Protection**
   ```javascript
   const csrf = require('csurf');
   app.use(csrf({ cookie: true }));
   ```

## See Also

- [SECURITY.md](../../SECURITY.md) - Overall security policy
- [DEPLOYMENT.md](../../DEPLOYMENT.md) - Security headers for deployment
