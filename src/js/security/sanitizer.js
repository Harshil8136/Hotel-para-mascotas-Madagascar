/**
 * Input Sanitization and Validation Utilities
 * 
 * Provides secure input handling for user-generated content.
 * Uses a lightweight sanitization approach suitable for a client-side app.
 */

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} str - Input string to escape
 * @returns {string} Escaped string safe for HTML context
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return str.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
}

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  
  // RFC 5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validates phone number (Mexican format)
 * Accepts: +52 XXX XXX XXXX, 52XXXXXXXXXX, XXXXXXXXXX
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 */
export function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  
  // Remove common separators
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Mexican phone: 10 digits, optionally prefixed with +52 or 52
  const phoneRegex = /^(\+?52)?[0-9]{10}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Sanitizes text input by trimming, limiting length, and escaping HTML
 * @param {string} input - Input text to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 500)
 * @returns {string} Sanitized text
 */
export function sanitizeText(input, maxLength = 500) {
  if (typeof input !== 'string') return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Escape HTML to prevent XSS
  return escapeHtml(sanitized);
}

/**
 * Validates and sanitizes URL
 * @param {string} url - URL to validate
 * @param {string[]} allowedProtocols - Allowed protocols (default: ['http:', 'https:'])
 * @returns {string|null} Sanitized URL or null if invalid
 */
export function sanitizeUrl(url, allowedProtocols = ['http:', 'https:']) {
  if (typeof url !== 'string' || !url.trim()) return null;
  
  try {
    const parsed = new URL(url);
    
    // Check if protocol is allowed
    if (!allowedProtocols.includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.href;
  } catch (e) {
    return null;
  }
}

/**
 * Validates date string (YYYY-MM-DD format)
 * @param {string} dateStr - Date string to validate
 * @param {boolean} futureOnly - If true, only allow future dates
 * @returns {boolean} True if valid date
 */
export function isValidDate(dateStr, futureOnly = false) {
  if (typeof dateStr !== 'string') return false;
  
  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  
  // Parse and validate date
  const date = new Date(dateStr);
  const isValidDate = date instanceof Date && !isNaN(date);
  
  if (!isValidDate) return false;
  
  // Check if future date if required
  if (futureOnly) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }
  
  return true;
}

/**
 * Validates time string (HH:MM format)
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} True if valid time
 */
export function isValidTime(timeStr) {
  if (typeof timeStr !== 'string') return false;
  
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

/**
 * Sanitizes object by applying sanitizeText to all string properties
 * @param {Object} obj - Object to sanitize
 * @param {number} maxLength - Maximum length for string values
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj, maxLength = 500) {
  if (typeof obj !== 'object' || obj === null) return {};
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value, maxLength);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, maxLength);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Validates booking form data
 * @param {Object} formData - Form data to validate
 * @returns {{isValid: boolean, errors: Object}} Validation result
 */
export function validateBookingForm(formData) {
  const errors = {};
  
  // Required fields
  if (!formData.service || formData.service.trim() === '') {
    errors.service = 'Service is required';
  }
  
  if (!formData.petName || formData.petName.trim() === '') {
    errors.petName = 'Pet name is required';
  } else if (formData.petName.length > 100) {
    errors.petName = 'Pet name is too long (max 100 characters)';
  }
  
  if (!formData.ownerName || formData.ownerName.trim() === '') {
    errors.ownerName = 'Your name is required';
  } else if (formData.ownerName.length > 100) {
    errors.ownerName = 'Name is too long (max 100 characters)';
  }
  
  // Email validation
  if (!formData.ownerEmail || !isValidEmail(formData.ownerEmail)) {
    errors.ownerEmail = 'Valid email is required';
  }
  
  // Phone validation
  if (!formData.ownerPhone || !isValidPhone(formData.ownerPhone)) {
    errors.ownerPhone = 'Valid phone number is required';
  }
  
  // Date validation
  if (!formData.date || !isValidDate(formData.date, true)) {
    errors.date = 'Valid future date is required';
  }
  
  // Time validation
  if (!formData.time || !isValidTime(formData.time)) {
    errors.time = 'Valid time is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
