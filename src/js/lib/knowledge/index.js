// Aggregate all FAQ categories
import { vaccinationsFAQs } from './faqs/vaccinationsFAQs.js';
import { specialNeedsFAQs } from './faqs/specialNeedsFAQs.js';
import { comfortFAQs } from './faqs/comfortFAQs.js';
import { facilitiesFAQs } from './faqs/facilitiesFAQs.js';
import { logisticsFAQs } from './faqs/logisticsFAQs.js';

// Original FAQs from seed.json (to be migrated here eventually)
const originalFAQs = [
    {
        id: "faq_hours_en",
        lang: "en",
        q_variants: ["What are your hours?", "When are you open?", "schedule"],
        answer: "We are open for reception. Please contact us to confirm specific drop-off and pick-up times.",
        category: "hours"
    },
    {
        id: "faq_hours_es",
        lang: "es",
        q_variants: ["¿Cuál es su horario?", "¿Cuándo abren?", "horario"],
        answer: "Estamos abiertos para recepción. Por favor contáctenos para confirmar horarios específicos de entrega y recogida.",
        category: "hours"
    },
    {
        id: "faq_location_en",
        lang: "en",
        q_variants: ["Where are you located?", "address", "directions"],
        answer: "We are located at Teniente Juan de la Barrera 503, Colonia Héroes 20190 Aguascalientes, Mexico.",
        category: "general"
    },
    {
        id: "faq_location_es",
        lang: "es",
        q_variants: ["¿Dónde están ubicados?", "dirección", "ubicación"],
        answer: "Estamos ubicados en Teniente Juan de la Barrera 503, Colonia Héroes 20190 Aguascalientes, México.",
        category: "general"
    },
    {
        id: "faq_contact_en",
        lang: "en",
        q_variants: ["phone number", "email", "contact"],
        answer: "You can reach us at +52 449 448 5486 (WhatsApp) or email hotelmadagascarags@gmail.com.",
        category: "general"
    },
    {
        id: "faq_contact_es",
        lang: "es",
        q_variants: ["teléfono", "correo", "contacto"],
        answer: "Puede contactarnos al +52 449 448 5486 (WhatsApp) o al correo hotelmadagascarags@gmail.com.",
        category: "general"
    },
    {
        id: "faq_included_en",
        lang: "en",
        q_variants: ["what is included?", "what do you offer?"],
        answer: "Our services include love, care, spacious play areas, individual rooms, and professional attention.",
        category: "services"
    },
    {
        id: "faq_included_es",
        lang: "es",
        q_variants: ["¿qué incluye?", "¿qué ofrecen?"],
        answer: "Nuestros servicios incluyen amor, cuidado, amplia área de juegos, cuartos individuales y atención profesional.",
        category: "services"
    }
];

// Combine all FAQs
export const ALL_FAQS = [
    ...vaccinationsFAQs,
    ...specialNeedsFAQs,
    ...comfortFAQs,
    ...facilitiesFAQs,
    ...logisticsFAQs,
    ...originalFAQs
];

// Export for easy access
export {
    vaccinationsFAQs,
    specialNeedsFAQs,
    comfortFAQs,
    facilitiesFAQs,
    logisticsFAQs
};
