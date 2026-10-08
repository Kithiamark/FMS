import React, { useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Plus, Save, Settings as SettingsIcon, ShieldCheck, UserRound, Edit2, Trash2, Send, Lock, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFarms, useUpdateFarm, useUpdateProfile } from '../hooks/useFarm';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useCheckoutSubscription, useSubscription } from '../hooks/useSubscription';
import { useCreateWorker, useWorkers, useUpdateWorker, useDeleteWorker } from '../hooks/useWorkers';
import { Modal } from '../components/ui/Modal';
import api from '../api/axios';

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const { data: farms = [], isLoading } = useFarms();
  const updateFarm = useUpdateFarm();
  const updateProfile = useUpdateProfile();
  const { data: subscriptionData } = useSubscription();
  const checkout = useCheckoutSubscription();
  const { data: workers = [] } = useWorkers();
  const createWorker = useCreateWorker();
  const updateWorker = useUpdateWorker();
  const deleteWorker = useDeleteWorker();

  const { addToast } = useToast();
  const farm = farms[0] || user?.farm;
  const isSuperAdmin = user?.is_superuser || user?.role === 'ADMIN';
  const isWorker = user?.role === 'FARM_WORKER';

  const [supportTicketForm, setSupportTicketForm] = useState({ subject: 'Request for Account Details Update', description: '' });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const [profileDraft, setProfileDraft] = useState(null);
  const [farmDraft, setFarmDraft] = useState(null);
  const [workerForm, setWorkerForm] = useState({ 
    full_name: '', 
    phone_number: '+254', 
    email: '', 
    password: '', 
    accessible_modules: [],
    national_id: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    worker_specialty: 'General Herdsman',
    indemnity_agreed: true
  });
  const [editingWorkerId, setEditingWorkerId] = useState(null);

  const availableModules = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'dairy', label: 'Dairy Records' },
    { id: 'finance', label: 'Financials' },
    { id: 'animals', label: 'Herd/Animals' },
    { id: 'tasks', label: 'Tasks (Chores)' }
  ];

  const handleModuleToggle = (moduleId) => {
    setWorkerForm(prev => {
      const current = prev.accessible_modules || [];
      if (current.includes(moduleId)) {
        return { ...prev, accessible_modules: current.filter(id => id !== moduleId) };
      } else {
        return { ...prev, accessible_modules: [...current, moduleId] };
      }
    });
  };

  const [activeModal, setActiveModal] = useState(null);

  const profile = useMemo(() => profileDraft || {
    full_name: user?.full_name || '',
    email: user?.email || '',
    national_id: user?.national_id || '',
    alt_phone: user?.alt_phone || '',
    indemnity_agreed: user?.indemnity_agreed || false,
    indemnity_agreed_at: user?.indemnity_agreed_at || null,
  }, [profileDraft, user]);

  const farmForm = useMemo(() => farmDraft || {
    name: farm?.name || '',
    location: farm?.location || '',
    county: farm?.county || '',
    sub_county: farm?.sub_county || '',
    size_acres: farm?.size_acres || '',
    primary_breed: farm?.primary_breed || 'Friesian',
    kdb_license: farm?.kdb_license || '',
    estimated_herd_size: farm?.estimated_herd_size || 5,
  }, [farmDraft, farm]);

  const submitProfileSupportRequest = async (event) => {
    event.preventDefault();
    if (!supportTicketForm.description.trim()) {
      addToast('Please describe the changes you need updated.', 'error');
      return;
    }
    setSubmittingTicket(true);
    try {
      await api.post('/admin/tickets/', {
        category: 'ACCOUNT',
        subject: supportTicketForm.subject,
        description: supportTicketForm.description,
        priority: 'MEDIUM',
      });
      addToast('Support request sent. A platform admin will review and apply your changes.', 'success');
      setSupportTicketForm({ subject: 'Request for Account Details Update', description: '' });
      setActiveModal(null);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to submit support request.', 'error');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const saveProfile = (event) => {
    event.preventDefault();
    updateProfile.mutate(profile, {
      onSuccess: async () => {
        await refreshUser();
        setProfileDraft(null);
        setActiveModal(null);
        addToast('Profile updated.', 'success');
      },
      onError: (err) => addToast(err.response?.data?.detail || err.response?.data?.email?.[0] || err.response?.data?.full_name?.[0] || 'Could not update profile.', 'error'),
    });
  };

  const saveFarm = (event) => {
    event.preventDefault();
    if (isWorker) {
      addToast('Farm workers cannot modify farm profile details.', 'error');
      return;
    }
    if (!farm?.id) {
      addToast('Farm profile was not found.', 'error');
      return;
    }
    updateFarm.mutate({ id: farm.id, data: farmForm }, {
      onSuccess: async () => {
        await refreshUser();
        setFarmDraft(null);
        setActiveModal(null);
        addToast('Farm profile updated.', 'success');
      },
      onError: (err) => {
        const errorMsg = err.response?.data?.detail 
          || err.response?.data?.name?.[0]
          || err.response?.data?.size_acres?.[0]
          || err.response?.data?.estimated_herd_size?.[0]
          || 'Could not update farm profile.';
        addToast(errorMsg, 'error');
      },
    });
  };

  if (isLoading) return <div className="p-8 text-gray-600 dark:text-slate-300">Loading settings...</div>;
  const currentPlan = subscriptionData?.current?.plan || user?.farm?.subscription?.plan || 'Trial';
  const plans = subscriptionData?.plans || {};

  const upgradePlan = (plan) => {
    checkout.mutate({ plan, phone_number: user?.phone_number, test_mode: true }, {
      onSuccess: async (data) => {
        await refreshUser();
        addToast(data.message || 'Subscription updated.', 'success');
      },
      onError: () => addToast('Could not start checkout.', 'error'),
    });
  };

  const submitWorker = (event) => {
    event.preventDefault();
    if (editingWorkerId) {
      updateWorker.mutate({ id: editingWorkerId, ...workerForm }, {
        onSuccess: () => {
          setWorkerForm({ full_name: '', phone_number: '+254', email: '', password: '', accessible_modules: [] });
          setEditingWorkerId(null);
          setActiveModal(null);
          addToast('Worker account updated.', 'success');
        },
        onError: (err) => addToast(err.response?.data?.phone_number?.[0] || err.response?.data?.password?.[0] || err.response?.data?.detail || 'Could not update worker account.', 'error'),
      });
    } else {
      createWorker.mutate(workerForm, {
        onSuccess: (data) => {
          const tempPass = data?.temporary_password;
          setWorkerForm({ full_name: '', phone_number: '+254', email: '', password: '', accessible_modules: [] });
          setActiveModal(null);
          if (tempPass) {
            addToast(`Worker account created! Temporary password: ${tempPass}`, 'success');
          } else {
            addToast('Worker account created successfully.', 'success');
          }
        },
        onError: (err) => addToast(err.response?.data?.phone_number?.[0] || err.response?.data?.password?.[0] || err.response?.data?.detail || 'Could not create worker account.', 'error'),
      });
    }
  };

  const openEditWorker = (worker) => {
    setWorkerForm({ 
      full_name: worker.full_name, 
      phone_number: worker.phone_number, 
      email: worker.email || '', 
      password: '', 
      accessible_modules: worker.accessible_modules || [],
      national_id: worker.national_id || '',
      emergency_contact_name: worker.emergency_contact_name || '',
      emergency_contact_phone: worker.emergency_contact_phone || '',
      worker_specialty: worker.worker_specialty || 'General Herdsman',
      indemnity_agreed: worker.indemnity_agreed ?? true
    });
    setEditingWorkerId(worker.id);
    setActiveModal('worker');
  };

  const handleDeleteWorker = (id) => {
    if(window.confirm('Are you sure you want to delete this worker account?')) {
      deleteWorker.mutate(id, {
        onSuccess: () => addToast('Worker account deleted.', 'success'),
        onError: () => addToast('Could not delete worker.', 'error'),
      });
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Manage the account and farm details used across records, reports, and alerts.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['profile', UserRound, 'Account Details', 'Name, email, and verified phone.'],
          ['farm', SettingsIcon, 'Farm Profile', 'Farm name, location, county, and sub-county.'],
          ['membership', CreditCard, 'Membership', `Current plan: ${currentPlan}`],
        ].map(([key, icon, title, text]) => {
          const ActionIcon = icon;
          return (
            <button key={key} onClick={() => key === 'membership' ? document.getElementById('membership-section')?.scrollIntoView({ behavior: 'smooth' }) : setActiveModal(key)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-emerald-500/10">
              <ActionIcon className="mb-4 text-emerald-700 dark:text-emerald-300" size={24} />
              <p className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">{title}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
            </button>
          );
        })}
      </section>

      <section className="hidden">
        <form onSubmit={saveProfile} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold text-gray-900"><UserRound size={20} /> Account Details</h2>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Full Name
              <input required value={profile.full_name} onChange={event => setProfileDraft({ ...profile, full_name: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Email
              <input type="email" value={profile.email || ''} onChange={event => setProfileDraft({ ...profile, email: event.target.value })} placeholder="farmer@example.com" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
              <input value={user?.phone_number || ''} disabled className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500" />
            </label>
            <Button type="submit" disabled={updateProfile.isPending}><Save size={18} className="mr-2" /> Save Account</Button>
          </div>
        </form>

        <form onSubmit={saveFarm} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold text-gray-900"><SettingsIcon size={20} /> Farm Profile</h2>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Farm Name
              <input required value={farmForm.name} onChange={event => setFarmDraft({ ...farmForm, name: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Location
              <input value={farmForm.location} onChange={event => setFarmDraft({ ...farmForm, location: event.target.value })} placeholder="Village, road, or landmark" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                County
                <input value={farmForm.county} onChange={event => setFarmDraft({ ...farmForm, county: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Sub County
                <input value={farmForm.sub_county} onChange={event => setFarmDraft({ ...farmForm, sub_county: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </label>
            </div>
            <Button type="submit" disabled={updateFarm.isPending}><Save size={18} className="mr-2" /> Save Farm</Button>
          </div>
        </form>
      </section>

      <section id="membership-section" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-slate-950 dark:text-slate-100"><CreditCard size={20} /> Membership & Payments</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Test mode activates plans immediately while M-Pesa API keys are pending.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <ShieldCheck size={16} /> Current: {currentPlan}
          </span>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {Object.entries(plans).map(([plan, details]) => (
            <div key={plan} className={`rounded-2xl border p-4 ${currentPlan === plan ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'}`}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">{details.name}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-100">KES {details.price_kes}</p>
                </div>
                {currentPlan === plan && <CheckCircle2 className="text-emerald-700" size={22} />}
              </div>
              <ul className="mb-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {details.features?.slice(0, 4).map(feature => <li key={feature}>• {feature}</li>)}
              </ul>
              {plan !== 'Trial' && (
                <Button type="button" disabled={checkout.isPending || currentPlan === plan} onClick={() => upgradePlan(plan)} className="w-full">
                  {currentPlan === plan ? 'Active' : 'Test Checkout'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      <Modal isOpen={activeModal === 'profile'} onClose={() => setActiveModal(null)} title="Farmer Profile & Regulatory Details">
        {isSuperAdmin ? (
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
              <span className="font-bold">Super Admin Access:</span> You have permission to directly edit this account's details.
            </div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Full Name
              <input required value={profile.full_name} onChange={event => setProfileDraft({ ...profile, full_name: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950" />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                National ID / Passport Number
                <input value={profile.national_id || ''} onChange={event => setProfileDraft({ ...profile, national_id: event.target.value })} placeholder="e.g. 29384756" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950" />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                Alternative Phone Number
                <input value={profile.alt_phone || ''} onChange={event => setProfileDraft({ ...profile, alt_phone: event.target.value })} placeholder="+254..." className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950" />
              </label>
            </div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Email Address
              <input type="email" value={profile.email || ''} onChange={event => setProfileDraft({ ...profile, email: event.target.value })} placeholder="farmer@example.com" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950" />
            </label>
            
            {/* Indemnity Agreement Section */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="font-bold text-amber-900 dark:text-amber-200 mb-1">Agricultural Advisory & Operational Indemnity Agreement</p>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed mb-3">
                By using FMS, you acknowledge that all AI veterinary recommendations, lactation projections, financial calculations, and aggregator matching features are provided strictly as agricultural management aids. Decisions regarding clinical livestock treatments, culling, and commercial contracts remain the sole responsibility of the farm operator. FMS and its affiliates assume no liability for livestock mortality, milk yield fluctuations, or third-party payment defaults.
              </p>
              <label className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-slate-100 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={!!profile.indemnity_agreed} 
                  onChange={event => setProfileDraft({ ...profile, indemnity_agreed: event.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" 
                />
                <span>I have read, understood, and accept the Farm Management & Advisory Indemnity Agreement</span>
              </label>
              {profile.indemnity_agreed_at && (
                <p className="mt-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  ✓ Accepted on {new Date(profile.indemnity_agreed_at).toLocaleDateString()}
                </p>
              )}
            </div>

            <Button type="submit" disabled={updateProfile.isPending} className="w-full bg-emerald-600 text-white"><Save size={18} className="mr-2" /> Save Account & Indemnity</Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 flex items-start gap-3">
              <Lock className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">Super Admin Protected</p>
                <p className="leading-relaxed">Account identity, registered phone, and regulatory data can only be modified by platform Super Administrators. To request a change to your name, phone, or email, submit an in-app request below.</p>
              </div>
            </div>

            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Full Name</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{profile.full_name || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Phone Number</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{user?.phone_number || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Email Address</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{profile.email || 'None'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">National ID / Passport</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{profile.national_id || 'Not set'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Alt Phone</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{profile.alt_phone || 'None'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Indemnity Agreement</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${profile.indemnity_agreed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'}`}>
                  {profile.indemnity_agreed ? 'Accepted' : 'Pending'}
                </span>
              </div>
            </div>

            <Button type="button" onClick={() => setActiveModal('request-change')} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800">
              <MessageSquare size={16} /> Request Changes via Support
            </Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={activeModal === 'request-change'} onClose={() => setActiveModal(null)} title="Request Account Profile Change">
        <form onSubmit={submitProfileSupportRequest} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit a support ticket to platform administrators detailing the corrections needed for your verified account.
          </p>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Subject
            <input 
              required 
              value={supportTicketForm.subject} 
              onChange={e => setSupportTicketForm({ ...supportTicketForm, subject: e.target.value })} 
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" 
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Requested Changes & Rationale
            <textarea 
              required 
              rows={4}
              value={supportTicketForm.description} 
              onChange={e => setSupportTicketForm({ ...supportTicketForm, description: e.target.value })} 
              placeholder="e.g. Please update my registered email to newfarmer@example.com and correct the spelling of my full name..." 
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" 
            />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setActiveModal('profile')}>Cancel</Button>
            <Button type="submit" disabled={submittingTicket} className="flex items-center gap-2 bg-emerald-600 text-white">
              <Send size={16} /> {submittingTicket ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'farm'} onClose={() => setActiveModal(null)} title={isWorker ? "Assigned Farm Profile" : "Edit Farm & Facility Profile"}>
        <form onSubmit={saveFarm} className="space-y-4">
          {isWorker && (
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200">
              <span className="font-bold">Assigned Farm Profile (Read-Only):</span> Farm facility and regulatory details are managed by the Farm Owner.
            </div>
          )}
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Farm Name
            <input required disabled={isWorker} value={farmForm.name} onChange={event => setFarmDraft({ ...farmForm, name: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-950 dark:disabled:bg-slate-900 dark:disabled:text-slate-400" />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Farm Size (Acres)
              <input type="number" step="0.5" disabled={isWorker} value={farmForm.size_acres || ''} onChange={event => setFarmDraft({ ...farmForm, size_acres: event.target.value })} placeholder="e.g. 5.5" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-950 dark:disabled:bg-slate-900 dark:disabled:text-slate-400" />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Primary Dairy Breed
              <select disabled={isWorker} value={farmForm.primary_breed || 'Friesian'} onChange={event => setFarmDraft({ ...farmForm, primary_breed: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-950 dark:disabled:bg-slate-900 dark:disabled:text-slate-400">
                <option value="Friesian">Friesian / Holstein</option>
                <option value="Ayrshire">Ayrshire</option>
                <option value="Jersey">Jersey</option>
                <option value="Guernsey">Guernsey</option>
                <option value="Crossbreed">Crossbreed / Mixed</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Kenya Dairy Board (KDB) License No.
              <input disabled={isWorker} value={farmForm.kdb_license || ''} onChange={event => setFarmDraft({ ...farmForm, kdb_license: event.target.value })} placeholder="KDB-XXXXX" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-950 dark:disabled:bg-slate-900 dark:disabled:text-slate-400" />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Estimated Total Herd Size
              <input type="number" disabled={isWorker} value={farmForm.estimated_herd_size || ''} onChange={event => setFarmDraft({ ...farmForm, estimated_herd_size: event.target.value })} placeholder="e.g. 15" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-950 dark:disabled:bg-slate-900 dark:disabled:text-slate-400" />
            </label>
          </div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Physical Location / Landmarks
            <input disabled={isWorker} value={farmForm.location} onChange={event => setFarmDraft({ ...farmForm, location: event.target.value })} placeholder="Village, road, or landmark" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-950 dark:disabled:bg-slate-900 dark:disabled:text-slate-400" />
          </label>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              County
              <input disabled={isWorker} value={farmForm.county} onChange={event => setFarmDraft({ ...farmForm, county: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-950 dark:disabled:bg-slate-900 dark:disabled:text-slate-400" />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Sub County
              <input disabled={isWorker} value={farmForm.sub_county} onChange={event => setFarmDraft({ ...farmForm, sub_county: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-950 dark:disabled:bg-slate-900 dark:disabled:text-slate-400" />
            </label>
          </div>
          {!isWorker && (
            <Button type="submit" disabled={updateFarm.isPending} className="w-full bg-emerald-600 text-white">
              <Save size={18} className="mr-2" /> Save Farm Profile
            </Button>
          )}
        </form>
      </Modal>

      {currentPlan === 'Enterprise' && (
        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <button type="button" onClick={() => setActiveModal('worker')} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-emerald-500/10">
            <Plus className="mb-4 text-emerald-700 dark:text-emerald-300" size={26} />
            <h2 className="font-heading text-xl font-bold text-slate-950 dark:text-slate-100">Enterprise Worker Account</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Create worker logins from a modal so the admin area stays clean and scannable.</p>
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 font-heading text-xl font-bold text-slate-950 dark:text-slate-100">Worker Activity Access</h2>
            <div className="space-y-3">
              {workers.length ? workers.map(worker => (
                <div key={worker.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950 gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{worker.full_name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{worker.phone_number}</p>
                    {worker.accessible_modules?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {worker.accessible_modules.map(mod => (
                          <span key={mod} className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold dark:bg-emerald-900 dark:text-emerald-300">{mod}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${worker.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {worker.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => openEditWorker(worker)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDeleteWorker(worker.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  No worker accounts yet. Create one so activities can be logged separately from the head farmer.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <Modal isOpen={activeModal === 'worker'} onClose={() => {setActiveModal(null); setEditingWorkerId(null);}} title={editingWorkerId ? "Edit Worker Account" : "Create Worker Account"}>
        <form onSubmit={submitWorker} className="space-y-4">
          <input required value={workerForm.full_name} onChange={event => setWorkerForm({ ...workerForm, full_name: event.target.value })} placeholder="Worker full name" className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input required value={workerForm.phone_number} onChange={event => setWorkerForm({ ...workerForm, phone_number: event.target.value })} placeholder="+254..." className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
            <input value={workerForm.national_id || ''} onChange={event => setWorkerForm({ ...workerForm, national_id: event.target.value })} placeholder="National ID / Passport" className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={workerForm.emergency_contact_name || ''} onChange={event => setWorkerForm({ ...workerForm, emergency_contact_name: event.target.value })} placeholder="Emergency Contact Name" className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
            <input value={workerForm.emergency_contact_phone || ''} onChange={event => setWorkerForm({ ...workerForm, emergency_contact_phone: event.target.value })} placeholder="Emergency Contact Phone" className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          </div>
          <input value={workerForm.worker_specialty || ''} onChange={event => setWorkerForm({ ...workerForm, worker_specialty: event.target.value })} placeholder="Role / Specialty (e.g. Milking Specialist, Herdsman)" className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          <input type="email" value={workerForm.email} onChange={event => setWorkerForm({ ...workerForm, email: event.target.value })} placeholder="worker@example.com (optional)" className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Accessible Modules</label>
            <div className="grid grid-cols-2 gap-2">
              {availableModules.map(mod => (
                <label key={mod.id} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input 
                    type="checkbox" 
                    checked={(workerForm.accessible_modules || []).includes(mod.id)}
                    onChange={() => handleModuleToggle(mod.id)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {mod.label}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <input 
              value={workerForm.password} 
              onChange={event => setWorkerForm({ ...workerForm, password: event.target.value })} 
              placeholder={editingWorkerId ? "Leave blank to keep current password" : "Password (min 8 chars, or leave blank to auto-generate)"} 
              className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" 
            />
            {!editingWorkerId && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Leave blank to automatically generate a secure temporary password.
              </p>
            )}
          </div>
          <Button type="submit" disabled={createWorker.isPending || updateWorker.isPending} className="w-full">{editingWorkerId ? 'Update Worker' : 'Create Worker'}</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
