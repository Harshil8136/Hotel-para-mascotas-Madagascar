// Smart suggestion provider for all dialogue states
import { ALL_SERVICES } from '../../knowledgeBase.js';

export class SuggestionProvider {
    constructor(lang = 'en') {
        this.lang = lang;
    }

    /**
     * Get contextually relevant suggestions for a dialogue state
     * @param {string} state - Current dialogue state
     * @param {object} context - Dialogue context for conditional suggestions
     * @returns {string[]} Array of suggestion strings
     */
    getSuggestions(state, context = {}) {
        // Dynamic service suggestions from loaded data
        if (state === 'service') {
            return this.getServiceSuggestions();
        }

        // Get all suggestion definitions
        const suggestions = this.getAllSuggestions();
        const stateSuggestions = suggestions[state] || suggestions['default'];

        return stateSuggestions[this.lang] || stateSuggestions['en'] || [];
    }

    /**
     * Generate dynamic service suggestions from ALL_SERVICES
     */
    getServiceSuggestions() {
        const lang = this.lang;
        if (ALL_SERVICES.length === 0) {
            // Fallback if services not loaded yet
            return lang === 'es'
                ? ["Hotel (Hospedaje)", "Guardería", "Reubicación", "Transporte"]
                : ["Hotel (Boarding)", "Daycare", "Relocation", "Transport"];
        }

        return ALL_SERVICES.map(s => s.name[lang] || s.name.en).slice(0, 4);
    }

    /**
     * All suggestion definitions by dialogue state
     */
    getAllSuggestions() {
        return {
            // Initial idle state - highlight key actions
            'idle': {
                en: ["Book now", "Vaccination info", "First time here?", "See services", "What are your hours?"],
                es: ["Reservar ahora", "Info de vacunas", "¿Primera vez aquí?", "Ver servicios", "¿Cuál es su horario?"]
            },

            // Default fallback
            'default': {
                en: ["Book an appointment", "See services", "Vaccination requirements", "Contact us"],
                es: ["Reservar una cita", "Ver servicios", "Requisitos de vacunación", "Contáctenos"]
            },

            // Service selection (dynamically generated)
            'service': this.getServiceSuggestions(),

            // Pet name entry (no suggestions, text input)
            'petName': {
                en: [],
                es: []
            },

            // Date selection - smart date suggestions
            'date': {
                en: ["Tomorrow", "This weekend", "Next Monday", "Flexible dates"],
                es: ["Mañana", "Este fin de semana", "El próximo lunes", "Fechas flexibles"]
            },

            // Time selection - business context aware
            'time': {
                en: ["Morning (9-12)", "Afternoon (2-5)", "Evening (5-7)", "Flexible"],
                es: ["Mañana (9-12)", "Tarde (2-5)", "Noche (5-7)", "Flexible"]
            },

            // Owner name (no suggestions, text input)
            'ownerName': {
                en: [],
                es: []
            },

            // Phone number (no suggestions, text input)
            'ownerPhone': {
                en: [],
                es: []
            },

            // Email - optional field
            'ownerEmail': {
                en: ["Skip (optional)"],
                es: ["Omitir (opcional)"]
            },

            // Consent - simple yes/no
            'consent': {
                en: ["Yes, that's fine", "No, cancel booking"],
                es: ["Sí, está bien", "No, cancelar reserva"]
            },

            // Confirmation - final check
            'confirmation': {
                en: ["Yes, confirm booking", "No, let me change something"],
                es: ["Sí, confirmar reserva", "No, déjame cambiar algo"]
            },

            // Contact/callback states
            'awaiting_contact_phone': {
                en: [],
                es: []
            },

            'awaiting_contact_time': {
                en: ["Morning", "Afternoon", "Evening", "Anytime"],
                es: ["Mañana", "Tarde", "Noche", "Cualquier hora"]
            }
        };
    }

    /**
     * Get contextual follow-up suggestions (future enhancement)
     * Based on conversation history, could suggest related topics
     */
    getContextualSuggestions(dialogueHistory) {
        // Future: Analyze history and suggest related questions
        // Example: If user asked about vaccinations, suggest "Do you offer medication administration?"
        return [];
    }
}
