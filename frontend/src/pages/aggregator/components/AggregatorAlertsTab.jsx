import React from 'react';
import { AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const AggregatorAlertsTab = ({ onNavigateOverview, onOpenProfile }) => {
  const alerts = [
    {
      title: 'Quality Flag: Density Anomaly Detected',
      desc: 'Collection on Mary Wanjiku farm logged lactometer reading below standard (1.022 sp.gr) resulting in batch rejection and KES 0 total payout.',
      time: 'Yesterday',
      type: 'error',
      actionLabel: 'Inspect Quality Ledger',
      onAction: onNavigateOverview,
    },
    {
      title: 'Route Optimization Opportunity',
      desc: 'New surplus available on your standard collection route in Limuru (+350L morning capacity).',
      time: '5 hours ago',
      type: 'info',
      actionLabel: 'View Supply Network',
      onAction: onNavigateOverview,
    },
    {
      title: 'Cold-Chain Chiller Calibration Due',
      desc: 'Vehicle intake tank thermometer calibration audit due in 5 days to preserve Grade A milk collection warranty.',
      time: '2 days ago',
      type: 'info',
      actionLabel: 'Update KYC & Fleet Specs',
      onAction: onOpenProfile,
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 shadow-card rounded-2xl p-6 sm:p-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">System & Logistics Alerts</h2>
          <p className="text-xs text-slate-500">
            Operational flags regarding milk quality thresholds and route scheduling
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl border-l-4 shadow-xs bg-white border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
              alert.type === 'error' ? 'border-l-rose-500' : 'border-l-blue-500'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {alert.type === 'error' ? (
                  <AlertTriangle size={16} className="text-rose-500" />
                ) : (
                  <Info size={16} className="text-blue-500" />
                )}
                <h4 className="font-bold text-slate-900 text-sm">{alert.title}</h4>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {alert.time}
                </span>
              </div>
              <p className="text-slate-600 text-xs font-medium leading-relaxed max-w-2xl">
                {alert.desc}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={alert.onAction}
              className="text-xs font-bold whitespace-nowrap touch-target"
            >
              {alert.actionLabel}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AggregatorAlertsTab;
