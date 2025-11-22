import { html, useContext, Icon } from '../../globals.js';
import { Button } from '../ui/Button.js';
import { AppContext } from '../../AppContext.js';

export const Hero = ({ onBookingClick, onChatClick }) => {
  const { lang, t } = useContext(AppContext);
  return html`
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5"></div>
      <div className="absolute inset-0" style=${{ background: 'var(--gradient-mesh)' }}></div>
      <div className="absolute inset-0 bg-[url('assets/images/hero-background.jpg')] bg-cover bg-center opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background"></div>
      
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style=${{ animationDelay: '1s' }}></div>

      <div className="relative z-10 container mx-auto px-4 py-32 text-center">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6 animate-fade-in-up leading-tight">
          ${t('Hotel para mascotas', 'Hotel para mascotas')}
          <br />
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
              Madagascar
            </span>
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in-up leading-relaxed" style=${{ animationDelay: "0.1s" }}>
          ${t('Your pet will be cared for with much love.', 'Tu mascota será atendida y cuidada con mucho amor.')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style=${{ animationDelay: "0.2s" }}>
          <${Button} 
            onClick=${onBookingClick}
            className="bg-gradient-to-r from-primary via-primary-glow to-primary text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-glow hover:scale-[1.02] border border-primary/10"
            size="xl"
          >
            <${Icon} name="Calendar" className="mr-2" />
            <span>${t('Book a Stay', 'Reservar Estancia')}</span>
          <//>
          <${Button} 
            onClick=${onChatClick}
            variant="glass" 
            size="xl"
          >
            <${Icon} name="MessageCircle" className="mr-2" />
            <span>${t('Chat with Us', 'Hablar con Nosotros')}</span>
          <//>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  `;
};
