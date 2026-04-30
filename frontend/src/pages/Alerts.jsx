import React, { useMemo, useState } from 'react';
import { Bell, CalendarClock, CheckCircle2, Plus } from 'lucide-react';
import { useAnimals } from '../hooks/useAnimals';
import { useAlerts, useCreateAlert, useMarkAlertRead } from '../hooks/useAlerts';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';

const alertTypes = [
  ['VACCINATION_DUE', 'Vaccination Due'],
  ['BREEDING_DUE', 'Breeding Due'],
  ['HEALTH_CHECKUP', 'Health Checkup'],
  ['LOW_YIELD_WARNING', 'Low Yield Warning'],
  ['AI_DISEASE_RISK', 'AI Disease Risk'],
  ['SUBSCRIPTION_EXPIRING', 'Subscription Expiring'],
  ['CUSTOM', 'Custom'],
];

const channels = [
  ['SMS', 'SMS'],
  ['EMAIL', 'Email'],
  ['PUSH', 'Push Notification'],
  ['ALL', 'All Channels'],
];

const Alerts = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const [form, setForm] = useState({
    alert_type: 'CUSTOM',
    animal: '',
    scheduled_at: now.toISOString().slice(0, 16),
    channel: 'SMS',
    message: '',
  });
  const [showReminderModal, setShowReminderModal] = useState(false);
  const { data: animals = [] } = useAnimals();
  const { data: alerts = [], isLoading } = useAlerts();
  const createAlert = useCreateAlert();
  const markRead = useMarkAlertRead();
  const { addToast } = useToast();

  const unreadCount = useMemo(() => alerts.filter(alert => !alert.read).length, [alerts]);

  const handleSubmit = (event) => {
    event.preventDefault();
    createAlert.mutate({
      alert_type: form.alert_type,
      animal: form.animal || null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      channel: form.channel,
      message: form.message,
      is_active: true,
    }, {
      onSuccess: () => {
        setForm(prev => ({ ...prev, message: '', animal: '' }));
        setShowReminderModal(false);
        addToast('Alert scheduled.', 'success');
      },
      onError: () => addToast('Could not schedule alert.', 'error'),
    });
  };

  if (isLoading) return <div className="p-8 text-gray-600 dark:text-slate-300">Loading alerts...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-100">Dairy Alerts</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Heat cycles, calf vaccines, low yield warnings, milk prices, and care reminders.</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Unread</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{unreadCount}</p>
          </div>
          <button onClick={() => setShowReminderModal(true)} className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-700 text-white shadow-sm hover:bg-emerald-800" aria-label="Create reminder">
            <Plus size={26} />
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          ['Heat Cycle', 'Track breeding signs and follow-up windows.'],
          ['Calf Vaccine', 'Schedule calf vaccine and deworming reminders.'],
          ['Milk Price', 'Remember buyer price checks or county alerts.'],
        ].map(([title, text]) => (
          <button key={title} onClick={() => setShowReminderModal(true)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-emerald-500/10">
            <Bell className="mb-4 text-emerald-700 dark:text-emerald-300" size={24} />
            <p className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">{title}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
          </button>
        ))}
      </section>

      <section>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-slate-800">
            <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-gray-900 dark:text-slate-100"><CalendarClock size={20} /> Alert Queue</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {alerts.length ? alerts.map(alert => (
              <div key={alert.id} className="p-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge status={alert.read ? 'Active' : 'Pending'}>{alert.read ? 'Read' : 'Unread'}</Badge>
                    <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{alert.alert_type.replaceAll('_', ' ')}</span>
                  </div>
                  <span className="text-sm text-gray-500">{alert.scheduled_at ? new Date(alert.scheduled_at).toLocaleString() : 'No schedule'}</span>
                </div>
                <p className="text-sm leading-6 text-gray-700 dark:text-slate-300">{alert.message}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                  <span>{alert.animal_name || 'Farm-wide'} • {alert.channel}</span>
                  {!alert.read && (
                    <button onClick={() => markRead.mutate(alert.id)} className="inline-flex items-center gap-1 font-semibold text-forest-green dark:text-emerald-300">
                      <CheckCircle2 size={14} /> Mark read
                    </button>
                  )}
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-500">No alerts scheduled yet.</div>
            )}
          </div>
        </div>
      </section>

      <Modal isOpen={showReminderModal} onClose={() => setShowReminderModal(false)} title="Create Dairy Reminder">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Alert Type
              <select value={form.alert_type} onChange={event => setForm({ ...form, alert_type: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                {alertTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Animal
              <select value={form.animal} onChange={event => setForm({ ...form, animal: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                <option value="">Farm-wide</option>
                {animals.map(animal => <option key={animal.id} value={animal.id}>{animal.name} ({animal.ear_tag})</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Date and Time
              <input required type="datetime-local" value={form.scheduled_at} onChange={event => setForm({ ...form, scheduled_at: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Channel
              <select value={form.channel} onChange={event => setForm({ ...form, channel: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                {channels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Message
            <textarea required rows="4" value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} placeholder="Example: Check Bessie after evening milking and record temperature." className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          </label>
          <Button type="submit" disabled={createAlert.isPending} className="mt-5 w-full">
            <Bell size={18} className="mr-2" /> {createAlert.isPending ? 'Scheduling...' : 'Schedule Alert'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default Alerts;
