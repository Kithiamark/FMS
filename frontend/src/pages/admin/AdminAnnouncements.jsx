import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { AdminLayout } from '../../components/Layout/AdminLayout';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { 
    Megaphone, Plus, Trash2, Edit3, CheckCircle, Clock, 
    RefreshCw, Globe, Users, Stethoscope, Building
} from 'lucide-react';

const fetchAnnouncements = async () => {
    const { data } = await api.get('/admin/announcements/');
    return Array.isArray(data) ? data : (data?.results || []);
};

const AdminAnnouncements = () => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const { data: announcements = [], isLoading, refetch, isFetching } = useQuery({
        queryKey: ['adminAnnouncements'],
        queryFn: fetchAnnouncements
    });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // Form state
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [targetAudience, setTargetAudience] = useState('ALL');
    const [isPublished, setIsPublished] = useState(true);
    const [expiresAt, setExpiresAt] = useState('');

    const openCreateModal = () => {
        setEditingAnnouncement(null);
        setTitle('');
        setBody('');
        setTargetAudience('ALL');
        setIsPublished(true);
        setExpiresAt('');
        setIsCreateOpen(true);
    };

    const openEditModal = (a) => {
        setEditingAnnouncement(a);
        setTitle(a.title || '');
        setBody(a.body || '');
        setTargetAudience(a.target_audience || 'ALL');
        setIsPublished(a.is_published ?? true);
        setExpiresAt(a.expires_at ? a.expires_at.split('T')[0] : '');
        setIsCreateOpen(true);
    };

    // Save mutation (Create / Update)
    const saveMutation = useMutation({
        mutationFn: async (payload) => {
            if (editingAnnouncement?.id) {
                const { data } = await api.patch(`/admin/announcements/${editingAnnouncement.id}/`, payload);
                return data;
            }
            const { data } = await api.post('/admin/announcements/', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminAnnouncements']);
            setIsCreateOpen(false);
            addToast(`Announcement ${editingAnnouncement ? 'updated' : 'published'} successfully.`, 'success');
        },
        onError: () => {
            addToast('Failed to save announcement.', 'error');
        }
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/admin/announcements/${id}/`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminAnnouncements']);
            setDeleteTargetId(null);
            addToast('Announcement deleted successfully.', 'success');
        },
        onError: () => {
            addToast('Failed to delete announcement.', 'error');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
            addToast('Please provide both a title and announcement content.', 'error');
            return;
        }
        saveMutation.mutate({
            title: title.trim(),
            body: body.trim(),
            target_audience: targetAudience,
            is_published: isPublished,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
        });
    };

    // Metrics
    const totalCount = announcements.length;
    const publishedCount = announcements.filter(a => a.is_published).length;
    const farmerAudience = announcements.filter(a => a.target_audience === 'FARMERS' || a.target_audience === 'ALL').length;
    const vetAudience = announcements.filter(a => a.target_audience === 'VETS' || a.target_audience === 'ALL').length;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2.5">
                            <Megaphone className="text-admin-accent" size={24} />
                            Platform Announcements & Advisories
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">
                            Broadcast regulatory bulletins, disease alerts, and scheduled system maintenance windows.
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button 
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
                        >
                            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <Button 
                            onClick={openCreateModal}
                            size="sm"
                            className="bg-admin-accent hover:bg-admin-accent/90 text-white font-bold flex items-center gap-1.5"
                        >
                            <Plus size={15} /> Create Announcement
                        </Button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Total Bulletins</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{totalCount}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">Platform broadcasts</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Currently Published</p>
                        <h3 className="text-2xl font-bold text-emerald-400 mt-1">{publishedCount}</h3>
                        <p className="text-[11px] text-emerald-400 mt-1">Visible to active users</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Farmer Reached</p>
                        <h3 className="text-2xl font-bold text-blue-400 mt-1">{farmerAudience}</h3>
                        <p className="text-[11px] text-blue-400 mt-1">Bulletins delivered to herd owners</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Vet Broadcasts</p>
                        <h3 className="text-2xl font-bold text-purple-400 mt-1">{vetAudience}</h3>
                        <p className="text-[11px] text-purple-400 mt-1">Veterinary advisory notices</p>
                    </div>
                </div>

                {/* Announcements Feed */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500 text-xs font-medium bg-admin-card border border-gray-800 rounded-xl">
                            Loading announcements...
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 text-xs font-medium bg-admin-card border border-gray-800 rounded-xl space-y-2">
                            <Megaphone className="w-8 h-8 text-gray-600 mx-auto" />
                            <p className="text-white font-bold text-sm">No Announcements Broadcasted Yet</p>
                            <p>Click "Create Announcement" to send platform notices to farmers or vets.</p>
                        </div>
                    ) : (
                        announcements.map(item => (
                            <div key={item.id} className="bg-admin-card border border-gray-800 rounded-xl p-6 transition-all hover:border-gray-700">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                                            item.target_audience === 'FARMERS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            item.target_audience === 'VETS' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            item.target_audience === 'ENTERPRISE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-gray-500/10 text-gray-300 border-gray-500/20'
                                        }`}>
                                            Audience: {item.target_audience}
                                        </span>
                                        {item.is_published ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <CheckCircle size={11} /> Published
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-gray-700 text-gray-300">
                                                Draft
                                            </span>
                                        )}
                                        <span className="text-[11px] text-gray-500 font-mono">
                                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => openEditModal(item)}
                                            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition"
                                            title="Edit Announcement"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => setDeleteTargetId(item.id)}
                                            className="p-1.5 rounded-lg bg-gray-800 text-rose-400 hover:text-rose-300 hover:bg-rose-900/30 transition"
                                            title="Delete Announcement"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">{item.body}</p>

                                <div className="mt-4 pt-3 border-t border-gray-800/80 flex justify-between items-center text-[11px] text-gray-500">
                                    <span>Author: <strong className="text-gray-400">{item.created_by_name || 'Admin'}</strong></span>
                                    {item.expires_at && (
                                        <span>Expires: <strong className="text-gray-400">{new Date(item.expires_at).toLocaleDateString()}</strong></span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MODAL: CREATE / EDIT ANNOUNCEMENT */}
            <Modal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                title={editingAnnouncement ? "Edit Announcement / Newsletter Broadcast" : "Compose Platform Announcement & Newsletter"}
                size="2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4 text-xs text-gray-300">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column: Form Controls */}
                        <div className="lg:col-span-7 space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 mb-1">Announcement / Bulletin Title</label>
                                <input 
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. FMD Vaccination Alert / Milk Quality Standards Update"
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:ring-1 focus:ring-admin-accent text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 mb-1">Target Audience</label>
                                    <select 
                                        value={targetAudience}
                                        onChange={e => setTargetAudience(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-admin-accent"
                                    >
                                        <option value="ALL">All Users (Platform-Wide)</option>
                                        <option value="FARMERS">Farmers Only</option>
                                        <option value="VETS">Veterinarians Only</option>
                                        <option value="ENTERPRISE">Enterprise Users</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 mb-1">Expiration Date (Optional)</label>
                                    <input 
                                        type="date"
                                        value={expiresAt}
                                        onChange={e => setExpiresAt(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-admin-accent"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-[11px] font-bold text-gray-400">Broadcast Content & Message Body</label>
                                    <span className="text-[10px] text-gray-500 font-mono">{body.length} characters</span>
                                </div>
                                <textarea 
                                    rows="9"
                                    required
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    placeholder="Draft your full newsletter advisory or platform announcement here..."
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3.5 text-white text-xs leading-relaxed focus:ring-1 focus:ring-admin-accent font-sans"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input 
                                    type="checkbox"
                                    id="is_published"
                                    checked={isPublished}
                                    onChange={e => setIsPublished(e.target.checked)}
                                    className="h-4 w-4 rounded text-admin-accent focus:ring-admin-accent bg-gray-900 border-gray-800"
                                />
                                <label htmlFor="is_published" className="font-semibold text-gray-300 cursor-pointer">
                                    Publish immediately to live in-app notifications & feeds
                                </label>
                            </div>
                        </div>

                        {/* Right Column: Live Feed Preview */}
                        <div className="lg:col-span-5 bg-gray-950/60 border border-gray-800 rounded-2xl p-4 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between pb-3 border-b border-gray-800/80 mb-3">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-admin-accent flex items-center gap-1.5">
                                        <Megaphone size={13} /> Live Feed Preview
                                    </span>
                                    <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-mono">
                                        {targetAudience}
                                    </span>
                                </div>

                                <div className="bg-admin-card border border-gray-800/80 rounded-xl p-4 space-y-2.5 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-admin-accent/20 text-admin-accent flex items-center justify-center font-bold text-xs">
                                            A
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-medium">Arvion Official Broadcast</p>
                                            <p className="text-[9px] text-gray-500">Just now • Platform Notice</p>
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-bold text-white leading-snug">
                                        {title || 'Announcement Title Preview'}
                                    </h4>
                                    <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed line-clamp-6">
                                        {body || 'Your broadcast message preview will appear here in real-time as you type...'}
                                    </p>
                                    {expiresAt && (
                                        <p className="text-[10px] text-amber-400/80 flex items-center gap-1 pt-1 border-t border-gray-800/60">
                                            <Clock size={11} /> Valid until {expiresAt}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl mt-4">
                                <p className="text-[11px] text-blue-300/90 leading-relaxed">
                                    💡 <strong>Broadcasting Tip:</strong> Farmers receive this announcement directly at the top of their workspace and in community alert tickers.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-800">
                        <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" type="submit" disabled={saveMutation.isPending} className="bg-admin-accent text-white px-5">
                            {saveMutation.isPending ? 'Saving...' : (editingAnnouncement ? 'Save Changes' : 'Broadcast Now')}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* MODAL: DELETE CONFIRMATION */}
            <Modal isOpen={!!deleteTargetId} onClose={() => setDeleteTargetId(null)} title="Delete Announcement">
                <div className="space-y-4 text-xs text-gray-300">
                    <p className="text-gray-300 leading-relaxed">
                        Are you sure you want to permanently delete this announcement? This action will remove the advisory from all user feeds.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => setDeleteTargetId(null)}>
                            Cancel
                        </Button>
                        <Button 
                            size="sm" 
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                            onClick={() => deleteMutation.mutate(deleteTargetId)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
};

export default AdminAnnouncements;
