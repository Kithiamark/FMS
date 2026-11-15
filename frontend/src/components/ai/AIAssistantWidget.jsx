import React, { useState, useRef, useEffect } from 'react';
import { useAIChat, useAIFeedback } from '../../hooks/useAI';
import { useAuth } from '../../context/AuthContext';
import { 
    Sparkles, 
    Send, 
    Bot, 
    User, 
    RotateCcw, 
    CheckCircle2, 
    Activity, 
    X,
    Maximize2,
    Minimize2,
    Copy,
    Check,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';
import { Button } from '../ui/Button';

// Role-tailored prompt suggestions
const ROLE_SUGGESTIONS = {
    FARMER: [
        { label: '🥛 Ration Optimizer', query: 'Recommend a cost-effective total mixed ration (TMR) for a 22L/day Friesian cow using Napier grass and dairy meal.' },
        { label: '🐄 Heat Detection Rule', query: 'What are the primary signs of standing heat and the AM-PM breeding timing rule?' },
        { label: '🩺 Mastitis Early Signs', query: 'How do I detect subclinical mastitis early before clots appear in the strip cup?' },
        { label: '🤝 Off-taker Best Practices', query: 'What lactometer and temperature standards do aggregators expect during morning collection?' }
    ],
    FARM_WORKER: [
        { label: '📋 Udder Prep Hygiene', query: 'What is the step-by-step pre-milking routine to prevent udder infections?' },
        { label: '🍼 Newborn Colostrum Care', query: 'How many litres of colostrum should a calf receive within the first 6 hours of birth?' },
        { label: '🔍 Heat Check Signs', query: 'What behavioral signs should I observe in the pens to flag a cow in heat for the farmer?' }
    ],
    VETERINARIAN: [
        { label: '🩺 Differential Diagnosis', query: 'What are the key differentials for an acute drop in milk yield, fever (40.5°C), and swollen prescapular lymph nodes in Kiambu?' },
        { label: '💊 Antibiotic Withdrawal', query: 'What is the standard milk withdrawal period for procaine penicillin and oxytetracycline in dairy cattle?' },
        { label: '📋 Visit Brief Template', query: 'Generate a checklist for a routine herd reproductive and ultrasound synchronization visit.' }
    ],
    AGGREGATOR: [
        { label: '🥛 Density & Dilution Check', query: 'If a morning batch has a lactometer reading of 1.022 sp.gr at 20°C, what is the estimated water adulteration percentage?' },
        { label: '🧪 68% Alcohol Test', query: 'How does the 68% ethanol platform test detect high titratable acidity in bulk milk tanks?' },
        { label: '🚛 Cold Chain Management', query: 'What are the critical temperature holding limits during multi-stop route transport?' }
    ],
    ADMIN: [
        { label: '📊 Platform Anomaly Audit', query: 'What metrics indicate anomalous milk yield reporting or sudden connection drop-offs?' },
        { label: '🛡️ Compliance & KYC Review', query: 'What verification steps are required for new commercial off-takers and licensed vets?' }
    ]
};

export const AIAssistantWidget = ({ 
    initialContext, 
    isOpen = false, 
    onClose, 
    roleOverride,
    inline = false 
}) => {
    const { user } = useAuth();
    const role = roleOverride || user?.role || 'FARMER';
    const suggestions = ROLE_SUGGESTIONS[role] || ROLE_SUGGESTIONS.FARMER;

    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [feedbackState, setFeedbackState] = useState({}); // { [idx]: 'UP' | 'DOWN' }

    const initialGreeting = `Hello! I am your Arvion AI Advisor. I am role-aware and grounded in your Kenyan dairy records (${role.replace('_', ' ')}). How can I assist you today?`;

    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: initialGreeting,
            provider: 'arvion-dairy-knowledge-base',
            mode: 'live',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const chatMutation = useAIChat();
    const feedbackMutation = useAIFeedback();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, chatMutation.isPending, isOpen]);

    const handleSend = async (messageToSend) => {
        const text = (messageToSend || input).trim();
        if (!text || chatMutation.isPending) return;

        const userMsg = {
            role: 'user',
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');

        // Prepare conversation history (last 6 items excluding current)
        const history = updatedMessages.slice(-7, -1).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            content: m.content,
        }));

        chatMutation.mutate(
            { 
                message: text, 
                history,
                roleContext: {
                    role,
                    userName: user?.full_name,
                    ...(initialContext || {})
                }
            },
            {
                onSuccess: (data) => {
                    setMessages(prev => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: data.response,
                            provider: data.provider || 'arvion-ai',
                            mode: data.mode || 'live',
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        }
                    ]);
                },
                onError: () => {
                    // Graceful fallback response
                    setMessages(prev => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: 'I am currently unable to connect to the Arvion AI knowledge engine. Please verify your connection or retry in a few moments.',
                            provider: 'system-fallback',
                            isError: true,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        }
                    ]);
                }
            }
        );
    };

    const handleClearChat = () => {
        setMessages([
            {
                role: 'assistant',
                content: 'Chat session reset. What dairy management or clinical query can I help you analyze?',
                provider: 'arvion-dairy-knowledge-base',
                mode: 'live',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
        ]);
        setFeedbackState({});
    };

    const handleCopy = (content, idx) => {
        navigator.clipboard?.writeText(content);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleFeedback = (idx, score) => {
        setFeedbackState(prev => ({ ...prev, [idx]: score }));
        feedbackMutation.mutate({
            messageId: `msg_${idx}`,
            score,
            role
        });
    };

    if (!inline && !isOpen) return null;

    const containerClasses = inline
        ? "w-full rounded-2xl border border-slate-200/90 shadow-card flex flex-col bg-white overflow-hidden h-[620px]"
        : `fixed bottom-0 right-0 z-50 transition-all duration-300 ease-in-out shadow-2xl flex flex-col bg-white border-l border-t border-slate-200/90 ${
            isExpanded 
                ? 'w-full md:w-[680px] h-[92vh] md:rounded-tl-3xl' 
                : 'w-full md:w-[440px] h-[640px] md:rounded-tl-2xl'
        }`;

    return (
        <aside
            role="dialog"
            aria-label="Arvion AI Assistant Drawer"
            className={containerClasses}
        >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-heading font-bold text-sm leading-tight text-white">Arvion AI</h2>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 uppercase tracking-wider">
                                {role.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-300">Live Kenyan Dairy Herd & Supply Intelligence</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition touch-target"
                        title={isExpanded ? 'Minimize' : 'Expand'}
                    >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button
                        type="button"
                        onClick={handleClearChat}
                        title="Reset Chat"
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition touch-target"
                    >
                        <RotateCcw size={16} />
                    </button>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            title="Close Drawer"
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition touch-target"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70">
                {messages.map((msg, idx) => {
                    const isAssistant = msg.role === 'assistant';
                    return (
                        <div
                            key={idx}
                            className={`flex gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                        >
                            {isAssistant && (
                                <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-600/20 text-blue-700 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                                    <Bot size={15} />
                                </div>
                            )}

                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs text-sm ${
                                    isAssistant
                                        ? msg.isError
                                            ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-none'
                                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                                        : 'bg-blue-600 text-white rounded-tr-none'
                                }`}
                            >
                                <div className="text-[11px] font-semibold mb-1 flex items-center justify-between gap-3 opacity-75">
                                    <span>{isAssistant ? 'Arvion AI' : 'You'}</span>
                                    <span>{msg.timestamp}</span>
                                </div>

                                <div className="leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
                                    {msg.content}
                                </div>

                                {isAssistant && (
                                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                        <span className="flex items-center gap-1 text-[10px]">
                                            <CheckCircle2 size={11} className="text-blue-500" />
                                            Grounding: Kenyan Dairy Standards
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(msg.content, idx)}
                                                className="p-1 hover:text-slate-700 rounded transition"
                                                title="Copy to clipboard"
                                            >
                                                {copiedIndex === idx ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleFeedback(idx, 'UP')}
                                                className={`p-1 hover:text-slate-700 rounded transition ${feedbackState[idx] === 'UP' ? 'text-blue-600 font-bold' : ''}`}
                                                title="Helpful"
                                            >
                                                <ThumbsUp size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleFeedback(idx, 'DOWN')}
                                                className={`p-1 hover:text-slate-700 rounded transition ${feedbackState[idx] === 'DOWN' ? 'text-rose-600 font-bold' : ''}`}
                                                title="Not helpful"
                                            >
                                                <ThumbsDown size={12} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!isAssistant && (
                                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                                    <User size={15} />
                                </div>
                            )}
                        </div>
                    );
                })}

                {chatMutation.isPending && (
                    <div className="flex gap-2.5 justify-start items-center text-slate-500 text-xs">
                        <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-600/20 text-blue-700 flex items-center justify-center shrink-0">
                            <Bot size={15} />
                        </div>
                        <div className="bg-white border border-slate-200/80 rounded-2xl px-3.5 py-2.5 shadow-xs flex items-center gap-2">
                            <Sparkles size={14} className="text-blue-600 animate-spin" />
                            <span>Arvion AI is formulating recommendations...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Role Quick Prompts Bar */}
            <div className="px-3 py-2 bg-white border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Prompts:</span>
                {suggestions.map((p, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => handleSend(p.query)}
                        disabled={chatMutation.isPending}
                        className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-700 transition-colors shrink-0 disabled:opacity-50 touch-target font-medium"
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Input Footer */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                }}
                className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Ask Arvion AI as a ${role.replace('_', ' ')}...`}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={chatMutation.isPending}
                />
                <Button
                    type="submit"
                    disabled={!input.trim() || chatMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-xs shrink-0 text-xs sm:text-sm font-bold touch-target"
                >
                    <Send size={15} />
                    <span className="hidden sm:inline">Send</span>
                </Button>
            </form>
        </aside>
    );
};

export default AIAssistantWidget;
