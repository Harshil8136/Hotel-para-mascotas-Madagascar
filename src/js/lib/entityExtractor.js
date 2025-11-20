import { Fuse } from '../globals.js';
import { ALL_SERVICES } from './knowledgeBase.js';

const phonePatterns = [
    /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /\d{10}/g,
];
const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const timePatterns = [
    /\b(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\b/g,
    /\b(\d{1,2})\s*(am|pm|AM|PM)\b/g,
    /\bat\s+(\d{1,2}):?(\d{2})?\b/gi,
];
const datePatterns = [
    /\b(tomorrow|today|tonight|mañana|hoy|esta noche)\b/gi,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b/gi,
    /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/g,
    // Typo tolerance for "fridayt" etc. handled by fuzzy logic or simple regex extensions if needed
    /\b(next week|this week)\b/gi
];

// Smart Cleaning: Remove common conversational prefixes
function cleanInput(text) {
    let cleaned = text;
    const prefixes = [
        /^it's\s+/i, /^its\s+/i,
        /^my name is\s+/i, /^i am\s+/i, /^im\s+/i,
        /^call me\s+/i,
        /^i want\s+/i, /^i'd like\s+/i,
        /^please\s+/i
    ];

    for (const prefix of prefixes) {
        cleaned = cleaned.replace(prefix, '');
    }
    return cleaned.trim();
}

// Advanced Date Parsing
function parseRelativeDate(text) {
    const now = new Date();
    const lower = text.toLowerCase();

    // "in X weeks/days"
    const inMatch = lower.match(/in\s+(\d+)\s+(day|week|month)s?/);
    if (inMatch) {
        const amount = parseInt(inMatch[1]);
        const unit = inMatch[2];
        const target = new Date(now);
        if (unit === 'day') target.setDate(now.getDate() + amount);
        if (unit === 'week') target.setDate(now.getDate() + (amount * 7));
        if (unit === 'month') target.setMonth(now.getMonth() + amount);
        return target.toDateString();
    }

    // "next month"
    if (lower.includes('next month')) {
        const target = new Date(now);
        target.setMonth(now.getMonth() + 1);
        target.setDate(1); // Start of next month
        return target.toDateString();
    }

    // "end of this month"
    if (lower.includes('end of this month') || lower.includes('this month end')) {
        const target = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return target.toDateString();
    }

    // "tomorrow"
    if (lower.includes('tomorrow') || lower.includes('mañana')) {
        const target = new Date(now);
        target.setDate(now.getDate() + 1);
        return target.toDateString();
    }

    return null;
}

export function extractEntities(text, conversationContext) {
    const allEntities = [];
    const cleanedText = cleanInput(text);
    const lowerText = text.toLowerCase();

    // Service - Fuzzy Match
    if (ALL_SERVICES.length > 0) {
        const serviceFuse = new Fuse(ALL_SERVICES, {
            keys: ['name.en', 'name.es', 'type'],
            threshold: 0.4
        });
        const serviceResults = serviceFuse.search(text);
        if (serviceResults.length > 0) {
            const bestMatch = serviceResults[0].item;
            allEntities.push({ type: 'service', value: bestMatch.id, raw: text, confidence: 0.9 });
        }
    }

    // Phone
    for (const pattern of phonePatterns) {
        const matches = [...text.matchAll(pattern)];
        for (const match of matches) {
            const cleaned = match[0].replace(/\D/g, '');
            if (cleaned.length >= 10) {
                allEntities.push({ type: 'phone', value: cleaned, raw: match[0], confidence: 0.9 });
            }
        }
    }
    // Email
    const emailMatches = [...text.matchAll(emailPattern)];
    for (const match of emailMatches) {
        allEntities.push({ type: 'email', value: match[0], raw: match[0], confidence: 0.95 });
    }
    // Time
    for (const pattern of timePatterns) {
        const matches = [...text.matchAll(pattern)];
        for (const match of matches) {
            allEntities.push({ type: 'time', value: match[0], raw: match[0], confidence: 0.85 });
        }
    }

    // Date - Advanced Parsing
    const relativeDate = parseRelativeDate(text);
    if (relativeDate) {
        allEntities.push({ type: 'date', value: relativeDate, raw: text, confidence: 0.95 });
    } else {
        // Standard Regex Date
        for (const pattern of datePatterns) {
            const matches = [...text.matchAll(pattern)];
            for (const match of matches) {
                allEntities.push({ type: 'date', value: match[0], raw: match[0], confidence: 0.8 });
            }
        }
    }

    // Pet Name (Context-aware)
    if (conversationContext?.awaitingSlot === 'petName') {
        // Use cleaned text for names to avoid "its sarah"
        allEntities.push({ type: 'pet_name', value: cleanedText, raw: text, confidence: 0.95 });
    }
    // Owner Name (Context-aware)
    if (conversationContext?.awaitingSlot === 'ownerName') {
        allEntities.push({ type: 'ownerName', value: cleanedText, raw: text, confidence: 0.95 });
    }

    // Fallback for Date/Time if context expects it and regex failed (simple pass-through)
    if (conversationContext?.awaitingSlot === 'date' && !allEntities.some(e => e.type === 'date')) {
        allEntities.push({ type: 'date', value: cleanedText, raw: text, confidence: 0.5 });
    }
    if (conversationContext?.awaitingSlot === 'time' && !allEntities.some(e => e.type === 'time')) {
        allEntities.push({ type: 'time', value: cleanedText, raw: text, confidence: 0.5 });
    }

    return allEntities;
}
