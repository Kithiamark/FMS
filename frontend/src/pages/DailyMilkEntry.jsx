import React, { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAnimals } from '../hooks/useAnimals';
import { useDailyMilkSummary, useBulkCreateMilkRecords } from '../hooks/useMilk';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { 
    ArrowLeft, Save, AlertTriangle, CheckCircle, Info, X, ShieldAlert, 
    PenLine, Sunrise, Sun, PieChart, Milk, Home, ShoppingCart, Baby
} from 'lucide-react';
import { VerifyOTPModal } from '../components/ui/VerifyOTPModal';
import { enqueueOfflineMutation } from '../utils/offlineQueue';

const numberValue = (value) => Number.parseFloat(value) || 0;

const DailyMilkEntry = () => {
    const { user } = useAuth();
    const isWorker = user?.role === 'FARM_WORKER';
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Support ?date=YYYY-MM-DD from dashboard or URL
    const queryDate = searchParams.get('date');
    const initialDate = queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate) 
        ? queryDate 
        : new Date().toISOString().split('T')[0];

    const [date, setDate] = useState(initialDate);
    const [entries, setEntries] = useState({});
    const [farmAllocation, setFarmAllocation] = useState({
        home_use_litres: '',
        sold_litres: '',
        calf_litres: '',
        notes: ''
    });
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState(null);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [editingAnimalId, setEditingAnimalId] = useState(null);
    const { addToast } = useToast();

    const { data: animals = [], isLoading: animalsLoading } = useAnimals({ sex: 'Cow' });
    const { data: summary, isLoading: summaryLoading } = useDailyMilkSummary(date);
    const { mutate: bulkSave, isPending } = useBulkCreateMilkRecords();

    // When date changes in URL or via picker, update state
    useEffect(() => {
        if (queryDate && queryDate !== date && /^\d{4}-\d{2}-\d{2}$/.test(queryDate)) {
            setDate(queryDate);
            setEntries({});
            setEditingAnimalId(null);
        }
    }, [queryDate]);

    // Populate initial farm allocation from summary when loaded
    useEffect(() => {
        if (summary?.usage) {
            setFarmAllocation(prev => ({
                home_use_litres: prev.home_use_litres !== '' ? prev.home_use_litres : (summary.usage.home > 0 ? String(summary.usage.home) : ''),
                sold_litres: prev.sold_litres !== '' ? prev.sold_litres : (summary.usage.sold > 0 ? String(summary.usage.sold) : ''),
                calf_litres: prev.calf_litres !== '' ? prev.calf_litres : (summary.usage.calves > 0 ? String(summary.usage.calves) : ''),
                notes: prev.notes !== '' ? prev.notes : ''
            }));
        }
    }, [summary]);

    // Cow yields mapped by animal ID
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
                notes: '',
                ...existing,
                ...entries[animal.id],
            };
            return acc;
        }, {});
    }, [animals, date, entries, summary]);

    // Aggregates for produced milk across cows
    const totalProduced = useMemo(() => {
        return Object.values(displayEntries).reduce((sum, entry) => {
            return sum + numberValue(entry.morning_yield) + numberValue(entry.evening_yield);
        }, 0);
    }, [displayEntries]);

    // Farm-level allocations
    const allocationValues = useMemo(() => {
        const home = numberValue(farmAllocation.home_use_litres);
        const sold = numberValue(farmAllocation.sold_litres);
        const calves = numberValue(farmAllocation.calf_litres);
        const total = home + sold + calves;
        return {
            home,
            sold,
            calves,
            allocated: total,
            unallocated: totalProduced - total
        };
    }, [farmAllocation, totalProduced]);

    // Live validation checks
    const validationIssues = useMemo(() => {
        const issues = [];
        Object.values(displayEntries).forEach(entry => {
            const morning = numberValue(entry.morning_yield);
            const evening = numberValue(entry.evening_yield);

            if (morning > 35) {
                issues.push({ 
                    animalId: entry.animal, 
                    name: entry.animal_name, 
                    message: `Morning yield (${morning}L) exceeds typical session limit (35L)` 
                });
            }
            if (evening > 35) {
                issues.push({ 
                    animalId: entry.animal, 
                    name: entry.animal_name, 
                    message: `Evening yield (${evening}L) exceeds typical session limit (35L)` 
                });
            }
        });

        if (allocationValues.allocated > totalProduced && totalProduced > 0) {
            issues.push({
                animalId: 'farm-allocation',
                name: 'Daily Farm Allocation',
                message: `Total allocated milk (${allocationValues.allocated.toFixed(1)}L) exceeds total produced (${totalProduced.toFixed(1)}L)`
            });
        }

        return issues;
    }, [displayEntries, allocationValues, totalProduced]);

    const handleEntryChange = (animalId, field, value) => {
        setEntries(prev => ({
            ...prev,
            [animalId]: {
                ...displayEntries[animalId],
                ...prev[animalId],
                [field]: value
            }
        }));
    };

    const handleAllocationChange = (field, value) => {
        setFarmAllocation(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleOpenPreview = () => {
        if (validationIssues.length > 0) {
            addToast(validationIssues[0].message, 'error');
            return;
        }

        const recordsToSave = Object.values(displayEntries)
            .filter(entry => numberValue(entry.morning_yield) || numberValue(entry.evening_yield) || entry.notes);

        if (!recordsToSave.length && allocationValues.allocated === 0) {
            addToast('Enter at least one cow milk yield or farm allocation before proceeding.', 'error');
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
                notes: entry.notes || '',
            }));

        const payload = {
            records: recordsToSave,
            farm_allocation: {
                home_use_litres: allocationValues.home,
                sold_litres: allocationValues.sold,
                calf_litres: allocationValues.calves,
                notes: farmAllocation.notes || ''
            }
        };

        // If currently offline, queue locally and notify
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            enqueueOfflineMutation({
                endpoint: '/milk/bulk/',
                method: 'POST',
                data: payload,
                description: `Milk records & farm allocations for ${date} (${recordsToSave.length} cows)`
            });
            setEntries({});
            setShowPreviewModal(false);
            addToast('Offline: Milk records saved locally. They will automatically sync when network returns.', 'success');
            return;
        }

        bulkSave(payload, {
            onSuccess: () => {
                setEntries({});
                setEditingAnimalId(null);
                setShowPreviewModal(false);
                addToast('Milk records & daily allocations saved successfully.', 'success');
            },
            onError: (err) => {
                if (!err.response) {
                    enqueueOfflineMutation({
                        endpoint: '/milk/bulk/',
                        method: 'POST',
                        data: payload,
                        description: `Milk records & allocations for ${date} (${recordsToSave.length} cows)`
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

    if (animalsLoading || summaryLoading) {
        return <div className="p-8 text-gray-600 dark:text-slate-400">Loading daily milk ledger...</div>;
    }

    const entriesToSaveList = Object.values(displayEntries)
        .filter(entry => numberValue(entry.morning_yield) || numberValue(entry.evening_yield) || entry.notes);

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <Link to="/dairy" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-forest-green dark:text-slate-400 dark:hover:text-emerald-400 transition">
                        <ArrowLeft size={16} /> Dairy overview
                    </Link>
                    <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-slate-100">Daily Milk Ledger</h1>
                    <p className="mt-1 text-gray-500 dark:text-slate-400">Record cow production yields and manage single daily farm allocations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-52">
                        <CustomDatePicker
                            value={date}
                            onChange={(newDate) => {
                                const selected = newDate.includes('T') ? newDate.split('T')[0] : newDate;
                                setDate(selected);
                                setSearchParams({ date: selected });
                                setEntries({});
                                setEditingAnimalId(null);
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
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                    <ShieldAlert size={20} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                        <p className="font-semibold">Worker Recording Safeguard Active</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                            Records are immutable once submitted and cannot be modified or backdated by farm workers. Please review your entries carefully before committing.
                        </p>
                    </div>
                </div>
            )}

            {/* Live validation warning banner */}
            {validationIssues.length > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                    <AlertTriangle size={20} className="shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                        <p className="font-semibold">Please resolve input discrepancies before saving ({validationIssues.length}):</p>
                        <ul className="mt-1 list-disc list-inside text-xs space-y-0.5 text-red-700 dark:text-red-400">
                            {validationIssues.map((issue, idx) => (
                                <li key={idx}><strong>{issue.name}:</strong> {issue.message}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Top Metric Cards */}
            <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {[
                    ['Total Produced', totalProduced, 'text-gray-900 dark:text-slate-100'],
                    ['Home Use', allocationValues.home, 'text-blue-700 dark:text-blue-400'],
                    ['Sold', allocationValues.sold, 'text-emerald-700 dark:text-emerald-400'],
                    ['Calves', allocationValues.calves, 'text-amber-700 dark:text-amber-400'],
                    ['Unallocated', allocationValues.unallocated, allocationValues.unallocated < 0 ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-gray-900 dark:text-slate-100'],
                ].map(([label, value, colorClass]) => (
                    <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">{label}</p>
                        <p className={`mt-1.5 text-2xl font-bold ${colorClass}`}>
                            {Number(value).toFixed(1)} L
                        </p>
                    </div>
                ))}
            </section>

            {/* 1. COW PRODUCTION YIELDS (INDIVIDUAL COW DATA ENTRY) */}
            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between bg-gradient-to-r from-amber-50/40 via-white to-emerald-50/30 dark:border-slate-800 dark:from-slate-800/60 dark:via-slate-900 dark:to-slate-800/40">
                    <div>
                        <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <Milk size={18} className="text-emerald-600 dark:text-emerald-400" />
                            <span>Cow Milking Sessions</span>
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Enter morning and evening yields for individual cows</p>
                    </div>
                    <div className="text-xs font-bold px-3 py-1 bg-white rounded-lg border border-gray-200 text-gray-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        Total Produced: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{totalProduced.toFixed(1)} L</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[650px] w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-950 dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-3">Cow</th>
                                <th className="px-5 py-3">
                                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
                                        <Sunrise size={14} /> Morning (L)
                                    </div>
                                </th>
                                <th className="px-5 py-3">
                                    <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-400 font-bold">
                                        <Sun size={14} /> Evening (L)
                                    </div>
                                </th>
                                <th className="px-5 py-3 font-bold text-emerald-800 dark:text-emerald-400">Day Total</th>
                                <th className="px-5 py-3">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {animals.length ? animals.map(animal => {
                                const entry = displayEntries[animal.id] || {};
                                const morning = numberValue(entry.morning_yield);
                                const evening = numberValue(entry.evening_yield);
                                const produced = morning + evening;
                                const hasDiscrepancy = morning > 35 || evening > 35;
                                const isBeingEdited = editingAnimalId === animal.id;

                                return (
                                    <tr 
                                        key={animal.id} 
                                        className={`transition ${
                                            isBeingEdited 
                                                ? 'bg-emerald-50/60 dark:bg-emerald-950/40' 
                                                : hasDiscrepancy 
                                                    ? 'bg-amber-50/40 dark:bg-amber-950/20' 
                                                    : 'hover:bg-gray-50/70 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-slate-100">{animal.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">{animal.ear_tag}</p>
                                                </div>
                                                {isBeingEdited && (
                                                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">
                                                        Active Edit
                                                    </span>
                                                )}
                                                {hasDiscrepancy && (
                                                    <span className="inline-flex rounded-full bg-amber-100 p-1 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300" title="High session yield limit (>35L)">
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
                                                onChange={(event) => handleEntryChange(animal.id, 'morning_yield', event.target.value)} 
                                                placeholder="0.0"
                                                className={`w-28 rounded-xl border px-3 py-2 text-right text-sm font-semibold transition focus:outline-none dark:bg-slate-800 dark:text-slate-100 ${
                                                    morning > 35 
                                                        ? 'border-amber-500 bg-amber-50 focus:border-amber-600 dark:bg-amber-950/40' 
                                                        : 'border-gray-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:focus:border-emerald-500'
                                                }`} 
                                            />
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <input 
                                                type="number" 
                                                min="0" 
                                                step="0.1" 
                                                value={entry.evening_yield ?? ''} 
                                                onChange={(event) => handleEntryChange(animal.id, 'evening_yield', event.target.value)} 
                                                placeholder="0.0"
                                                className={`w-28 rounded-xl border px-3 py-2 text-right text-sm font-semibold transition focus:outline-none dark:bg-slate-800 dark:text-slate-100 ${
                                                    evening > 35 
                                                        ? 'border-amber-500 bg-amber-50 focus:border-amber-600 dark:bg-amber-950/40' 
                                                        : 'border-gray-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:focus:border-emerald-500'
                                                }`} 
                                            />
                                        </td>
                                        <td className="px-5 py-3.5 font-bold text-emerald-800 dark:text-emerald-400 text-base">
                                            {produced > 0 ? `${produced.toFixed(1)} L` : '-'}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <input 
                                                type="text" 
                                                value={entry.notes || ''} 
                                                onChange={(event) => handleEntryChange(animal.id, 'notes', event.target.value)} 
                                                placeholder="Notes (health, milk color...)" 
                                                className="w-full max-w-xs rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500" 
                                            />
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="5" className="px-5 py-10 text-center text-gray-500 dark:text-slate-400">Add cows to your herd before recording milk.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 2. SINGLE DAILY FARM ALLOCATION CARD */}
            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between bg-gradient-to-r from-emerald-50/40 via-white to-blue-50/30 dark:border-slate-800 dark:from-slate-800/60 dark:via-slate-900 dark:to-slate-800/40">
                    <div>
                        <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <PieChart size={18} className="text-emerald-600 dark:text-emerald-400" />
                            <span>Daily Farm Allocations</span>
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Allocate the farm's aggregate milk for {date} across home use, commercial sales, and calf feeding
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-600 dark:text-slate-400">Total Allocated:</span>
                        <span className="text-xs font-extrabold px-3 py-1 bg-white rounded-lg border border-gray-200 text-emerald-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400">
                            {allocationValues.allocated.toFixed(1)} / {totalProduced.toFixed(1)} L
                        </span>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Home Use */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
                                <Home size={15} /> Home Use (L)
                            </label>
                            <input 
                                type="number" 
                                min="0" 
                                step="0.1" 
                                value={farmAllocation.home_use_litres} 
                                onChange={(e) => handleAllocationChange('home_use_litres', e.target.value)} 
                                placeholder="0.0"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-right font-mono text-base font-bold text-gray-900 shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500"
                            />
                            <p className="mt-1.5 text-[11px] text-gray-500 dark:text-slate-400">Retained for household or worker consumption</p>
                        </div>

                        {/* Sold Litres */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                                <ShoppingCart size={15} /> Sold to Buyer (L)
                            </label>
                            <input 
                                type="number" 
                                min="0" 
                                step="0.1" 
                                value={farmAllocation.sold_litres} 
                                onChange={(e) => handleAllocationChange('sold_litres', e.target.value)} 
                                placeholder="0.0"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-right font-mono text-base font-bold text-gray-900 shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500"
                            />
                            <p className="mt-1.5 text-[11px] text-gray-500 dark:text-slate-400">Volume sold to cooperative, dairy, or retailer</p>
                        </div>

                        {/* Calf Feeding */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                                <Baby size={15} /> Calves Feeding (L)
                            </label>
                            <input 
                                type="number" 
                                min="0" 
                                step="0.1" 
                                value={farmAllocation.calf_litres} 
                                onChange={(e) => handleAllocationChange('calf_litres', e.target.value)} 
                                placeholder="0.0"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-right font-mono text-base font-bold text-gray-900 shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500"
                            />
                            <p className="mt-1.5 text-[11px] text-gray-500 dark:text-slate-400">Whole milk fed to young calves</p>
                        </div>

                        {/* Allocation Notes */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Allocation Notes
                            </label>
                            <input 
                                type="text" 
                                value={farmAllocation.notes} 
                                onChange={(e) => handleAllocationChange('notes', e.target.value)} 
                                placeholder="Buyer name, collection slip #..."
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-900 shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500"
                            />
                            <p className="mt-1.5 text-[11px] text-gray-500 dark:text-slate-400">Receipts, buyers, or distribution notes</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. SAVED RECORDS FOR SELECTED DATE */}
            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between dark:border-slate-800">
                    <div>
                        <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-slate-100">Saved Records for {date}</h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Existing database entries for this date</p>
                    </div>
                    {editingAnimalId && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                            <PenLine size={13} /> Editing unlocked via OTP
                        </span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-[820px] w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-950 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Animal</th>
                                <th className="px-4 py-3">Morning</th>
                                <th className="px-4 py-3">Evening</th>
                                <th className="px-4 py-3">Total Produced</th>
                                <th className="px-4 py-3">Comments</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {summary?.records?.length ? summary.records.map(record => (
                                <tr key={record.id} className={`transition ${editingAnimalId === record.animal ? "bg-emerald-50/50 dark:bg-emerald-950/40" : "hover:bg-gray-50/50 dark:hover:bg-slate-800/40"}`}>
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">
                                        {record.animal_name}
                                        {editingAnimalId === record.animal && (
                                            <span className="ml-2 inline-block text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                                                Active Edit
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{Number(record.morning_yield || 0).toFixed(1)} L</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{Number(record.evening_yield || 0).toFixed(1)} L</td>
                                    <td className="px-4 py-3 font-bold text-emerald-700 dark:text-emerald-400">{Number(record.total_yield || 0).toFixed(1)} L</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-slate-400">{record.notes || '-'}</td>
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
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:border-emerald-500 transition text-xs font-semibold shadow-sm"
                                                title="Edit record (Requires OTP)"
                                            >
                                                <PenLine size={13} className="text-emerald-600 dark:text-emerald-400" />
                                                <span>Edit Record</span>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">No saved records for this date yet.</td>
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
                                notes: recordToEdit.notes ?? '',
                            }
                        }));
                        addToast(`Edit unlocked for ${recordToEdit.animal_name}. Update values in the cow table above and save.`, 'success');
                    }
                    setRecordToEdit(null);
                }}
            />

            {/* Confirmation Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-slate-100">Review Milk Log Submission</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Please confirm your daily figures before committing to the ledger.</p>
                            </div>
                            <button onClick={() => setShowPreviewModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-xl bg-gray-50 p-3 border border-gray-100 dark:bg-slate-800 dark:border-slate-700">
                                <span className="text-xs text-gray-500 dark:text-slate-400">Animals Logged</span>
                                <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{entriesToSaveList.length}</p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/50">
                                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Total Produced</span>
                                <p className="text-xl font-bold text-emerald-900 dark:text-emerald-300">{totalProduced.toFixed(1)} L</p>
                            </div>
                            <div className="rounded-xl bg-blue-50 p-3 border border-blue-100 dark:bg-blue-950/40 dark:border-blue-900/50">
                                <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">Sold Litres</span>
                                <p className="text-xl font-bold text-blue-900 dark:text-blue-300">{allocationValues.sold.toFixed(1)} L</p>
                            </div>
                            <div className="rounded-xl bg-amber-50 p-3 border border-amber-100 dark:bg-amber-950/40 dark:border-amber-900/50">
                                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Calves + Home</span>
                                <p className="text-xl font-bold text-amber-900 dark:text-amber-300">{(allocationValues.calves + allocationValues.home).toFixed(1)} L</p>
                            </div>
                        </div>

                        {isWorker && (
                            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                                <strong>Reminder:</strong> As a farm worker, you will not be able to modify these records once confirmed.
                            </div>
                        )}

                        <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-700">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 uppercase text-gray-500 dark:bg-slate-950 dark:text-slate-400 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2">Animal</th>
                                        <th className="px-3 py-2 text-right">Morning</th>
                                        <th className="px-3 py-2 text-right">Evening</th>
                                        <th className="px-3 py-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {entriesToSaveList.map(entry => {
                                        const morning = numberValue(entry.morning_yield);
                                        const evening = numberValue(entry.evening_yield);
                                        const total = morning + evening;
                                        return (
                                            <tr key={entry.animal}>
                                                <td className="px-3 py-2 font-medium text-gray-900 dark:text-slate-100">{entry.animal_name}</td>
                                                <td className="px-3 py-2 text-right text-gray-700 dark:text-slate-300">{morning.toFixed(1)} L</td>
                                                <td className="px-3 py-2 text-right text-gray-700 dark:text-slate-300">{evening.toFixed(1)} L</td>
                                                <td className="px-3 py-2 text-right font-bold text-emerald-800 dark:text-emerald-400">{total.toFixed(1)} L</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-slate-800 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowPreviewModal(false)}
                                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
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
