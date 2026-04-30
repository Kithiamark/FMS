import React, { useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Plus, Save, Settings as SettingsIcon, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFarms, useUpdateFarm, useUpdateProfile } from '../hooks/useFarm';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useCheckoutSubscription, useSubscription } from '../hooks/useSubscription';
import { useCreateWorker, useWorkers } from '../hooks/useWorkers';
import { Modal } from '../components/ui/Modal';

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const { data: farms = [], isLoading } = useFarms();
  const updateFarm = useUpdateFarm();
  const updateProfile = useUpdateProfile();
  const { data: subscriptionData } = useSubscription();
  const checkout = useCheckoutSubscription();
  const { data: workers = [] } = useWorkers();
  const createWorker = useCreateWorker();
  const { addToast } = useToast();
  const farm = farms[0] || user?.farm;

  const [profileDraft, setProfileDraft] = useState(null);
  const [farmDraft, setFarmDraft] = useState(null);
  const [workerForm, setWorkerForm] = useState({ full_name: '', phone_number: '+254', email: '', password: 'ChangeMe123' });
  const [activeModal, setActiveModal] = useState(null);

  const profile = useMemo(() => profileDraft || {
    full_name: user?.full_name || '',
    email: user?.email || '',
  }, [profileDraft, user]);

  const farmForm = useMemo(() => farmDraft || {
    name: farm?.name || '',
    location: farm?.location || '',
    county: farm?.county || '',
    sub_county: farm?.sub_county || '',
  }, [farmDraft, farm]);

  const saveProfile = (event) => {
    event.preventDefault();
    updateProfile.mutate(profile, {
      onSuccess: async () => {
        await refreshUser();
        setProfileDraft(null);
        setActiveModal(null);
        addToast('Profile updated.', 'success');
      },
      onError: () => addToast('Could not update profile.', 'error'),
    });
  };

  const saveFarm = (event) => {
    event.preventDefault();
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
      onError: () => addToast('Could not update farm profile.', 'error'),
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

  const addWorker = (event) => {
    event.preventDefault();
    createWorker.mutate(workerForm, {
      onSuccess: () => {
        setWorkerForm({ full_name: '', phone_number: '+254', email: '', password: 'ChangeMe123' });
        setActiveModal(null);
        addToast('Worker account created.', 'success');
      },
      onError: () => addToast('Could not create worker account.', 'error'),
    });
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

      <Modal isOpen={activeModal === 'profile'} onClose={() => setActiveModal(null)} title="Edit Account Details">
        <form onSubmit={saveProfile} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Full Name
            <input required value={profile.full_name} onChange={event => setProfileDraft({ ...profile, full_name: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950" />
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Email
            <input type="email" value={profile.email || ''} onChange={event => setProfileDraft({ ...profile, email: event.target.value })} placeholder="farmer@example.com" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950" />
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Phone Number
            <input value={user?.phone_number || ''} disabled className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500 dark:border-slate-800 dark:bg-slate-950" />
          </label>
          <Button type="submit" disabled={updateProfile.isPending}><Save size={18} className="mr-2" /> Save Account</Button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'farm'} onClose={() => setActiveModal(null)} title="Edit Farm Profile">
        <form onSubmit={saveFarm} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Farm Name
            <input required value={farmForm.name} onChange={event => setFarmDraft({ ...farmForm, name: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950" />
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Location
            <input value={farmForm.location} onChange={event => setFarmDraft({ ...farmForm, location: event.target.value })} placeholder="Village, road, or landmark" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950" />
          </label>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              County
              <input value={farmForm.county} onChange={event => setFarmDraft({ ...farmForm, county: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950" />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Sub County
              <input value={farmForm.sub_county} onChange={event => setFarmDraft({ ...farmForm, sub_county: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950" />
            </label>
          </div>
          <Button type="submit" disabled={updateFarm.isPending}><Save size={18} className="mr-2" /> Save Farm</Button>
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
                <div key={worker.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{worker.full_name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{worker.phone_number}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${worker.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {worker.is_active ? 'Active' : 'Inactive'}
                  </span>
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

      <Modal isOpen={activeModal === 'worker'} onClose={() => setActiveModal(null)} title="Create Worker Account">
        <form onSubmit={addWorker} className="space-y-4">
          <input required value={workerForm.full_name} onChange={event => setWorkerForm({ ...workerForm, full_name: event.target.value })} placeholder="Worker full name" className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          <input required value={workerForm.phone_number} onChange={event => setWorkerForm({ ...workerForm, phone_number: event.target.value })} placeholder="+254..." className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          <input type="email" value={workerForm.email} onChange={event => setWorkerForm({ ...workerForm, email: event.target.value })} placeholder="worker@example.com" className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          <input required value={workerForm.password} onChange={event => setWorkerForm({ ...workerForm, password: event.target.value })} placeholder="Temporary password" className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          <Button type="submit" disabled={createWorker.isPending} className="w-full">Create Worker</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
