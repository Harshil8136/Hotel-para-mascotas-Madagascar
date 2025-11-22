import { html, useContext, Icon } from '../../globals.js';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { AppContext } from '../../AppContext.js';

export const Pricing = () => {
    const { t } = useContext(AppContext);

    return html`
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12">
          
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                ${t("What's Included?", '¿Qué incluye?')}
              </h2>
              <ul className="space-y-4">
                ${[
            { en: "24/7 Professional Supervision", es: "Supervisión profesional 24/7" },
            { en: "Spacious Play Areas", es: "Amplias áreas de juego" },
            { en: "Individual Private Rooms", es: "Habitaciones privadas individuales" },
            { en: "Daily Health Checks", es: "Chequeos de salud diarios" },
            { en: "Socialization Activities", es: "Actividades de socialización" },
            { en: "Lots of Love & Cuddles", es: "Mucho amor y mimos" }
        ].map(item => html`
                  <li className="flex items-center gap-3 text-lg text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <${Icon} name="Check" className="w-4 h-4 text-primary" />
                    </div>
                    ${t(item.en, item.es)}
                  </li>
                `)}
              </ul>
            </div>

            <div className="p-6 bg-accent/10 rounded-xl border border-accent/20">
              <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                <${Icon} name="Tag" className="w-5 h-5 text-primary" />
                ${t('Discounts', 'Descuentos')}
              </h3>
              <p className="text-muted-foreground">
                ${t('Ask about our special rates for long stays (10+ days) and multiple pets from the same family!', '¡Pregunte por nuestras tarifas especiales para estancias largas (10+ días) y múltiples mascotas de la misma familia!')}
              </p>
            </div>
          </div>

          <div className="animate-fade-in-up">
            <${Card} className="p-8 h-full bg-card border-border shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <${Icon} name="DollarSign" className="w-32 h-32" />
              </div>
              
              <h2 className="text-4xl font-bold text-foreground mb-8 relative z-10">
                ${t('Get a Quote', 'Obtener una Cotización')}
              </h2>
              
              <p className="text-lg text-muted-foreground mb-8 relative z-10">
                ${t('Every pet is unique. Contact us for a personalized quote based on your specific needs, dates, and services required.', 'Cada mascota es única. Contáctenos para una cotización personalizada basada en sus necesidades específicas, fechas y servicios requeridos.')}
              </p>

              <div className="space-y-4 relative z-10">
                <a 
                  href="https://wa.me/524494485486" 
                  target="_blank" 
                  className="block"
                >
                  <${Button} size="lg" className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-none">
                    <${Icon} name="MessageCircle" className="mr-2 w-5 h-5" />
                    ${t('Chat on WhatsApp', 'Chat en WhatsApp')}
                  <//>
                </a>
                
                <a 
                  href="mailto:hotelmadagascarags@gmail.com"
                  className="block"
                >
                  <${Button} variant="outline" size="lg" className="w-full">
                    <${Icon} name="Mail" className="mr-2 w-5 h-5" />
                    ${t('Email Us', 'Envíanos un Correo')}
                  <//>
                </a>
              </div>
            <//>
          </div>

        </div>
      </div>
    </section>
  `;
};
