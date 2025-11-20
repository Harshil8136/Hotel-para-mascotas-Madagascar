import { html, useState, useEffect, useRef, useContext, Icon, cn } from '../../globals.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';
import { Input } from '../ui/Input.js';
import { AppContext } from '../../AppContext.js';
import { addChatMessage, getChatHistory } from '../../database.js';
import { DialogueManager, getServiceById } from '../../chatbotLogic.js';

export const Chatbot = ({ onBookService }) => {
  const { lang, t_kb } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const [context, setContext] = useState({ dialogueState: 'idle', filledSlots: {}, lang });
  const dialogueManagerRef = useRef(new DialogueManager(context));
  const messagesEndRef = useRef(null);
  const SESSION_ID = 'session-123'; // Hardcoded for no-npm demo

  // Helper to add message to state and DB
  const addMessage = async (role, content) => {
    const newMessage = { id: Date.now(), role, content };
    setMessages(prev => [...prev, newMessage]);
    await addChatMessage(SESSION_ID, role, content);
  };

  // On initial mount, load history
  useEffect(() => {
    (async () => {
      const history = await getChatHistory(SESSION_ID);
      if (history.length > 0) {
        setMessages(history);
      } else {
        // If no history, add welcome message
        addMessage("assistant", t_kb('chat_welcome_en', 'chat_welcome_es'));
      }
      // Set initial suggestions
      setSuggestions(dialogueManagerRef.current.getSuggestions('idle'));
    })();
  }, []); // Run once on mount

  // When language or context changes, update the DialogueManager's internal references
  // instead of recreating the entire instance
  useEffect(() => {
    dialogueManagerRef.current.context = context;
    dialogueManagerRef.current.lang = context.lang;
  }, [context]);

  // Sync language changes to context
  useEffect(() => {
    setContext(prevContext => ({ ...prevContext, lang }));
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (messageOverride = null) => {
    const text = messageOverride || input.trim();
    if (!text) return;

    if (!messageOverride) setInput("");
    addMessage("user", text);
    setIsTyping(true);
    setSuggestions([]); // Clear suggestions while processing

    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 600));

    // Process message
    const response = await dialogueManagerRef.current.processInput(text);

    setIsTyping(false);
    addMessage("assistant", response.text);

    // Update context
    setContext(prev => ({
      ...prev,
      dialogueState: response.newState,
      filledSlots: response.filledSlots
    }));

    // Update suggestions based on new state
    setSuggestions(dialogueManagerRef.current.getSuggestions(response.newState));

    // Handle booking action
    if (response.action === 'book_service' && response.serviceId) {
      const service = getServiceById(response.serviceId);
      if (service) {
        onBookService(service);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion);
  };

  return html`
    <${Button}
      className=${cn(
    "fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl hover:shadow-2xl z-50 group",
    "bg-gradient-to-r from-primary via-primary-glow to-secondary text-primary-foreground border border-primary/10"
  )}
      onClick=${() => setIsOpen(prev => !prev)}
    >
      ${isOpen
      ? html`<${Icon} name="X" className="w-6 h-6 group-hover:rotate-90 transition-transform" />`
      : html`<${Icon} name="MessageCircle" className="w-6 h-6 group-hover:scale-110 transition-transform" />`
    }
    <//>

    ${isOpen && html`
      <${Card} className="fixed bottom-24 right-6 w-96 h-[600px] shadow-2xl border border-border/50 bg-card/95 backdrop-blur-xl z-50 flex flex-col animate-slide-up-fade overflow-hidden">
        <div className="relative bg-gradient-to-r from-primary via-primary-glow to-primary text-primary-foreground p-5 rounded-t-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer"></div>
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 bg-primary-foreground/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-primary-foreground/30">
              <${Icon} name="Bot" className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">${t_kb('chat_title_en', 'chat_title_es')}</h3>
              <p className="text-xs opacity-90">${t_kb('chat_subtitle_en', 'chat_subtitle_es')} 🐾</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4 bg-gradient-to-b from-muted/5 to-muted/10">
          ${messages.map(msg => html`
            <div
              key=${msg.id}
              className=${cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              ${msg.role === "assistant" && html`
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <${Icon} name="Bot" className="w-5 h-5 text-primary-foreground" />
                </div>
              `}
              <div
                className=${cn(
      "max-w-[75%] p-3 rounded-2xl shadow-sm transition-all duration-smooth",
      msg.role === "user"
        ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground"
        : "bg-card/80 backdrop-blur-sm border border-border/50"
    )}
              >
                <p className="text-sm whitespace-pre-line">${msg.content}</p>
              </div>
              ${msg.role === "user" && html`
                <div className="w-8 h-8 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <${Icon} name="User" className="w-5 h-5 text-secondary-foreground" />
                </div>
              `}
            </div>
          `)}
          
          ${isTyping && html`
            <div className="flex gap-2 justify-start">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <${Icon} name="Bot" className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="bg-card border border-border p-3 rounded-2xl">
                <div className="flex gap-1">
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
          <div className="px-4 pb-2 flex flex-wrap gap-2 border-t border-border pt-3">
            ${suggestions.slice(0, 4).map(suggestion => html`
              <button
                key=${suggestion}
                onClick=${() => handleSuggestionClick(suggestion)}
                className="text-xs hover:bg-primary/10 hover:border-primary/50 hover:text-primary border border-border rounded-full px-3 py-1.5 transition-all"
              >
                ${suggestion}
              </button>
            `)}
          </div>
        `}

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <${Input}
              value=${input}
              onChange=${(e) => setInput(e.target.value)}
              onKeyPress=${(e) => e.key === "Enter" && handleSend()}
              placeholder=${t_kb('input_placeholder_en', 'input_placeholder_es')}
              className="flex-1"
            />
            <${Button} size="icon" onClick=${handleSend} disabled=${!input.trim()}>
              <${Icon} name="Send" className="w-4 h-4" />
            <//>
          </div>
        </div>
      <//>
    `}
  `;
};
