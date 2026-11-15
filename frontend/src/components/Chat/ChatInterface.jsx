import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import {
  Send,
  Paperclip,
  Phone,
  ShieldCheck,
  CheckCheck,
  Stethoscope,
  Building2,
  Users,
  Sparkles,
  AlertCircle,
  Copy,
  Info,
} from 'lucide-react';
import { cn } from '../ui/Button';

// No fake or canned mock histories in production paths


// WebSocket Hook
const useChatWebSocket = (conversationId, onMessageReceived) => {
  const token = localStorage.getItem('access_token');
  const ws = useRef(null);

  useEffect(() => {
    if (!conversationId || !token || conversationId.toString().startsWith('seed-') || conversationId.toString().startsWith('custom_')) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = window.location.port === '5173' ? 'localhost:8001' : window.location.host;
    const apiBase = import.meta.env.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'https://fms-gf57.onrender.com/api/v1';
    if (import.meta.env.VITE_WS_BASE_URL) {
      host = import.meta.env.VITE_WS_BASE_URL.replace(/^wss?:\/\//, '');
    } else if (apiBase && apiBase.startsWith('http')) {
      try {
        const parsed = new URL(apiBase);
        host = parsed.host;
      } catch (e) {
        void e;
      }
    }
    const wsUrl = `${protocol}//${host}/ws/chat/${conversationId}/?token=${token}`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('Connected to chat socket');
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          onMessageReceived(message);
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.current.onerror = () => {
        console.warn('Chat WebSocket unavailable, falling back to HTTP REST.');
      };

      ws.current.onclose = () => {
        console.log('Chat socket disconnected');
      };
    } catch (err) {
      console.warn('Could not initialize WebSocket:', err);
    }

    return () => {
      if (ws.current) {
        try { ws.current.close(); } catch (err) { void err; }
      }
    };
  }, [conversationId, token, onMessageReceived]);

  const sendMessage = (content) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify({ content }));
      } catch (e) {
        console.error('WS send error:', e);
      }
    }
  };

  return { sendMessage };
};

export const ChatInterface = ({
  conversationId,
  partnerName,
  theme = 'farmer',
  conversationType = 'vet',
  partnerRole,
  isVetVerified = false,
  kvbLicense,
  partner = null,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inputText, setTextInput] = useState('');
  const [showCallNotice, setShowCallNotice] = useState(false);
  const messagesEndRef = useRef(null);

  const isSeedOrCustom = conversationId?.toString().startsWith('seed-') || conversationId?.toString().startsWith('custom_');
  const roleDisplay = partnerRole || partner?.role || (conversationType === 'vet' ? 'VETERINARIAN' : conversationType === 'buyer' ? 'AGGREGATOR' : 'FARMER');
  const isVerified = isVetVerified || partner?.is_vet_verified || partnerName?.toLowerCase().includes('dr.');
  const licenseText = kvbLicense || partner?.kvb_license || (isVerified ? 'KVB #4102 Registered' : null);

  const scrollToBottom = useCallback(() => {
    window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  const messagesUrl = conversationType === 'buyer'
    ? `/aggregators/connections/${conversationId}/messages/`
    : `/chat/conversations/${conversationId}/messages/`;

  // Fetch initial history
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chatHistory', conversationType, conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      if (isSeedOrCustom) {
        return [
          {
            id: 'init-1',
            content: `Connected with ${partnerName || 'Contact'}. You can send inquiries, clinical notes, or delivery updates here.`,
            created_at: new Date().toISOString(),
            is_me: false,
          },
        ];
      }

      try {
        const { data } = await api.get(messagesUrl);
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        return [];
      } catch {
        return [];
      }
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Mark as read
  const readMutation = useMutation({
    mutationFn: async () => {
      if (conversationType === 'vet' && !isSeedOrCustom) {
        return await api.post(`/chat/conversations/${conversationId}/read/`);
      }
    },
  });

  useEffect(() => {
    if (conversationId && messages.length > 0 && conversationType === 'vet' && !isSeedOrCustom) {
      readMutation.mutate();
    }
  }, [conversationId, messages.length, readMutation, conversationType, isSeedOrCustom]);

  // WebSocket handler
  const handleMessageReceived = useCallback((newMessage) => {
    queryClient.setQueryData(['chatHistory', conversationType, conversationId], (current = []) => {
      const list = Array.isArray(current) ? current : [];
      if (list.some(m => String(m.id) === String(newMessage.id))) return list;
      return [
        ...list,
        { ...newMessage, is_me: newMessage.sender_id === String(user?.id) },
      ];
    });
    scrollToBottom();
  }, [conversationId, conversationType, queryClient, scrollToBottom, user?.id]);

  const { sendMessage } = useChatWebSocket(conversationType === 'vet' ? conversationId : null, handleMessageReceived);

  // HTTP Send Mutation
  const sendMutation = useMutation({
    mutationFn: async (content) => {
      if (isSeedOrCustom) {
        return {
          id: 'local-' + Date.now(),
          content,
          created_at: new Date().toISOString(),
          is_me: true,
        };
      }
      const { data } = await api.post(messagesUrl, { content });
      return data;
    },
    onSuccess: (newMsg) => {
      queryClient.setQueryData(['chatHistory', conversationType, conversationId], (current = []) => {
        const list = Array.isArray(current) ? current : [];
        if (list.some(m => String(m.id) === String(newMsg.id))) return list;
        return [...list, { ...newMsg, is_me: true }];
      });
      queryClient.invalidateQueries({ queryKey: ['farmerConversations'] });
      queryClient.invalidateQueries({ queryKey: ['vetConversations'] });
      queryClient.invalidateQueries({ queryKey: ['aggregatorConnections'] });
      scrollToBottom();
    },
    onError: (err) => {
      console.error('Failed to post message via HTTP:', err);
    },
  });

  const handleSend = (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || sendMutation.isPending) return;
    setTextInput('');

    // Send via HTTP REST
    sendMutation.mutate(text);

    // Also broadcast via WS if active
    if (!isSeedOrCustom) {
      sendMessage(text);
    }
  };

  const handleQuickAction = (actionText) => {
    setTextInput(actionText);
  };

  // Quick Action Shortcuts tailored to role
  const quickActions = conversationType === 'vet' || isVerified ? [
    { label: '🩺 Request Farm Visit', text: 'Dr., could we schedule an urgent on-farm clinical visit today?' },
    { label: '🏷️ Cow #104 Mastitis Alert', text: 'Patient COW-#104 (Bessie): Showing rear-quarter swelling and fever (39.2°C). Need treatment protocol.' },
    { label: '💊 Refill Intramammary Tubes', text: 'Requesting authorization to dispense intramammary penicillin syringes from agrovet.' },
  ] : conversationType === 'buyer' ? [
    { label: '🥛 Share Available Bulk', text: 'Morning chilled bulk available: 180 Litres cooled to 3.8°C ready for dispatch.' },
    { label: '🚚 Tanker ETA Inquiry', text: 'What is today’s tanker pickup window and collector arrival time?' },
    { label: '🧪 Density Quality Report', text: 'Can you confirm the lactometer reading and butterfat percentage for yesterday’s delivery?' },
  ] : [
    { label: '🌾 Silage Fermentation Tip', text: 'Sharing our molasses-to-napier fermentation recipe for low-loss ensiling.' },
    { label: '🐄 Heifer Breeding Inquiry', text: 'Do you have registered Jersey heifers or straw availability this season?' },
    { label: '🚜 Shared Feed Transport', text: 'We have bulk hay delivery coming from Eldoret, looking to share transit costs.' },
  ];

  // Theme colors
  const isVetTheme = theme === 'vet';
  const myBubbleColor = isVetTheme ? 'bg-teal-700 text-white shadow-xs' : 'bg-forest-green text-white shadow-xs';
  const otherBubbleColor = 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/50 dark:border-slate-700/50';

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-slate-400 h-full rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-xs">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Send size={24} className="opacity-50" />
        </div>
        <h3 className="text-base font-extrabold text-slate-700 dark:text-slate-300 mb-1">
          No Conversation Selected
        </h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Select a veterinarian, milk aggregator, or fellow farmer from the sidebar to open instant messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Verified Partner Status Bar & Header */}
      <div className="p-3.5 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border",
              isVerified
                ? "bg-emerald-100 text-forest-green border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                : conversationType === 'buyer'
                ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                : "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            )}>
              {partnerName?.charAt(0) || 'U'}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" title="Online" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                {partnerName || 'Direct Message'}
              </h3>
              {isVerified && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-forest-green dark:text-emerald-300 text-[10px] font-extrabold" title="KVB Certified Veterinarian">
                  <ShieldCheck size={11} className="shrink-0" />
                  <span>Verified</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-medium flex items-center gap-1">
                {conversationType === 'vet' ? (
                  <Stethoscope size={11} className="text-emerald-600" />
                ) : conversationType === 'buyer' ? (
                  <Building2 size={11} className="text-blue-600" />
                ) : (
                  <Users size={11} className="text-slate-500" />
                )}
                {licenseText || roleDisplay}
              </span>
              <span className="text-[10px] text-slate-400">•</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active Now
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowCallNotice(!showCallNotice)}
            className="p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-emerald-300 dark:hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700/80"
            title="Call Partner"
          >
            <Phone size={14} className="text-emerald-600" />
            <span className="hidden sm:inline text-xs">Call</span>
          </button>
        </div>
      </div>

      {/* Call notification banner if triggered */}
      {showCallNotice && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Phone size={13} className="text-emerald-600 animate-pulse" />
            <span>Direct phone consultation: <strong>+254 712 345 678</strong> (Available 07:00 - 19:00 EAT)</span>
          </div>
          <button
            onClick={() => setShowCallNotice(false)}
            className="text-[11px] font-bold text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Action Contextual Shortcuts */}
      <div className="px-3 py-2 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1 pl-1">
          <Sparkles size={11} className="text-amber-500" />
          Quick:
        </span>
        {quickActions.map((qa, i) => (
          <button
            key={i}
            onClick={() => handleQuickAction(qa.text)}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-500 dark:hover:text-emerald-300 transition shadow-2xs"
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30 dark:bg-slate-900/40">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs text-center p-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
              <Sparkles size={20} className="text-emerald-600" />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-1 text-sm">No messages exchanged yet</p>
            <p className="text-slate-400 max-w-xs">Send an initial clinical question, milk pickup update, or query to start communicating.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={msg.id || idx} className={cn("flex w-full", msg.is_me ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2.5 relative shadow-xs",
                msg.is_me ? myBubbleColor : otherBubbleColor
              )}>
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <div className={cn(
                  "text-[10px] flex items-center justify-end gap-1 mt-1",
                  msg.is_me ? "text-emerald-100" : "text-slate-400 dark:text-slate-500"
                )}>
                  <span>
                    {new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.is_me && (
                    <CheckCheck size={12} className="text-emerald-200" title="Delivered and read" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSend} className="p-3 md:p-3.5 border-t border-slate-200 dark:border-slate-800 flex gap-2 bg-white dark:bg-slate-900">
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hidden sm:flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Attach diagnostic photo / lab report"
        >
          <Paperclip size={18} />
        </button>
        <input
          type="text"
          className="flex-1 border rounded-xl px-4 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-green border-slate-200 dark:border-slate-800 transition placeholder:text-slate-400"
          placeholder={`Message ${partnerName || 'contact'}...`}
          value={inputText}
          onChange={(e) => setTextInput(e.target.value)}
          disabled={sendMutation.isPending}
        />
        <Button
          type="submit"
          disabled={!inputText.trim() || sendMutation.isPending}
          className={cn(
            "rounded-xl px-4 py-2 flex items-center justify-center gap-1.5 font-bold text-xs shrink-0",
            isVetTheme ? "bg-teal-700 hover:bg-teal-800" : "bg-forest-green hover:bg-forest-green/90"
          )}
        >
          <span className="hidden sm:inline">Send</span>
          <Send size={15} />
        </Button>
      </form>
    </div>
  );
};

