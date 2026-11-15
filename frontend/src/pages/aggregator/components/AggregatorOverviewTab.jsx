import React from 'react';
import {
  Droplets,
  TrendingUp,
  FlaskConical,
  Users,
  MessageSquare,
  XCircle,
  Check,
  CheckCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from '../../../components/ui/StatCard';
import { EmptyState } from '../../../components/ui/EmptyState';

export const AggregatorOverviewTab = ({
  totalLitres = 0,
  totalPaid = 0,
  gradeAPercent = 0,
  avgLactometer = '1.028',
  activeConnections = [],
  connections = [],
  chartData = [],
  collections = [],
  handleOpenChatWithFarm,
  onOpenLogModal,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 4 Universal Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Volume"
          value={totalLitres.toLocaleString()}
          unit="L"
          icon={Droplets}
          trend="+12% vs last week"
          trendUp={true}
          accent="aggregator"
        />
        <StatCard
          title="Total Payouts"
          value={`KES ${totalPaid.toLocaleString()}`}
          icon={TrendingUp}
          trend="On budget"
          trendUp={true}
          accent="emerald"
        />
        <StatCard
          title="Quality Standard (QA)"
          value={`${gradeAPercent}%`}
          subtitle={`Grade A (${avgLactometer} sp.gr)`}
          icon={FlaskConical}
          trend={gradeAPercent >= 85 ? 'Premium quality' : 'Attention needed'}
          trendUp={gradeAPercent >= 85}
          accent={gradeAPercent >= 85 ? 'blue' : 'amber'}
        />
        <StatCard
          title="Contracted Farms"
          value={activeConnections.length}
          subtitle={`${connections.length} total registered`}
          icon={Users}
          accent="admin"
        />
      </div>

      {/* Intake Chart & Supply Network */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-slate-200 shadow-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Volume Intake Trends</h2>
              <p className="text-xs text-slate-500">Last 7 recorded daily procurement volumes</p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              Litres (L)
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dx={-8} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    background: '#FFFFFF',
                  }}
                />
                <Area type="monotone" dataKey="volume" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVol)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-card rounded-2xl p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Supply Network</h2>
              <p className="text-xs text-slate-500">{activeConnections.length} connected dairy farms</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
            {activeConnections.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-medium">No active farms yet.</div>
            ) : (
              activeConnections.map((conn) => (
                <div
                  key={conn.id}
                  className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-200 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {conn.farm_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-700 transition-colors">
                        {conn.farm_name}
                      </h4>
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-0.5">
                        {conn.status}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenChatWithFarm(conn)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 touch-target flex items-center justify-center"
                    title={`Chat with ${conn.farm_name}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Collections & Quality Ledger */}
      <div className="bg-white border border-slate-200 shadow-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-blue-600" />
              Recent Procurement Records & Quality Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Live intake audit trail with lactometer density and platform testing verification
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
            {collections.length} Total Collections Recorded
          </span>
        </div>

        {collections.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No Milk Collections Logged Yet"
            description="Click 'Log Collection' to record your first farmer intake with quality testing parameters."
            action={onOpenLogModal ? { label: 'Log Collection', onClick: onOpenLogModal } : null}
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Farm</th>
                  <th className="py-3 px-3">Volume</th>
                  <th className="py-3 px-3">Quality Grade</th>
                  <th className="py-3 px-3">Density & Temp</th>
                  <th className="py-3 px-3">Alcohol Test</th>
                  <th className="py-3 px-3 text-right">Unit Price</th>
                  <th className="py-3 px-3 text-right">Settlement</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {collections.map((col) => {
                  const isRejected = col.quality_grade === 'REJECTED';
                  const isGradeB = col.quality_grade === 'GRADE_B';
                  return (
                    <tr key={col.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-semibold">{col.date}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-bold text-slate-900">
                        {col.farm_name || 'Contract Farm'}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-bold text-slate-800">
                        {parseFloat(col.litres_collected).toLocaleString()} L
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isRejected ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={12} /> Rejected
                            </span>
                            {col.rejection_reason && (
                              <p className="text-[10px] text-rose-500 mt-0.5 max-w-[140px] truncate" title={col.rejection_reason}>
                                {col.rejection_reason}
                              </p>
                            )}
                          </div>
                        ) : isGradeB ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Check size={12} /> Grade B
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle size={12} /> Grade A
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                        {col.lactometer_reading ? `${col.lactometer_reading} sp.gr` : '—'} • {col.temperature_celsius ? `${col.temperature_celsius}°C` : '—'}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            col.alcohol_test_passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {col.alcohol_test_passed ? 'Passed (75% OK)' : 'Failed / Clot'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-right font-mono font-semibold text-slate-700">
                        KES {parseFloat(col.unit_price_kes || 50).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-right font-mono font-bold text-slate-900">
                        KES {parseFloat(col.total_payout_kes || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            col.payment_status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {col.payment_status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AggregatorOverviewTab;
