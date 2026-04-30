import React, { useMemo, useState } from 'react';
import { useCreateExpense, useCreateIncome, useFinanceSummary } from '../hooks/useFinance';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { ArrowDownRight, ArrowUpRight, Plus, WalletCards } from 'lucide-react';
import { Modal } from '../components/ui/Modal';

const formatMoney = (value) => `KES ${Number(value || 0).toLocaleString()}`;

const Finance = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [entryType, setEntryType] = useState('income');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [form, setForm] = useState({ amount_kes: '', date: new Date().toISOString().split('T')[0], description: '', source: 'MilkSale', category: 'Feed' });
  const { addToast } = useToast();
  const { data, isLoading } = useFinanceSummary(year, month);
  const createIncome = useCreateIncome();
  const createExpense = useCreateExpense();

  const netPositive = Number(data?.net_total || 0) >= 0;
  const transactions = useMemo(() => {
    const income = (data?.recent_income || []).map(item => ({ ...item, kind: 'Income', label: item.source, amount: item.amount_kes }));
    const expenses = (data?.recent_expenses || []).map(item => ({ ...item, kind: 'Expense', label: item.category, amount: -item.amount_kes }));
    return [...income, ...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12);
  }, [data]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      amount_kes: Number(form.amount_kes),
      date: form.date,
      description: form.description,
      ...(entryType === 'income' ? { source: form.source } : { category: form.category }),
    };
    const mutation = entryType === 'income' ? createIncome : createExpense;
    mutation.mutate(payload, {
      onSuccess: () => {
        setForm(prev => ({ ...prev, amount_kes: '', description: '' }));
        setShowTransactionModal(false);
        addToast(`${entryType === 'income' ? 'Income' : 'Expense'} recorded.`, 'success');
      },
      onError: () => addToast('Could not save the finance record.', 'error'),
    });
  };

  if (isLoading) return <div className="p-8 text-gray-600 dark:text-slate-300">Loading financials...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-100">Money</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Track farm income, expenses, and month-to-date cash position.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowTransactionModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-800">
            <Plus size={18} /> Add
          </button>
          <select value={year} onChange={event => setYear(Number(event.target.value))} className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            {[2024, 2025, 2026].map(option => <option key={option} value={option}>{option}</option>)}
          </select>
          <select value={month} onChange={event => setMonth(Number(event.target.value))} className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
          </select>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-gray-500 dark:text-slate-400">Income</p>
          <p className="mt-2 text-2xl font-bold text-green-700">{formatMoney(data?.income_total)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-gray-500 dark:text-slate-400">Expenses</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{formatMoney(data?.expense_total)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-gray-500 dark:text-slate-400">Net</p>
          <p className={`mt-2 flex items-center gap-2 text-2xl font-bold ${netPositive ? 'text-green-700' : 'text-red-600'}`}>
            {netPositive ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
            {formatMoney(data?.net_total)}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          ['income', 'Record Milk Income', 'Milk sale, animal sale, or other farm income.'],
          ['expense', 'Record Expense', 'Feed, vet, labor, utilities, equipment, or other costs.'],
        ].map(([type, title, text]) => (
          <button key={type} onClick={() => { setEntryType(type); setShowTransactionModal(true); }} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-emerald-500/10">
            <Plus className="mb-4 text-emerald-700 dark:text-emerald-300" size={24} />
            <p className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">{title}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
          </button>
        ))}
      </section>

      <section>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-slate-800">
            <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-gray-900 dark:text-slate-100"><WalletCards size={20} /> Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[680px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {transactions.length ? transactions.map(item => (
                  <tr key={`${item.kind}-${item.id}`} className="text-gray-800 dark:text-slate-200">
                    <td className="px-4 py-3">{item.date}</td>
                    <td className="px-4 py-3">{item.kind}</td>
                    <td className="px-4 py-3">{item.label}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{item.description || '-'}</td>
                    <td className={`px-4 py-3 text-right font-bold ${item.amount >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatMoney(Math.abs(item.amount))}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">No finance records for this month yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Modal isOpen={showTransactionModal} onClose={() => setShowTransactionModal(false)} title="Record Transaction">
        <form onSubmit={handleSubmit}>
          <div className="mb-4 grid grid-cols-2 rounded-lg bg-gray-100 p-1 dark:bg-slate-950">
            {['income', 'expense'].map(type => (
              <button key={type} type="button" onClick={() => setEntryType(type)} className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ${entryType === type ? 'bg-white text-forest-green shadow-sm dark:bg-slate-900 dark:text-emerald-300' : 'text-gray-500 dark:text-slate-400'}`}>{type}</button>
            ))}
          </div>
          <div className="space-y-4">
            <input required type="number" min="1" placeholder="Amount (KES)" value={form.amount_kes} onChange={event => setForm({ ...form, amount_kes: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
            <input required type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
            {entryType === 'income' ? (
              <select value={form.source} onChange={event => setForm({ ...form, source: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                <option value="MilkSale">Milk Sale</option>
                <option value="AnimalSale">Animal Sale</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                <option value="Feed">Feed</option>
                <option value="Veterinary">Veterinary</option>
                <option value="Labor">Labor</option>
                <option value="Equipment">Equipment</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            )}
            <textarea rows="3" placeholder="Description or notes" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
            <Button type="submit" disabled={createIncome.isPending || createExpense.isPending} className="w-full">Save Transaction</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Finance;
