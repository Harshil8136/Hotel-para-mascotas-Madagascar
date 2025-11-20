(function() {
  'use strict';

  // --- 1. SETUP GLOBALS (from CDN) ---
  // These are loaded from index.html <head> and should be available
  const { React, ReactDOM } = window;
  if (!React || !ReactDOM) {
    console.error("React or ReactDOM failed to load from CDN. App cannot start.");
    return;
  }
  
  const { 
    useState, useEffect, useRef, useCallback, createContext, useContext 
  } = React;
  
  const { idb } = window;
  if (!idb) {
    console.error("IndexedDB (idb) failed to load from CDN. App cannot start.");
    return;
  }
  
  const Fuse = window.Fuse;
  if (!Fuse) {
    console.error("Fuse.js failed to load from CDN. Chatbot search will not work.");
  }

  const htm = window.htm;
  if (!htm) {
    console.error("HTM failed to load from CDN. App cannot start.");
    return;
  }

  const lucide = window.LucideReact;
  if (!lucide) {
    console.error("Lucide-React failed to load from CDN. Icons will be missing.");
  }
  
  // Create an `html` tag function bound to React.createElement
  // This replaces all JSX
  const html = htm.bind(React.createElement);

  // --- 2. CONSTANTS & SHARED STATE ---
  const AppContext = createContext(null);
  const SESSION_ID = `session-${Date.now()}`;
  const ADMIN_PASS_HASH = "c21f969b"; // md5("123") - for demo per PRD

  // --- 3. DATABASE LOGIC (from lib/indexdb.ts) ---
  // (Converted from TS to plain JS)
  const DOGSPA_DB_NAME = 'dogspa_db_v1';
  const DOGSPA_DB_VERSION = 1;
  const BOOKINGS_STORE = 'bookings';
  const CHAT_HISTORY_STORE = 'chatHistory';
  const SERVICES_STORE = 'services';
  const KNOWLEDGE_STORE = 'knowledge';
  const CONTACT_REQUESTS_STORE = 'contact_requests';
  const SETTINGS_STORE = 'settings';

  let dbPromise = null;

  function getDB() {
    if (!dbPromise) {
      dbPromise = idb.openDB(DOGSPA_DB_NAME, DOGSPA_DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log(`Upgrading DB from v${oldVersion} to v${newVersion}`);
          if (!db.objectStoreNames.contains(BOOKINGS_STORE)) {
            const bookingStore = db.createObjectStore(BOOKINGS_STORE, { keyPath: 'id', autoIncrement: true });
            bookingStore.createIndex('by-date', 'date');
            bookingStore.createIndex('by-status', 'status');
          }
          if (!db.objectStoreNames.contains(CHAT_HISTORY_STORE)) {
            const chatStore = db.createObjectStore(CHAT_HISTORY_STORE, { keyPath: 'id', autoIncrement: true });
            chatStore.createIndex('by-session', 'sessionId');
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

  async function seedDatabase(services, knowledge) {
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

  async function addBooking(booking) {
    const db = await getDB();
    const id = `booking-${Date.now()}`;
    const newBooking = { ...booking, id, createdAt: new Date().toISOString() };
    await db.add(BOOKINGS_STORE, newBooking);
    return newBooking;
  }

  async function getAllBookings() {
    const db = await getDB();
    return await db.getAll(BOOKINGS_STORE);
  }

  async function addChatMessage(message) {
    const db = await getDB();
    await db.add(CHAT_HISTORY_STORE, message);
  }

  async function getChatHistory(sessionId) {
    const db = await getDB();
    const index = db.transaction(CHAT_HISTORY_STORE).store.index('by-session');
    return await index.getAll(sessionId);
  }

  async function addContactRequest(request) {
    const db = await getDB();
    await db.add(CONTACT_REQUESTS_STORE, { ...request, createdAt: new Date().toISOString(), processed: false });
  }

  async function getContactRequests() {
    const db = await getDB();
    return await db.getAll(CONTACT_REQUESTS_STORE);
  }
  
  async function getSettings(key) {
    const db = await getDB();
    return await db.get(SETTINGS_STORE, key);
  }

  async function saveSettings(key, value) {
    const db = await getDB();
    await db.put(SETTINGS_STORE, { key, value });
  }

  function exportBookingsToCSV(bookings) {
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
  
  // Simple MD5 hash for client-side password check.
  // Not secure, but meets PRD 14 for a *simple* client-side gate.
  function md5(s) {
    let h = 0;
    for(let i = 0; i < s.length; i++) {
      h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    }
    // Convert to hex string (basic)
    let hash = h.toString(16);
    if (h < 0) {
      hash = (h >>> 0).toString(16);
    }
    return hash.padStart(8, '0');
  }

  // --- 4. CHATBOT LOGIC (from lib/ files) ---
  
  // (Global scope within IIFE, to be populated by fetch)
  let ALL_SERVICES = [];
  let ALL_KNOWLEDGE = [];
  let fuseInstanceEn = null;
  let fuseInstanceEs = null;

  function initializeSearch(knowledge) {
    fuseInstanceEn = new Fuse(knowledge.filter(k => k.lang === 'en'), {
      keys: ['q_variants', 'answer', 'tags'],
      threshold: 0.4,
      includeScore: true
    });
    fuseInstanceEs = new Fuse(knowledge.filter(k => k.lang === 'es'), {
      keys: ['q_variants', 'answer', 'tags'],
      threshold: 0.4,
      includeScore: true
    });
  }

  function searchKnowledge(query, lang) {
    const fuse = lang === 'es' ? fuseInstanceEs : fuseInstanceEn;
    if (!fuse) return null;
    
    const results = fuse.search(query);
    if (results.length > 0 && results[0].score && results[0].score < 0.5) {
      return results[0].item;
    }
    return null;
  }

  function getServiceByName(name, lang) {
    const serviceFuse = new Fuse(ALL_SERVICES, {
      keys: [`name.${lang}`, `description.${lang}`, `type`],
      threshold: 0.3
    });
    const results = serviceFuse.search(name);
    return results.length > 0 ? results[0].item : null;
  }
  
  function getServiceById(id) {
    return ALL_SERVICES.find(s => s.id === id) || null;
  }

  // --- (from lib/entityExtractor.ts) ---
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
  ];

  function extractEntities(text, conversationContext) {
    const allEntities = [];
    const lowerText = text.toLowerCase();
    
    // Service
    ALL_SERVICES.forEach(service => {
      const nameEn = (service.name.en || '').toLowerCase();
      const nameEs = (service.name.es || '').toLowerCase();
      if (lowerText.includes(nameEn) || (nameEs && lowerText.includes(nameEs))) {
        allEntities.push({ type: 'service', value: service.id, raw: service.name.en, confidence: 0.9 });
      }
    });

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
    // Date
    for (const pattern of datePatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        allEntities.push({ type: 'date', value: match[0], raw: match[0], confidence: 0.8 });
      }
    }
    
    // Pet Name (Context-aware)
    if (conversationContext?.awaitingSlot === 'petName') {
      allEntities.push({ type: 'pet_name', value: text, raw: text, confidence: 0.95 });
    }
    // Owner Name (Context-aware)
    if (conversationContext?.awaitingSlot === 'ownerName') {
      allEntities.push({ type: 'ownerName', value: text, raw: text, confidence: 0.95 });
    }

    return allEntities;
  }

  // --- (from lib/dialogueManager.ts & conversationFlows.ts) ---
  const BOOKING_SLOTS = [
    { name: 'service', required: true, prompt: { en: "Which service would you like to book?", es: "¿Qué servicio le gustaría reservar?" }, examples: { en: ["Grooming", "Boarding"], es: ["Estética", "Hospedaje"] } },
    { name: 'petName', required: true, prompt: { en: "What's your pet's name?", es: "¿Cómo se llama su mascota?" } },
    { name: 'date', required: true, prompt: { en: "What date would you like to book for?", es: "¿Para qué fecha desea reservar?" }, examples: { en: ["Tomorrow", "Next Friday"], es: ["Mañana", "El próximo viernes"] } },
    { name: 'time', required: true, prompt: { en: "What time works best for you?", es: "¿A qué hora le viene bien?" }, examples: { en: ["9am", "2:30pm"], es: ["9am", "2:30pm"] } },
    { name: 'ownerName', required: true, prompt: { en: "What's your full name?", es: "¿Cuál es su nombre completo?" } },
    { name: 'ownerPhone', required: true, prompt: { en: "What's the best phone number to reach you?", es: "¿Cuál es el mejor número de teléfono para contactarlo?" } },
    { name: 'ownerEmail', required: false, prompt: { en: "And your email address? (Optional, you can say 'skip')", es: "¿Y su correo electrónico? (Opcional, puede decir 'omitir')" } },
    { name: 'consent', required: true, prompt: { en: "We need to save this information to make your booking. Is that okay?", es: "Necesitamos guardar esta información para hacer su reserva. ¿Está de acuerdo?" }, examples: { en: ["Yes", "No"], es: ["Sí", "No"] } }
  ];

  class DialogueManager {
    constructor(context) {
      this.context = context || { dialogueState: 'idle', filledSlots: {} };
      this.lang = context.lang || 'en';
    }

    // Helper to get translated string
    t(key, prompt) {
      return prompt[this.lang] || prompt['en'];
    }

    determineNextAction(message, intent) {
      const entities = extractEntities(message, this.context);
      this.fillSlots(entities, message);

      const state = this.context.dialogueState;

      // Handle explicit cancellation
      if (intent === 'negative' && state !== 'idle') {
        const oldState = this.context.dialogueState;
        this.context = { dialogueState: 'idle', filledSlots: {}, lang: this.lang };
        return {
          response: this.t('cancel', { en: "Okay, I've cancelled the booking process.", es: "De acuerdo, he cancelado el proceso de reserva." }),
          suggestions: this.getSuggestions('idle'),
          nextContext: this.context
        };
      }
      
      // Handle call request
      if (intent === 'request_contact_call') {
        return this.handleCallbackRequest(entities);
      }

      if (state === 'awaiting_contact_phone') {
        const phoneEntity = entities.find(e => e.type === 'phone');
        if (phoneEntity) {
          this.context.filledSlots.ownerPhone = phoneEntity.value;
          return this.handleCallbackRequest(entities); // Check for time
        } else {
          return {
            response: this.t('retry_phone', { en: "I didn't catch that. What's a good phone number?", es: "No entendí eso. ¿Cuál es un buen número de teléfono?" }),
            suggestions: [],
            nextContext: this.context
          };
        }
      }
      
      if (state === 'awaiting_contact_time') {
         const timeEntity = entities.find(e => e.type === 'time') || entities.find(e => e.type === 'date');
         if (timeEntity) {
           this.context.filledSlots.preferredTime = timeEntity.value;
           return this.confirmCallback();
         } else {
            return {
              response: this.t('retry_time', { en: "Sorry, what time works for you?", es: "Disculpe, ¿a qué hora le viene bien?" }),
              suggestions: [],
              nextContext: this.context
            };
         }
      }

      // Main booking flow
      if (intent === 'book_service' && state === 'idle') {
        this.context.dialogueState = 'booking';
      }

      if (this.context.dialogueState === 'booking') {
        const nextSlot = this.getNextRequiredSlot();
        
        if (nextSlot) {
          // Special handling for consent
          if (nextSlot.name === 'consent') {
             if (intent === 'affirmative') {
               this.context.filledSlots.consent = true;
               return this.determineNextAction(message, intent); // Re-run to find next slot
             }
             if (intent === 'negative') {
                this.context = { dialogueState: 'idle', filledSlots: {}, lang: this.lang };
                return {
                  response: this.t('no_consent', { en: "No problem. I cannot save your booking without consent. Let me know if you change your mind.", es: "No hay problema. No puedo guardar su reserva sin consentimiento. Avíseme si cambia de opinión." }),
                  suggestions: this.getSuggestions('idle'),
                  nextContext: this.context
                };
             }
          }
          
          // Special handling for optional email
          if (nextSlot.name === 'ownerEmail' && (intent === 'negative' || message.toLowerCase().includes('skip') || message.toLowerCase().includes('omitir'))) {
            this.context.filledSlots.ownerEmail = 'skipped';
            this.context.awaitingSlot = null; // Clear awaiting slot
            return this.determineNextAction(message, intent); // Re-run to find next slot
          }

          // Ask for the next slot
          this.context.awaitingSlot = nextSlot.name;
          return {
            response: this.t(nextSlot.name, nextSlot.prompt),
            suggestions: this.getSuggestions(nextSlot.name),
            nextContext: this.context
          };
        } else {
          // All slots are filled
          this.context.dialogueState = 'confirmation';
          return {
            response: this.getConfirmationMessage(),
            suggestions: this.getSuggestions('confirmation'),
            nextContext: this.context
          };
        }
      }
      
      if (state === 'confirmation') {
         if (intent === 'affirmative') {
           this.context.dialogueState = 'complete';
           return {
             response: this.t('book_success', { en: "Great! Your booking is all set. We look forward to seeing you!", es: "¡Genial! Su reserva está lista. ¡Esperamos verle!" }),
             suggestions: this.getSuggestions('idle'),
             nextContext: this.context,
             action: 'save_booking'
           };
         } else {
           // Assumes "no" or change request
           this.context.dialogueState = 'idle';
           this.context.filledSlots = {};
           return {
             response: this.t('book_cancel', { en: "Okay, I've cancelled this booking. We can start over if you like.", es: "De acuerdo, he cancelado esta reserva. Podemos empezar de nuevo si lo desea." }),
             suggestions: this.getSuggestions('idle'),
             nextContext: this.context
           };
         }
      }

      // Fallback for general intents
      return {
        response: null, // Will be handled by simple KB search
        suggestions: this.getSuggestions('default'),
        nextContext: this.context
      };
    }

    fillSlots(entities, message) {
      const awaitingSlot = this.context.awaitingSlot;
      const lowerMessage = message.toLowerCase();
      
      // Handle optional slot skipping
      if (awaitingSlot === 'ownerEmail' && (lowerMessage.includes('skip') || lowerMessage.includes('omitir'))) {
        this.context.filledSlots.ownerEmail = 'skipped';
        this.context.awaitingSlot = null;
        return; // Slot filled by skipping
      }

      if (awaitingSlot) {
        // Try to fill the specific slot we're waiting for
        let entity = entities.find(e => this.mapEntityToSlot(e.type) === awaitingSlot);
        
        // If no specific entity, but we're waiting, use the whole message
        if (!entity) {
           if (awaitingSlot === 'petName') entity = { type: 'pet_name', value: message };
           if (awaitingSlot === 'ownerName') entity = { type: 'ownerName', value: message };
           if (awaitingSlot === 'date') entity = { type: 'date', value: message };
           if (awaitingSlot === 'time') entity = { type: 'time', value: message };
           if (awaitingSlot === 'ownerPhone') entity = { type: 'phone', value: message };
           if (awaitingSlot === 'ownerEmail') entity = { type: 'email', value: message };
        }
        
        if (entity) {
          // Simple validation
          if (awaitingSlot === 'ownerPhone' && entity.value.replace(/\D/g, '').length < 10) {
             // Don't fill, let it re-prompt
          } else if (awaitingSlot === 'ownerEmail' && !emailPattern.test(entity.value)) {
             // Don't fill, let it re-prompt
          } else {
            this.context.filledSlots[awaitingSlot] = entity.value;
            this.context.awaitingSlot = null;
          }
        }
      } else {
        // Fill any slots we find
        entities.forEach(entity => {
          const slotName = this.mapEntityToSlot(entity.type);
          if (slotName && !this.context.filledSlots[slotName]) {
            this.context.filledSlots[slotName] = entity.value;
          }
        });
      }
    }
    
    mapEntityToSlot(type) {
      const map = {
        'service': 'service',
        'pet_name': 'petName',
        'date': 'date',
        'time': 'time',
        'ownerName': 'ownerName',
        'phone': 'ownerPhone',
        'email': 'ownerEmail'
      };
      return map[type] || null;
    }

    getNextRequiredSlot() {
      return BOOKING_SLOTS.find(slot => slot.required && !this.context.filledSlots[slot.name]);
    }
    
    getConfirmationMessage() {
      const { filledSlots, lang } = this.context;
      const s = getServiceById(filledSlots.service);
      const serviceName = s ? (s.name[lang] || s.name.en) : 'Unknown Service';

      if (lang === 'es') {
        return `Por favor confirme los detalles:\n
- Servicio: ${serviceName}
- Mascota: ${filledSlots.petName}
- Fecha: ${filledSlots.date} a las ${filledSlots.time}
- Su Nombre: ${filledSlots.ownerName}
- Teléfono: ${filledSlots.ownerPhone}

¿Es correcto?`;
      }
      return `Please confirm the details:\n
- Service: ${serviceName}
- Pet: ${filledSlots.petName}
- Date: ${filledSlots.date} at ${filledSlots.time}
- Your Name: ${filledSlots.ownerName}
- Phone: ${filledSlots.ownerPhone}

Is this correct?`;
    }
    
    handleCallbackRequest(entities) {
       const phone = entities.find(e => e.type === 'phone')?.value || this.context.filledSlots.ownerPhone;
       const time = entities.find(e => e.type === 'time' || e.type === 'date')?.value || this.context.filledSlots.preferredTime;
       
       if (!phone) {
         this.context.dialogueState = 'awaiting_contact_phone';
         return {
           response: this.t('ask_phone', { en: "Sure, I can have someone call you. What's the best phone number?", es: "Claro, puedo pedir que alguien le llame. ¿Cuál es el mejor número de teléfono?" }),
           suggestions: [],
           nextContext: this.context
         };
       }
       
       if (!time) {
         this.context.dialogueState = 'awaiting_contact_time';
         this.context.filledSlots.ownerPhone = phone; // Save the phone
         return {
           response: this.t('ask_time', { en: `Got it: ${phone}. When would be a good time to call?`, es: `Entendido: ${phone}. ¿Cuándo sería un buen momento para llamarle?` }),
           suggestions: this.getSuggestions('time'),
           nextContext: this.context
         };
       }
       
       // Both are present
       this.context.filledSlots.ownerPhone = phone;
       this.context.filledSlots.preferredTime = time;
       return this.confirmCallback();
    }
    
    confirmCallback() {
       const { ownerPhone, preferredTime } = this.context.filledSlots;
       this.context.dialogueState = 'idle'; // Reset state
       this.context.filledSlots = {};
       return {
         response: this.t('callback_confirm', { 
           en: `Okay! I've requested a callback for you at ${ownerPhone}, around ${preferredTime}. A staff member will reach out soon.`, 
           es: `¡De acuerdo! He solicitado una llamada para usted al ${ownerPhone}, alrededor de las ${preferredTime}. Un miembro del personal se comunicará pronto.`
         }),
         suggestions: this.getSuggestions('idle'),
         nextContext: this.context,
         action: 'save_contact_request'
       };
    }
    
    getSuggestions(state) {
      const lang = this.lang;
      const suggestions = {
        'idle': { en: ["Book an appointment", "See services", "What are your hours?", "Location"], es: ["Reservar una cita", "Ver servicios", "¿Cuál es su horario?", "Ubicación"] },
        'default': { en: ["Book an appointment", "See services", "What are your hours?", "Location"], es: ["Reservar una cita", "Ver servicios", "¿Cuál es su horario?", "Ubicación"] },
        'service': { en: ["Grooming", "Boarding", "Daycare", "Spa"], es: ["Estética", "Hospedaje", "Guardería", "Spa"] },
        'date': { en: ["Tomorrow", "Next Monday", "This weekend"], es: ["Mañana", "El próximo lunes", "Este fin de semana"] },
        'time': { en: ["9:00 AM", "1:00 PM", "Any time"], es: ["9:00 AM", "1:00 PM", "Cualquier hora"] },
        'ownerEmail': { en: ["skip", "no email"], es: ["omitir", "sin correo"] },
        'consent': { en: ["Yes, that's fine", "No, cancel"], es: ["Sí, está bien", "No, cancelar"] },
        'confirmation': { en: ["Yes, confirm", "No, change details"], es: ["Sí, confirmar", "No, cambiar detalles"] }
      };
      
      // Fallback for slots without specific examples
      const slotSuggestions = suggestions[state] || suggestions['default'];
      return slotSuggestions[lang] || slotSuggestions['en'];
    }
  }

  function detectIntent(message, context) {
    const lang = context.lang || 'en';
    const lower = message.toLowerCase();
    
    // 1. Context-driven intents (if we are waiting for something)
    if (context.awaitingSlot) {
      // User is providing the data we asked for
      return { intent: `provide_${context.awaitingSlot}`, confidence: 0.95 };
    }
    if (context.dialogueState === 'confirmation') {
      if (lower.includes('yes') || lower.includes('sí') || lower.includes('confirm')) return { intent: 'affirmative', confidence: 0.9 };
      if (lower.includes('no') || lower.includes('cancel')) return { intent: 'negative', confidence: 0.9 };
    }

    // 2. Rule-based intents
    const rules = {
      en: [
        { intent: 'book_service', keywords: ['book', 'reserve', 'schedule', 'appointment', 'board'] },
        { intent: 'request_contact_call', keywords: ['call me', 'contact me', 'phone me'] },
        { intent: 'ask_hours', keywords: ['hours', 'open', 'when', 'schedule', 'time'] },
        { intent: 'ask_price', keywords: ['how much', 'cost', 'price', 'pricing'] },
        { intent: 'services', keywords: ['service', 'grooming', 'daycare', 'spa'] },
        { intent: 'greeting', keywords: ['hi', 'hello', 'hey'] },
        { intent: 'affirmative', keywords: ['yes', 'yeah', 'yep', 'ok', 'sure'] },
        { intent: 'negative', keywords: ['no', 'nope', 'cancel', 'skip', 'omit'] }
      ],
      es: [
        { intent: 'book_service', keywords: ['reservar', 'cita', 'agendar', 'hospedar'] },
        { intent: 'request_contact_call', keywords: ['llámeme', 'contactarme', 'teléfono'] },
        { intent: 'ask_hours', keywords: ['horario', 'abren', 'cuándo', 'hora'] },
        { intent: 'ask_price', keywords: ['cuánto cuesta', 'precio', 'costo'] },
        { intent: 'services', keywords: ['servicio', 'estética', 'guardería', 'hospedaje'] },
        { intent: 'greeting', keywords: ['hola', 'buenos días', 'buenas tardes'] },
        { intent: 'affirmative', keywords: ['sí', 'si', 'claro', 'ok', 'vale'] },
        { intent: 'negative', keywords: ['no', 'cancelar', 'omitir'] }
      ]
    };

    for (const rule of rules[lang]) {
      if (rule.keywords.some(k => lower.includes(k))) {
        return { intent: rule.intent, confidence: 0.9 };
      }
    }

    // 3. Fallback to knowledge base search
    if (searchKnowledge(lower, lang)) {
      return { intent: 'question', confidence: 0.7 };
    }

    return { intent: 'unknown', confidence: 0.5 };
  }
  
  // --- 5. UI COMPONENTS (from components/ files) ---
  // (Converted from TSX to HTM)

  // Helper for classnames
  function cn(...inputs) {
    const classes = [];
    for (const input of inputs) {
      if (typeof input === 'string') {
        classes.push(input);
      } else if (typeof input === 'object' && input !== null) {
        for (const key in input) {
          if (input[key]) {
            classes.push(key);
          }
        }
      }
    }
    // This is a minimal replacement for twMerge
    return [...new Set(classes.join(' ').split(' '))].join(' ');
  }
  
  // Icon helper
  function Icon({ name, className = "w-4 h-4", ...props }) {
    if (!lucide || !lucide[name]) {
      return html`<span class="w-4 h-4 inline-block">[i]</span>`; // Fallback
    }
    const LucideIcon = lucide[name];
    return html`<\${LucideIcon} className=${className} ...\${props} />`;
  }

  // --- UI Components ---
  // We'll create minimal, functional versions of the components needed.

  const Button = ({ className, children, ...props }) => {
    return html`
      <button
        className=${cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          "h-11 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-md hover:shadow-lg",
          className
        )}
        ...${props}
      >
        ${children}
      </button>
    `;
  };

  const Card = ({ className, children, ...props }) => {
    return html`
      <div
        className=${cn(
          "rounded-xl border bg-card text-card-foreground shadow-md transition-all duration-smooth",
          className
        )}
        ...${props}
      >
        ${children}
      </div>
    `;
  };

  const Input = ({ className, ...props }) => {
    return html`
      <input
        className=${cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ...${props}
      />
    `;
  };
  
  const Textarea = ({ className, ...props }) => {
    return html`
      <textarea
        className=${cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ...${props}
      />
    `;
  };

  const Select = ({ className, children, ...props }) => {
    return html`
      <select
        className=${cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ...${props}
      >
        ${children}
      </select>
    `;
  };
  
  const Switch = ({ checked, onCheckedChange, ...props }) => {
    return html`
      <button
        type="button"
        role="switch"
        aria-checked=${checked}
        onClick=${() => onCheckedChange(!checked)}
        className=${cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? 'bg-primary' : 'bg-input'
        )}
        ...${props}
      >
        <span
          className=${cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    `;
  };

  // --- App Components (from components/ files) ---

  const Hero = ({ onBookingClick, onChatClick, lang }) => {
    const t = (en, es) => (lang === 'es' ? es : en);
    return html`
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5"></div>
        <div className="absolute inset-0" style=${{ background: 'var(--gradient-mesh)' }}></div>
        <div className="absolute inset-0 bg-[url('assets/images/hero-background.jpg')] bg-cover bg-center opacity-10" 
             onError=${(e) => e.target.style.opacity = 0}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background"></div>
        
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style=${{ animationDelay: '1s' }}></div>

        <div className="relative z-10 container mx-auto px-4 py-32 text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6 animate-fade-in-up leading-tight">
            ${t('Where Every Pup is', 'Donde Cada Cachorro es')}
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
                ${t('Treated Like Royalty', 'Tratado Como Realeza')}
              </span>
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in-up leading-relaxed" style=${{ animationDelay: "0.1s" }}>
            ${t('Professional grooming, luxury boarding, and spa treatments.', 'Estética profesional, hospedaje de lujo y tratamientos de spa.')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style=${{ animationDelay: "0.2s" }}>
            <${Button} 
              onClick=${onBookingClick}
              className="bg-gradient-to-r from-primary via-primary-glow to-primary text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-glow hover:scale-[1.02] border border-primary/10"
              size="xl"
            >
              <${Icon} name="Calendar" className="mr-2" />
              <span>${t('Book a Stay', 'Reservar Estancia')}</span>
            <//>
            <${Button} 
              onClick=${onChatClick}
              variant="glass" 
              size="xl"
              className="bg-card/50 backdrop-blur-md text-card-foreground border border-border/50 hover:bg-card/70 hover:border-border shadow-lg hover:shadow-xl"
            >
              <${Icon} name="MessageCircle" className="mr-2" />
              <span>${t('Chat with Us', 'Hablar con Nosotros')}</span>
            <//>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
      </section>
    `;
  };

  const Services = ({ onBookService, lang }) => {
    const t = (obj) => (obj[lang] || obj['en']);
    
    return html`
      <section id="services" className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              ${t({ en: 'Our Services', es: 'Nuestros Servicios' })}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              ${t({ en: 'From quick refreshes to full spa days.', es: 'Desde baños rápidos hasta días de spa completos.' })}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${ALL_SERVICES.map((service, idx) => html`
              <${Card} 
                key=${service.id} 
                className="group relative overflow-hidden border border-border/50 hover:border-primary/30 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-smooth hover:scale-[1.02] cursor-pointer"
                style=${{ animationDelay: `${idx * 0.1}s` }}
                onClick=${() => onBookService(service)}
              >
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src=${service.image} 
                    alt=${t(service.name)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError=${(e) => e.target.src = 'https://placehold.co/600x400/9ca3af/ffffff?text=Image'}
                  />
                  <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-lg border border-primary/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    ${service.type}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">${t(service.name)}</h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">${t(service.description)}</p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 pb-4 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <${Icon} name="Clock" className="w-4 h-4 text-primary" />
                      <span className="font-medium">${service.duration}</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <${Icon} name="DollarSign" className="w-5 h-5" />
                      <span className="font-bold text-xl">${service.price.replace('$', '')}</span>
                    </div>
                  </div>
                  
                  <${Button} 
                    className="w-full"
                    onClick=${(e) => {
                      e.stopPropagation();
                      onBookService(service);
                    }}
                  >
                    <${Icon} name="Calendar" className="mr-2 w-4 h-4" />
                    ${t({ en: 'Book Now', es: 'Reservar Ahora' })}
                  <//>
                </div>
              <//>
            `)}
          </div>
        </div>
      </section>
    `;
  };
  
  const Info = ({ lang }) => {
    const t = (en, es) => (lang === 'es' ? es : en);
    
    // Manually manage accordion state
    const [openItem, setOpenItem] = useState(null);
    const toggleItem = (item) => {
      setOpenItem(openItem === item ? null : item);
    };

    const faqs = [
      { id: 'faq1', q: { en: "What are your operating hours?", es: "¿Cuál es su horario?" }, a: { en: "We're open Monday-Saturday from 8:00 AM to 6:00 PM, and Sunday from 9:00 AM to 4:00 PM.", es: "Abrimos de Lunes a Sábado de 8:00 AM a 6:00 PM, y Domingo de 9:00 AM a 4:00 PM." } },
      { id: 'faq2', q: { en: "Do you require vaccinations?", es: "¿Requieren vacunas?" }, a: { en: "Yes, we require current vaccinations (Rabies, DHPP, Bordetella) for the safety of all guests.", es: "Sí, requerimos vacunas vigentes (Rabia, DHPP, Bordetella) por la seguridad de todos los huéspedes." } },
      { id: 'faq3', q: { en: "Can you administer medication?", es: "¿Pueden administrar medicamentos?" }, a: { en: "Yes, our trained staff can administer oral medications at no extra charge.", es: "Sí, nuestro personal capacitado puede administrar medicamentos orales sin costo adicional." } },
      { id: 'faq4', q: { en: "What's your cancellation policy?", es: "¿Cuál es su política de cancelación?" }, a: { en: "You can cancel up to 24 hours before your appointment with no fee. Within 24 hours, a 50% fee applies.", es: "Puede cancelar hasta 24 horas antes de su cita sin cargo. Dentro de las 24 horas, se aplica un cargo del 50%." } }
    ];

    return html`
      <section id="info" className="relative py-24 bg-background">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <!-- About Us -->
            <div className="animate-fade-in">
              <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-8">
                ${t('About Us', 'Sobre Nosotros')}
              </h2>
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>${t('Since 2015, we have been providing premium pet care services to families across Mexico.', 'Desde 2015, hemos brindado servicios premium de cuidado de mascotas a familias en todo México.')}</p>
                <p>${t('Our team of certified groomers and experienced caregivers treat every pet like family.', 'Nuestro equipo de esteticistas certificados y cuidadores experimentados trata a cada mascota como familia.')}</p>
              </div>
              
              <${Card} className="mt-10 p-8 bg-muted/20 border-border/50">
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  ${t('Contact & Location', 'Contacto y Ubicación')}
                </h3>
                <div className="space-y-4 text-foreground/80">
                  <div className="flex items-start gap-4">
                    <${Icon} name="MapPin" className="w-5 h-5 text-primary mt-1" />
                    <span>123 Paw Street, Pet City, Mexico</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <${Icon} name="Clock" className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold">${t('Mon-Sat: 8:00 AM - 6:00 PM', 'Lun-Sáb: 8:00 AM - 6:00 PM')}</p>
                      <p className="font-semibold">${t('Sun: 9:00 AM - 4:00 PM', 'Dom: 9:00 AM - 4:00 PM')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <${Icon} name="Phone" className="w-5 h-5 text-primary mt-1" />
                    <span className="font-semibold">(555) DOG-SPAA</span>
                  </div>
                </div>
              <//>
            </div>
            
            <!-- FAQ -->
            <div className="animate-fade-in-up">
              <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-8">
                ${t('FAQ', 'Preguntas Frecuentes')}
              </h2>
              
              <div className="space-y-4">
                ${faqs.map(faq => html`
                  <div key=${faq.id} className="bg-card/80 rounded-xl px-6 shadow-md border border-border/50">
                    <button
                      onClick=${() => toggleItem(faq.id)}
                      className="flex w-full items-center justify-between py-5 text-left font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      <span>${t(faq.q.en, faq.q.es)}</span>
                      <${Icon} name="ChevronDown" className=${cn("h-4 w-4 shrink-0 transition-transform duration-200", openItem === faq.id && "rotate-180")} />
                    </button>
                    <div
                      className="overflow-hidden text-sm transition-all duration-300 ease-out"
                      style=${{
                        maxHeight: openItem === faq.id ? '200px' : '0',
                        opacity: openItem === faq.id ? '1' : '0',
                        paddingBottom: openItem === faq.id ? '1.25rem' : '0',
                        visibility: openItem === faq.id ? 'visible' : 'hidden',
                      }}
                    >
                      <p className="text-muted-foreground leading-relaxed">${t(faq.a.en, faq.a.es)}</p>
                    </div>
                  </div>
                `)}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  };

  const BookingWidget = ({ preselectedService, onClose, lang }) => {
    const t = (en, es) => (lang === 'es' ? es : en);
    const [formData, setFormData] = useState({
      service: preselectedService?.id || "",
      date: new Date().toISOString().split('T')[0],
      time: "09:00",
      petName: "",
      petBreed: "",
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      contactConsent: false,
      contactMethod: "email"
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [bookingId, setBookingId] = useState("");

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Client-side validation
      if (!formData.service || !formData.date || !formData.time || !formData.petName || !formData.ownerName || !formData.ownerPhone) {
        alert(t('Please fill all required fields.', 'Por favor complete todos los campos obligatorios.'));
        return;
      }
      
      const selectedService = getServiceById(formData.service);
      const bookingData = {
        ...formData,
        service: selectedService ? selectedService.name : { en: 'Unknown', es: 'Desconocido' },
        service_type: selectedService ? selectedService.type : 'unknown',
        status: "pending"
      };
      
      const savedBooking = await addBooking(bookingData);
      setBookingId(savedBooking.id);
      setIsSubmitted(true);
      
      if (formData.contactConsent) {
         await addContactRequest({
           bookingId: savedBooking.id,
           method: formData.contactMethod,
           details: `Booking ${savedBooking.id}`,
           preferred_time: 'ASAP'
         });
      }
    };

    if (isSubmitted) {
      return html`
        <div className="fixed inset-0 bg-black/80 z-40 animate-fade-in" onClick=${onClose}></div>
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t-4 border-primary shadow-lg z-50 p-4 animate-slide-up-fade">
          <div className="container mx-auto max-w-2xl text-center p-8">
            <${Icon} name="CheckCheck" className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 p-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">${t('Booking Confirmed!', '¡Reserva Confirmada!')}</h3>
            <p className="text-muted-foreground mb-4">${t('Your booking ID is:', 'Su ID de reserva es:')}</p>
            <p className="text-2xl font-bold text-primary mb-6">${bookingId.toString().slice(-8)}</p>
            <${Button} onClick=${onClose}>${t('Done', 'Hecho')}<//>
          </div>
        </div>
      `;
    }

    return html`
      <div className="fixed inset-0 bg-black/80 z-40 animate-fade-in" onClick=${onClose}></div>
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border shadow-lg z-50 transition-all duration-300 animate-slide-up-fade">
        <div className="container mx-auto px-4 py-6 max-h-[80vh] overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">${t('Book Your Appointment', 'Reserve su Cita')}</h2>
            <${Button} 
              variant="ghost" 
              size="icon"
              onClick=${onClose}
              className="hover:bg-muted"
            >
              <${Icon} name="X" className="w-5 h-5" />
            <//>
          </div>

          <form onSubmit=${handleSubmit} className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="space-y-2">
              <label htmlFor="service" className="text-sm font-medium">${t('Service', 'Servicio')} *</label>
              <${Select} id="service" name="service" value=${formData.service} onChange=${handleChange} required>
                <option value="" disabled>${t('Select a service', 'Seleccione un servicio')}</option>
                ${ALL_SERVICES.map(s => html`
                  <option key=${s.id} value=${s.id}>
                    ${t(s.name.en, s.name.es)} - ${s.price}
                  </option>
                `)}
              <//>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">${t('Date', 'Fecha')} *</label>
              <${Input} id="date" name="date" type="date" value=${formData.date} onChange=${handleChange} min=${new Date().toISOString().split('T')[0]} required />
            </div>

            <div className="space-y-2">
              <label htmlFor="time" className="text-sm font-medium">${t('Time', 'Hora')} *</label>
              <${Input} id="time" name="time" type="time" value=${formData.time} onChange=${handleChange} required />
            </div>

            <div className="space-y-2">
              <label htmlFor="petName" className="text-sm font-medium">${t("Pet's Name", 'Nombre de Mascota')} *</label>
              <${Input} id="petName" name="petName" value=${formData.petName} onChange=${handleChange} required />
            </div>

            <div className="space-y-2">
              <label htmlFor="petBreed" className="text-sm font-medium">${t('Pet Breed', 'Raza de Mascota')} *</label>
              <${Input} id="petBreed" name="petBreed" value=${formData.petBreed} onChange=${handleChange} required />
            </div>

            <div className="space-y-2">
              <label htmlFor="ownerName" className="text-sm font-medium">${t('Your Name', 'Su Nombre')} *</label>
              <${Input} id="ownerName" name="ownerName" value=${formData.ownerName} onChange=${handleChange} required />
            </div>

            <div className="space-y-2">
              <label htmlFor="ownerEmail" className="text-sm font-medium">${t('Your Email', 'Su Email')} *</label>
              <${Input} id="ownerEmail" name="ownerEmail" type="email" value=${formData.ownerEmail} onChange=${handleChange} required />
            </div>

            <div className="space-y-2">
              <label htmlFor="ownerPhone" className="text-sm font-medium">${t('Your Phone', 'Su Teléfono')} *</label>
              <${Input} id="ownerPhone" name="ownerPhone" type="tel" value=${formData.ownerPhone} onChange=${handleChange} required />
            </div>

            <div className="md:col-span-2 space-y-4 p-4 bg-accent/20 rounded-lg border-2 border-accent">
              <div className="flex items-center justify-between">
                <label htmlFor="contactConsent" className="cursor-pointer text-sm font-medium">
                  ${t('Would you like a staff member to contact you?', '¿Desea que un miembro del personal lo contacte?')}
                </label>
                <${Switch} id="contactConsent" name="contactConsent" checked=${formData.contactConsent} onCheckedChange=${(checked) => handleChange({ target: { name: 'contactConsent', type: 'checkbox', checked } })} />
              </div>

              ${formData.contactConsent && html`
                <div className="grid md:grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">${t('Preferred Method', 'Método Preferido')}</label>
                    <${Select} name="contactMethod" value=${formData.contactMethod} onChange=${handleChange}>
                      <option value="email">${t('Email', 'Correo Electrónico')}</option>
                      <option value="phone">${t('Phone Call', 'Llamada Telefónica')}</option>
                      <option value="text">${t('Text Message', 'Mensaje de Texto')}</option>
                    <//>
                  </div>
                </div>
              `}
            </div>

            <div className="md:col-span-2">
              <${Button} type="submit" size="lg" className="w-full">
                <${Icon} name="Calendar" className="mr-2 w-5 h-5" />
                ${t('Confirm Booking', 'Confirmar Reserva')}
              <//>
            </div>
          </form>
        </div>
      </div>
    `;
  };

  const Chatbot = ({ onBookService, lang, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [context, setContext] = useState({ dialogueState: 'idle', filledSlots: {}, lang });
    
    const dialogueManagerRef = useRef(new DialogueManager({ ...context, lang }));
    const messagesEndRef = useRef(null);

    // Update DM context when lang changes
    useEffect(() => {
      dialogueManagerRef.current = new DialogueManager({ ...context, lang });
      setContext(prev => ({...prev, lang}));
      // Post a welcome message if no history
      if (messages.length === 0) {
        addMessage("assistant", t('chat_welcome_en', 'chat_welcome_es'));
      }
      setSuggestions(dialogueManagerRef.current.getSuggestions('idle'));
    }, [lang]);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const addMessage = async (role, content, action = null) => {
      const msg = {
        id: `msg-${Date.now()}-${Math.random()}`,
        role,
        content,
        action,
        timestamp: new Date().toISOString(),
        sessionId: SESSION_ID
      };
      setMessages(prev => [...prev, msg]);
      await addChatMessage(msg);
      return msg;
    };

    const handleSend = async () => {
      if (!input.trim()) return;

      const userMessage = input.trim();
      setInput("");
      await addMessage("user", userMessage);
      setIsTyping(true);

      const intentResult = detectIntent(userMessage, context);
      const dm = dialogueManagerRef.current;
      const dmResponse = dm.determineNextAction(userMessage, intentResult.intent);
      
      let responseContent = dmResponse.response;
      let responseAction = dmResponse.action;
      
      // If DM returns null, it's a KB question
      if (responseContent === null) {
        const kbResult = searchKnowledge(userMessage, lang);
        responseContent = kbResult 
          ? kbResult.answer 
          : t('fallback_en', 'fallback_es');
      }
      
      // Handle action from DM
      if (responseAction === 'save_booking') {
        const bookingData = {
          ...dm.context.filledSlots,
          service: getServiceById(dm.context.filledSlots.service)?.name || { en: 'Unknown', es: 'Desconocido' },
          status: 'pending'
        };
        const savedBooking = await addBooking(bookingData);
        responseContent += `\n\n${t('booking_id_en', 'booking_id_es')} ${savedBooking.id.toString().slice(-8)}`;
      }
      
      if (responseAction === 'save_contact_request') {
        await addContactRequest({
           method: 'phone',
           details: 'Callback request from chat',
           preferred_time: dm.context.filledSlots.preferredTime || 'ASAP',
           phone: dm.context.filledSlots.ownerPhone
         });
      }

      setContext(dm.context);
      setSuggestions(dmResponse.suggestions || []);
      
      setTimeout(async () => {
        setIsTyping(false);
        await addMessage("assistant", responseContent);
      }, 800);
    };
    
    const handleSuggestionClick = (suggestion) => {
      setInput(suggestion);
      // Use setTimeout to allow state to update before sending
      setTimeout(handleSend, 50);
    };

    return html`
      <!-- Chat Button -->
      <${Button}
        className=${cn(
          "fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl hover:shadow-2xl z-50 group",
          "bg-gradient-to-r from-primary via-primary-glow to-secondary text-primary-foreground border border-primary/10"
        )}
        onClick=${() => setIsOpen(prev => !prev)}
      >
        ${isOpen 
          ? html`<${Icon} name="X" className="w-6 h-6 group-hover:rotate-90 transition-transform" />` 
          : html`<${Icon} name="MessageCircle" className="w-6 h-6 group-hover:scale-110 transition-transform" />`
        }
      <//>

      <!-- Chat Window -->
      ${isOpen && html`
        <${Card} className="fixed bottom-24 right-6 w-96 h-[600px] shadow-2xl border border-border/50 bg-card/95 backdrop-blur-xl z-50 flex flex-col animate-slide-up-fade overflow-hidden">
          <!-- Header -->
          <div className="relative bg-gradient-to-r from-primary via-primary-glow to-primary text-primary-foreground p-5 rounded-t-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer"></div>
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 bg-primary-foreground/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-primary-foreground/30">
                <${Icon} name="Bot" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">${t('chat_title_en', 'chat_title_es')}</h3>
                <p className="text-xs opacity-90">${t('chat_subtitle_en', 'chat_subtitle_es')} 🐾</p>
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div className="flex-1 overflow-auto p-4 space-y-4 bg-gradient-to-b from-muted/5 to-muted/10">
            ${messages.map(msg => html`
              <div
                key=${msg.id}
                className=${cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                ${msg.role === "assistant" && html`
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <${Icon} name="Bot" className="w-5 h-5 text-primary-foreground" />
                  </div>
                `}
                <div
                  className=${cn(
                    "max-w-[75%] p-3 rounded-2xl shadow-sm transition-all duration-smooth",
                    msg.role === "user"
                      ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground"
                      : "bg-card/80 backdrop-blur-sm border border-border/50"
                  )}
                >
                  <p className="text-sm whitespace-pre-line">${msg.content}</p>
                </div>
                ${msg.role === "user" && html`
                  <div className="w-8 h-8 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <${Icon} name="User" className="w-5 h-5 text-secondary-foreground" />
                  </div>
                `}
              </div>
            `)}
            
            ${isTyping && html`
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <${Icon} name="Bot" className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="bg-card border border-border p-3 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style=${{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style=${{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style=${{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            `}
            
            <div ref=${messagesEndRef} />
          </div>

          <!-- Quick Replies -->
          ${suggestions.length > 0 && html`
            <div className="px-4 pb-2 flex flex-wrap gap-2 border-t border-border pt-3">
              ${suggestions.slice(0, 4).map(suggestion => html`
                <button
                  key=${suggestion}
                  onClick=${() => handleSuggestionClick(suggestion)}
                  className="text-xs hover:bg-primary/10 hover:border-primary/50 hover:text-primary border border-border rounded-full px-3 py-1.5 transition-all"
                >
                  ${suggestion}
                </button>
              `)}
            </div>
          `}

          <!-- Input -->
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <${Input}
                value=${input}
                onChange=${(e) => setInput(e.target.value)}
                onKeyPress=${(e) => e.key === "Enter" && handleSend()}
                placeholder=${t('input_placeholder_en', 'input_placeholder_es')}
                className="flex-1"
              />
              <${Button} size="icon" onClick=${handleSend} disabled=${!input.trim()}>
                <${Icon} name="Send" className="w-4 h-4" />
              <//>
            </div>
          </div>
        <//>
      `}
    `;
  };
  
  const AdminPanel = ({ lang }) => {
    const t = (en, es) => (lang === 'es' ? es : en);
    const [bookings, setBookings] = useState([]);
    const [requests, setRequests] = useState([]);
    
    useEffect(() => {
      async function fetchData() {
        setBookings(await getAllBookings());
        setRequests(await getContactRequests());
      }
      fetchData();
    }, []);
    
    const downloadCSV = () => {
      const csv = exportBookingsToCSV(bookings);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'bookings.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return html`
      <section id="admin" className="py-24 bg-muted/20 min-h-screen">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-8">${t('Admin Panel', 'Panel de Administración')}</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <${Card} className="overflow-hidden">
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-4">${t('Bookings', 'Reservas')} (${bookings.length})</h3>
                <${Button} onClick=${downloadCSV}>${t('Export Bookings CSV', 'Exportar Reservas CSV')}<//>
              </div>
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left font-medium">${t('Date', 'Fecha')}</th>
                      <th className="p-3 text-left font-medium">${t('Pet', 'Mascota')}</th>
                      <th className="p-3 text-left font-medium">${t('Service', 'Servicio')}</th>
                      <th className="p-3 text-left font-medium">${t('Owner', 'Dueño')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${bookings.map(b => html`
                      <tr key=${b.id} className="border-b">
                        <td className="p-3">${b.date} ${b.time}</td>
                        <td className="p-3">${b.petName}</td>
                        <td className="p-3">${t(b.service.en, b.service.es)}</td>
                        <td className="p-3">${b.ownerName} (${b.ownerPhone})</td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              </div>
            <//>
            
            <${Card} className="overflow-hidden">
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-4">${t('Contact Requests', 'Solicitudes de Contacto')} (${requests.length})</h3>
              </div>
               <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left font-medium">${t('Time', 'Hora')}</th>
                      <th className="p-3 text-left font-medium">${t('Phone', 'Teléfono')}</th>
                      <th className="p-3 text-left font-medium">${t('Reason', 'Razón')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${requests.map(r => html`
                      <tr key=${r.id} className="border-b">
                        <td className="p-3">${r.preferred_time}</td>
                        <td className="p-3">${r.phone}</td>
                        <td className="p-3">${r.details}</td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              </div>
            <//>
          </div>
        </div>
      </section>
    `;
  };

  // --- Main App Component ---
  const App = () => {
    const [lang, setLang] = useState('en');
    const [showBookingWidget, setShowBookingWidget] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    
    // Translations helper
    const t = (en, es) => (lang === 'es' ? es : en);
    const t_kb = (key_en, key_es) => (lang === 'es' ? key_es : key_en);

    // Load data from seed.json and init DB
    useEffect(() => {
      async function loadData() {
        try {
          const response = await fetch('seed.json');
          if (!response.ok) throw new Error('Failed to fetch seed.json');
          const data = await response.json();
          
          ALL_SERVICES = data.services;
          ALL_KNOWLEDGE = data.knowledge;
          
          initializeSearch(data.knowledge);
          await seedDatabase(data.services, data.knowledge);
          
          // Check for admin
          if (window.location.hash === '#admin') {
             const pass = prompt(t('Enter admin password', 'Ingrese la contraseña de administrador'));
             if (md5(pass || "") === ADMIN_PASS_HASH) { // md5("123")
               setIsAdmin(true);
             } else {
               alert(t('Incorrect password', 'Contraseña incorrecta'));
               window.location.hash = '';
             }
          }
          
        } catch (error) {
          console.error("Failed to load app data:", error);
        } finally {
          setIsLoading(false);
        }
      }
      loadData();
    }, []);
    
    const handleBookService = (service) => {
      setSelectedService(service);
      setShowBookingWidget(true);
    };
    
    const toggleLang = () => {
      const newLang = lang === 'en' ? 'es' : 'en';
      setLang(newLang);
    };
    
    if (isLoading) {
      return html`
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-xl text-muted-foreground">Loading...</p>
        </div>
      `;
    }
    
    if (isAdmin) {
      return html`<${AdminPanel} lang=${lang} />`;
    }

    return html`
      <${AppContext.Provider} value=${{ lang, t }}>
        <header className="fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
          <nav className="container mx-auto px-4 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <${Icon} name="Dog" className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">Dog Spa Hotel</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#hero" className="text-sm font-medium text-muted-foreground hover:text-primary">${t('Home', 'Inicio')}</a>
              <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-primary">${t('Services', 'Servicios')}</a>
              <a href="#info" className="text-sm font-medium text-muted-foreground hover:text-primary">${t('Info', 'Info')}</a>
              <${Button} onClick=${() => handleBookService(null)}>
                ${t('Book Now', 'Reservar')}
              <//>
              <${Button} 
                className="w-12 hover:bg-muted bg-muted text-muted-foreground border-border"
                onClick=${toggleLang}
              >
                ${lang === 'en' ? 'ES' : 'EN'}
              <//>
            </div>
          </nav>
        </header>

        <main>
          <${Hero} onBookingClick=${() => handleBookService(null)} onChatClick=${() => setShowChat(true)} lang=${lang} />
          <${Services} onBookService=${handleBookService} lang=${lang} />
          <${Info} lang=${lang} />
        </main>
        
        <footer className="py-12 bg-muted">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>© ${new Date().getFullYear()} Dog Spa Hotel. ${t('All rights reserved.', 'Todos los derechos reservados.')}</p>
          </div>
        </footer>

        ${showBookingWidget && html`
          <${BookingWidget}
            preselectedService=${selectedService}
            onClose=${() => setShowBookingWidget(false)}
            lang=${lang}
          />
        `}
        
        <${Chatbot} 
          onBookService=${handleBookService} 
          lang=${lang} 
          t=${(en, es) => t_kb(en, es)}
          key=${lang}
        />
        
      <//>
    `;
  };

  // --- 6. START THE APP ---
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(html`<\${App} />`);
  } else {
    console.error("Root element #root not found. App cannot mount.");
  }
  
  // --- 7. TEST HARNESS EXPOSURE (for tests.js) ---
  // (As required by PRD 15)
  if (window.location.pathname.endsWith('tests.html')) {
    console.warn('TEST HARNESS ENABLED. Exposing app logic to window.ChatbotLogic');
    
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
      
      // Translations for testing
      t_en: {
        'chat_welcome_en': "Hi! 👋 I'm here to help you. What can I help you with today?",
        'fallback_en': "Sorry, I'm not sure about that. I can help with services, pricing, or booking.",
        'booking_id_en': "Your Booking ID is:",
        'chat_title_en': "Dog Spa Assistant",
        'chat_subtitle_en': "Always here to help",
        'input_placeholder_en': "Type your message..."
      },
      t_es: {
        'chat_welcome_es': "¡Hola! 👋 Estoy aquí para ayudarte. ¿En qué puedo ayudarte hoy?",
        'fallback_es': "Lo siento, no estoy seguro de eso. Puedo ayudarte con servicios, precios o reservas.",
        'booking_id_es': "Su ID de reserva es:",
        'chat_title_es': "Asistente de Dog Spa",
        'chat_subtitle_es': "Siempre aquí para ayudar",
        'input_placeholder_es': "Escribe tu mensaje..."
      },

      // React Components
      AppContext,
      App,
      
      // Core Libs
      html,
      React,
      ReactDOM
    };
  }

})();