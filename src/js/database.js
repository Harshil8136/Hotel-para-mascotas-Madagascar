import { idb } from './globals.js';

// --- 3. DATABASE LOGIC (from lib/indexdb.ts) ---
const DOGSPA_DB_NAME = 'dogspa_db_v1';
const DOGSPA_DB_VERSION = 1;
const BOOKINGS_STORE = ' bookings';
const CHAT_HISTORY_STORE = 'chatHistory';
const SERVICES_STORE = 'services';
const KNOWLEDGE_STORE = 'knowledge';
const CONTACT_REQUESTS_STORE = 'contact_requests';
const SETTINGS_STORE = 'settings';

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = idb.openDB(DOGSPA_DB_NAME, DOGSPA_DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading DB from v${oldVersion} to v${newVersion}`);
        if (!db.objectStoreNames.contains(BOOKINGS_STORE)) {
          const bookingStore = db.createObjectStore(BOOKINGS_STORE, { keyPath: 'id' }); // Use user-generated ID
          bookingStore.createIndex('by-date', 'date');
          bookingStore.createIndex('by-status', 'status');
        }
        if (!db.objectStoreNames.contains(CHAT_HISTORY_STORE)) {
          db.createObjectStore(CHAT_HISTORY_STORE, { keyPath: 'id', autoIncrement: true });
          // No index needed if only querying by session on app load (getAll)
        }
        if (!db.objectStoreNames.contains(SERVICES_STORE)) {
          db.createObjectStore(SERVICES_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(KNOWLEDGE_STORE)) {
          db.createObjectStore(KNOWLEDGE_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(CONTACT_REQUESTS_STORE)) {
          db.createObjectStore(CONTACT_REQUESTS_STORE, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export async function seedDatabase(services, knowledge) {
  const db = await getDB();
  const txServices = db.transaction(SERVICES_STORE, 'readwrite');
  for (const service of services) {
    await txServices.store.put(service);
  }
  await txServices.done;

  const txKnowledge = db.transaction(KNOWLEDGE_STORE, 'readwrite');
  for (const item of knowledge) {
    await txKnowledge.store.put(item);
  }
  await txKnowledge.done;
  console.log('Database seeded successfully.');
}

export async function addBooking(booking) {
  const db = await getDB();
  const id = `booking-${Date.now()}`;
  const newBooking = { ...booking, id, createdAt: new Date().toISOString() };
  await db.add(BOOKINGS_STORE, newBooking);
  return newBooking;
}

export async function getAllBookings() {
  const db = await getDB();
  return await db.getAll(BOOKINGS_STORE);
}

// FIXED: Accept sessionId, role, content and don't include 'id' field
export async function addChatMessage(sessionId, role, content) {
  const db = await getDB();
  // Don't include 'id' - let autoIncrement handle it
  const message = {
    sessionId,
    role,
    content,
    timestamp: new Date().toISOString()
  };
  await db.add(CHAT_HISTORY_STORE, message);
}

export async function getChatHistory(sessionId) {
  const db = await getDB();
  // Note: This is inefficient but works for a no-index 'sessionId' query
  const allMessages = await db.getAll(CHAT_HISTORY_STORE);
  return allMessages.filter(msg => msg.sessionId === sessionId);
}

export async function addContactRequest(request) {
  const db = await getDB();
  await db.add(CONTACT_REQUESTS_STORE, { ...request, createdAt: new Date().toISOString(), processed: false });
}

export async function getContactRequests() {
  const db = await getDB();
  return await db.getAll(CONTACT_REQUESTS_STORE);
}

/**
 * NEW FUNCTION (Priority 11 Fix)
 * Updates the 'processed' status of a contact request.
 */
export async function updateContactRequestStatus(id, processed) {
  const db = await getDB();
  const tx = db.transaction(CONTACT_REQUESTS_STORE, 'readwrite');
  const request = await tx.store.get(id);
  if (request) {
    request.processed = processed;
    await tx.store.put(request);
  }
  await tx.done;
}


export async function getSettings(key) {
  const db = await getDB();
  return await db.get(SETTINGS_STORE, key);
}

export async function saveSettings(key, value) {
  const db = await getDB();
  await db.put(SETTINGS_STORE, { key, value });
}

export function exportBookingsToCSV(bookings) {
  const headers = ['ID', 'Service', 'Date', 'Time', 'Pet Name', 'Pet Breed', 'Owner Name', 'Owner Email', 'Owner Phone', 'Contact Consent', 'Contact Method', 'Status', 'Created At'];
  const rows = bookings.map(b => [
    b.id,
    b.service.en || b.service.es || b.service, // Handle multilingual object
    b.date,
    b.time,
    b.petName,
    b.petBreed,
    b.ownerName,
    b.ownerEmail,
    b.ownerPhone,
    b.contactConsent ? 'Yes' : 'No',
    b.contactMethod || 'N/A',
    b.status,
    b.createdAt
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}