import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnimals } from '../hooks/useAnimals';
import { useDailyMilkSummary, useBulkCreateMilkRecords } from '../hooks/useMilk';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Info, X, ShieldAlert, PenLine, Sunrise, Sun, PieChart, Milk } from 'lucide-react';
import { VerifyOTPModal } from '../components/ui/VerifyOTPModal';
import { enqueueOfflineMutation } from '../utils/offlineQueue';

const numberValue = (value) => Number.parseFloat(value) || 0;

const DailyMilkEntry = () => {
    const { user } = useAuth();
    const isWorker = user?.role === 'FARM_WORKER';
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState('yields'); // 'yields' (morning & evening) or 'allocations' (usage & sales)
    const [entries, setEntries] = useState({});
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState(null);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [editingAnimalId, setEditingAnimalId] = useState(null);
    const { addToast } = useToast();
    const { data: animals = [], isLoading: animalsLoading } = useAnimals({ sex: 'Cow' });
    const { data: summary, isLoading: summaryLoading } = useDailyMilkSummary(date);
    const { mutate: bulkSave, isPending } = useBulkCreateMilkRecords();

    const displayEntries = useMemo(() => {
        return animals.reduce((acc, animal) => {
            const existing = summary?.records?.find(record => record.animal === animal.id);
            acc[animal.id] = {
                animal: animal.id,
                animal_name: animal.name,
                ear_tag: animal.ear_tag,
                date,
                morning_yield: '',
                evening_yield: '',
                home_use_litres: '',
                sold_litres: '',
                calf_litres: '',
                notes: '',
                ...existing,
                ...entries[animal.id],
            };
            return acc;
        }, {});
    }, [animals, date, entries, summary]);

    const totals = useMemo(() => {
        return Object.values(displayEntries).reduce((acc, entry) => {
            const produced = numberValue(entry.morning_yield) + numberValue(entry.evening_yield);
            const home = numberValue(entry.home_use_litres);
            const sold = numberValue(entry.sold_litres);
            const calves = numberValue(entry.calf_litres);
            acc.produced += produced;
            acc.home += home;
            acc.sold += sold;
            acc.calves += calves;
            acc.allocated += home + sold + calves;
            return acc;
        }, { produced: 0, home: 0, sold: 0, calves: 0, allocated: 0 });
    }, [displayEntries]);

    // Live validation checks
    const validationIssues = useMemo(() => {
        const issues = [];
        Object.values(displayEntries).forEach(entry => {
            const morning = numberValue(entry.morning_yield);
            const evening = numberValue(entry.evening_yield);
            const produced = morning + evening;
            const allocated = numberValue(entry.home_use_litres) + numberValue(entry.sold_litres) + numberValue(entry.calf_litres);

            if (morning > 35) {
                issues.push({ animalId: entry.animal, name: entry.animal_name, message: `Morning yield (${morning}L) exceeds typical session limit (35L)` });
            }
            if (evening > 35) {
                issues.push({ animalId: entry.animal, name: entry.animal_name, message: `Evening yield (${evening}L) exceeds typical session limit (35L)` });
            }
            if (allocated > produced) {
                issues.push({ animalId: entry.animal, name: entry.animal_name, message: `Allocations (${allocated.toFixed(1)}L) exceed total produced (${produced.toFixed(1)}L)` });
            }
        });
        return issues;
    }, [displayEntries]);

    const handleChange = (animalId, field, value) => {
        setEntries(prev => ({
            ...prev,
            [animalId]: {
                ...displayEntries[animalId],
                ...prev[animalId],
                [field]: value
            }
        }));
    };

    const handleOpenPreview = () => {
        if (validationIssues.length > 0) {
            addToast(validationIssues[0].message, 'error');
            return;
        }

        const recordsToSave = Object.values(displayEntries)
            .filter(entry => numberValue(entry.morning_yield) || numberValue(entry.evening_yield) || entry.notes);

        if (!recordsToSave.length) {
            addToast('Enter at least one milk record before proceeding.', 'error');
            return;
        }

        setShowPreviewModal(true);
    };

    const handleConfirmSave = () => {
        const recordsToSave = Object.values(displayEntries)
            .filter(entry => numberValue(entry.morning_yield) || numberValue(entry.evening_yield) || entry.notes)
            .map(entry => ({
                animal: entry.animal,
                date,
                morning_yield: numberValue(entry.morning_yield),
                evening_yield: numberValue(entry.evening_yield),
                home_use_litres: numberValue(entry.home_use_litres),
                sold_litres: numberValue(entry.sold_litres),
                calf_litres: numberValue(entry.calf_litres),
                notes: entry.notes || '',
            }));

        // If currently offline, queue locally and notify
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            enqueueOfflineMutation({
                endpoint: '/milk/bulk/',
                method: 'POST',
                data: { records: recordsToSave },
                description: `Milk records for ${date} (${recordsToSave.length} cows)`
            });
            setEntries({});
            setShowPreviewModal(false);
            addToast('Offline: Milk records saved locally. They will automatically sync when network returns.', 'success');
            return;
        }

        bulkSave(recordsToSave, {
            onSuccess: () => {
                setEntries({});
                setShowPreviewModal(false);
                addToast('Milk records saved successfully.', 'success');
            },
            onError: (err) => {
                // If network failure occurred (no response / server down), queue offline
                if (!err.response) {
                    enqueueOfflineMutation({
                        endpoint: '/milk/bulk/',
                        method: 'POST',
                        data: { records: recordsToSave },
                        description: `Milk records for ${date} (${recordsToSave.length} cows)`
                    });
                    setEntries({});
                    setShowPreviewModal(false);
                    addToast('Network unavailable: Milk records saved locally in offline queue.', 'success');
                    return;
                }
                const apiError = err.response?.data?.errors?.[0]?.errors;
                const errDetail = apiError ? Object.values(apiError).flat().join(' ') : (err.response?.data?.error || 'Could not save milk records.');
                addToast(errDetail, 'error');
            }
        });
    };

    if (animalsLoading || summaryLoading) return <div className="p-8 text-gray-600">Loading dairy ledger...</div>;

    const entriesToSaveList = Object.values(displayEntries)
        .filter(entry => numberValue(entry.morning_yield) || numberValue(entry.evening_yield) || entry.notes);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <Link to="/dairy" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-forest-green">
                        <ArrowLeft size={16} /> Dairy overview
                    </Link>
                    <h1 className="font-heading text-3xl font-bold text-gray-900">Daily Milk Ledger</h1>
                    <p className="mt-1 text-gray-500">Record production, usage, and comments for the selected date.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-48">
                        <CustomDatePicker
                            value={date}
                            onChange={(newDate) => {
                                const selected = newDate.includes('T') ? newDate.split('T')[0] : newDate;
                                setDate(selected);
                                setEntries({});
                            }}
                            placeholder="Select date"
                        />
                    </div>
                    <Button onClick={handleOpenPreview} disabled={isPending || validationIssues.length > 0}>
                        <Save size={18} className="mr-2" /> Review & Save
                    </Button>
                </div>
            </div>

            {/* Worker notice banner */}
            {isWorker && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
                    <ShieldAlert size={20} className="shrink-0 text-amber-600 mt-0.5" />
                    <div>
                        <p className="font-semibold">Worker Recording Safeguard Active</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            Records are immutable once submitted and cannot be modified or backdated by farm workers. Please review your entries carefully in the preview screen before committing.
                        </p>
                    </div>
                </div>
            )}

            {/* Live validation warning banner */}
            {validationIssues.length > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
                    <AlertTriangle size={20} className="shrink-0 text-red-600 mt-0.5" />
                    <div>
                        <p className="font-semibold">Please resolve input discrepancies before saving ({validationIssues.length}):</p>
                        <ul className="mt-1 list-disc list-inside text-xs space-y-0.5 text-red-700">
                            {validationIssues.map((issue, idx) => (
                                <li key={idx}><strong>{issue.name}:</strong> {issue.message}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {[
                    ['Produced', totals.produced],
                    ['Home', totals.home],
                    ['Sold', totals.sold],
                    ['Calves', totals.calves],
                    ['Unallocated', totals.produced - totals.allocated],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-500">{label}</p>
                        <p className={`mt-1 text-2xl font-bold ${label === 'Unallocated' && value < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {value.toFixed(1)} L
                        </p>
                    </div>
                ))}
            </section>

            {/* Tab Switcher for Yields vs Allocations */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-2">
                <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-slate-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab('yields')}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                            activeTab === 'yields'
                                ? 'bg-white text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                        }`}
                    >
                        <Sunrise size={16} className="text-amber-500" />
                        <span>1. Production Yields (Morning & Evening)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('allocations')}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                            activeTab === 'allocations'
                                ? 'bg-white text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                        }`}
                    >
                        <PieChart size={16} className="text-emerald-600" />
                        <span>2. Allocations (Home, Sold & Calves)</span>
                    </button>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                    {activeTab === 'yields' ? (
                        <span>Logging morning and evening milking volumes</span>
                    ) : (
                        <span>Distributing produced milk to sales, home use, and calves</span>
                    )}
                </div>
            </div>

            {/* TAB 1: PRODUCTION YIELDS (MORNING & EVENING) */}
            {activeTab === 'yields' && (
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-emerald-50/30">
                        <div>
                            <h2 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Milk size={18} className="text-emerald-700" />
                                <span>Milking Sessions</span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">Enter morning and evening milk yields per cow</p>
                        </div>
                        <div className="text-xs font-bold px-3 py-1 bg-white rounded-lg border border-gray-200 text-gray-700 shadow-sm">
                            Total Yield: <span className="text-emerald-700 font-extrabold">{totals.produced.toFixed(1)} L</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-[650px] w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-5 py-3">Animal</th>
                                    <th className="px-5 py-3">
                                        <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                                            <Sunrise size={14} /> Morning (L)
                                        </div>
                                    </th>
                                    <th className="px-5 py-3">
                                        <div className="flex items-center gap-1.5 text-orange-700 font-bold">
                                            <Sun size={14} /> Evening (L)
                                        </div>
                                    </th>
                                    <th className="px-5 py-3 font-bold text-emerald-800">Day Total</th>
                                    <th className="px-5 py-3">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {animals.length ? animals.map(animal => {
                                    const entry = displayEntries[animal.id] || {};
                                    const morning = numberValue(entry.morning_yield);
                                    const evening = numberValue(entry.evening_yield);
                                    const produced = morning + evening;
                                    const hasDiscrepancy = morning > 35 || evening > 35;
                                    return (
                                        <tr key={animal.id} className={hasDiscrepancy ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-gray-50/70'}>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{animal.name}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{animal.ear_tag}</p>
                                                    </div>
                                                    {hasDiscrepancy && (
                                                        <span className="inline-flex rounded-full bg-amber-100 p-1 text-amber-700" title="High session yield limit (>35L)">
                                                            <AlertTriangle size={14} />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    step="0.1" 
                                                    value={entry.morning_yield ?? ''} 
                                                    onChange={(event) => handleChange(animal.id, 'morning_yield', event.target.value)} 
                                                    placeholder="0.0"
                                                    className={`w-28 rounded-xl border px-3 py-2 text-right text-sm font-semibold focus:outline-none transition ${
                                                        morning > 35 ? 'border-amber-500 bg-amber-50 focus:border-amber-600' : 'border-gray-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                                                    }`} 
                                                />
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    step="0.1" 
                                                    value={entry.evening_yield ?? ''} 
                                                    onChange={(event) => handleChange(animal.id, 'evening_yield', event.target.value)} 
                                                    placeholder="0.0"
                                                    className={`w-28 rounded-xl border px-3 py-2 text-right text-sm font-semibold focus:outline-none transition ${
                                                        evening > 35 ? 'border-amber-500 bg-amber-50 focus:border-amber-600' : 'border-gray-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                                                    }`} 
                                                />
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-emerald-800 text-base">
                                                {produced > 0 ? `${produced.toFixed(1)} L` : '-'}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <input 
                                                    type="text" 
                                                    value={entry.notes || ''} 
                                                    onChange={(event) => handleChange(animal.id, 'notes', event.target.value)} 
                                                    placeholder="Session notes (health, milk color...)" 
                                                    className="w-full max-w-xs rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none" 
                                                />
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="5" className="px-5 py-10 text-center text-gray-500">Add cows to your herd before recording milk.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* TAB 2: ALLOCATIONS (USAGE & SALES) */}
            {activeTab === 'allocations' && (
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-blue-50/30">
                        <div>
                            <h2 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                                <PieChart size={18} className="text-emerald-700" />
                                <span>Milk Distribution & Allocations</span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">Distribute collected yields to household, commercial sales, and calf feeding</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-600">Total Allocated:</span>
                            <span className="text-xs font-extrabold px-3 py-1 bg-white rounded-lg border border-gray-200 text-emerald-700 shadow-sm">
                                {totals.allocated.toFixed(1)} / {totals.produced.toFixed(1)} L
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-[850px] w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-5 py-3">Animal</th>
                                    <th className="px-5 py-3">Produced</th>
                                    <th className="px-5 py-3 text-blue-700 font-bold">Home Use (L)</th>
                                    <th className="px-5 py-3 text-emerald-700 font-bold">Sold (L)</th>
                                    <th className="px-5 py-3 text-amber-700 font-bold">Calves (L)</th>
                                    <th className="px-5 py-3 font-bold">Net Balance</th>
                                    <th className="px-5 py-3">Comments</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {animals.length ? animals.map(animal => {
                                    const entry = displayEntries[animal.id] || {};
                                    const produced = numberValue(entry.morning_yield) + numberValue(entry.evening_yield);
                                    const allocated = numberValue(entry.home_use_litres) + numberValue(entry.sold_litres) + numberValue(entry.calf_litres);
                                    const balance = produced - allocated;
                                    const hasDiscrepancy = balance < 0;
                                    return (
                                        <tr key={animal.id} className={hasDiscrepancy ? 'bg-red-50/50 hover:bg-red-50/70' : 'hover:bg-gray-50/70'}>
                                            <td className="px-5 py-3.5">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{animal.name}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{animal.ear_tag}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-gray-900 text-sm">
                                                {produced.toFixed(1)} L
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    step="0.1" 
                                                    value={entry.home_use_litres ?? ''} 
                                                    onChange={(event) => handleChange(animal.id, 'home_use_litres', event.target.value)} 
                                                    placeholder="0.0"
                                                    className="w-24 rounded-xl border border-gray-200 px-3 py-2 text-right text-sm font-semibold focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition" 
                                                />
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    step="0.1" 
                                                    value={entry.sold_litres ?? ''} 
                                                    onChange={(event) => handleChange(animal.id, 'sold_litres', event.target.value)} 
                                                    placeholder="0.0"
                                                    className="w-24 rounded-xl border border-gray-200 px-3 py-2 text-right text-sm font-semibold focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition" 
                                                />
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    step="0.1" 
                                                    value={entry.calf_litres ?? ''} 
                                                    onChange={(event) => handleChange(animal.id, 'calf_litres', event.target.value)} 
                                                    placeholder="0.0"
                                                    className="w-24 rounded-xl border border-gray-200 px-3 py-2 text-right text-sm font-semibold focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition" 
                                                />
                                            </td>
                                            <td className={`px-5 py-3.5 font-extrabold ${balance < 0 ? 'text-red-600' : balance === 0 ? 'text-gray-400' : 'text-emerald-700'}`}>
                                                {balance.toFixed(1)} L
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <input 
                                                    type="text" 
                                                    value={entry.notes || ''} 
                                                    onChange={(event) => handleChange(animal.id, 'notes', event.target.value)} 
                                                    placeholder="Buyer details, calf name..." 
                                                    className="w-full max-w-xs rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none" 
                                                />
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="7" className="px-5 py-10 text-center text-gray-500">Add cows to your herd before recording allocations.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="font-heading text-lg font-bold text-gray-900">Records for {date}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Existing saved entries on this date</p>
                    </div>
                    {editingAnimalId && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <PenLine size={13} /> Editing unlocked via OTP
                        </span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-[820px] w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Animal</th>
                                <th className="px-4 py-3">Produced</th>
                                <th className="px-4 py-3">Home</th>
                                <th className="px-4 py-3">Sold</th>
                                <th className="px-4 py-3">Calves</th>
                                <th className="px-4 py-3">Comments</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {summary?.records?.length ? summary.records.map(record => (
                                <tr key={record.id} className={editingAnimalId === record.animal ? "bg-emerald-50/40" : ""}>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {record.animal_name}
                                        {editingAnimalId === record.animal && (
                                            <span className="ml-2 inline-block text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                                                Active Edit
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">{Number(record.total_yield).toFixed(1)} L</td>
                                    <td className="px-4 py-3">{Number(record.home_use_litres).toFixed(1)} L</td>
                                    <td className="px-4 py-3">{Number(record.sold_litres).toFixed(1)} L</td>
                                    <td className="px-4 py-3">{Number(record.calf_litres).toFixed(1)} L</td>
                                    <td className="px-4 py-3 text-gray-600">{record.notes || '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        {isWorker ? (
                                            <span className="text-xs text-gray-400 italic">Locked</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRecordToEdit(record);
                                                    setShowOtpModal(true);
                                                }}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition text-xs font-semibold shadow-sm"
                                                title="Edit record (Requires OTP)"
                                            >
                                                <PenLine size={14} className="text-emerald-600" />
                                                <span>Edit</span>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No saved records for this date yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* OTP Verification Modal for Record Editing */}
            <VerifyOTPModal
                isOpen={showOtpModal}
                onClose={() => {
                    setShowOtpModal(false);
                    setRecordToEdit(null);
                }}
                phoneNumber={user?.phone_number || ''}
                title="Verify Milk Ledger Modification"
                subtitle={`Enter the 6-digit OTP to modify saved milk records for ${recordToEdit?.animal_name || 'this animal'}`}
                onVerified={() => {
                    setShowOtpModal(false);
                    if (recordToEdit) {
                        setEditingAnimalId(recordToEdit.animal);
                        setEntries(prev => ({
                            ...prev,
                            [recordToEdit.animal]: {
                                animal: recordToEdit.animal,
                                animal_name: recordToEdit.animal_name,
                                morning_yield: recordToEdit.morning_yield ?? '',
                                evening_yield: recordToEdit.evening_yield ?? '',
                                home_use_litres: recordToEdit.home_use_litres ?? '',
                                sold_litres: recordToEdit.sold_litres ?? '',
                                calf_litres: recordToEdit.calf_litres ?? '',
                                notes: recordToEdit.notes ?? '',
                            }
                        }));
                        addToast(`Edit unlocked for ${recordToEdit.animal_name}. Update values in the entry table above and save.`, 'success');
                    }
                    setRecordToEdit(null);
                }}
            />

            {/* Confirmation Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="font-heading text-xl font-bold text-gray-900">Review Milk Log Submission</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Please confirm your daily figures before committing to the ledger.</p>
                            </div>
                            <button onClick={() => setShowPreviewModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                                <span className="text-xs text-gray-500">Animals Logged</span>
                                <p className="text-xl font-bold text-gray-900">{entriesToSaveList.length}</p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100">
                                <span className="text-xs text-emerald-700 font-medium">Total Produced</span>
                                <p className="text-xl font-bold text-emerald-900">{totals.produced.toFixed(1)} L</p>
                            </div>
                            <div className="rounded-xl bg-blue-50 p-3 border border-blue-100">
                                <span className="text-xs text-blue-700 font-medium">Sold Litres</span>
                                <p className="text-xl font-bold text-blue-900">{totals.sold.toFixed(1)} L</p>
                            </div>
                            <div className="rounded-xl bg-amber-50 p-3 border border-amber-100">
                                <span className="text-xs text-amber-700 font-medium">Calves + Home</span>
                                <p className="text-xl font-bold text-amber-900">{(totals.calves + totals.home).toFixed(1)} L</p>
                            </div>
                        </div>

                        {isWorker && (
                            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                <strong>Reminder:</strong> As a farm worker, you will not be able to modify these records once confirmed.
                            </div>
                        )}

                        <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 uppercase text-gray-500 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2">Animal</th>
                                        <th className="px-3 py-2 text-right">Morning</th>
                                        <th className="px-3 py-2 text-right">Evening</th>
                                        <th className="px-3 py-2 text-right">Total</th>
                                        <th className="px-3 py-2 text-right">Sold</th>
                                        <th className="px-3 py-2 text-right">Home</th>
                                        <th className="px-3 py-2 text-right">Calves</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {entriesToSaveList.map(entry => {
                                        const morning = numberValue(entry.morning_yield);
                                        const evening = numberValue(entry.evening_yield);
                                        const total = morning + evening;
                                        return (
                                            <tr key={entry.animal}>
                                                <td className="px-3 py-2 font-medium text-gray-900">{entry.animal_name}</td>
                                                <td className="px-3 py-2 text-right">{morning.toFixed(1)} L</td>
                                                <td className="px-3 py-2 text-right">{evening.toFixed(1)} L</td>
                                                <td className="px-3 py-2 text-right font-bold text-emerald-800">{total.toFixed(1)} L</td>
                                                <td className="px-3 py-2 text-right">{numberValue(entry.sold_litres).toFixed(1)} L</td>
                                                <td className="px-3 py-2 text-right">{numberValue(entry.home_use_litres).toFixed(1)} L</td>
                                                <td className="px-3 py-2 text-right">{numberValue(entry.calf_litres).toFixed(1)} L</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowPreviewModal(false)}
                                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Back to Edit
                            </button>
                            <Button onClick={handleConfirmSave} disabled={isPending}>
                                <CheckCircle size={16} className="mr-2" />
                                {isPending ? 'Committing...' : 'Confirm & Save Records'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyMilkEntry;
