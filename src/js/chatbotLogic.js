// --- CHATBOT LOGIC ENTRY POINT ---
// This file now serves as a central export point for the modularized chatbot logic.

export { initializeSearch, searchKnowledge, getServiceByName, getServiceById, ALL_SERVICES, ALL_KNOWLEDGE } from './lib/knowledgeBase.js';
export { extractEntities } from './lib/entityExtractor.js';
export { detectIntent } from './lib/intentParser.js';
export { DialogueManager } from './lib/dialogueManager.js';