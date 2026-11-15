import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../../hooks/useAI';
import { 
    Sparkles, 
    Send, 
    Bot, 
    User, 
    RotateCcw, 
    CheckCircle2, 
    AlertCircle, 
    Building2, 
    Activity, 
    Droplets,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Button } from '../ui/Button';

const QUICK_PROMPTS = [
    { label: '🥛 Feed & Milk Optimization', query: 'What is the optimal feed and concentrate ration for my high-yielding dairy cows?' },
    { label: '🩺 Mastitis & Udder Health', query: 'How do I detect and prevent subclinical mastitis in my milking herd?' },
    { label: '🐄 Heat Detection & AI Timing', query: 'What is the AM-PM rule for heat detection and artificial insemination?' },
    { label: '🤝 Connect to Milk Buyers', query: 'How do I connect to reliable milk buyers and aggregators in my area?' },
    { label: '🍼 Calf Care & Colostrum', query: 'What are the critical colostrum and early feeding guidelines for newborn calves?' },
];

export const AIAssistantWidget = ({ initialContext }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! I am your Arvion AI Farm Advisor. I am grounded with your live farm data to provide real-time recommendations on feed rations, mastitis control, breeding, and aggregator marketing. How can I help you today?',
            provider: 'arvion-dairy-knowledge-base',
            mode: 'live',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
    ]);
    const [input, setInput] = useState('');
    const [farmContext, setFarmContext] = useState(initialContext || null);
    const [showContextDetails, setShowContextDetails] = useState(false);
    const messagesEndRef = useRef(null);
    const chatMutation = useAIChat();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, chatMutation.isPending]);

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
            { message: text, history },
            {
                onSuccess: (data) => {
                    if (data.farm_context) {
                        setFarmContext(data.farm_context);
                    }
                    setMessages(prev => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: data.response,
                            provider: data.provider,
                            mode: data.mode,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        }
                    ]);
                },
                onError: () => {
                    setMessages(prev => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: 'Sorry, I encountered an issue connecting to the dairy knowledge service. Please check your connection and try again.',
                            provider: 'system-error',
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
                content: 'Chat history cleared. What dairy management or farm question can I assist you with?',
                provider: 'arvion-dairy-knowledge-base',
                mode: 'live',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
        ]);
    };

    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col h-[650px] relative">
            {/* Header */}
            <div className="p-4 md:p-5 bg-gradient-to-r from-forest-green to-forest-green/90 text-white flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
                        <Sparkles size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-heading font-bold text-lg leading-tight">Arvion AI Farm Assistant</h2>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                {chatMutation.data?.provider === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Active'}
                            </span>
                        </div>
                        <p className="text-xs text-green-100">Live Kenyan Dairy Management & Herd Intelligence</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {farmContext && (
                        <button
                            onClick={() => setShowContextDetails(!showContextDetails)}
                            className="hidden sm:flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1 rounded-lg transition-colors text-white"
                        >
                            <Building2 size={13} />
                            <span>{farmContext.farm_name || 'Farm Data'}</span>
                            {showContextDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                    )}
                    <button
                        onClick={handleClearChat}
                        title="Reset Chat"
                        className="p-1.5 text-green-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Farm Context Drawer */}
            {farmContext && showContextDetails && (
                <div className="bg-emerald-50/80 border-b border-emerald-100 px-4 py-3 text-xs text-gray-700 flex flex-wrap items-center gap-4 animate-in slide-in-from-top-1">
                    <div className="flex items-center gap-1.5 font-medium text-forest-green">
                        <Building2 size={14} />
                        <span>{farmContext.farm_name} ({farmContext.county})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Activity size={14} className="text-gray-500" />
                        <span>Herd: <strong>{farmContext.active_animals || 0}</strong> active ({farmContext.sick_animals || 0} sick)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Droplets size={14} className="text-blue-600" />
                        <span>7-Day Milk: <strong>{farmContext.last_7_days_milk_litres || 0} L</strong></span>
                    </div>
                </div>
            )}

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 bg-gray-50/60">
                {messages.map((msg, idx) => {
                    const isAssistant = msg.role === 'assistant';
                    return (
                        <div
                            key={idx}
                            className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                        >
                            {isAssistant && (
                                <div className="w-8 h-8 rounded-lg bg-forest-green/10 border border-forest-green/20 text-forest-green flex items-center justify-center shrink-0 mt-1">
                                    <Bot size={18} />
                                </div>
                            )}

                            <div
                                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                    isAssistant
                                        ? msg.isError
                                            ? 'bg-red-50 text-red-800 border border-red-200'
                                            : 'bg-white text-gray-800 border border-gray-100'
                                        : 'bg-forest-green text-white rounded-br-none'
                                }`}
                            >
                                <div className="text-xs font-semibold mb-1 flex items-center justify-between gap-3 opacity-75">
                                    <span>{isAssistant ? 'Arvion AI' : 'You'}</span>
                                    <span>{msg.timestamp}</span>
                                </div>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                    {msg.content}
                                </div>
                                {isAssistant && msg.provider && (
                                    <div className="mt-2 pt-2 border-t border-gray-100/70 flex items-center justify-between text-[10px] text-gray-400">
                                        <span className="flex items-center gap-1">
                                            {msg.mode === 'live' ? <CheckCircle2 size={11} className="text-emerald-500" /> : <Activity size={11} className="text-amber-500" />}
                                            {msg.provider === 'gemini-3.8-flash' ? 'Google Gemini 3.8 Flash' : 'Kenyan Dairy Expert Engine'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {!isAssistant && (
                                <div className="w-8 h-8 rounded-lg bg-forest-green text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                    <User size={18} />
                                </div>
                            )}
                        </div>
                    );
                })}

                {chatMutation.isPending && (
                    <div className="flex gap-3 justify-start items-center text-gray-500 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-forest-green/10 border border-forest-green/20 text-forest-green flex items-center justify-center shrink-0">
                            <Bot size={18} />
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
                            <Sparkles size={16} className="text-forest-green animate-spin" />
                            <span>Arvion AI is analyzing your herd data and generating guidance...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Bar */}
            <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">Suggestions:</span>
                {QUICK_PROMPTS.map((p, i) => (
                    <button
                        key={i}
                        onClick={() => handleSend(p.query)}
                        disabled={chatMutation.isPending}
                        className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-gray-100 hover:bg-forest-green/10 hover:text-forest-green border border-gray-200/60 text-gray-700 transition-colors shrink-0 disabled:opacity-50"
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
                className="p-3 md:p-4 bg-white border-t border-gray-100 flex items-center gap-2"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about feed rations, mastitis, breeding cycles, milk buyers..."
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition-all"
                    disabled={chatMutation.isPending}
                />
                <Button
                    type="submit"
                    disabled={!input.trim() || chatMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-green text-white hover:bg-forest-green/90 shadow-sm shrink-0"
                >
                    <Send size={16} />
                    <span className="hidden sm:inline">Ask AI</span>
                </Button>
            </form>
        </div>
    );
};

export default AIAssistantWidget;
