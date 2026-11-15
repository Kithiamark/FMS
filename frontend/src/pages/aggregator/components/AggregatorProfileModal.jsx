import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { ShieldCheck, Save } from 'lucide-react';

export const AggregatorProfileModal = ({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    profileForm,
    setProfileForm
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Aggregator Business KYC & Trade Indemnity">
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization Name</label>
                        <input 
                            required
                            value={profileForm.organization_name}
                            onChange={e => setProfileForm({...profileForm, organization_name: e.target.value})}
                            placeholder="e.g. Brookside Dairy Ltd"
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Business Reg. / Certificate No.</label>
                        <input 
                            value={profileForm.business_reg_no}
                            onChange={e => setProfileForm({...profileForm, business_reg_no: e.target.value})}
                            placeholder="CPR/202X/XXXXX"
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">KRA Tax PIN</label>
                        <input 
                            value={profileForm.kra_pin}
                            onChange={e => setProfileForm({...profileForm, kra_pin: e.target.value})}
                            placeholder="P051XXXXXXZ"
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Contact Officer Name</label>
                        <input 
                            value={profileForm.contact_person}
                            onChange={e => setProfileForm({...profileForm, contact_person: e.target.value})}
                            placeholder="Full name of operations manager"
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Payout Terms</label>
                        <select 
                            value={profileForm.payment_terms}
                            onChange={e => setProfileForm({...profileForm, payment_terms: e.target.value})}
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="Daily">Daily Settlement</option>
                            <option value="Weekly">Weekly (Every Monday)</option>
                            <option value="Bi-Weekly">Bi-Weekly (1st & 15th)</option>
                            <option value="Monthly">Monthly Cycle</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Daily Intake Capacity (L)</label>
                        <input 
                            type="number" 
                            value={profileForm.vehicle_capacity_litres}
                            onChange={e => setProfileForm({...profileForm, vehicle_capacity_litres: Number(e.target.value)})}
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Main Depot / Dispatch Physical Address</label>
                    <input 
                        value={profileForm.office_address}
                        onChange={e => setProfileForm({...profileForm, office_address: e.target.value})}
                        placeholder="Industrial Area, Road C, Depot 4..."
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>

                {/* Indemnity Section */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 space-y-2">
                    <p className="font-bold flex items-center gap-1.5"><ShieldCheck size={16} className="text-blue-600" /> Milk Collection & Trade Settlement Agreement</p>
                    <p className="leading-relaxed text-blue-800">
                        The aggregator confirms adherence to official lactometer density testing, cold chain preservation, and timely payment disbursement according to the declared settlement schedule. The FMS platform functions as an independent verification ledger and does not assume financial underwriting liability for buyer settlement defaults.
                    </p>
                    <label className="flex items-center gap-2 font-bold cursor-pointer pt-1 text-slate-900 touch-target">
                        <input 
                            type="checkbox"
                            checked={profileForm.indemnity_agreed}
                            onChange={e => setProfileForm({...profileForm, indemnity_agreed: e.target.checked})}
                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>I agree to the Commercial Milk Collection & Trade Indemnity Terms</span>
                    </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 touch-target">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 disabled:opacity-50 touch-target shadow-xs">
                        <Save size={14} /> Save Business Profile
                    </button>
                </div>
            </form>
        </Modal>
    );
};
