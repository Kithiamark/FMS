import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMilkProductionStats } from '../hooks/useMilk';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarDays, Download, Plus, PenLine } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../api/axios';

const formatLitres = (value) => `${Number(value || 0).toFixed(1)} L`;

const ProductionDashboard = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const { data: stats, isLoading } = useMilkProductionStats(year, month);

    const monthlyTotal = stats?.daily_totals?.reduce((acc, curr) => acc + Number(curr.total || 0), 0) || 0;
    const hasDailyTotals = Boolean(stats?.daily_totals?.length);

    const handleDownloadReport = async () => {
        const response = await api.get(`/milk/summary/monthly/?year=${year}&month=${month}`);
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `milk_summary_${year}_${month}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    if (isLoading) return <div className="p-8 text-gray-600 dark:text-slate-400">Loading dairy dashboard...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-slate-100">Dairy Management</h1>
                    <p className="mt-1 text-gray-500 dark:text-slate-400">Track production, household use, sales, calf feeding, and daily balances.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select 
                        value={year} 
                        onChange={event => setYear(Number(event.target.value))} 
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                        {[2024, 2025, 2026].map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <select 
                        value={month} 
                        onChange={event => setMonth(Number(event.target.value))} 
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                    <Button variant="outline" onClick={handleDownloadReport}><Download size={16} className="mr-2" /> Export</Button>
                    <Link to="/dairy/record"><Button><Plus size={16} className="mr-2" /> Daily Entry</Button></Link>
                </div>
            </div>

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {[
                    ['Produced', monthlyTotal, 'text-gray-900 dark:text-slate-100'],
                    ['Home Use', stats?.stats?.total_home, 'text-blue-700 dark:text-blue-400'],
                    ['Sold', stats?.stats?.total_sold, 'text-green-700 dark:text-emerald-400'],
                    ['Calves', stats?.stats?.total_calves, 'text-amber-700 dark:text-amber-400'],
                    ['Avg / Day', stats?.stats?.avg_daily, 'text-gray-900 dark:text-slate-100'],
                ].map(([label, value, color]) => (
                    <div key={label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-sm text-gray-500 dark:text-slate-400">{label}</p>
                        <p className={`mt-2 text-2xl font-bold ${color}`}>{formatLitres(value)}</p>
                    </div>
                ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold text-gray-900 dark:text-slate-100">
                        <CalendarDays size={20} className="text-emerald-600 dark:text-emerald-400" /> Production Trend
                    </h2>
                    <div className="h-80">
                        {hasDailyTotals ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats?.daily_totals || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis dataKey="date" stroke="#6b7280" />
                                    <YAxis stroke="#6b7280" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2.5} name="Produced" dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-center text-gray-500 dark:bg-slate-800/50 dark:text-slate-400">
                                Save daily milk records to see the production trend.
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="mb-5 font-heading text-xl font-bold text-gray-900 dark:text-slate-100">Milk Usage</h2>
                    <div className="h-80">
                        {hasDailyTotals ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.daily_totals || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis dataKey="date" stroke="#6b7280" />
                                    <YAxis stroke="#6b7280" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                                    <Legend />
                                    <Bar dataKey="home" stackId="usage" fill="#3b82f6" name="Home" />
                                    <Bar dataKey="sold" stackId="usage" fill="#10b981" name="Sold" />
                                    <Bar dataKey="calves" stackId="usage" fill="#f59e0b" name="Calves" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-center text-gray-500 dark:bg-slate-800/50 dark:text-slate-400">
                                Allocate milk to home, sales, and calves to see usage.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-gray-100 px-5 py-4 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-slate-100">Daily Ledger</h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Monthly breakdown with quick edit access</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                        {stats?.daily_totals?.length || 0} Days Recorded
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-[760px] w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-950 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Produced</th>
                                <th className="px-4 py-3">Home</th>
                                <th className="px-4 py-3">Sold</th>
                                <th className="px-4 py-3">Calves</th>
                                <th className="px-4 py-3">Balance</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {stats?.daily_totals?.length ? stats.daily_totals.map(row => {
                                const balance = Number(row.total || 0) - Number(row.home || 0) - Number(row.sold || 0) - Number(row.calves || 0);
                                return (
                                    <tr key={row.date} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">{row.date}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-800 dark:text-slate-200">{formatLitres(row.total)}</td>
                                        <td className="px-4 py-3 text-blue-600 dark:text-blue-400">{formatLitres(row.home)}</td>
                                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">{formatLitres(row.sold)}</td>
                                        <td className="px-4 py-3 text-amber-600 dark:text-amber-400">{formatLitres(row.calves)}</td>
                                        <td className={`px-4 py-3 font-bold ${balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{formatLitres(balance)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                to={`/dairy/record?date=${row.date}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:border-emerald-500 transition text-xs font-semibold shadow-sm"
                                                title={`Edit or view records for ${row.date}`}
                                            >
                                                <PenLine size={13} className="text-emerald-600 dark:text-emerald-400" />
                                                <span>Edit</span>
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">No milk records for this month yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default ProductionDashboard;
