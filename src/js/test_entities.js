
const { extractEntities } = require('./lib/entityExtractor.js');

// Mock services for the test
const mockServices = [
    { id: 'grooming', name: { en: 'Grooming', es: 'Peluquería' } },
    { id: 'boarding', name: { en: 'Boarding', es: 'Hospedaje' } }
];

// Mock context
const context = { lang: 'en' };

function test(input, expectedDate) {
    const entities = extractEntities(input, mockServices, context);
    console.log(`Input: "${input}"`);
    console.log(`Extracted:`, entities);

    if (expectedDate) {
        if (entities.date === expectedDate) {
            console.log("PASS: Date matches");
        } else {
            console.error(`FAIL: Expected date ${expectedDate}, got ${entities.date}`);
        }
    }
    console.log('---');
}

// Calculate expected dates
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);
const nextWeekStr = nextWeek.toISOString().split('T')[0];

console.log("Testing Entity Extractor...");

test("I want to book grooming for tomorrow", tomorrowStr);
test("boarding in 7 days", nextWeekStr);
test("grooming next week", null); // 'next week' might map to +7 days or next Monday, let's see what it does.
// My implementation of 'next week' adds 7 days.

