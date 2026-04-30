import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import MainLayout from '../components/Layout/MainLayout';
import { ChatInterface } from '../components/Chat/ChatInterface';
import { Search } from 'lucide-react';

const fetchConversations = async () => {
    const { data } = await api.get('/chat/conversations/');
    return data.results || data || [];
};

const Messages = () => {
    const { data: conversations, isLoading } = useQuery({ queryKey: ['farmerConversations'], queryFn: fetchConversations });
    const [selectedConv, setSelectedConv] = useState(null);

    return (
        <MainLayout>
            <div className="h-[calc(100vh-140px)] flex gap-6">
                {/* Conversation List */}
                <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col hidden md:flex">
                    <div className="p-4 border-b">
                        <h2 className="font-bold text-lg text-gray-900 mb-4">Messages</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-forest-green"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-4 text-center text-gray-500">Loading...</div>
                        ) : (
                            conversations?.map(conv => (
                                <button 
                                    key={conv.id}
                                    onClick={() => setSelectedConv(conv)}
                                    className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50
                                        ${selectedConv?.id === conv.id ? 'bg-green-50 border-l-4 border-l-forest-green' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-forest-green text-white flex-shrink-0 flex items-center justify-center font-bold">
                                        {conv.partner_name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-medium text-gray-900 truncate">{conv.partner_name}</h4>
                                            <span className="text-xs text-gray-400">
                                                {new Date(conv.last_message_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{conv.last_message || 'No messages yet'}</p>
                                    </div>
                                    {conv.unread_count > 0 && (
                                        <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                            {conv.unread_count}
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1">
                    <ChatInterface 
                        conversationId={selectedConv?.id} 
                        partnerName={selectedConv?.partner_name} 
                        theme="farmer" 
                    />
                </div>
            </div>
        </MainLayout>
    );
};

export default Messages;
