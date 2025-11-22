import { html, useContext } from '../../globals.js';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { AppContext } from '../../AppContext.js';

import { ChatbotMessage } from './chatbot/ChatbotMessage.js';
import { ChatbotInput } from './chatbot/ChatbotInput.js';
import { ChatbotToggle } from './chatbot/ChatbotToggle.js';
import { BotIcon, CloseIcon } from '../ui/ChatbotIcons.js';
import { useChatbot } from '../../hooks/useChatbot.js';

export const Chatbot = ({ onBookService, isOpen: externalIsOpen, onToggle: externalOnToggle }) => {
  const { toggleLang } = useContext(AppContext);

  const {
    isOpen,
    setIsOpen,
    messages,
    input,
    setInput,
    suggestions,
    isTyping,
    unreadCount,
    handleSend,
    messagesEndRef,
    lang,
    t_kb
  } = useChatbot(externalIsOpen, externalOnToggle, onBookService);

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion);
  };

  const handleQuickAction = (action) => {
    if (action === 'book') {
      handleSend('I want to book a service');
    }
  };

  const chatbotContent = html`
    <${ChatbotToggle} isOpen=${isOpen} setIsOpen=${setIsOpen} unreadCount=${unreadCount} lang=${lang} />

    ${isOpen && html`
      <${Card} className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 w-auto sm:w-96 h-[calc(100vh-150px)] sm:h-[600px] shadow-2xl border border-border/50 bg-card/95 backdrop-blur-xl z-[9999] flex flex-col animate-slide-up-fade overflow-hidden rounded-2xl">
        <div className="relative bg-gradient-to-r from-primary via-primary-glow to-primary text-primary-foreground p-5 rounded-t-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary-foreground/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-primary-foreground/30">
                <${BotIcon} />
              </div>
              <div>
                <h3 className="font-bold text-base">${t_kb('chat_title_en', 'chat_title_es')}</h3>
                <p className="text-xs opacity-90">${t_kb('chat_subtitle_en', 'chat_subtitle_es')} 🐾</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <!-- Language Toggle -->
              <${Button} 
                  variant="ghost" 
                  size="sm" 
                  onClick=${toggleLang} 
                  className="h-8 w-8 p-0 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/20"
              >
                  ${lang.toUpperCase()}
              <//>
              
              <!-- Close Button -->
              <${Button} 
                  variant="ghost" 
                  size="sm" 
                  onClick=${() => setIsOpen(false)} 
                  className="h-8 w-8 p-0 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/20"
                  aria-label="Close chatbot"
              >
                  <${CloseIcon} size=${16} />
              <//>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4 bg-gradient-to-b from-muted/5 to-muted/10">
          ${messages.map((msg, idx) => html`
            <${ChatbotMessage} 
              key=${msg.id} 
              msg=${msg} 
              lang=${lang} 
              onQuickAction=${handleQuickAction}
              style=${{ animationDelay: `${idx * 50}ms` }}
            />
          `)}
          
          ${isTyping && html`
            <div className="flex gap-2 justify-start animate-fade-in">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <${BotIcon} className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="bg-card border border-border p-3 rounded-2xl shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style=${{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style=${{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style=${{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          `}
          
          <div ref=${messagesEndRef} />
        </div>

        ${suggestions.length > 0 && html`
          <div className="px-4 pb-2 flex flex-wrap gap-2 border-t border-border pt-3 animate-fade-in">
            ${suggestions.slice(0, 4).map(suggestion => html`
              <button
                key=${suggestion}
                onClick=${() => handleSuggestionClick(suggestion)}
                className="text-xs hover:bg-primary/10 hover:border-primary/50 hover:text-primary border border-border rounded-full px-3 py-1.5 transition-all duration-smooth hover:shadow-md hover:scale-105"
              >
                ${suggestion}
              </button>
            `)}
          </div>
        `}

        <${ChatbotInput} 
          input=${input} 
          setInput=${setInput} 
          handleSend=${handleSend} 
          placeholder=${lang === 'es' ? 'Escribe tu mensaje...' : 'Type your message...'} 
        />
      <//>
    `}
  `;

  return ReactDOM.createPortal(chatbotContent, document.body);
};
