import { html, Icon, useState } from '../../globals.js';
import { Button } from '../ui/Button.js';

export const Header = ({ t, lang, toggleLang, handleBookService }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return html`
    <header className="fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
      <nav className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <${Icon} name="Dog" className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold text-foreground hidden md:inline">Hotel Madagascar</span>
        </div>

        <!-- Desktop Navigation -->
        <div className="hidden md:flex items-center gap-4">
          <a href="#hero" className="text-sm font-medium text-muted-foreground hover:text-primary">${t('Home', 'Inicio')}</a>
          <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-primary">${t('Services', 'Servicios')}</a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary">${t('Pricing', 'Precios')}</a>
          <a href="#gallery" className="text-sm font-medium text-muted-foreground hover:text-primary">${t('Gallery', 'Galería')}</a>
          <a href="#info" className="text-sm font-medium text-muted-foreground hover:text-primary">${t('Contact', 'Contacto')}</a>
          <${Button} onClick=${() => handleBookService(null)}>
            ${t('Book Now', 'Reservar')}
          <//>
          <${Button} variant="outline" onClick=${toggleLang} className="w-12 hover:bg-muted">
            ${lang.toUpperCase()}
          <//>
        </div>

        <!-- Mobile Actions -->
        <div className="flex md:hidden items-center gap-2">
          <${Button} variant="ghost" size="sm" onClick=${toggleLang} className="w-10 h-10 p-0 font-bold">
            ${lang.toUpperCase()}
          <//>
          <button 
            className="p-2 text-foreground hover:text-primary transition-colors"
            onClick=${() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <${Icon} name=${isMenuOpen ? "X" : "Menu"} className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <!-- Mobile Navigation Menu -->
      ${isMenuOpen && html`
        <div className="md:hidden absolute top-20 left-0 right-0 bg-background border-b border-border shadow-lg animate-slide-up-fade">
          <div className="flex flex-col p-4 space-y-4">
            <a href="#hero" onClick=${() => setIsMenuOpen(false)} className="text-base font-medium text-foreground hover:text-primary p-2 rounded-md hover:bg-muted/50">${t('Home', 'Inicio')}</a>
            <a href="#services" onClick=${() => setIsMenuOpen(false)} className="text-base font-medium text-foreground hover:text-primary p-2 rounded-md hover:bg-muted/50">${t('Services', 'Servicios')}</a>
            <a href="#pricing" onClick=${() => setIsMenuOpen(false)} className="text-base font-medium text-foreground hover:text-primary p-2 rounded-md hover:bg-muted/50">${t('Pricing', 'Precios')}</a>
            <a href="#gallery" onClick=${() => setIsMenuOpen(false)} className="text-base font-medium text-foreground hover:text-primary p-2 rounded-md hover:bg-muted/50">${t('Gallery', 'Galería')}</a>
            <a href="#info" onClick=${() => setIsMenuOpen(false)} className="text-base font-medium text-foreground hover:text-primary p-2 rounded-md hover:bg-muted/50">${t('Contact', 'Contacto')}</a>
            
            <div className="flex gap-2 pt-2 border-t border-border">
              <${Button} className="flex-1" onClick=${() => handleBookService(null)}>
                ${t('Book Now', 'Reservar')}
              <//>
              <${Button} variant="outline" onClick=${toggleLang} className="w-12 hover:bg-muted">
                ${lang.toUpperCase()}
              <//>
            </div>
          </div>
        </div>
      `}
    </header>
  `;
};
