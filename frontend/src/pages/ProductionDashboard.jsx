import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMilkProductionStats } from '../hooks/useMilk';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarDays, Download, Plus } from 'lucide-react';
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

    if (isLoading) return <div className="p-8 text-gray-600">Loading dairy dashboard...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-gray-900">Dairy Management</h1>
                    <p className="mt-1 text-gray-500">Track production, household use, sales, calf feeding, and daily balances.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select value={year} onChange={event => setYear(Number(event.target.value))} className="rounded-lg border border-gray-300 bg-white px-3 py-2">
                        {[2024, 2025, 2026].map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <select value={month} onChange={event => setMonth(Number(event.target.value))} className="rounded-lg border border-gray-300 bg-white px-3 py-2">
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
                    ['Produced', monthlyTotal, 'text-gray-900'],
                    ['Home Use', stats?.stats?.total_home, 'text-blue-700'],
                    ['Sold', stats?.stats?.total_sold, 'text-green-700'],
                    ['Calves', stats?.stats?.total_calves, 'text-amber-700'],
                    ['Avg / Day', stats?.stats?.avg_daily, 'text-gray-900'],
                ].map(([label, value, color]) => (
                    <div key={label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-500">{label}</p>
                        <p className={`mt-2 text-2xl font-bold ${color}`}>{formatLitres(value)}</p>
                    </div>
                ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold text-gray-900">
                        <CalendarDays size={20} /> Production Trend
                    </h2>
                    <div className="h-80">
                        {hasDailyTotals ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats?.daily_totals || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="total" stroke="#1a3a1f" strokeWidth={2} name="Produced" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-center text-gray-500">
                                Save daily milk records to see the production trend.
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 font-heading text-xl font-bold text-gray-900">Milk Usage</h2>
                    <div className="h-80">
                        {hasDailyTotals ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.daily_totals || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="home" stackId="usage" fill="#2563eb" name="Home" />
                                    <Bar dataKey="sold" stackId="usage" fill="#16a34a" name="Sold" />
                                    <Bar dataKey="calves" stackId="usage" fill="#d97706" name="Calves" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-center text-gray-500">
                                Allocate milk to home, sales, and calves to see usage.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                    <h2 className="font-heading text-lg font-bold text-gray-900">Daily Ledger</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-[760px] w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Produced</th>
                                <th className="px-4 py-3">Home</th>
                                <th className="px-4 py-3">Sold</th>
                                <th className="px-4 py-3">Calves</th>
                                <th className="px-4 py-3">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats?.daily_totals?.length ? stats.daily_totals.map(row => {
                                const balance = Number(row.total || 0) - Number(row.home || 0) - Number(row.sold || 0) - Number(row.calves || 0);
                                return (
                                    <tr key={row.date}>
                                        <td className="px-4 py-3 font-medium text-gray-900">{row.date}</td>
                                        <td className="px-4 py-3">{formatLitres(row.total)}</td>
                                        <td className="px-4 py-3">{formatLitres(row.home)}</td>
                                        <td className="px-4 py-3">{formatLitres(row.sold)}</td>
                                        <td className="px-4 py-3">{formatLitres(row.calves)}</td>
                                        <td className={`px-4 py-3 font-bold ${balance < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatLitres(balance)}</td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No milk records for this month yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default ProductionDashboard;
