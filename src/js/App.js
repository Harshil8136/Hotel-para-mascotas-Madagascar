import {
  React, useState, useEffect, html, useContext
} from './globals.js';

import { seedDatabase } from './database.js';
import { initializeSearch } from './chatbotLogic.js';
import { AppContext } from './AppContext.js';
import { useAdminAuth } from './hooks/useAdminAuth.js';
import { unregisterServiceWorkers } from './utils/serviceWorker.js';

import {
  Hero, Services, Info, Gallery, Pricing, Requirements, BookingWidget, Chatbot
} from './components/index.js';
import { Header } from './components/layout/Header.js';
import { Footer } from './components/layout/Footer.js';
import { AdminPanel } from './admin.js';

// --- Main App Component ---
export const App = () => {
  const [lang, setLang] = useState('en');
  const [showBookingWidget, setShowBookingWidget] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
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

  const { isAdmin, checkAdmin } = useAdminAuth(t);

  // Load data from seed.json and init DB
  useEffect(() => {
    async function loadData() {
      try {
        // Unregister stale service workers
        unregisterServiceWorkers();

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
        checkAdmin();

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
    return html`
      <${AppContext.Provider} value=${{ lang, t, t_kb }}>
        <${AdminPanel} lang=${lang} t=${t} />
      <//>
    `;
  }

  return html`
    <${AppContext.Provider} value=${{ lang, t, t_kb, toggleLang }}>
      <${Header} t=${t} lang=${lang} toggleLang=${toggleLang} handleBookService=${handleBookService} />

      <main className="pt-20">
        <${Hero} onBookingClick=${() => handleBookService(null)} onChatClick=${() => setShowChat(true)} />
        <${Services} services=${services} onBookService=${handleBookService} />
        <${Pricing} />
        <${Gallery} />
        <${Requirements} />
        <${Info} />
      </main>
      
      <${Footer} t=${t} />

      ${showBookingWidget && html`
        <${BookingWidget}
          preselectedService=${selectedService}
          onClose=${() => setShowBookingWidget(false)}
        />
      `}
      
      <${Chatbot} 
        onBookService=${handleBookService} 
        isOpen=${showChat}
        onToggle=${setShowChat}
      />
      
    <//>
  `;
};
