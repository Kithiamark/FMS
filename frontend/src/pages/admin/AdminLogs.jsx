import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { AdminLayout } from '../../components/Layout/AdminLayout';
import { Terminal, RefreshCw, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

const fetchLogs = async () => {
    const { data } = await api.get('/admin/logs/');
    return data.results; // Assuming pagination
};

const AdminLogs = () => {
    const [autoRefresh, setAutoRefresh] = useState(false);
    const { data: logs, isLoading, refetch } = useQuery({ queryKey: ['systemLogs'], queryFn: fetchLogs });

    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(refetch, 30000); // 30s
        }
        return () => clearInterval(interval);
    }, [autoRefresh, refetch]);

    const getLevelBadge = (level) => {
        switch (level) {
            case 'CRITICAL': return <span className="bg-red-900 text-red-200 px-1 rounded text-[10px] font-bold">CRIT</span>;
            case 'ERROR': return <span className="bg-red-500/20 text-red-400 px-1 rounded text-[10px] font-bold">ERR</span>;
            case 'WARNING': return <span className="bg-amber-500/20 text-amber-400 px-1 rounded text-[10px] font-bold">WARN</span>;
            default: return <span className="bg-gray-700 text-gray-300 px-1 rounded text-[10px]">INFO</span>;
        }
    };

    const getRowStyle = (level) => {
        switch (level) {
            case 'CRITICAL': return 'border-l-2 border-red-600 bg-red-900/10';
            case 'ERROR': return 'border-l-2 border-red-500 bg-red-500/5';
            case 'WARNING': return 'border-l-2 border-amber-500 bg-amber-500/5';
            default: return 'border-l-2 border-transparent hover:bg-gray-800/30';
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-4 h-[calc(100vh-100px)] flex flex-col">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Terminal size={20} /> System Logs
                    </h1>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full transition-colors ${autoRefresh ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
                        >
                            <RefreshCw size={12} className={autoRefresh ? "animate-spin" : ""} />
                            Auto-refresh {autoRefresh ? "ON" : "OFF"}
                        </button>
                    </div>
                </div>

                {/* Log Viewer */}
                <div className="flex-1 bg-black border border-gray-800 rounded-xl p-4 font-mono text-xs overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
                    {isLoading ? (
                        <div className="text-gray-500">Loading logs...</div>
                    ) : (
                        <div className="space-y-1">
                            {logs?.map((log) => (
                                <div key={log.id} className={`p-2 rounded flex gap-4 items-start ${getRowStyle(log.level)}`}>
                                    <span className="text-gray-500 min-w-[140px]">{new Date(log.timestamp).toLocaleString()}</span>
                                    <div className="min-w-[50px]">{getLevelBadge(log.level)}</div>
                                    <span className="text-admin-accent min-w-[80px] font-bold">[{log.service}]</span>
                                    <span className="text-gray-300 break-all">{log.message}</span>
                                    {log.ip_address && <span className="text-gray-600 ml-auto">{log.ip_address}</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminLogs;
