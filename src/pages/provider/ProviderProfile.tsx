import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, User as UserIcon, CheckCircle2 } from 'lucide-react';

export const ProviderProfile: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  
  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [area, setArea] = useState(userProfile?.area || '');
  const [city, setCity] = useState(userProfile?.city || 'New York');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !area) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const docRef = doc(db, 'users', userProfile!.uid);
      await updateDoc(docRef, {
        name,
        phone,
        area,
        updatedAt: serverTimestamp()
      });
      await refreshProfile();
      setSuccess(true);
    } catch (err: any) {
      console.error("Profile update failed:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12" id="provider-profile-panel">
      <div className="bg-white border border-stone-100 p-8 rounded-2xl shadow-xs space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-stone-50 pb-4">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-stone-900 leading-none">Your Profile Settings</h3>
            <p className="text-[10px] text-stone-400 font-semibold uppercase mt-1">Manage provider accounts and service areas</p>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-4 flex items-start gap-2.5 text-xs animate-scale-up">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            <p className="font-semibold">Profile updated successfully!</p>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">Email Address (Registered)</label>
            <input 
              type="email"
              value={userProfile?.email}
              disabled
              className="w-full text-xs border border-stone-200 bg-stone-50 text-stone-400 p-3 rounded-lg cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">Contact / Provider Name *</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-lg transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">Contact Phone *</label>
            <input 
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-lg transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">City</label>
              <input 
                type="text"
                value={city}
                disabled
                className="w-full text-xs border border-stone-200 bg-stone-50 text-stone-400 p-3 rounded-lg cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">Neighborhood / Area *</label>
              <input 
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-lg transition-all"
                required
              />
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <div className="space-y-0.5">
              <p className="font-bold">Verification Status Badge</p>
              <p className="text-[10px] text-stone-400">Current authorization levels</p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
              userProfile?.verificationStatus === 'APPROVED' || userProfile?.verificationStatus === 'VERIFIED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {userProfile?.verificationStatus}
            </span>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold py-3.5 rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer text-center"
          >
            {loading ? 'Saving adjustments...' : 'Save Profile Adjustments'}
          </button>
        </form>

      </div>
    </div>
  );
};
