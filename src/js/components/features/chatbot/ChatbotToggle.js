import { html, cn } from '../../../globals.js';
import { Button } from '../../ui/Button.js';
import { ChatIcon, CloseIcon } from '../../ui/ChatbotIcons.js';

export const ChatbotToggle = ({ isOpen, setIsOpen, unreadCount = 0, lang = 'en' }) => {
  return html`
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2 group/toggle">
      
      <!-- Tooltip -->
      <div className=${cn(
    "bg-card text-card-foreground px-3 py-1.5 rounded-lg shadow-lg border border-border text-sm font-medium transition-all duration-300 origin-bottom-right",
    isOpen ? "opacity-0 scale-95 pointer-events-none" : "opacity-0 scale-95 translate-y-2 group-hover/toggle:opacity-100 group-hover/toggle:scale-100 group-hover/toggle:translate-y-0"
  )}>
        ${lang === 'es' ? '¡Chatea con nosotros!' : 'Chat with us!'}
      </div>

      <${Button}
        className=${cn(
    "h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-xl hover:shadow-2xl relative bg-gradient-to-r from-primary via-primary-glow to-secondary text-primary-foreground border border-primary/10 transition-all duration-smooth hover:scale-110",
    !isOpen && "animate-float" // Add subtle float animation when closed
  )}
        onClick=${() => setIsOpen(prev => !prev)}
        aria-label="Toggle Chatbot"
      >
        ${isOpen
      ? html`<${CloseIcon} className="group-hover:rotate-90 transition-transform duration-smooth" />`
      : html`<${ChatIcon} className="group-hover:scale-110 transition-transform duration-smooth" />`
    }
        
        ${!isOpen && unreadCount > 0 && html`
          <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full min-w-[24px] h-6 flex items-center justify-center px-1.5 text-xs font-bold shadow-lg border-2 border-background animate-pulse-ring">
            <span className="relative z-10">${unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        `}
        
        <!-- Pulse Glow Effect -->
        ${!isOpen && html`
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-glow -z-10"></div>
        `}
      <//>
    </div>
  `;
};
