import { useState, useEffect, useRef, useContext } from '../globals.js';
import { AppContext } from '../AppContext.js';
import { addChatMessage, getChatHistory } from '../database.js';
import { DialogueManager, getServiceById } from '../chatbotLogic.js';

export const useChatbot = (externalIsOpen, externalOnToggle, onBookService) => {
    const { lang, t_kb } = useContext(AppContext);
    const [internalIsOpen, setInternalIsOpen] = useState(false);

    // Control logic
    const isControlled = externalIsOpen !== undefined;
    const isOpen = isControlled ? externalIsOpen : internalIsOpen;
    const setIsOpen = isControlled ? externalOnToggle : setInternalIsOpen;

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const [context, setContext] = useState({ dialogueState: 'idle', filledSlots: {}, lang });
    const dialogueManagerRef = useRef(new DialogueManager(context));
    const messagesEndRef = useRef(null);
    const SESSION_ID = 'session-123';

    // Sync context language
    useEffect(() => {
        setContext(prev => ({ ...prev, lang }));
        dialogueManagerRef.current.lang = lang;
    }, [lang]);

    // Add message helper
    const addMessage = async (role, content, type = 'text', payload = null) => {
        const newMessage = { id: Date.now(), role, content, type, payload };
        setMessages(prev => [...prev, newMessage]);
        // Only save text content to DB for now to keep it simple
        if (typeof content === 'string') {
            await addChatMessage(SESSION_ID, role, content);
        }
    };

    // Initial load
    useEffect(() => {
        (async () => {
            const history = await getChatHistory(SESSION_ID);
            if (history.length > 0) {
                setMessages(history);
            } else {
                addMessage("assistant", {
                    en: "Hi! 👋 I'm here to help you. What can I help you with today? 😊🐾",
                    es: "¡Hola! 👋 Estoy aquí para ayudarte. ¿En qué puedo ayudarte hoy? 😊🐾"
                });
            }
            setSuggestions(dialogueManagerRef.current.getSuggestions('idle'));
        })();
    }, []);

    // Update DM context
    useEffect(() => {
        dialogueManagerRef.current.context = context;
    }, [context]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages]);

    // Unread count
    useEffect(() => {
        if (!isOpen && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'assistant') {
                setUnreadCount(prev => prev + 1);
            }
        }
        if (isOpen) setUnreadCount(0);
    }, [messages, isOpen]);

    const handleSend = async (messageOverride = null) => {
        const text = messageOverride || input.trim();
        if (!text) return;

        if (!messageOverride) setInput("");
        addMessage("user", text);
        setIsTyping(true);
        setSuggestions([]);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 600));

        const response = await dialogueManagerRef.current.processInput(text);

        setIsTyping(false);

        // Handle Rich Responses
        if (response.type === 'rich') {
            addMessage("assistant", response.text, 'rich', response.payload);
        } else {
            addMessage("assistant", response.text);
        }

        setContext(prev => ({
            ...prev,
            dialogueState: response.newState,
            filledSlots: response.filledSlots
        }));

        setSuggestions(dialogueManagerRef.current.getSuggestions(response.newState));

        if (response.action === 'book_service' && response.serviceId) {
            const service = getServiceById(response.serviceId);
            if (service) onBookService(service);
        }
    };

    return {
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
    };
};
