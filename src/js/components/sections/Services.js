import { html, useContext, Icon } from '../../globals.js';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { AppContext } from '../../AppContext.js';
import { ALL_SERVICES } from '../../chatbotLogic.js';

export const Services = ({ services = [], onBookService }) => {
  const { lang, t } = useContext(AppContext);
  const t_service = (obj) => (obj[lang] || obj['en']);

  return html`
    <section id="services" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            ${t('Our Services', 'Nuestros Servicios')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            ${t('From quick refreshes to full spa days.', 'Desde baños rápidos hasta días de spa completos.')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${services.map((service, idx) => html`
            <${Card} 
              key=${service.id} 
              className="group relative overflow-hidden border border-border/50 hover:border-primary/30 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-smooth hover:scale-[1.02] cursor-pointer"
              style=${{ animationDelay: `${idx * 0.1}s` }}
              onClick=${() => onBookService(service)}
            >
              <div className="relative h-56 overflow-hidden">
                <img 
                  src=${service.image} 
                  alt=${t_service(service.name)}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-lg border border-primary/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  ${service.type}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">${t_service(service.name)}</h3>
                <p className="text-muted-foreground mb-4 line-clamp-2">${t_service(service.description)}</p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 pb-4 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <${Icon} name="Clock" className="w-4 h-4 text-primary" />
                    <span className="font-medium">${service.duration}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    <${Icon} name="DollarSign" className="w-5 h-5" />
                    <span className="font-bold text-xl">${service.price.replace('$', '')}</span>
                  </div>
                </div>
                
                <${Button} 
                  className="w-full"
                  onClick=${(e) => {
      e.stopPropagation();
      onBookService(service);
    }}
                >
                  <${Icon} name="Calendar" className="mr-2 w-4 h-4" />
                  ${t('Book Now', 'Reservar Ahora')}
                <//>
              </div>
            <//>
          `)}
        </div>
      </div>
    </section>
  `;
};
