import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { AdminLayout } from '../../components/Layout/AdminLayout';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { 
    Ticket, Search, MessageSquare, AlertTriangle, Send, 
    CheckCircle2, Clock, RefreshCw, Filter, User, Building
} from 'lucide-react';

const fetchTickets = async () => {
    const { data } = await api.get('/admin/tickets/');
    return Array.isArray(data) ? data : (data?.results || []);
};

const fetchTicketMessages = async (ticketId) => {
    if (!ticketId) return [];
    const { data } = await api.get(`/admin/tickets/${ticketId}/messages/`);
    return Array.isArray(data) ? data : (data?.results || []);
};

const AdminTickets = () => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const { data: tickets = [], isLoading, refetch, isFetching } = useQuery({
        queryKey: ['adminTickets'],
        queryFn: fetchTickets
    });

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Active ticket drawer / modal
    const [activeTicket, setActiveTicket] = useState(null);
    const [newReplyMessage, setNewReplyMessage] = useState('');
    const [ticketStatusUpdate, setTicketStatusUpdate] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');

    // Fetch messages for active ticket
    const { data: messages = [], isLoading: messagesLoading } = useQuery({
        queryKey: ['ticketMessages', activeTicket?.id],
        queryFn: () => fetchTicketMessages(activeTicket?.id),
        enabled: !!activeTicket?.id,
        refetchInterval: 5000 // Poll every 5s for active conversation
    });

    // Send reply mutation
    const sendReplyMutation = useMutation({
        mutationFn: async ({ ticketId, content }) => {
            const { data } = await api.post(`/admin/tickets/${ticketId}/messages/`, { content });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['ticketMessages', activeTicket?.id]);
            setNewReplyMessage('');
            addToast('Support reply sent to farm.', 'success');
        },
        onError: (err) => {
            const msg = err.response?.data?.content?.[0] || 'Failed to send message.';
            addToast(msg, 'error');
        }
    });

    // Update ticket status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ ticketId, status, resolution_notes }) => {
            const payload = { status };
            if (resolution_notes) payload.resolution_notes = resolution_notes;
            const { data } = await api.patch(`/admin/tickets/${ticketId}/`, payload);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['adminTickets']);
            addToast(`Ticket #${data.id} status updated to ${data.status}.`, 'success');
            setActiveTicket(data);
        },
        onError: () => {
            addToast('Failed to update ticket status.', 'error');
        }
    });

    const handleOpenTicket = (ticket) => {
        setActiveTicket(ticket);
        setTicketStatusUpdate(ticket.status);
        setResolutionNotes(ticket.resolution_notes || '');
        setNewReplyMessage('');
    };

    const handleSendReply = (e) => {
        e.preventDefault();
        if (!newReplyMessage.trim() || !activeTicket?.id) return;
        sendReplyMutation.mutate({ ticketId: activeTicket.id, content: newReplyMessage.trim() });
    };

    const handleSaveStatus = (e) => {
        e.preventDefault();
        if (!activeTicket?.id) return;
        updateStatusMutation.mutate({
            ticketId: activeTicket.id,
            status: ticketStatusUpdate,
            resolution_notes: resolutionNotes
        });
    };

    // Filter tickets
    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
            if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
            if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const subj = (t.subject || '').toLowerCase();
                const desc = (t.description || '').toLowerCase();
                const raisedBy = (t.raised_by_name || '').toLowerCase();
                return subj.includes(q) || desc.includes(q) || raisedBy.includes(q);
            }
            return true;
        });
    }, [tickets, statusFilter, categoryFilter, priorityFilter, searchQuery]);

    // Metrics
    const totalCount = tickets.length;
    const openCount = tickets.filter(t => t.status === 'OPEN').length;
    const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
    const urgentCount = tickets.filter(t => t.priority === 'URGENT' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2.5">
                            <Ticket className="text-admin-accent" size={24} />
                            Platform Support Ticketing
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">
                            Direct helpdesk correspondence and issue resolution for farmers and veterinarians.
                        </p>
                    </div>
                    <button 
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
                    >
                        <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
                        Refresh Tickets
                    </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Total Tickets</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{totalCount}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">Lifetime raised requests</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Open & Awaiting</p>
                        <h3 className="text-2xl font-bold text-blue-400 mt-1">{openCount}</h3>
                        <p className="text-[11px] text-blue-400 mt-1">Requires staff review</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">In Progress</p>
                        <h3 className="text-2xl font-bold text-amber-400 mt-1">{inProgressCount}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">Being actively resolved</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Urgent Priority</p>
                        <h3 className="text-2xl font-bold text-rose-500 mt-1">{urgentCount}</h3>
                        <p className="text-[11px] text-rose-400 mt-1">High-impact escalations</p>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="bg-admin-card border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search ticket subject, farmer..."
                                className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-admin-accent focus:border-admin-accent"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-gray-900 border border-gray-800 text-gray-300 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-admin-accent font-medium"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="bg-gray-900 border border-gray-800 text-gray-300 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-admin-accent font-medium"
                        >
                            <option value="ALL">All Categories</option>
                            <option value="BILLING">Billing</option>
                            <option value="TECHNICAL">Technical</option>
                            <option value="ACCOUNT">Account</option>
                            <option value="VET_ISSUE">Vet Issue</option>
                            <option value="OTHER">Other</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={e => setPriorityFilter(e.target.value)}
                            className="bg-gray-900 border border-gray-800 text-gray-300 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-admin-accent font-medium"
                        >
                            <option value="ALL">All Priorities</option>
                            <option value="URGENT">Urgent</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>

                    <span className="text-xs font-mono text-gray-500">
                        {filteredTickets.length} Tickets
                    </span>
                </div>

                {/* Tickets Table */}
                <div className="bg-admin-card border border-gray-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-900 text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-800">
                                <tr>
                                    <th className="py-3.5 px-4">Subject</th>
                                    <th className="py-3.5 px-4">Requester</th>
                                    <th className="py-3.5 px-4">Category</th>
                                    <th className="py-3.5 px-4">Priority</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4">Date</th>
                                    <th className="py-3.5 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-gray-300">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-gray-500 font-medium">
                                            Loading tickets...
                                        </td>
                                    </tr>
                                ) : filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-gray-500 font-medium">
                                            No support tickets found matching current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTickets.map(t => {
                                        return (
                                            <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-white block truncate max-w-xs">{t.subject}</span>
                                                    <span className="text-[11px] text-gray-500 line-clamp-1 max-w-xs">{t.description}</span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-medium text-gray-200 block">{t.raised_by_name || 'Farmer'}</span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="text-[11px] font-semibold text-gray-400 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                                                        {t.category}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                        t.priority === 'URGENT' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        t.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        t.priority === 'MEDIUM' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                    }`}>
                                                        {t.priority}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        t.status === 'OPEN' ? 'bg-blue-500/20 text-blue-300' :
                                                        t.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-300' :
                                                        t.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300' :
                                                        'bg-gray-700 text-gray-300'
                                                    }`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-gray-400">
                                                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenTicket(t)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition font-medium"
                                                    >
                                                        <MessageSquare size={13} className="text-admin-accent" /> Manage
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL: TICKET DETAIL & REPLY CONVERSATION */}
            <Modal isOpen={!!activeTicket} onClose={() => setActiveTicket(null)} title={`Support Ticket #${activeTicket?.id}: ${activeTicket?.subject || ''}`}>
                {activeTicket && (
                    <div className="space-y-4 text-xs text-gray-300">
                        {/* Top Info Bar */}
                        <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800 flex flex-wrap justify-between items-center gap-2">
                            <div>
                                <span className="text-[11px] text-gray-400">Raised By: <strong>{activeTicket.raised_by_name}</strong></span>
                                <span className="text-gray-600 mx-2">|</span>
                                <span className="text-[11px] text-gray-400">Category: <strong>{activeTicket.category}</strong></span>
                            </div>
                            <div className="flex gap-1.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-300 border border-gray-700">
                                    {activeTicket.priority} Priority
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    {activeTicket.status}
                                </span>
                            </div>
                        </div>

                        {/* Status Management Form */}
                        <form onSubmit={handleSaveStatus} className="p-3 bg-gray-900/40 rounded-xl border border-gray-800 flex flex-wrap items-center gap-2">
                            <span className="font-bold text-gray-400 text-[11px]">Update State:</span>
                            <select
                                value={ticketStatusUpdate}
                                onChange={e => setTicketStatusUpdate(e.target.value)}
                                className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-white font-medium focus:ring-1 focus:ring-admin-accent"
                            >
                                <option value="OPEN">OPEN</option>
                                <option value="IN_PROGRESS">IN PROGRESS</option>
                                <option value="RESOLVED">RESOLVED</option>
                                <option value="CLOSED">CLOSED</option>
                            </select>

                            <input 
                                type="text"
                                value={resolutionNotes}
                                onChange={e => setResolutionNotes(e.target.value)}
                                placeholder="Resolution notes (optional)..."
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-white text-[11px]"
                            />

                            <Button size="sm" type="submit" disabled={updateStatusMutation.isPending} className="bg-gray-800 hover:bg-gray-700 text-white">
                                {updateStatusMutation.isPending ? 'Saving...' : 'Update'}
                            </Button>
                        </form>

                        {/* Initial Description */}
                        <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-gray-500 block">Initial Issue Description</span>
                            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{activeTicket.description}</p>
                        </div>

                        {/* Conversation Messages */}
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase font-bold text-gray-500 block">Communication Thread</span>
                            <div className="max-h-48 overflow-y-auto space-y-2.5 p-3 bg-black/40 rounded-xl border border-gray-800">
                                {messagesLoading ? (
                                    <div className="text-center py-4 text-gray-500 text-xs">Loading replies...</div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500 text-xs">No replies on this ticket yet.</div>
                                ) : (
                                    messages.map(msg => (
                                        <div key={msg.id} className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 space-y-1">
                                            <div className="flex justify-between items-baseline">
                                                <span className="font-bold text-admin-accent text-[11px]">{msg.sender_name || 'Support'}</span>
                                                <span className="text-[10px] text-gray-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Reply Form */}
                        <form onSubmit={handleSendReply} className="flex gap-2 pt-1">
                            <input 
                                type="text"
                                value={newReplyMessage}
                                onChange={e => setNewReplyMessage(e.target.value)}
                                placeholder="Type support reply to farm..."
                                className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-admin-accent"
                            />
                            <Button 
                                type="submit" 
                                size="sm" 
                                disabled={sendReplyMutation.isPending || !newReplyMessage.trim()}
                                className="bg-admin-accent text-white"
                            >
                                <Send size={14} className="mr-1" /> Send
                            </Button>
                        </form>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
};

export default AdminTickets;
