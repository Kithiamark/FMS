import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFarmHealth, usePersonalizedRecommendations } from '../hooks/useAI';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Droplets,
  Lightbulb,
  NotebookPen,
  Sparkles,
  Target,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { Skeleton, SkeletonStatGrid } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { AIAssistantWidget } from '../components/ai/AIAssistantWidget';

const priorityClass = {
  High: 'border-red-200 bg-red-50 text-red-800',
  Medium: 'border-amber-200 bg-amber-50 text-amber-800',
  Low: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

const typeIcon = {
  records: NotebookPen,
  production: Droplets,
  health: AlertTriangle,
  feed: Target,
};

export const Insights = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assistant');
  const { data: healthData = [], isLoading: isHealthLoading } = useFarmHealth();
  const { data, isLoading } = usePersonalizedRecommendations();

  if (isLoading || isHealthLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-44 rounded-xl" />
          <Skeleton className="h-10 w-44 rounded-xl" />
        </div>
        <SkeletonStatGrid count={4} />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const chartData = data?.animal_predictions?.map(item => ({
    name: item.animal.name,
    predicted: item.predicted_7_day_total,
    confidence: Math.round(item.confidence * 100),
  })) || [];

  const change = data?.summary?.production_change_pct || 0;
  const confidence = Math.round((data?.model?.confidence || 0) * 100);
  const farmName = user?.farm?.name || user?.farm_name || 'My Herd';

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <section className="rounded-2xl bg-forest-green p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-green-100">
              <Brain size={16} /> Intelligent Farm Advisory
            </div>
            <h1 className="font-heading text-3xl font-bold md:text-4xl">Farm AI & Insights</h1>
            <p className="mt-3 max-w-2xl text-green-100 leading-relaxed text-sm sm:text-base">
              Powered by Arvion AI and live farm data. Get instant answers on feeds, herd health, breeding cycles, and market off-take, alongside predictive production analytics.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:min-w-80">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-xs">
              <p className="text-green-100 text-xs">Model confidence</p>
              <p className="mt-1 text-2xl font-bold">{confidence}%</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-xs">
              <p className="text-green-100 text-xs">Records learned</p>
              <p className="mt-1 text-2xl font-bold">{data?.model?.learned_from_records || 0}</p>
            </div>
          </div>
        </div>
      </section>

      {/* View Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('assistant')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all touch-target ${
              activeTab === 'assistant'
                ? 'bg-forest-green text-white shadow-xs font-bold'
                : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Sparkles size={16} className={activeTab === 'assistant' ? 'text-amber-300' : 'text-forest-green'} />
            <span>Arvion AI Farm Assistant</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 font-bold border border-emerald-400/30">
              Live
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('forecasts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all touch-target ${
              activeTab === 'forecasts'
                ? 'bg-forest-green text-white shadow-xs font-bold'
                : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <BarChart3 size={16} />
            <span>Production Forecasts</span>
          </button>
        </div>

        {activeTab === 'forecasts' && (
          <button
            type="button"
            onClick={() => setActiveTab('assistant')}
            className="text-xs text-forest-green hover:underline font-semibold flex items-center gap-1 touch-target"
          >
            <Sparkles size={13} />
            Have questions about these projections? Chat with AI Advisor &rarr;
          </button>
        )}
      </div>

      {/* Tab 1: Arvion AI Farm Assistant */}
      {activeTab === 'assistant' && (
        <div className="space-y-6">
          <AIAssistantWidget
            inline={true}
            initialContext={{
              farm_name: farmName,
              active_animals: data?.summary?.active_animals || 0,
              last_7_days_milk_litres: data?.summary?.last_7_day_total || 0,
            }}
          />

          {/* Quick Metric Baseline Cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Active Animals Grounded"
              value={data?.summary?.active_animals || 0}
              icon={Activity}
              accent="farmer"
            />
            <StatCard
              title="Last 7 Days Output"
              value={data?.summary?.last_7_day_total || 0}
              unit="L"
              icon={Droplets}
              accent="blue"
            />
            <StatCard
              title="Week-over-Week Trend"
              value={`${change > 0 ? '+' : ''}${change}%`}
              trend={change}
              trendUp={change >= 0}
              icon={TrendingUp}
              accent={change >= 0 ? 'emerald' : 'red'}
            />
            <StatCard
              title="Month to Date Output"
              value={data?.summary?.month_to_date_total || 0}
              unit="L"
              icon={Droplets}
              accent="amber"
            />
          </section>
        </div>
      )}

      {/* Tab 2: Forecasts & Health Risk Overview */}
      {activeTab === 'forecasts' && (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Active Animals"
              value={data?.summary?.active_animals || 0}
              icon={Activity}
              accent="farmer"
            />
            <StatCard
              title="Last 7 Days"
              value={data?.summary?.last_7_day_total || 0}
              unit="L"
              icon={Droplets}
              accent="blue"
            />
            <StatCard
              title="Week Change"
              value={`${change > 0 ? '+' : ''}${change}%`}
              trend={change}
              trendUp={change >= 0}
              icon={TrendingUp}
              accent={change >= 0 ? 'emerald' : 'red'}
            />
            <StatCard
              title="Month to Date"
              value={data?.summary?.month_to_date_total || 0}
              unit="L"
              icon={Droplets}
              accent="amber"
            />
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-card border border-surface-border bg-white p-6 shadow-card">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-lg font-bold text-slate-900">Projected 7-Day Output</h2>
                  <p className="text-xs text-slate-500">Animal-level forecast learned from recorded milk history.</p>
                </div>
                <Badge status={confidence >= 60 ? 'Active' : 'Pending'}>
                  {confidence >= 60 ? 'Learning' : 'Needs data'}
                </Badge>
              </div>
              <div className="h-72">
                {chartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="predicted" fill="#1a3a1f" radius={[6, 6, 0, 0]} name="Predicted litres" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-center text-xs text-slate-500 p-6">
                    Add animals and daily milk records to unlock animal-level forecasts.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-card border border-surface-border bg-white p-6 shadow-card">
              <h2 className="font-heading text-lg font-bold text-slate-900">Recommended Actions</h2>
              <div className="mt-4 space-y-3">
                {data?.recommendations?.length ? (
                  data.recommendations.map((item, index) => {
                    const Icon = typeIcon[item.type] || Lightbulb;
                    return (
                      <div
                        key={`${item.type}-${index}`}
                        className={`rounded-xl border p-4 ${priorityClass[item.priority] || priorityClass.Medium}`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Icon size={18} />
                            <h3 className="font-bold text-xs sm:text-sm">{item.title}</h3>
                          </div>
                          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold">
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed">{item.message}</p>
                        {item.link && (
                          <Link to={item.link}>
                            <Button size="sm" variant="outline" className="mt-3 bg-white/90 text-xs">
                              {item.action}
                            </Button>
                          </Link>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                    <div className="mb-1.5 flex items-center gap-2 font-bold text-xs sm:text-sm">
                      <CheckCircle size={16} /> No urgent recommendations
                    </div>
                    <p className="text-xs leading-relaxed">
                      Keep recording production and health notes so the model can continue learning.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
              <Activity className="text-amber-accent" size={20} /> Herd Health Risk Overview
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {healthData.length ? (
                healthData.map((item) => (
                  <div key={item.animal.id} className="rounded-card border border-surface-border bg-white p-5 shadow-card">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{item.animal.name}</h3>
                        <p className="text-xs text-slate-500">{item.animal.ear_tag}</p>
                      </div>
                      <Badge status={item.risk.risk_level} />
                    </div>
                    <div className="mb-3">
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-forest-green"
                          style={{ width: `${Math.min(100, Math.max(0, item.risk.risk_score))}%` }}
                        />
                      </div>
                      <p className="mt-1 text-right text-[11px] font-semibold text-slate-500">
                        Risk Score: {item.risk.risk_score}/100
                      </p>
                    </div>
                    <p className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-100">
                      {item.risk.recommended_action}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No Herd Health Alerts"
                  description="Add active animals to view automated herd health risk scores."
                  className="col-span-full py-8"
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Insights;
