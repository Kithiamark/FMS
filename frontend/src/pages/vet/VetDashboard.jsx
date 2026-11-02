import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { VetLayout } from '../../components/Layout/VetLayout';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton, SkeletonStatGrid } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { getTimeAwareGreetingKey } from '../../utils/greeting';
import {
  Building2,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Clock,
  Users,
  ShieldAlert,
  ArrowRight,
  Bell,
  CheckCircle2,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { VetDosageCalculatorModal } from '../../components/ui/VetDosageCalculatorModal';
import { PreVisitBriefModal } from '../../components/ui/PreVisitBriefModal';

const fetchVetDashboard = async () => {
  const { data } = await api.get('/vet/data/dashboard/');
  return data;
};

export const VetDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dosageCalcOpen, setDosageCalcOpen] = React.useState(false);
  const [selectedBriefVisit, setSelectedBriefVisit] = React.useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['vetDashboard'],
    queryFn: fetchVetDashboard,
  });

  const isVerified = user?.is_verified ?? user?.vet_profile?.is_verified ?? false;
  const kvbRegNo = user?.vet_profile?.kvb_reg_no || user?.vet_profile?.license_number || '';
  const indemnityProvider = user?.vet_profile?.indemnity_provider || user?.vet_profile?.insurance_policy || '';
  const hasIndemnity = Boolean(user?.vet_profile?.indemnity_agreed || indemnityProvider);
  const isProfileIncomplete = !kvbRegNo || !hasIndemnity;

  const greetingKey = getTimeAwareGreetingKey();
  const greetingText = `${t(greetingKey, 'Good morning')}, ${t('doctor', 'Doctor')}`;
  const currentDateFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading) {
    return (
      <VetLayout>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <SkeletonStatGrid count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-72 lg:col-span-2 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        </div>
      </VetLayout>
    );
  }

  if (isError) {
    return (
      <VetLayout>
        <ErrorState
          title={t('error_loading', 'Failed to load veterinary dashboard')}
          message="Could not load your live clinical data from the server. Please check your connection and retry."
          onRetry={refetch}
          retryLabel={t('try_again', 'Retry')}
        />
      </VetLayout>
    );
  }

  return (
    <VetLayout>
      <div className="space-y-6">
        {/* Practitioner Credentials Banner */}
        {isProfileIncomplete ? (
          <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-700 mt-0.5 shrink-0">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-sm sm:text-base">
                  {t('profile_incomplete', 'Complete Your Clinical Profile')}
                </h4>
                <p className="text-xs text-amber-800/90 mt-1 max-w-2xl leading-relaxed">
                  {t('kvb_license_prompt', 'Please enter your KVB registration number and indemnity insurance in profile settings to receive farmer consults.')}
                </p>
              </div>
            </div>
            <Link
              to="/vet/profile"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2.5 text-xs font-bold text-white transition shadow-xs touch-target"
            >
              <span>{t('complete_profile', 'Complete Profile')}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-white p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-teal-600/10 flex items-center justify-center text-vet-teal shrink-0">
                <ShieldCheck size={26} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    KVB Registered Veterinary Surgeon
                  </h3>
                  <Badge status={isVerified ? 'Verified' : 'Pending'} />
                </div>
                <p className="text-xs text-slate-600 mt-1 truncate">
                  License: <span className="font-semibold text-slate-900 font-mono">{kvbRegNo}</span>
                  {indemnityProvider && (
                    <>
                      {' '}• Professional Indemnity: <span className="text-emerald-700 font-semibold">{indemnityProvider}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/vet/profile"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition shadow-xs touch-target"
              >
                <span>{t('profile', 'Credentials & Rates')}</span>
              </Link>
            </div>
          </div>
        )}

        {/* Page Header with Time-Aware Greeting */}
        <PageHeader
          title={greetingText}
          subtitle={currentDateFormatted}
          actions={
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setDosageCalcOpen(true)}
                variant="outline" 
                className="text-xs font-bold border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 touch-target flex items-center gap-1.5"
              >
                <Calculator size={15} className="text-teal-600" />
                <span>Drug Dosage Calc</span>
              </Button>
              <Link to="/vet/visits">
                <Button variant="outline" className="text-xs font-bold touch-target">
                  <Calendar size={16} className="mr-1.5 text-vet-teal" />
                  {t('visits', 'Clinical Visits')}
                </Button>
              </Link>
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('active_farms', 'Active Farms')}
            value={data?.active_farms ?? 0}
            icon={Building2}
            accent="vet"
          />
          <StatCard
            title={t('at_risk_animals', 'At-Risk Animals')}
            value={data?.animals_at_risk?.length || 0}
            icon={AlertTriangle}
            accent="red"
          />
          <StatCard
            title={t('upcoming_visits', 'Upcoming Visits')}
            value={data?.upcoming_visits?.length || 0}
            icon={Calendar}
            accent="blue"
          />
          <StatCard
            title={t('unread_messages', 'Unread Messages')}
            value={data?.unread_messages ?? 0}
            icon={MessageSquare}
            accent="amber"
          />
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Columns (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* At-Risk Animals Section */}
            <div className="bg-white rounded-card shadow-card border border-surface-border overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-border flex justify-between items-center bg-surface-muted">
                <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base">
                  {t('at_risk_animals', 'At-Risk Animals')}
                </h3>
                <Link to="/vet/records">
                  <Button variant="ghost" size="sm" className="text-vet-teal font-semibold text-xs touch-target">
                    {t('view_all', 'View All')}
                  </Button>
                </Link>
              </div>

              <div className="divide-y divide-surface-border">
                {(!data?.animals_at_risk || data.animals_at_risk.length === 0) ? (
                  <EmptyState
                    title="No At-Risk Animals Detected"
                    description="All animals under your care currently report normal temperatures and somatic cell parameters."
                    className="border-0 bg-transparent py-8"
                  />
                ) : (
                  data.animals_at_risk.map((animal, i) => (
                    <div key={animal.id || i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-700 font-bold shrink-0">
                          {animal.name?.charAt(0) || 'A'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">{animal.name}</p>
                          <p className="text-xs text-slate-500 truncate">{animal.farm_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge status={animal.risk_level || 'High'} />
                        <Link to={`/vet/records`}>
                          <Button variant="ghost" size="sm" className="text-vet-teal text-xs font-semibold">
                            Review
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Health Records */}
            <div className="bg-white rounded-card shadow-card border border-surface-border overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-border flex justify-between items-center bg-surface-muted">
                <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base">
                  {t('records', 'Recent Health Records')}
                </h3>
                <Link to="/vet/records">
                  <Button variant="ghost" size="sm" className="text-vet-teal font-semibold text-xs touch-target">
                    {t('view_all', 'View All')}
                  </Button>
                </Link>
              </div>

              <div className="divide-y divide-surface-border">
                {(!data?.recent_health_records || data.recent_health_records.length === 0) ? (
                  <EmptyState
                    title="No Recent Clinical Records"
                    description="Recent diagnoses and treatment logs will appear here as they are entered."
                    className="border-0 bg-transparent py-8"
                  />
                ) : (
                  data.recent_health_records.map((record, i) => (
                    <div key={record.id || i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{record.animal}</p>
                        <p className="text-xs text-slate-500 truncate">{record.diagnosis}</p>
                      </div>
                      <span className="text-xs font-medium text-slate-400 shrink-0 ml-3">{record.date}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column / Schedule & Alerts */}
          <div className="space-y-6">
            {/* Upcoming Schedule */}
            <div className="bg-white rounded-card shadow-card border border-surface-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base">
                  {t('upcoming_visits', 'Upcoming Visits')}
                </h3>
                <Calendar size={18} className="text-vet-teal" />
              </div>

              <div className="space-y-3">
                {(!data?.upcoming_visits || data.upcoming_visits.length === 0) ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No upcoming visits scheduled.</p>
                ) : (
                  data.upcoming_visits.map((visit, i) => (
                    <div key={visit.id || i} className="flex gap-3 items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex gap-2.5 items-start min-w-0">
                        <Clock size={16} className="text-vet-teal mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-slate-900 truncate">{visit.farm}</p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(visit.date).toLocaleDateString()} • {visit.type}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedBriefVisit(visit)}
                        className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold shrink-0 transition flex items-center gap-1 touch-target"
                        title="Generate AI Pre-visit brief"
                      >
                        <Sparkles size={11} className="text-blue-600" />
                        <span>Brief</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <Link to="/vet/visits">
                <Button className="w-full mt-4 bg-vet-navy hover:bg-vet-navy-light text-white text-xs font-bold touch-target">
                  Open Visit Calendar
                </Button>
              </Link>
            </div>

            {/* Active County Outbreak Alerts Card */}
            <div className="rounded-card border border-red-200 bg-red-50/50 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="text-red-600 animate-pulse" size={18} />
                  <h3 className="font-heading font-bold text-red-950 text-xs sm:text-sm">
                    County Outbreak Alerts
                  </h3>
                </div>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  Active Notice
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="rounded-xl bg-white p-3 border border-red-100 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-slate-900">Foot & Mouth Disease (FMD)</p>
                    <Badge status="High" className="text-[10px] py-0 px-1.5" />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Uasin Gishu corridor. Ring vaccination and quarantine protocols in effect.
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-amber-100 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-slate-900">East Coast Fever (ECF)</p>
                    <Badge status="Medium" className="text-[10px] py-0 px-1.5" />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Nandi County. Intensified acaricide dipping recommended.
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Connections */}
            {data?.pending_connections > 0 && (
              <div className="rounded-card border border-amber-200 bg-amber-50/60 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="text-amber-700" size={18} />
                  <h3 className="font-heading font-bold text-amber-950 text-sm">
                    Pending Farmer Requests
                  </h3>
                </div>
                <p className="text-xs text-amber-800 mb-3">
                  You have {data.pending_connections} farm connection request{data.pending_connections === 1 ? '' : 's'}.
                </p>
                <Link to="/vet/connections">
                  <Button variant="outline" className="w-full bg-white border-amber-300 text-amber-900 text-xs font-bold touch-target">
                    Manage Requests
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* AI Vet Modals */}
        <VetDosageCalculatorModal
          isOpen={dosageCalcOpen}
          onClose={() => setDosageCalcOpen(false)}
        />

        <PreVisitBriefModal
          isOpen={!!selectedBriefVisit}
          onClose={() => setSelectedBriefVisit(null)}
          visit={selectedBriefVisit}
        />
      </div>
    </VetLayout>
  );
};

export default VetDashboard;
