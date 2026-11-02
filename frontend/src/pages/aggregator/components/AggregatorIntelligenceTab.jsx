import React, { useState } from 'react';
import { Sparkles, ArrowRight, FileText, ChevronRight, BrainCircuit, RefreshCw } from 'lucide-react';
import { useAggregatorSupplyForecast } from '../../../hooks/useAI';
import { Skeleton, SkeletonCard } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

export const AggregatorIntelligenceTab = ({ bulletins = [], setSelectedBulletin }) => {
  const { data: forecast, isLoading, isError, refetch } = useAggregatorSupplyForecast();
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Live AI Regional Supply Forecast */}
      {isLoading ? (
        <SkeletonCard className="p-8" />
      ) : isError ? (
        <ErrorState
          title="Could not load AI supply forecast"
          message="Server communication failed while fetching regional supply projections."
          onRetry={refetch}
        />
      ) : forecast ? (
        <div className="backdrop-blur-xl bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 tracking-wider uppercase">
              <Sparkles size={13} /> Arvion AI Supply Forecast
            </span>
            {forecast.region && (
              <span className="text-xs font-semibold text-slate-500">
                Region: <strong>{forecast.region}</strong>
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-3">
            {forecast.title || `Regional Supply Risk: Expect ${forecast.forecast_drop_pct || 0}% change`}
          </h2>
          <p className="text-slate-600 max-w-2xl text-sm leading-relaxed mb-6">
            {forecast.summary}
          </p>

          <Button
            onClick={() => setIsAnalysisModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs touch-target"
          >
            Read Full Analysis <ArrowRight size={14} className="ml-1.5" />
          </Button>

          {/* Full Analysis Modal */}
          <Modal
            isOpen={isAnalysisModalOpen}
            onClose={() => setIsAnalysisModalOpen(false)}
            title="Arvion AI — Regional Supply Analysis"
            size="lg"
          >
            <div className="space-y-4 text-slate-700 text-sm">
              <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-100">
                <p className="font-bold text-blue-900 text-base">{forecast.title}</p>
                <p className="text-xs text-blue-700 mt-1">{forecast.summary}</p>
              </div>

              {forecast.recommendations && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Mitigation Recommendations</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    {Array.isArray(forecast.recommendations) ? (
                      forecast.recommendations.map((rec, i) => <li key={i}>{rec}</li>)
                    ) : (
                      <li>{forecast.recommendations}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </Modal>
        </div>
      ) : (
        <EmptyState
          icon={BrainCircuit}
          title="No Live AI Forecast Data Available"
          description="Real-time regional milk volume forecasts require live collection telemetry from your connected routes. Connect additional farmer routes to generate automated yield predictions."
          action={{
            label: 'Refresh Forecast',
            onClick: refetch,
            icon: RefreshCw,
            variant: 'outline',
          }}
          className="bg-white border-slate-200"
        />
      )}

      {/* Past Intelligence Bulletins */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">
          Market Intelligence Bulletins
        </h3>
        {bulletins.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bulletins.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBulletin && setSelectedBulletin(b)}
                className="bg-white border border-slate-200 p-5 rounded-2xl shadow-card hover:shadow-card-hover hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{b.date}</span>
                </div>
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {b.category}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-700 transition-colors">
                  {b.title}
                </h4>
                <p className="text-slate-500 text-xs font-medium line-clamp-2">{b.summary}</p>
                <div className="mt-3 text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read breakdown <ChevronRight size={13} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Published Bulletins"
            description="Official county market advisories and industry price notices will appear here once published."
            className="bg-white"
          />
        )}
      </div>
    </div>
  );
};

export default AggregatorIntelligenceTab;
