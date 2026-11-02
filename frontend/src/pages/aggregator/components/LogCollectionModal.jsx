import React from 'react';
import { FlaskConical } from 'lucide-react';

export const LogCollectionModal = ({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    activeConnections,
    selectedConnection,
    setSelectedConnection,
    litres,
    setLitres,
    price,
    setPrice,
    lactometer,
    setLactometer,
    temperature,
    setTemperature,
    alcoholPassed,
    setAlcoholPassed,
    qualityGrade,
    setQualityGrade,
    rejectionReason,
    setRejectionReason,
    calculatedPayout
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="backdrop-blur-2xl bg-white/95 border border-white/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/70">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <FlaskConical className="w-5 h-5 text-blue-600" />
                            Log Milk Pickup & Quality Verification
                        </h3>
                        <p className="text-xs text-slate-500">Record intake volume, platform density testing, and payout</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 touch-target">&times;</button>
                </div>
                <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Contracted Farm</label>
                        <select 
                            className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
                            value={selectedConnection}
                            onChange={(e) => setSelectedConnection(e.target.value)}
                            required
                        >
                            <option value="">-- Choose Farm --</option>
                            {activeConnections.map(c => (
                                <option key={c.id} value={c.id}>{c.farm_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Intake Volume (L)</label>
                            <input 
                                type="number" 
                                min="1" step="0.1" 
                                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
                                value={litres}
                                onChange={(e) => setLitres(e.target.value)}
                                required 
                                placeholder="150.0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Agreed Price / L (KES)</label>
                            <input 
                                type="number" 
                                min="1" 
                                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required 
                            />
                        </div>
                    </div>

                    {/* Quality Verification Group */}
                    <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 space-y-3.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                                <FlaskConical size={14} className="text-blue-600" /> Platform Quality Testing
                            </span>
                            <span className="text-[11px] text-blue-700 font-semibold">Standard: Pure Milk QA</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">Lactometer Reading (sp.gr)</label>
                                <input 
                                    type="number" 
                                    step="0.001" 
                                    min="1.015" 
                                    max="1.045"
                                    value={lactometer}
                                    onChange={(e) => setLactometer(e.target.value)}
                                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-blue-500"
                                    required
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Std: 1.028 – 1.032. &lt;1.026 implies dilution.</p>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">Milk Temperature (°C)</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    min="-5.0" 
                                    max="50.0"
                                    value={temperature}
                                    onChange={(e) => setTemperature(e.target.value)}
                                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-blue-500"
                                    required
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Cold-chain intake std: ≤ 4.5°C.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Alcohol Platform Test (68% Ethanol)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setAlcoholPassed(true)}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition touch-target ${alcoholPassed ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    Passed (Homogeneous)
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setAlcoholPassed(false);
                                        setQualityGrade('REJECTED');
                                        if (!rejectionReason) setRejectionReason('Failed alcohol platform test (acid curdling / high titratable acidity)');
                                    }}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition touch-target ${!alcoholPassed ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    Failed (Curdled / Sour)
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Assigned Quality Grade</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setQualityGrade('GRADE_A')}
                                    className={`py-2 px-2 rounded-lg text-xs font-bold border transition touch-target ${qualityGrade === 'GRADE_A' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200'}`}
                                >
                                    Grade A (Premium)
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setQualityGrade('GRADE_B')}
                                    className={`py-2 px-2 rounded-lg text-xs font-bold border transition touch-target ${qualityGrade === 'GRADE_B' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200'}`}
                                >
                                    Grade B (Standard)
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setQualityGrade('REJECTED');
                                        if (!rejectionReason) setRejectionReason('Lactometer density below standard (< 1.026 - suspected water addition)');
                                    }}
                                    className={`py-2 px-2 rounded-lg text-xs font-bold border transition touch-target ${qualityGrade === 'REJECTED' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200'}`}
                                >
                                    Rejected
                                </button>
                            </div>
                        </div>

                        {qualityGrade === 'REJECTED' && (
                            <div className="space-y-1.5 bg-rose-50 border border-rose-200 p-3 rounded-xl animate-in fade-in duration-200">
                                <label className="block text-[11px] font-bold text-rose-800">Reason for Batch Rejection</label>
                                <select 
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full bg-white border border-rose-300 text-rose-900 rounded-lg p-2 text-xs font-medium focus:ring-rose-500"
                                    required
                                >
                                    <option value="">-- Choose Rejection Reason --</option>
                                    <option value="Lactometer density below standard (< 1.026 - suspected water addition)">Lactometer density below standard (&lt; 1.026 - suspected water dilution)</option>
                                    <option value="Failed alcohol platform test (acid curdling / high titratable acidity)">Failed alcohol platform test (acid curdling / high acidity)</option>
                                    <option value="Temperature exceeds safe cold-chain preservation limit (> 10°C)">Temperature exceeds preservation limit (&gt; 10°C)</option>
                                    <option value="Visual flakes, clots or blood observed (mastitis symptoms)">Visual flakes, clots or blood observed (mastitis risk)</option>
                                </select>
                                <p className="text-[10px] text-rose-600 font-semibold pt-1">
                                    Notice: Per QA standards, rejected milk batches are logged with KES 0 total settlement.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Settlement Summary */}
                    <div className="bg-slate-100/80 border border-slate-200 p-4 rounded-xl flex justify-between items-center">
                        <div>
                            <span className="font-bold text-slate-700 text-xs block">Farmer Settlement Payout</span>
                            {qualityGrade === 'REJECTED' ? (
                                <span className="text-[11px] font-semibold text-rose-600">Zero Payout (Batch Rejected)</span>
                            ) : (
                                <span className="text-[11px] text-slate-500">{litres || 0} L @ KES {price || 0}/L</span>
                            )}
                        </div>
                        <span className={`text-xl font-black ${qualityGrade === 'REJECTED' ? 'text-rose-600' : 'text-slate-900'}`}>
                            KES {calculatedPayout.toLocaleString()}
                        </span>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-2.5 rounded-xl hover:bg-slate-50 text-xs touch-target">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2 text-xs touch-target">
                            {isSubmitting ? 'Logging Collection...' : 'Confirm & Log Intake'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
