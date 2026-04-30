import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnimals } from '../hooks/useAnimals';
import { useDailyMilkSummary, useBulkCreateMilkRecords } from '../hooks/useMilk';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { ArrowLeft, Save } from 'lucide-react';

const numberValue = (value) => Number.parseFloat(value) || 0;

const DailyMilkEntry = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [entries, setEntries] = useState({});
    const { addToast } = useToast();
    const { data: animals = [], isLoading: animalsLoading } = useAnimals({ sex: 'Cow' });
    const { data: summary, isLoading: summaryLoading } = useDailyMilkSummary(date);
    const { mutate: bulkSave, isPending } = useBulkCreateMilkRecords();

    const displayEntries = useMemo(() => {
        return animals.reduce((acc, animal) => {
            const existing = summary?.records?.find(record => record.animal === animal.id);
            acc[animal.id] = {
                animal: animal.id,
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

    const handleSave = () => {
        const invalidEntry = Object.values(displayEntries).find(entry => {
            const produced = numberValue(entry.morning_yield) + numberValue(entry.evening_yield);
            const allocated = numberValue(entry.home_use_litres) + numberValue(entry.sold_litres) + numberValue(entry.calf_litres);
            return allocated > produced;
        });

        if (invalidEntry) {
            addToast('Usage cannot exceed total milk produced for any animal.', 'error');
            return;
        }

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

        if (!recordsToSave.length) {
            addToast('Enter at least one milk record before saving.', 'error');
            return;
        }

        bulkSave(recordsToSave, {
            onSuccess: () => {
                setEntries({});
                addToast('Milk records saved.', 'success');
            },
            onError: (err) => {
                addToast(err.response?.data?.error || 'Could not save milk records.', 'error');
            }
        });
    };

    if (animalsLoading || summaryLoading) return <div className="p-8 text-gray-600">Loading dairy ledger...</div>;

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
                    <input
                        type="date"
                        value={date}
                        onChange={(event) => {
                            setDate(event.target.value);
                            setEntries({});
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/20"
                    />
                    <Button onClick={handleSave} disabled={isPending}>
                        <Save size={18} className="mr-2" /> {isPending ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>

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
                        <p className="mt-1 text-2xl font-bold text-gray-900">{value.toFixed(1)} L</p>
                    </div>
                ))}
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                    <h2 className="font-heading text-lg font-bold text-gray-900">Entry Table</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-[980px] w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Animal</th>
                                <th className="px-4 py-3">Morning</th>
                                <th className="px-4 py-3">Evening</th>
                                <th className="px-4 py-3">Total</th>
                                <th className="px-4 py-3">Home</th>
                                <th className="px-4 py-3">Sold</th>
                                <th className="px-4 py-3">Calves</th>
                                <th className="px-4 py-3">Balance</th>
                                <th className="px-4 py-3">Comments</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {animals.length ? animals.map(animal => {
                                const entry = displayEntries[animal.id] || {};
                                const produced = numberValue(entry.morning_yield) + numberValue(entry.evening_yield);
                                const allocated = numberValue(entry.home_use_litres) + numberValue(entry.sold_litres) + numberValue(entry.calf_litres);
                                const balance = produced - allocated;
                                return (
                                    <tr key={animal.id} className="hover:bg-gray-50/70">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-gray-900">{animal.name}</p>
                                            <p className="text-xs text-gray-500">{animal.ear_tag}</p>
                                        </td>
                                        {['morning_yield', 'evening_yield'].map(field => (
                                            <td key={field} className="px-4 py-3">
                                                <input type="number" min="0" step="0.1" value={entry[field] ?? ''} onChange={(event) => handleChange(animal.id, field, event.target.value)} className="w-24 rounded-lg border border-gray-300 px-2 py-2 text-right focus:border-forest-green focus:outline-none" />
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 font-bold text-gray-900">{produced.toFixed(1)} L</td>
                                        {['home_use_litres', 'sold_litres', 'calf_litres'].map(field => (
                                            <td key={field} className="px-4 py-3">
                                                <input type="number" min="0" step="0.1" value={entry[field] ?? ''} onChange={(event) => handleChange(animal.id, field, event.target.value)} className="w-24 rounded-lg border border-gray-300 px-2 py-2 text-right focus:border-forest-green focus:outline-none" />
                                            </td>
                                        ))}
                                        <td className={`px-4 py-3 font-bold ${balance < 0 ? 'text-red-600' : 'text-green-700'}`}>{balance.toFixed(1)} L</td>
                                        <td className="px-4 py-3">
                                            <input type="text" value={entry.notes || ''} onChange={(event) => handleChange(animal.id, 'notes', event.target.value)} placeholder="Optional notes" className="w-52 rounded-lg border border-gray-300 px-3 py-2 focus:border-forest-green focus:outline-none" />
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="9" className="px-4 py-10 text-center text-gray-500">Add cows to your herd before recording milk.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                    <h2 className="font-heading text-lg font-bold text-gray-900">Records for {date}</h2>
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {summary?.records?.length ? summary.records.map(record => (
                                <tr key={record.id}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{record.animal_name}</td>
                                    <td className="px-4 py-3">{Number(record.total_yield).toFixed(1)} L</td>
                                    <td className="px-4 py-3">{Number(record.home_use_litres).toFixed(1)} L</td>
                                    <td className="px-4 py-3">{Number(record.sold_litres).toFixed(1)} L</td>
                                    <td className="px-4 py-3">{Number(record.calf_litres).toFixed(1)} L</td>
                                    <td className="px-4 py-3 text-gray-600">{record.notes || '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No saved records for this date yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default DailyMilkEntry;
