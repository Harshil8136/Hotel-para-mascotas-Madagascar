import { searchKnowledge } from './knowledgeBase.js';

export function detectIntent(message, context) {
    const lang = context.lang || 'en';
    const lower = message.toLowerCase();

    // 1. Rule-based intents (High priority)
    const rules = {
        en: [
            { intent: 'book_service', keywords: ['book', 'reserve', 'schedule', 'appointment', 'board'] },
            { intent: 'request_contact_call', keywords: ['call me', 'contact me', 'phone me'] },
            { intent: 'ask_hours', keywords: ['hours', 'open', 'when', 'schedule', 'time'] },
            { intent: 'ask_price', keywords: ['how much', 'cost', 'price', 'pricing', 'rates', 'discount'] },
            // Health & Safety
            { intent: 'ask_vaccinations', keywords: ['vaccine', 'vaccination', 'rabies', 'shots', 'immunization', 'health requirements', 'bordetella'] },
            { intent: 'ask_medical', keywords: ['medication', 'medicine', 'pills', 'sick', 'emergency', 'vet', 'veterinarian'] },
            // Special Needs
            { intent: 'ask_special_needs', keywords: ['special needs', 'dietary', 'diet', 'food allergy', 'grain free', 'bring own food'] },
            { intent: 'ask_behavioral', keywords: ['aggressive', 'doesn\'t like other dogs', 'reactive', 'bite', 'mean', 'behavior', 'anxious'] },
            { intent: 'ask_allergy', keywords: ['sensitive', 'allergies', 'perfume', 'scent', 'allergy'] },
            // Comfort & First Time
            { intent: 'ask_first_time', keywords: ['first time', 'never been', 'new here', 'what to bring', 'how to prepare', 'trial visit'] },
            { intent: 'ask_separation_anxiety', keywords: ['separation anxiety', 'worried', 'stressed', 'misses me', 'anxiety'] },
            { intent: 'ask_updates', keywords: ['updates', 'photos', 'pictures', 'how is my pet', 'check on'] },
            // Facilities & Safety
            { intent: 'ask_facilities', keywords: ['tour', 'visit', 'see facility', 'look around', 'inspect'] },
            { intent: 'ask_cleanliness', keywords: ['clean', 'sanitation', 'hygiene', 'disinfect'] },
            { intent: 'ask_safety', keywords: ['safe', 'security', 'safety', 'protected', 'monitored'] },
            { intent: 'ask_climate', keywords: ['air conditioning', 'temperature', 'climate', 'heating', 'cooling'] },
            // Services & General
            { intent: 'services', keywords: ['service', 'grooming', 'daycare', 'spa', 'what do you offer'] },
            { intent: 'greeting', keywords: ['hi', 'hello', 'hey', 'greetings'] },
            // Enhanced Affirmative/Negative
            { intent: 'affirmative', keywords: ['yes', 'yeah', 'yep', 'ok', 'sure', 'correct', 'right', 'fine', 'good'] },
            { intent: 'negative', keywords: ['no', 'nope', 'cancel', 'stop', 'wrong', 'incorrect'] }
        ],
        es: [
            { intent: 'book_service', keywords: ['reservar', 'cita', 'agendar', 'hospedar'] },
            { intent: 'request_contact_call', keywords: ['llámeme', 'contactarme', 'teléfono'] },
            { intent: 'ask_hours', keywords: ['horario', 'abren', 'cuándo', 'hora'] },
            { intent: 'ask_price', keywords: ['cuánto cuesta', 'precio', 'costo', 'tarifas', 'descuento'] },
            // Health & Safety
            { intent: 'ask_vaccinations', keywords: ['vacuna', 'vacunación', 'rabia', 'vacunas', 'inmunización', 'requisitos de salud', 'bordetella'] },
            { intent: 'ask_medical', keywords: ['medicamento', 'medicina', 'pastillas', 'enfermo', 'emergencia', 'veterinario'] },
            // Special Needs
            { intent: 'ask_special_needs', keywords: ['necesidades especiales', 'dietético', 'dieta', 'alergia alimentaria', 'sin granos', 'traer comida'] },
            { intent: 'ask_behavioral', keywords: ['agresivo', 'no le gustan otros perros', 'reactivo', 'muerde', 'comportamiento', 'ansioso'] },
            { intent: 'ask_allergy', keywords: ['sensible', 'alergias', 'perfume', 'alergia'] },
            // Comfort & First Time
            { intent: 'ask_first_time', keywords: ['primera vez', 'nunca ha estado', 'nuevo aquí', 'qué traer', 'cómo preparar', 'visita de prueba'] },
            { intent: 'ask_separation_anxiety', keywords: ['ansiedad por separación', 'preocupado', 'estresado', 'me extraña', 'ansiedad'] },
            { intent: 'ask_updates', keywords: ['actualizaciones', 'fotos', 'imágenes', 'cómo está mi mascota', 'verificar'] },
            // Facilities & Safety
            { intent: 'ask_facilities', keywords: ['tour', 'visitar', 'ver instalaciones', 'inspeccionar'] },
            { intent: 'ask_cleanliness', keywords: ['limpio', 'saneamiento', 'higiene', 'desinfectar'] },
            { intent: 'ask_safety', keywords: ['seguro', 'seguridad', 'protegido', 'monitoreado'] },
            { intent: 'ask_climate', keywords: ['aire acondicionado', 'temperatura', 'clima', 'calefacción', 'enfriamiento'] },
            // Services & General
            { intent: 'services', keywords: ['servicio', 'estética', 'guardería', 'hospedaje', 'qué ofrecen'] },
            { intent: 'greeting', keywords: ['hola', 'buenos días', 'buenas tardes'] },
            // Enhanced Affirmative/Negative
            { intent: 'affirmative', keywords: ['sí', 'si', 'claro', 'ok', 'vale', 'correcto', 'bien', 'seguro'] },
            { intent: 'negative', keywords: ['no', 'cancelar', 'mal', 'incorrecto'] }
        ]
    };

    for (const rule of rules[lang]) {
        if (rule.keywords.some(k => lower.includes(k))) {
            // FIX: If we are awaiting a slot, and the found intent is 'book_service' (which shares keywords like 'boarding'),
            // we should treat it as providing the slot, NOT starting a new booking.
            if (context.awaitingSlot && rule.intent === 'book_service') {
                return { intent: `provide_${context.awaitingSlot}`, confidence: 0.95 };
            }
            return { intent: rule.intent, confidence: 0.9 };
        }
    }

    // 2. Context-driven intents (if no high-priority intent was found)
    if (context.awaitingSlot) {
        // User is providing the data we asked for
        return { intent: `provide_${context.awaitingSlot}`, confidence: 0.95 };
    }
    if (context.dialogueState === 'confirmation') {
        if (lower.includes('yes') || lower.includes('sí') || lower.includes('confirm') || lower.includes('yup') || lower.includes('sure')) return { intent: 'affirmative', confidence: 0.9 };
        if (lower.includes('no') || lower.includes('cancel')) return { intent: 'negative', confidence: 0.9 };
    }

    // 3. Fallback to knowledge base search
    if (searchKnowledge(lower, lang)) {
        return { intent: 'question', confidence: 0.7 };
    }

    return { intent: 'unknown', confidence: 0.5 };
}
