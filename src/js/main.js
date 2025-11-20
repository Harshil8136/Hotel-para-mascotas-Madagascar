import {
  React, ReactDOM, useState, useEffect,
  html, Icon, createContext, useContext
} from './globals.js';

import {
  getDB, seedDatabase
} from './database.js';

// --- 0. CRITICAL FIX: UNREGISTER SERVICE WORKERS ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      console.log('Unregistering stale service worker:', registration);
      registration.unregister();
    }
  });
}

import {
  initializeSearch
} from './chatbotLogic.js';

import {
  AppContext, Hero, Services, Info, Gallery, Pricing, Requirements, BookingWidget, Chatbot, Button
} from './components/index.js';

import { AdminPanel } from './admin.js';

// --- Main App Component ---
const App = () => {
  const [lang, setLang] = useState('en');
  const [showBookingWidget, setShowBookingWidget] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [services, setServices] = useState([]);

  // Translations helper
  const t = (en, es) => (lang === 'es' ? es : en);
  // KB translations (for chatbot)
  const t_kb = (key_en, key_es) => {
    const translations = {
      'chat_welcome_en': "Hi! 👋 I'm here to help you. What can I help you with today?",
      'chat_welcome_es': "¡Hola! 👋 Estoy aquí para ayudarte. ¿En qué puedo ayudarte hoy?",
      'fallback_en': "Sorry, I'm not sure about that. I can help with services, pricing, or booking.",
      'fallback_es': "Lo siento, no estoy seguro de eso. Puedo ayudarte con servicios, precios o reservas.",
      'booking_id_en': "Your Booking ID is:",
      'booking_id_es': "Su ID de reserva es:",
      'chat_title_en': "Hotel Madagascar",
      'chat_title_es': "Hotel Madagascar",
      'chat_subtitle_en': "Always here to help",
      'chat_subtitle_es': "Siempre aquí para ayudar",
      'input_placeholder_en': "Type your message...",
      'input_placeholder_es': "Escribe tu mensaje..."
    };
    return lang === 'es' ? (translations[key_es] || key_es) : (translations[key_en] || key_en);
  };

  // Load data from seed.json and init DB
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('seed.json');
        if (!response.ok) throw new Error('Failed to fetch seed.json');
        const data = await response.json();

        // Update state
        setServices(data.services);

        // Initialize the chatbot logic with data
        initializeSearch(data.knowledge, data.services);

        // Seed the database
        await seedDatabase(data.services, data.knowledge);

        // Check for admin
        if (window.location.hash === '#admin') {
          // This is a simple, *insecure* hash function for demo purposes per PRD.
          // A production app should use a proper auth flow.
          const md5 = (s) => {
            let h = 0;
            for (let i = 0; i < s.length; i++) {
              h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
            }
            // Basic hex conversion
            let res = h.toString(16);
            if (res.startsWith('-')) {
              res = res.substring(1);
            }
            return res.padStart(8, '0');
          };

          const pass = prompt(t('Enter admin password', 'Ingrese la contraseña de administrador'));

          const ADMIN_HASH = '4743c4bd'; // Hash for "adminpass"

          if (md5(pass) === ADMIN_HASH) {
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
  }, []); // Note: `t` is stable and doesn't need to be a dependency

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
    return html`
      <${AppContext.Provider} value=${{ lang, t, t_kb }}>
        <${AdminPanel} lang=${lang} t=${t} />
      <//>
    `;
  }

  return html`
    <${AppContext.Provider} value=${{ lang, t, t_kb }}>
      <header className="fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
        <nav className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <${Icon} name="Dog" className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-foreground hidden md:inline">Hotel Madagascar</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#hero" className="text-sm font-medium text-muted-foreground hover:text-primary">${t('Home', 'Inicio')}</a>
            <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-primary">${t('Services', 'Servicios')}</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary">${t('Pricing', 'Precios')}</a>
            <a href="#gallery" className="text-sm font-medium text-muted-foreground hover:text-primary">${t('Gallery', 'Galería')}</a>
            <a href="#info" className="text-sm font-medium text-muted-foreground hover:text-primary">${t('Contact', 'Contacto')}</a>
            <${Button} onClick=${() => handleBookService(null)}>
              ${t('Book Now', 'Reservar')}
            <//>
            <${Button} variant="outline" onClick=${toggleLang} className="w-12 hover:bg-muted">
              ${lang.toUpperCase()}
            <//>
          </div>
        </nav>
      </header>

      <main>
        <${Hero} onBookingClick=${() => handleBookService(null)} onChatClick=${() => setShowChat(true)} />
        <${Services} services=${services} onBookService=${handleBookService} />
        <${Pricing} />
        <${Gallery} />
        <${Requirements} />
        <${Info} />
      </main>
      
      <footer className="py-12 bg-muted">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© ${new Date().getFullYear()} Hotel Madagascar. ${t('All rights reserved.', 'Todos los derechos reservados.')}</p>
        </div>
      </footer>

      ${showBookingWidget && html`
        <${BookingWidget}
          preselectedService=${selectedService}
          onClose=${() => setShowBookingWidget(false)}
        />
      `}
      
      <${Chatbot} onBookService=${handleBookService} />
      
    <//>
  `;
};

// --- 6. START THE APP ---
// This code runs *after* index.html is parsed and all scripts are loaded
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(html`<${App} />`);


// --- 7. TEST HARNESS EXPOSURE (for tests.js) ---
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