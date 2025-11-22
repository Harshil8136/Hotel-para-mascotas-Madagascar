import { html, Icon, cn } from '../../../globals.js';
import { Button } from '../../ui/Button.js';

export const ChatbotMessage = ({ msg, lang, onQuickAction }) => {
  // Helper to get content based on language
  const getContent = () => {
    if (typeof msg.content === 'object') {
      return msg.content[lang] || msg.content['en'] || "Message not available";
    }
    return msg.content;
  };

  // Format timestamp
  const getTimestamp = () => {
    if (!msg.timestamp && !msg.id) return '';
    const date = msg.timestamp ? new Date(msg.timestamp) : new Date(msg.id);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if message should show quick action button
  const hasQuickAction = () => {
    if (msg.role !== 'assistant') return false;
    const content = getContent().toLowerCase();

    if (content.includes('?')) return false;
    if (content.includes('not sure') || content.includes('no estoy seguro')) return false;
    if (content.includes('all set') || content.includes('está lista')) return false;
    if (content.includes('confirm') || content.includes('confirme')) return false;
    if (content.includes('which service') || content.includes('qué servicio')) return false;

    const hasServiceList = content.includes('available services') ||
      content.includes('servicios disponibles') ||
      content.includes('we offer') ||
      content.includes('ofrecemos');

    return hasServiceList;
  };

  // Rich Content Renderer
  const renderRichContent = () => {
    if (msg.type === 'rich' && msg.payload?.type === 'carousel') {
      return html`
        <div className="flex gap-3 overflow-x-auto pb-2 mt-2 snap-x w-full">
          ${msg.payload.items.map(item => html`
            <div className="min-w-[200px] w-[200px] bg-card border border-border rounded-lg overflow-hidden shadow-sm snap-center flex-shrink-0 flex flex-col">
              <div className="h-24 bg-muted relative">
                 <img src=${item.image} alt=${item.title[lang]} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 flex flex-col flex-grow">
                <h4 className="font-bold text-sm truncate" title=${item.title[lang]}>${item.title[lang]}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-grow">${item.description[lang]}</p>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full self-start">${item.price}</span>
              </div>
            </div>
          `)}
        </div>
      `;
    }
    return null;
  };

  return html`
    <div
      className=${cn(
    "flex gap-2 group relative",
    msg.role === "user" ? "justify-end animate-slide-in-right" : "justify-start animate-slide-in-left"
  )}
    >
      ${msg.role === "assistant" && html`
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
          <${Icon} name="Bot" className="w-5 h-5 text-primary-foreground" />
        </div>
      `}
      
      <div className="flex flex-col gap-1 max-w-[75%]">
        <div
          className=${cn(
    "p-3 rounded-2xl shadow-sm transition-all duration-smooth hover:shadow-md",
    msg.role === "user"
      ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground rounded-tr-sm"
      : "bg-card/80 backdrop-blur-sm border border-border/50 rounded-tl-sm"
  )}
        >
          <p className="text-sm whitespace-pre-line leading-relaxed">${getContent()}</p>
          
          ${hasQuickAction() && html`
            <div className="mt-3 pt-3 border-t border-border/30">
              <${Button}
                size="sm"
                className="w-full"
                onClick=${() => onQuickAction?.('book')}
              >
                <${Icon} name="Calendar" className="w-4 h-4 mr-2" />
                ${lang === 'es' ? 'Reservar Ahora' : 'Book Now'}
              <//>
            </div>
          `}
        </div>
        
        <!-- Timestamp -->
        <span className=${cn(
    "text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200",
    msg.role === "user" ? "text-right" : "text-left"
  )}>
          ${getTimestamp()}
        </span>

        <!-- Render Rich Content (Carousel) -->
        ${renderRichContent()}
      </div>

      ${msg.role === "user" && html`
        <div className="w-8 h-8 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
          <${Icon} name="User" className="w-5 h-5 text-secondary-foreground" />
        </div>
      `}
    </div>
  `;
};
