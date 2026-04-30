import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '../ui/Button';

// WebSocket Hook
const useChatWebSocket = (conversationId, onMessageReceived) => {
    const { token } = useAuth();
    const ws = useRef(null);

    useEffect(() => {
        if (!conversationId || !token) return;

        const wsUrl = `ws://localhost:8000/ws/chat/${conversationId}/?token=${token}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('Connected to chat');
        };

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            onMessageReceived(message);
        };

        ws.current.onclose = () => {
            console.log('Disconnected from chat');
            // Reconnect logic could go here
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [conversationId, token, onMessageReceived]);

    const sendMessage = (content) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ content }));
        }
    };

    return { sendMessage };
};

export const ChatInterface = ({ conversationId, partnerName, theme = 'farmer' }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [inputText, setTextInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        window.requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
    }, []);

    // Fetch initial history
    const { data: messages = [] } = useQuery({
        queryKey: ['chatHistory', conversationId],
        queryFn: async () => {
            if (!conversationId) return [];
            const { data } = await api.get(`/chat/conversations/${conversationId}/messages/`);
            return data.results; // Paginated
        },
        enabled: !!conversationId
    });

    useEffect(() => {
        scrollToBottom();
    }, [messages.length, scrollToBottom]);

    // Mark as read
    const readMutation = useMutation({
        mutationFn: async () => await api.post(`/chat/conversations/${conversationId}/read/`)
    });

    useEffect(() => {
        if (conversationId && messages.length > 0) {
            readMutation.mutate();
        }
    }, [conversationId, messages.length, readMutation]);

    // WebSocket
    const handleMessageReceived = useCallback((newMessage) => {
        queryClient.setQueryData(['chatHistory', conversationId], (current = []) => [
            ...current,
            { ...newMessage, is_me: newMessage.sender_id === String(user.id) }
        ]);
        scrollToBottom();
    }, [conversationId, queryClient, scrollToBottom, user.id]);

    const { sendMessage } = useChatWebSocket(conversationId, handleMessageReceived);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        sendMessage(inputText);
        setTextInput('');
    };

    // Theme colors
    const myBubbleColor = theme === 'vet' ? 'bg-vet-teal text-white' : 'bg-forest-green text-white';
    const otherBubbleColor = 'bg-gray-100 text-gray-800';

    if (!conversationId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 h-full">
                Select a conversation to start chatting
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600">
                        {partnerName?.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{partnerName}</h3>
                        <div className="flex items-center gap-1 text-xs text-green-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                {messages.map((msg, idx) => (
                    <div key={msg.id || idx} className={cn("flex w-full", msg.is_me ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[70%] rounded-2xl px-4 py-2 relative", msg.is_me ? myBubbleColor : otherBubbleColor)}>
                            <p className="text-sm">{msg.content}</p>
                            <span className={cn("text-[10px] block mt-1 text-right opacity-70", msg.is_me ? "text-white" : "text-gray-500")}>
                                {new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t flex gap-2 bg-gray-50">
                <button type="button" className="p-2 text-gray-400 hover:text-gray-600">
                    <Paperclip size={20} />
                </button>
                <input 
                    type="text" 
                    className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-gray-400"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setTextInput(e.target.value)}
                />
                <Button type="submit" className={cn("rounded-full w-10 h-10 p-0 flex items-center justify-center", theme === 'vet' ? "bg-vet-teal" : "bg-forest-green")}>
                    <Send size={18} className="ml-0.5" />
                </Button>
            </form>
        </div>
    );
};
