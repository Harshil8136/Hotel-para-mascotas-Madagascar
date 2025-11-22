import { html, useState, useContext, Icon, cn } from '../../globals.js';
import { Card } from '../ui/Card.js';
import { AppContext } from '../../AppContext.js';

export const Info = () => {
  const { lang, t } = useContext(AppContext);
  const [openItem, setOpenItem] = useState(null);
  const toggleItem = (item) => {
    setOpenItem(openItem === item ? null : item);
  };

  // Hardcoded FAQs for display, or could fetch from seed.json if passed as prop
  // For now, we'll use a static list that matches the new brand
  const faqs = [
    { id: 'faq1', q: { en: "What are your reception hours?", es: "¿Cuáles son sus horarios de recepción?" }, a: { en: "We are open for reception. Please contact us to confirm specific drop-off and pick-up times.", es: "Estamos abiertos para recepción. Por favor contáctenos para confirmar horarios específicos de entrega y recogida." } },
    { id: 'faq2', q: { en: "Do you administer medication?", es: "¿Administran medicamentos?" }, a: { en: "Yes, we can administer medications. Please provide detailed instructions and the medication.", es: "Sí, podemos administrar medicamentos. Por favor proporcione instrucciones detalladas y el medicamento." } },
    { id: 'faq3', q: { en: "What are the requirements?", es: "¿Cuáles son los requisitos?" }, a: { en: "Current vaccinations are required. Please contact us for a full list of requirements.", es: "Se requieren vacunas vigentes. Por favor contáctenos para una lista completa de requisitos." } },
    { id: 'faq4', q: { en: "How do I get a quote?", es: "¿Cómo obtengo una cotización?" }, a: { en: "You can contact us via WhatsApp or email for a personalized quote based on your needs.", es: "Puede contactarnos vía WhatsApp o correo electrónico para una cotización personalizada basada en sus necesidades." } }
  ];

  return html`
    <section id="info" className="relative py-24 bg-background">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="animate-fade-in">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-8">
              ${t('About Us', 'Sobre Nosotros')}
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>${t('Hotel para mascotas Madagascar offers professional care for your furry friends.', 'Hotel para mascotas Madagascar ofrece cuidado profesional para sus amigos peludos.')}</p>
              <p>${t('With spacious play areas and individual rooms, your pet will feel right at home.', 'Con amplias áreas de juego y habitaciones individuales, su mascota se sentirá como en casa.')}</p>
            </div>
            
            <${Card} className="mt-10 p-8 bg-muted/20 border-border/50">
              <h3 className="text-2xl font-bold text-foreground mb-6">
                ${t('Contact & Location', 'Contacto y Ubicación')}
              </h3>
              <div className="space-y-4 text-foreground/80">
                <div className="flex items-start gap-4">
                  <${Icon} name="MapPin" className="w-5 h-5 text-primary mt-1" />
                  <span>Teniente Juan de la Barrera 503, Colonia Héroes 20190 Aguascalientes, Mexico</span>
                </div>
                <div className="flex items-start gap-4">
                  <${Icon} name="Phone" className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold">WhatsApp: +52 449 448 5486</p>
                    <p className="font-semibold">${t('Calls', 'Llamadas')}: 449 756 37 55</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <${Icon} name="Mail" className="w-5 h-5 text-primary mt-1" />
                  <span className="font-semibold">hotelmadagascarags@gmail.com</span>
                </div>
                
                <div className="pt-4 flex gap-4">
                  <a href="https://www.instagram.com/hotel_mascotasmadagascar" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <${Icon} name="Instagram" className="w-6 h-6" />
                  </a>
                  <a href="https://www.facebook.com/hotelmadagascar" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <${Icon} name="Facebook" className="w-6 h-6" />
                  </a>
                  <a href="https://tiktok.com/@hotelmadagascar" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <${Icon} name="Video" className="w-6 h-6" />
                  </a>
                </div>
              </div>
            <//>
          </div>
          
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
      height: openItem === faq.id ? 'auto' : '0',
      opacity: openItem === faq.id ? '1' : '0',
      paddingBottom: openItem === faq.id ? '1.25rem' : '0',
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
