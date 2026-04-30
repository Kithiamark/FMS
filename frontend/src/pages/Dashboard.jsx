import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  DollarSign,
  Droplets,
  HeartPulse,
  Milk,
  Plus,
  Syringe,
  Sparkles,
  Tag,
  WalletCards,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { useDailyMilkSummary, useMilkProductionStats } from '../hooks/useMilk';
import { useFarmHealth } from '../hooks/useAI';
import { useFinanceSummary } from '../hooks/useFinance';
import { useSubscription } from '../hooks/useSubscription';

const formatLitres = (value) => `${Number(value || 0).toFixed(1)} L`;
const formatMoney = (value) => `KES ${Number(value || 0).toLocaleString()}`;

const usageColors = {
  Home: '#2563eb',
  Sold: '#16a34a',
  Calves: '#d97706',
  Balance: '#64748b',
};

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  const todayParts = { year: todayDate.getFullYear(), month: todayDate.getMonth() + 1 };

  const { data: milkData } = useDailyMilkSummary(today);
  const { data: healthData } = useFarmHealth();
  const { data: financeData } = useFinanceSummary(todayParts.year, todayParts.month);
  const { data: monthlyMilk } = useMilkProductionStats(todayParts.year, todayParts.month);
  const { data: subscriptionData } = useSubscription();

  const highRiskCount = healthData?.filter((animal) => animal.risk.risk_level === 'High').length || 0;
  const activeAnimals = healthData?.length || 0;
  const recentMilkRecords = (milkData?.records || []).slice(0, 4);
  const monthlyTotal = monthlyMilk?.daily_totals?.reduce((sum, row) => sum + Number(row.total || 0), 0) || 0;
  const chartData = monthlyMilk?.daily_totals?.slice(-10).map((row) => ({
    ...row,
    day: new Date(row.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
  })) || [];
  const usageData = [
    { name: 'Home', value: milkData?.usage?.home || 0 },
    { name: 'Sold', value: milkData?.usage?.sold || 0 },
    { name: 'Calves', value: milkData?.usage?.calves || 0 },
    { name: 'Balance', value: Math.max(milkData?.usage?.unallocated || 0, 0) },
  ];
  const usageTotal = usageData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const currentPlan = subscriptionData?.current?.plan || user?.farm?.subscription?.plan || 'Trial';
  const dairyAlerts = [
    { title: 'Heat Cycle Watch', detail: 'Check cows with restlessness, mounting, or lower feed intake.', icon: HeartPulse, tone: 'text-rose-700 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300' },
    { title: 'Calf Vaccine', detail: 'Review calves due for clostridial or deworming schedule this week.', icon: Syringe, tone: 'text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300' },
    { title: 'Milk Price', detail: 'Post county buyer prices or compare today’s KES/L in Community.', icon: Tag, tone: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300' },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      {/* This screen intentionally aggregates several domains. When adding a new dashboard
          metric, prefer reading from an existing hook so the page remains a composition
          layer rather than a second API client. */}
      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          <div
            className="relative min-h-[250px] bg-cover bg-center p-6 text-white md:p-8"
            style={{ backgroundImage: "linear-gradient(90deg, rgba(6, 50, 31, 0.92), rgba(6, 50, 31, 0.55)), url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1400&q=80')" }}
          >
            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-100">
                    {todayDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <h1 className="mt-2 font-heading text-3xl font-bold tracking-normal md:text-4xl">
                    Good morning, {user?.full_name?.split(' ')[0] || 'Farmer'}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">
                    {user?.farm?.name || 'Your farm'} is ready for today’s production, animal health, and cash-flow checks.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to="/dairy/record">
                    <Button className="bg-white text-emerald-800 hover:bg-emerald-50">
                      <Plus size={17} className="mr-2" /> Record milk
                    </Button>
                  </Link>
                  <Link to="/insights">
                    <Button variant="secondary" className="border-white/20 bg-white/15 text-white hover:bg-white/20">
                      <Sparkles size={17} className="mr-2" /> AI tips
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Today milk', value: formatLitres(milkData?.total_farm_yield), icon: Milk },
                  { label: 'Month production', value: formatLitres(monthlyTotal), icon: Droplets },
                  { label: 'Net this month', value: formatMoney(financeData?.net_total), icon: WalletCards },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-800">
                      <item.icon size={19} />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Dairy Alerts</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-100">Today’s Watchlist</h2>
              </div>
              <AlertTriangle className="text-amber-600" size={26} />
            </div>
            <div className="space-y-3">
              {dairyAlerts.map((alert) => (
                <div key={alert.title} className="flex gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${alert.tone}`}>
                    <alert.icon size={19} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{alert.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{alert.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Active Animals</p>
                <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-slate-100">{activeAnimals}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <Activity size={26} />
              </div>
            </div>
            <Link to="/animals" className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">
              Review herd records <ArrowUpRight size={17} />
            </Link>
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { title: t('today_milk'), value: formatLitres(milkData?.total_farm_yield), detail: `${milkData?.records_count || 0} records`, icon: Milk },
          { title: 'Home use', value: formatLitres(milkData?.usage?.home), detail: 'Household allocation', icon: Droplets },
          { title: t('expenses_this_month'), value: formatMoney(financeData?.expense_total), detail: 'Month to date', icon: DollarSign },
          { title: t('pending_alerts'), value: highRiskCount, detail: highRiskCount ? 'Needs attention' : 'All clear', icon: AlertTriangle },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-500">{item.title}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{item.value}</p>
              </div>
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <item.icon size={21} />
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Membership Tier</p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-slate-950">{currentPlan}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Trial captures farm entries for model learning. Basic unlocks vet contact, better AI, and communities. Premium and Enterprise add personalised support and team controls.
            </p>
          </div>
          <Link to="/settings" className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">
            Manage membership
          </Link>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-bold text-slate-950">Production Overview</h2>
              <p className="text-sm text-slate-500">Last recorded days in the current month</p>
            </div>
            <Link to="/dairy" className="text-sm font-bold text-emerald-700 hover:text-emerald-900">Open dairy</Link>
          </div>
          <div className="h-[300px]">
            {/* Recharts needs a stable parent height. Keep these chart wrappers fixed-height
                or the library can render blank charts in responsive containers. */}
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="milkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatLitres(value)} />
                  <Area type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={3} fill="url(#milkGradient)" name="Milk produced" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-center text-sm text-slate-500">
                Record milk entries to build your production trend.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-slate-950">Milk Usage Today</h2>
              <p className="text-sm text-slate-500">Home, sales, calves, and remaining balance</p>
            </div>
            <CalendarDays className="text-slate-400" size={22} />
          </div>
          <div className="h-[230px]">
            {usageTotal > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageData} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatLitres(value)} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {usageData.map((entry) => <Cell key={entry.name} fill={usageColors[entry.name]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-center text-sm text-slate-500">
                Allocate today’s milk to see usage split.
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {usageData.map((item) => (
              <div key={item.name} className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold text-slate-500">{item.name}</p>
                <p className="text-sm font-bold text-slate-900">{formatLitres(item.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-slate-950">Quick Actions</h2>
            <Plus size={20} className="text-slate-400" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              { label: 'Record daily milk', path: '/dairy/record', icon: Milk },
              { label: 'Add income or expense', path: '/finance', icon: DollarSign },
              { label: 'Create farm alert', path: '/alerts', icon: AlertTriangle },
              { label: 'Ask AI for recommendations', path: '/insights', icon: Sparkles },
            ].map((item) => (
              <Link key={item.path} to={item.path} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-800">
                <span className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-emerald-700">
                    <item.icon size={18} />
                  </span>
                  {item.label}
                </span>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-slate-950">{t('recent_activity')}</h2>
              <p className="text-sm text-slate-500">Latest milk records for today</p>
            </div>
            <Link to="/dairy/record" className="text-sm font-bold text-emerald-700 hover:text-emerald-900">Add entry</Link>
          </div>
          <div className="space-y-3">
            {recentMilkRecords.length > 0 ? recentMilkRecords.map((record) => (
              <div key={record.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Milk size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{record.animal_name} milk recorded</p>
                  <p className="text-sm text-slate-500">
                    {formatLitres(record.total_yield)} total, {formatLitres(record.sold_litres)} sold, {formatLitres(record.home_use_litres)} home
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">{record.date}</span>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No milk activity has been recorded today. Add entries from the dairy record screen to populate this feed.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
