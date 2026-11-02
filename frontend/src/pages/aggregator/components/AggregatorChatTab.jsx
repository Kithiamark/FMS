import React from 'react';
import { MessageSquare, Send, Droplets } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const AggregatorChatTab = ({
  activeConnections = [],
  setSelectedChatId,
  activeChat,
  messages = [],
  messagesLoading,
  chatMessage,
  setChatMessage,
  handleSendMessage,
  isSending,
  messagesEndRef,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-card rounded-2xl overflow-hidden flex flex-col md:flex-row h-[650px] animate-in fade-in duration-300">
      {/* Conversations list sidebar */}
      <div className="w-full md:w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
          <h3 className="font-heading font-bold text-slate-900 text-sm">Contracted Farm Chats</h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            {activeConnections.length} Active
          </span>
        </div>
        <div className="overflow-y-auto flex-1">
          {activeConnections.length === 0 ? (
            <div className="p-8 text-slate-500 text-xs text-center">No connected farms found.</div>
          ) : (
            activeConnections.map((conn) => (
              <button
                key={conn.id}
                type="button"
                onClick={() => setSelectedChatId(conn.id)}
                className={`w-full text-left p-4 border-b border-slate-100 transition-colors flex items-center gap-3 touch-target ${
                  activeChat?.id === conn.id
                    ? 'bg-blue-50/90 border-l-4 border-l-blue-600'
                    : 'hover:bg-slate-100/80 border-l-4 border-l-transparent bg-white'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                  {conn.farm_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{conn.farm_name}</h4>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Connected</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">Click to view direct conversation</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Conversation main area */}
      <div className="w-full md:w-2/3 bg-white flex flex-col flex-1">
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="bg-blue-50 border border-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-blue-600 shadow-xs">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-2">Communications Hub</h2>
            <p className="text-slate-500 max-w-sm text-xs">
              Select a farm from the left to coordinate milk collections and quality specifications.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {activeChat.farm_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{activeChat.farm_name}</h3>
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Direct Logistics Channel
                  </p>
                </div>
              </div>
            </div>

            {/* Messages list */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm font-semibold">
                  <Droplets className="w-5 h-5 animate-spin mr-2 text-blue-600" />
                  Loading conversation history...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center my-auto py-16 text-slate-400 text-xs font-medium">
                  No messages in this conversation yet. Send the first message to schedule pickup or provide quality guidance.
                </div>
              ) : (
                messages.map((msg) => {
                  const isAggregator = msg.is_me;
                  const timeFormatted = msg.created_at
                    ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 max-w-[85%] ${isAggregator ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isAggregator ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isAggregator ? 'You' : msg.sender_name?.charAt(0) || 'F'}
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl shadow-xs text-xs sm:text-sm ${
                          isAggregator
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        {!isAggregator && (
                          <p className="text-[11px] font-bold text-blue-600 mb-1">{msg.sender_name || 'Farmer'}</p>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isAggregator ? 'text-blue-100' : 'text-slate-400'}`}>
                          {timeFormatted}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send message form */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={`Message ${activeChat.farm_name}...`}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 touch-target"
                />
                <Button
                  type="submit"
                  disabled={isSending || !chatMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 touch-target"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AggregatorChatTab;
