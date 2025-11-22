import { Fuse } from '../globals.js';
import { ALL_FAQS } from './knowledge/index.js';

export let ALL_SERVICES = [];
export let ALL_KNOWLEDGE = [];
let fuseInstanceEn = null;
let fuseInstanceEs = null;

export function initializeSearch(knowledge, services) {
    // Use modular FAQs if available, otherwise fall back to seed.json
    ALL_KNOWLEDGE = ALL_FAQS.length > 0 ? ALL_FAQS : knowledge;
    ALL_SERVICES = services;

    fuseInstanceEn = new Fuse(ALL_KNOWLEDGE.filter(k => k.lang === 'en'), {
        keys: ['q_variants', 'answer', 'tags', 'category'],
        threshold: 0.4,
        includeScore: true
    });
    fuseInstanceEs = new Fuse(ALL_KNOWLEDGE.filter(k => k.lang === 'es'), {
        keys: ['q_variants', 'answer', 'tags', 'category'],
        threshold: 0.4,
        includeScore: true
    });
}

export function searchKnowledge(query, lang) {
    const fuse = lang === 'es' ? fuseInstanceEs : fuseInstanceEn;
    if (!fuse) return null;

    const results = fuse.search(query);
    if (results.length > 0 && results[0].score && results[0].score < 0.5) {
        return results[0].item;
    }
    return null;
}

export function getServiceByName(name, lang) {
    const serviceFuse = new Fuse(ALL_SERVICES, {
        keys: [`name.${lang}`, `description.${lang}`, `type`],
        threshold: 0.3
    });
    const results = serviceFuse.search(name);
    return results.length > 0 ? results[0].item : null;
}

export function getServiceById(id) {
    return ALL_SERVICES.find(s => s.id === id) || null;
}
