import React, { useState } from 'react';
import { Sparkles, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

// Safe veterinary calculation guidelines based on standard East African cattle pharmacology
const DRUG_DATABASE = {
  oxytetracycline_20: {
    name: 'Oxytetracycline 20% L.A.',
    dosage_mg_kg: 20, // 20 mg/kg IM
    concentration_mg_ml: 200, // 200 mg/mL
    route: 'Deep Intramuscular (IM)',
    max_volume_per_site_ml: 15,
    milk_withdrawal_days: 7,
    meat_withdrawal_days: 21,
    notes: 'Do not exceed 15 mL per injection site in adult cattle.'
  },
  pen_strep: {
    name: 'Penicillin-Streptomycin (20:20)',
    dosage_mg_kg: 10,
    concentration_mg_ml: 200, // 200,000 IU procaine pen + 250mg strep per mL
    route: 'Intramuscular (IM)',
    max_volume_per_site_ml: 20,
    milk_withdrawal_days: 3,
    meat_withdrawal_days: 14,
    notes: 'Shake well before administration. Observe 72-hour milk withhold.'
  },
  flunixin: {
    name: 'Flunixin Meglumine (50 mg/mL)',
    dosage_mg_kg: 2.2, // 2.2 mg/kg IV
    concentration_mg_ml: 50,
    route: 'Slow Intravenous (IV)',
    max_volume_per_site_ml: 25,
    milk_withdrawal_days: 2,
    meat_withdrawal_days: 4,
    notes: 'For acute inflammation in mastitis and bovine respiratory disease.'
  },
  ivermectin_1: {
    name: 'Ivermectin 1% Injectable',
    dosage_mg_kg: 0.2, // 0.2 mg/kg SC
    concentration_mg_ml: 10, // 10 mg/mL
    route: 'Subcutaneous (SC) only',
    max_volume_per_site_ml: 10,
    milk_withdrawal_days: 'DO NOT USE in lactating dairy cows',
    meat_withdrawal_days: 35,
    notes: 'Contraindicated in cows producing milk for human consumption.'
  }
};

export const VetDosageCalculatorModal = ({ isOpen, onClose }) => {
  const [selectedDrug, setSelectedDrug] = useState('oxytetracycline_20');
  const [bodyWeightKg, setBodyWeightKg] = useState('450');
  const [calcResult, setCalcResult] = useState(null);

  if (!isOpen) return null;

  const drugInfo = DRUG_DATABASE[selectedDrug];

  const handleCalculate = (e) => {
    e.preventDefault();
    const weight = parseFloat(bodyWeightKg);
    if (isNaN(weight) || weight <= 0) return;

    const totalMg = weight * drugInfo.dosage_mg_kg;
    const volumeMl = (totalMg / drugInfo.concentration_mg_ml).toFixed(1);
    const sitesNeeded = Math.ceil(volumeMl / drugInfo.max_volume_per_site_ml);

    setCalcResult({
      volumeMl,
      sitesNeeded,
      weight,
      drugInfo
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="backdrop-blur-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Calculator size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Arvion AI Clinical Drug Dosage Calculator</h3>
              <p className="text-[11px] text-slate-500">Weight-based clinical dosing & statutory withdrawal calculation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold p-1 touch-target">&times;</button>
        </div>

        <form onSubmit={handleCalculate} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Pharmaceutical Agent</label>
            <select
              value={selectedDrug}
              onChange={(e) => {
                setSelectedDrug(e.target.value);
                setCalcResult(null);
              }}
              className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-teal-500"
            >
              {Object.entries(DRUG_DATABASE).map(([key, item]) => (
                <option key={key} value={key}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Estimated Cow Body Weight (kg)</label>
            <input
              type="number"
              min="30"
              max="1200"
              step="5"
              value={bodyWeightKg}
              onChange={(e) => setBodyWeightKg(e.target.value)}
              placeholder="e.g. 450"
              className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-teal-500"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">Average adult Friesian: 450-550kg | Ayrshire/Jersey: 350-450kg</p>
          </div>

          <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl touch-target">
            Calculate Exact Dose & Sites
          </Button>

          {calcResult && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 space-y-3 animate-in fade-in duration-200 text-xs text-slate-800">
              <div className="flex justify-between items-baseline border-b border-teal-200/80 pb-2">
                <span className="font-bold text-teal-950 uppercase tracking-wide">Prescribed Dose</span>
                <span className="text-xl font-black text-teal-700">{calcResult.volumeMl} mL</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Administration Route:</span>
                  <strong className="text-slate-900">{calcResult.drugInfo.route}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Injection Sites:</span>
                  <strong className="text-slate-900">{calcResult.sitesNeeded} site{calcResult.sitesNeeded > 1 ? 's' : ''} (max {calcResult.drugInfo.max_volume_per_site_ml} mL/site)</strong>
                </div>
              </div>

              <div className="bg-white/80 rounded-lg p-2.5 border border-teal-100 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertCircle size={13} className="text-amber-600 shrink-0" />
                  Statutory Withdrawal Warnings:
                </div>
                <p>• <strong>Milk:</strong> {calcResult.drugInfo.milk_withdrawal_days} days withhold from human consumption.</p>
                <p>• <strong>Meat:</strong> {calcResult.drugInfo.meat_withdrawal_days} days slaughter withhold.</p>
                <p className="text-slate-500 text-[10px] pt-1 font-sans">{calcResult.drugInfo.notes}</p>
              </div>
            </div>
          )}
        </form>

        <div className="px-6 py-3 border-t border-slate-200 flex justify-end bg-slate-50">
          <Button type="button" variant="ghost" onClick={onClose} className="text-xs font-bold text-slate-600 touch-target">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VetDosageCalculatorModal;
