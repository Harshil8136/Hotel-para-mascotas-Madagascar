// Booking slot definitions
// Defines all required and optional fields for the booking flow

export const BOOKING_SLOTS = [
    {
        name: 'service',
        required: true,
        prompt: {
            en: "Which service would you like to book?",
            es: "¿Qué servicio le gustaría reservar?"
        },
        examples: {
            en: ["Hotel (Boarding)", "Daycare"],
            es: ["Hotel (Hospedaje)", "Guardería"]
        }
    },
    {
        name: 'petName',
        required: true,
        prompt: {
            en: "What's your pet's name?",
            es: "¿Cómo se llama su mascota?"
        }
    },
    {
        name: 'date',
        required: true,
        prompt: {
            en: "What date would you like to book for?",
            es: "¿Para qué fecha desea reservar?"
        },
        examples: {
            en: ["Tomorrow", "Next Monday", "This weekend"],
            es: ["Mañana", "El próximo lunes", "Este fin de semana"]
        }
    },
    {
        name: 'time',
        required: true,
        prompt: {
            en: "What time works best for you?",
            es: "¿A qué hora le viene bien?"
        },
        examples: {
            en: ["Morning (9-12)", "Afternoon (2-5)", "Flexible"],
            es: ["Mañana (9-12)", "Tarde (2-5)", "Flexible"]
        }
    },
    {
        name: 'ownerName',
        required: true,
        prompt: {
            en: "What's your full name?",
            es: "¿Cuál es su nombre completo?"
        }
    },
    {
        name: 'ownerPhone',
        required: true,
        prompt: {
            en: "What's the best phone number to reach you?",
            es: "¿Cuál es el mejor número de teléfono para contactarlo?"
        }
    },
    {
        name: 'ownerEmail',
        required: false,
        prompt: {
            en: "And your email address? (Optional - press skip to continue)",
            es: "¿Y su correo electrónico? (Opcional - presione omitir para continuar)"
        }
    },
    {
        name: 'consent',
        required: true,
        prompt: {
            en: "We need to save this information to make your booking. Is that okay?",
            es: "Necesitamos guardar esta información para hacer su reserva. ¿Está de acuerdo?"
        },
        examples: {
            en: ["Yes, that's fine", "No, cancel"],
            es: ["Sí, está bien", "No, cancelar"]
        }
    }
];

// Helper to get slot by name
export function getSlotByName(slotName) {
    return BOOKING_SLOTS.find(slot => slot.name === slotName);
}

// Helper to get all required slots
export function getRequiredSlots() {
    return BOOKING_SLOTS.filter(slot => slot.required);
}

// Helper to get all optional slots
export function getOptionalSlots() {
    return BOOKING_SLOTS.filter(slot => !slot.required);
}
