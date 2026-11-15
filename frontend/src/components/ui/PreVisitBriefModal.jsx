import React from 'react';
import { usePreVisitBrief } from '../../hooks/useAI';
import { Modal } from './Modal';
import { Skeleton, SkeletonCard } from './Skeleton';
import { ErrorState } from './ErrorState';
import { Sparkles, FileText, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

export const PreVisitBriefModal = ({ isOpen, onClose, visit }) => {
  const { data: brief, isLoading, isError, refetch } = usePreVisitBrief(visit?.id);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pre-Visit Clinical Brief: ${visit?.farm || 'Farm Consultation'}`}
      size="lg"
    >
      <div className="space-y-4 text-xs sm:text-sm text-slate-700">
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-xl">
          <Sparkles size={16} className="text-blue-600 shrink-0" />
          <div>
            <span className="font-bold block text-xs">Arvion AI Clinical Herd Summary</span>
            <span className="text-[11px] text-blue-700">Automated pre-visit brief aggregated from farmer milk yields & health telemetry</span>
          </div>
        </div>

        {isLoading ? (
          <SkeletonCard className="p-6" />
        ) : isError ? (
          <ErrorState
            title="Could not generate clinical brief"
            message="Server was unable to compile herd telemetry for this client farm."
            onRetry={refetch}
          />
        ) : brief ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Scheduled Visit Type</span>
                <p className="font-bold text-slate-900 text-sm">{visit?.type || 'Routine Clinical Assessment'}</p>
                <p className="text-xs text-slate-600">{visit?.notes || 'No custom clinician notes provided.'}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Herd Risk Snapshot</span>
                <p className="font-bold text-slate-900 text-sm">
                  {brief.at_risk_count ? `${brief.at_risk_count} animals flagged for attention` : 'Herd in stable parameters'}
                </p>
                <p className="text-xs text-slate-600">7-Day Milk Average: {brief.recent_milk_average_litres || 'Normal'} L/day</p>
              </div>
            </div>

            {brief.clinical_focus_points && (
              <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <Activity size={15} className="text-teal-600" /> Key Clinical Focus Points
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                  {Array.isArray(brief.clinical_focus_points) ? (
                    brief.clinical_focus_points.map((pt, i) => <li key={i}>{pt}</li>)
                  ) : (
                    <li>{brief.clinical_focus_points}</li>
                  )}
                </ul>
              </div>
            )}

            {brief.diagnostic_recommendations && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-1.5 text-amber-950">
                <h4 className="font-bold text-xs flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-600" /> Recommended Diagnostics & Equipment to Pack
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed">{brief.diagnostic_recommendations}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs">
            No clinical brief data returned for this visit.
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 touch-target"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PreVisitBriefModal;
