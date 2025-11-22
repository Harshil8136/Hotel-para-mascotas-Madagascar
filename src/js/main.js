import { React, ReactDOM, html } from './globals.js';
import { App } from './App.js';
import { AppContext } from './AppContext.js';

// --- START THE APP ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(html`<${App} />`);

// --- TEST HARNESS EXPOSURE (for tests.js) ---
if (window.location.pathname.endsWith('tests.html')) {
  console.warn('TEST HARNESS ENABLED. Exposing app logic to window.ChatbotLogic');

  // This function is async so we can use top-level await for imports
  async function setupTestHarness() {
    // We must re-import everything to expose it
    const { getDB, addBooking, addContactRequest, getAllBookings, getContactRequests } = await import('./database.js');
    const { DialogueManager, detectIntent, searchKnowledge, extractEntities, getServiceById } = await import('./chatbotLogic.js');

    window.ChatbotLogic = {
      // Core Data & DB
      getDB,
      addBooking,
      addContactRequest,
      getAllBookings,
      getContactRequests,

      // Chatbot Internals
      DialogueManager,
      detectIntent,
      searchKnowledge,
      extractEntities,
      getServiceById,

      // App Translations (minimal)
      t_kb: (key_en, key_es) => (key_en), // Test harness defaults to english

      // React Components
      AppContext,
      App,

      // Core Libs
      html,
      React,
      ReactDOM
    };
  }

  setupTestHarness();
}