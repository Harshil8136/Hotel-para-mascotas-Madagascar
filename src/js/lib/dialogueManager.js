import { extractEntities } from './entityExtractor.js';
import { getServiceById, searchKnowledge, ALL_SERVICES } from './knowledgeBase.js';
import { BOOKING_SLOTS } from './chatbot/slots/bookingSlots.js';
import { SuggestionProvider } from './chatbot/suggestions/suggestionProvider.js';

export class DialogueManager {
    constructor(context) {
        this.context = context || { dialogueState: 'idle', filledSlots: {} };
        this.lang = context.lang || 'en';
        this.suggestionProvider = new SuggestionProvider(this.lang);
    }

    // Helper to get translated string
    t(key, prompt) {
        return prompt[this.lang] || prompt['en'];
    }

    // Main entry point for processing user input
    async processInput(message) {
        // Import detectIntent dynamically to avoid circular dependency
        const { detectIntent } = await import('./intentParser.js');
        const intentResult = detectIntent(message.toLowerCase(), this.context);
        const intent = intentResult.intent || intentResult;

        const result = this.determineNextAction(message, intent);

        // If no specific response, try KB search
        if (!result.response) {
            const kbResult = searchKnowledge(message, this.lang);
            const response = kbResult ? kbResult.answer : this.t('fallback', {
                en: "Sorry, I'm not sure about that. I can help with services, pricing, or booking.",
                es: "Lo siento, no estoy seguro de eso. Puedo ayudarte con servicios, precios o reservas."
            });
            return {
                text: response,
                newState: this.context.dialogueState,
                filledSlots: this.context.filledSlots,
                action: result.action
            };
        }

        return {
            text: result.response,
            newState: result.nextContext.dialogueState,
            filledSlots: result.nextContext.filledSlots,
            action: result.action,
            serviceId: result.serviceId
        };
    }

    determineNextAction(message, intent) {
        const entities = extractEntities(message, this.context);
        this.fillSlots(entities, message, intent);

        const state = this.context.dialogueState;

        // Handle explicit cancellation
        if (intent === 'negative' && state !== 'idle' && state !== 'confirmation') {
            if (message.toLowerCase().includes('cancel') || message.toLowerCase().includes('stop')) {
                this.context = { dialogueState: 'idle', filledSlots: {}, lang: this.lang };
                return {
                    response: this.t('cancel', { en: "Okay, I've cancelled the booking process.", es: "De acuerdo, he cancelado el proceso de reserva." }),
                    suggestions: this.getSuggestions('idle'),
                    nextContext: this.context
                };
            }
        }

        // Handle call request
        if (intent === 'request_contact_call') {
            return this.handleCallbackRequest(entities);
        }

        // Handle special KBs
        if (intent === 'ask_aggressive' || intent === 'ask_allergy') {
            const kbResult = searchKnowledge(message, this.lang);
            const response = kbResult ? kbResult.answer : this.t('fallback_en', 'fallback_es');
            if (this.context.dialogueState === 'booking') {
                this.context.filledSlots.notes = (this.context.filledSlots.notes || "") + `\nUser note: ${message}`;
            }
            return {
                response: response + "\n\n" + this.t('added_note', { en: "I've added a note to your booking about this.", es: "He añadido una nota a su reserva sobre esto." }),
                suggestions: this.getSuggestions('idle'),
                nextContext: this.context
            };
        }

        if (state === 'awaiting_contact_phone') {
            const phoneEntity = entities.find(e => e.type === 'phone');
            if (phoneEntity) {
                this.context.filledSlots.ownerPhone = phoneEntity.value;
                return this.handleCallbackRequest(entities);
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

        // Handle informational intents during booking (e.g., "what services you have?")
        // This allows users to ask questions mid-booking without losing their progress
        if (this.context.dialogueState === 'booking') {
            const informationalIntents = [
                'services', 'ask_price', 'ask_hours', 'ask_location', 'question', 'greeting',
                // Health & Safety
                'ask_vaccinations', 'ask_medical',
                // Special Needs
                'ask_special_needs', 'ask_behavioral', 'ask_allergy',
                // Comfort & First Time
                'ask_first_time', 'ask_separation_anxiety', 'ask_updates',
                // Facilities & Safety
                'ask_facilities', 'ask_cleanliness', 'ask_safety', 'ask_climate'
            ];

            if (informationalIntents.includes(intent)) {
                // Special case: if asking about services, list all available services
                if (intent === 'services') {
                    const nextSlot = this.getNextRequiredSlot();
                    const servicesList = ALL_SERVICES.map(s => {
                        const name = s.name[this.lang] || s.name.en;
                        const desc = s.description[this.lang] || s.description.en;
                        return `• ${name} - ${desc} (${s.price})`;
                    }).join('\n');

                    const response = this.t('services_list', {
                        en: `Here are our available services:\n\n${servicesList}`,
                        es: `Aquí están nuestros servicios disponibles:\n\n${servicesList}`
                    });

                    let followUp = '';
                    if (nextSlot) {
                        followUp = '\n\n' + this.t('continue_booking', {
                            en: `Let's continue with your booking. ${this.t(nextSlot.name, nextSlot.prompt)}`,
                            es: `Continuemos con su reserva. ${this.t(nextSlot.name, nextSlot.prompt)}`
                        });
                    }

                    return {
                        response: response + followUp,
                        suggestions: this.getSuggestions(nextSlot ? nextSlot.name : 'idle'),
                        nextContext: this.context
                    };
                }

                // Try to answer from knowledge base
                const kbResult = searchKnowledge(message, this.lang);

                if (kbResult) {
                    // Answer the question and remind about booking
                    const nextSlot = this.getNextRequiredSlot();
                    let followUp = '';

                    if (nextSlot) {
                        followUp = '\n\n' + this.t('continue_booking', {
                            en: `Let's continue with your booking. ${this.t(nextSlot.name, nextSlot.prompt)}`,
                            es: `Continuemos con su reserva. ${this.t(nextSlot.name, nextSlot.prompt)}`
                        });
                    }

                    return {
                        response: kbResult.answer + followUp,
                        suggestions: this.getSuggestions(nextSlot ? nextSlot.name : 'idle'),
                        nextContext: this.context
                    };
                }

                // If no KB result, provide a generic answer and continue booking
                const nextSlot = this.getNextRequiredSlot();
                if (nextSlot) {
                    return {
                        response: this.t('no_answer_continue', {
                            en: `I'm not sure about that, but let's continue with your booking. ${this.t(nextSlot.name, nextSlot.prompt)}`,
                            es: `No estoy seguro de eso, pero continuemos con su reserva. ${this.t(nextSlot.name, nextSlot.prompt)}`
                        }),
                        suggestions: this.getSuggestions(nextSlot.name),
                        nextContext: this.context
                    };
                }
            }
        }

        if (this.context.dialogueState === 'booking') {
            const nextSlot = this.getNextRequiredSlot();

            if (nextSlot) {
                // Special handling for consent
                if (nextSlot.name === 'consent') {
                    if (intent === 'affirmative') {
                        this.context.filledSlots.consent = true;
                        return this.determineNextAction(message, intent);
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
            response: null,
            suggestions: this.getSuggestions('default'),
            nextContext: this.context
        };
    }

    fillSlots(entities, message, intent) {
        const awaitingSlot = this.context.awaitingSlot;
        const isSlotFillingIntent = intent.startsWith('provide_') || intent === 'unknown' || intent === 'affirmative' || intent === 'book_service';

        if (awaitingSlot && isSlotFillingIntent) {
            let entity = entities.find(e => this.mapEntityToSlot(e.type) === awaitingSlot);

            if (!entity) {
                if (awaitingSlot === 'petName') entity = { type: 'pet_name', value: message };
                if (awaitingSlot === 'ownerName') entity = { type: 'ownerName', value: message };
                if (awaitingSlot === 'date') entity = { type: 'date', value: message };
                if (awaitingSlot === 'time') entity = { type: 'time', value: message };
            }

            if (entity) {
                this.context.filledSlots[awaitingSlot] = entity.value;
                this.context.awaitingSlot = null;
            }
        } else {
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
            this.context.filledSlots.ownerPhone = phone;
            return {
                response: this.t('ask_time', { en: `Got it: ${phone}. When would be a good time to call?`, es: `Entendido: ${phone}. ¿Cuándo sería un buen momento para llamarle?` }),
                suggestions: this.getSuggestions('time'),
                nextContext: this.context
            };
        }

        this.context.filledSlots.ownerPhone = phone;
        this.context.filledSlots.preferredTime = time;
        return this.confirmCallback();
    }

    confirmCallback() {
        const { ownerPhone, preferredTime } = this.context.filledSlots;

        this.context.dialogueState = 'idle';
        delete this.context.filledSlots.preferredTime;

        return {
            response: this.t('callback_confirm', {
                en: `Okay! I've requested a callback for you at ${ownerPhone}, around ${preferredTime}. A staff member will reach out soon. Was there anything else?`,
                es: `¡De acuerdo! He solicitado una llamada para usted al ${ownerPhone}, alrededor de las ${preferredTime}. Un miembro del personal se comunicará pronto. ¿Algo más?`
            }),
            suggestions: this.getSuggestions('idle'),
            nextContext: this.context,
            action: 'save_contact_request'
        };
    }

    getSuggestions(state) {
        // Delegate to modular suggestion provider
        // Update provider language if context lang changed
        this.suggestionProvider.lang = this.lang;
        return this.suggestionProvider.getSuggestions(state, this.context);
    }
}
