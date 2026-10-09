import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '../ui/Button';

// WebSocket Hook
const useChatWebSocket = (conversationId, onMessageReceived) => {
    const token = localStorage.getItem('access_token');
    const ws = useRef(null);

    useEffect(() => {
        if (!conversationId || !token) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.port === '5173' ? 'localhost:8001' : window.location.host;
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

export const ChatInterface = ({ conversationId, partnerName, theme = 'farmer', conversationType = 'vet' }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [inputText, setTextInput] = useState('');
    const messagesEndRef = useRef(null);

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
            const { data } = await api.get(messagesUrl);
            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.results)) return data.results;
            return [];
        },
        enabled: !!conversationId
    });

    useEffect(() => {
        scrollToBottom();
    }, [messages.length, scrollToBottom]);

    // Mark as read
    const readMutation = useMutation({
        mutationFn: async () => {
            if (conversationType === 'vet') {
                return await api.post(`/chat/conversations/${conversationId}/read/`);
            }
        }
    });

    useEffect(() => {
        if (conversationId && messages.length > 0 && conversationType === 'vet') {
            readMutation.mutate();
        }
    }, [conversationId, messages.length, readMutation, conversationType]);

    // WebSocket handler
    const handleMessageReceived = useCallback((newMessage) => {
        queryClient.setQueryData(['chatHistory', conversationType, conversationId], (current = []) => {
            const list = Array.isArray(current) ? current : [];
            if (list.some(m => String(m.id) === String(newMessage.id))) return list;
            return [
                ...list,
                { ...newMessage, is_me: newMessage.sender_id === String(user?.id) }
            ];
        });
        scrollToBottom();
    }, [conversationId, conversationType, queryClient, scrollToBottom, user?.id]);

    const { sendMessage } = useChatWebSocket(conversationType === 'vet' ? conversationId : null, handleMessageReceived);

    // HTTP Send Mutation
    const sendMutation = useMutation({
        mutationFn: async (content) => {
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
        }
    });

    const handleSend = (e) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text || sendMutation.isPending) return;
        setTextInput('');

        // Send via HTTP REST (primary guaranteed delivery)
        sendMutation.mutate(text);

        // Also broadcast via WS if active
        sendMessage(text);
    };

    // Theme colors
    const myBubbleColor = theme === 'vet' ? 'bg-vet-teal text-white' : 'bg-forest-green text-white';
    const otherBubbleColor = 'bg-gray-100 text-gray-800';

    if (!conversationId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400 h-full rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                    <Send size={24} className="opacity-50" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-1">No Conversation Selected</h3>
                <p className="text-xs text-gray-400 max-w-sm">Select a contact from the list or start a consultation to begin direct messaging.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-forest-green/10 text-forest-green border border-forest-green/20 flex items-center justify-center font-bold">
                        {partnerName?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{partnerName || 'Direct Message'}</h3>
                        <div className="flex items-center gap-1 text-xs text-green-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Direct Chat
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs text-center p-6">
                        <p className="font-semibold text-gray-600 mb-1">No messages exchanged yet</p>
                        <p>Send a message below to start your conversation.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={msg.id || idx} className={cn("flex w-full", msg.is_me ? "justify-end" : "justify-start")}>
                            <div className={cn("max-w-[70%] rounded-2xl px-4 py-2.5 relative shadow-sm", msg.is_me ? myBubbleColor : otherBubbleColor)}>
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                <span className={cn("text-[10px] block mt-1 text-right opacity-70", msg.is_me ? "text-white" : "text-gray-500")}>
                                    {new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 md:p-4 border-t flex gap-2 bg-gray-50">
                <button type="button" className="p-2 text-gray-400 hover:text-gray-600 hidden sm:block">
                    <Paperclip size={20} />
                </button>
                <input 
                    type="text" 
                    className="flex-1 border rounded-full px-4 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-forest-green border-gray-200"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={sendMutation.isPending}
                />
                <Button 
                    type="submit" 
                    disabled={!inputText.trim() || sendMutation.isPending}
                    className={cn("rounded-full w-10 h-10 p-0 flex items-center justify-center shrink-0", theme === 'vet' ? "bg-vet-teal" : "bg-forest-green")}
                >
                    <Send size={18} className="ml-0.5" />
                </Button>
            </form>
        </div>
    );
};
