import React from 'react';
import { Link } from 'react-router-dom';
import { useFarmHealth, usePersonalizedRecommendations } from '../hooks/useAI';
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Brain, CheckCircle, Droplets, Lightbulb, NotebookPen, Target } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const priorityClass = {
    High: 'border-red-200 bg-red-50 text-red-800',
    Medium: 'border-amber-200 bg-amber-50 text-amber-800',
    Low: 'border-green-200 bg-green-50 text-green-800',
};

const typeIcon = {
    records: NotebookPen,
    production: Droplets,
    health: AlertTriangle,
    feed: Target,
};

const Insights = () => {
    const { data: healthData = [], isLoading: isHealthLoading } = useFarmHealth();
    const { data, isLoading } = usePersonalizedRecommendations();

    if (isLoading || isHealthLoading) {
        return <div className="p-8 text-gray-600">Loading personalized insights...</div>;
    }

    const chartData = data?.animal_predictions?.map(item => ({
        name: item.animal.name,
        predicted: item.predicted_7_day_total,
        confidence: Math.round(item.confidence * 100),
    })) || [];

    const change = data?.summary?.production_change_pct || 0;
    const confidence = Math.round((data?.model?.confidence || 0) * 100);

    return (
        <div className="space-y-6">
            <section className="rounded-2xl bg-forest-green p-6 text-white shadow-sm md:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-green-100">
                            <Brain size={16} /> Personalized farm model
                        </div>
                        <h1 className="font-heading text-3xl font-bold md:text-4xl">AI Recommendations</h1>
                        <p className="mt-3 max-w-2xl text-green-100">
                            Tips are generated from your herd profile, milk records, and health signals. The more consistently you record production, the more personal this gets.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm md:min-w-80">
                        <div className="rounded-xl bg-white/10 p-4">
                            <p className="text-green-100">Model confidence</p>
                            <p className="mt-1 text-2xl font-bold">{confidence}%</p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-4">
                            <p className="text-green-100">Records learned</p>
                            <p className="mt-1 text-2xl font-bold">{data?.model?.learned_from_records || 0}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Active Animals</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{data?.summary?.active_animals || 0}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Last 7 Days</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{data?.summary?.last_7_day_total || 0} L</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Week Change</p>
                    <div className={`mt-2 flex items-center gap-2 text-3xl font-bold ${change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {change < 0 ? <ArrowDownRight size={26} /> : <ArrowUpRight size={26} />}
                        {change}%
                    </div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Month to Date</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{data?.summary?.month_to_date_total || 0} L</p>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="font-heading text-xl font-bold text-gray-900">Projected 7-Day Output</h2>
                            <p className="text-sm text-gray-500">Animal-level forecast learned from recorded milk history.</p>
                        </div>
                        <Badge status={confidence >= 60 ? 'Active' : 'Pending'}>{confidence >= 60 ? 'Learning' : 'Needs data'}</Badge>
                    </div>
                    <div className="h-72">
                        {chartData.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="predicted" fill="#1a3a1f" radius={[6, 6, 0, 0]} name="Predicted litres" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-center text-gray-500">
                                Add animals and milk records to unlock animal-level forecasts.
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="font-heading text-xl font-bold text-gray-900">Recommended Actions</h2>
                    <div className="mt-5 space-y-4">
                        {data?.recommendations?.length ? data.recommendations.map((item, index) => {
                            const Icon = typeIcon[item.type] || Lightbulb;
                            return (
                                <div key={`${item.type}-${index}`} className={`rounded-xl border p-4 ${priorityClass[item.priority] || priorityClass.Medium}`}>
                                    <div className="mb-2 flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Icon size={18} />
                                            <h3 className="font-bold">{item.title}</h3>
                                        </div>
                                        <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold">{item.priority}</span>
                                    </div>
                                    <p className="text-sm leading-6">{item.message}</p>
                                    {item.link && (
                                        <Link to={item.link}>
                                            <Button size="sm" variant="outline" className="mt-3 bg-white/80">{item.action}</Button>
                                        </Link>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
                                <div className="mb-2 flex items-center gap-2 font-bold"><CheckCircle size={18} /> No urgent recommendations</div>
                                <p className="text-sm">Keep recording production and health notes so the model can continue learning.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section>
                <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-bold text-gray-900">
                    <Activity className="text-amber-accent" /> Herd Health Risk Overview
                </h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {healthData.length ? healthData.map((item) => (
                        <div key={item.animal.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-gray-900">{item.animal.name}</h3>
                                    <p className="text-sm text-gray-500">{item.animal.ear_tag}</p>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${item.risk.risk_level === 'High' ? 'bg-red-500' : item.risk.risk_level === 'Medium' ? 'bg-orange-500' : 'bg-green-600'}`}>
                                    {item.risk.risk_level}
                                </span>
                            </div>
                            <div className="mb-4">
                                <div className="h-2.5 w-full rounded-full bg-gray-200">
                                    <div className="h-2.5 rounded-full bg-forest-green" style={{ width: `${item.risk.risk_score}%` }} />
                                </div>
                                <p className="mt-1 text-right text-xs text-gray-500">{item.risk.risk_score}/100</p>
                            </div>
                            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{item.risk.recommended_action}</p>
                        </div>
                    )) : (
                        <div className="rounded-xl border border-gray-100 bg-white p-6 text-gray-500 shadow-sm">
                            Add active animals to see herd health risk insights.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Insights;
