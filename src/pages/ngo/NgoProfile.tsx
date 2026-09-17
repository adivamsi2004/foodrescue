import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Building, ShieldCheck, FileText, CheckCircle2, Upload } from 'lucide-react';

export const NgoProfile: React.FC = () => {
  const { userProfile, refreshProfile, currentUser } = useAuth();

  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [area, setArea] = useState(userProfile?.area || '');
  const [city, setCity] = useState(userProfile?.city || 'New York');

  // NGO specific details
  const [registrationId, setRegistrationId] = useState(userProfile?.registrationId || '');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docFileName, setDocFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setDocFile(file);
      setDocFileName(file.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFile(file);
      setDocFileName(file.name);
    }
  };

  // Perform document upload
  const uploadDoc = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!docFile || !currentUser) {
        resolve('');
        return;
      }
      const storagePath = `verification_docs/${currentUser.uid}/${Date.now()}_${docFile.name}`;
      const docRef = ref(storage, storagePath);
      const task = uploadBytesResumable(docRef, docFile);

      task.on('state_changed', 
        (snap) => {
          const progress = (snap.bytesTransferred / snap.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        () => resolve(''), // ignore gracefully and complete
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !area) {
      setError("Please complete all required contact fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let documentUrl = userProfile?.verificationDocUrl || '';
      if (docFile) {
        documentUrl = await uploadDoc();
      }

      const userRef = doc(db, 'users', userProfile!.uid);
      const updates: any = {
        name,
        phone,
        area,
        registrationId,
        verificationDocUrl: documentUrl,
        updatedAt: serverTimestamp()
      };

      // If they were UNVERIFIED and provided a doc + registrationId, set status to PENDING_APPROVAL
      if (userProfile?.verificationStatus === 'UNVERIFIED' && registrationId) {
        updates.verificationStatus = 'PENDING_APPROVAL';
      }

      await updateDoc(userRef, updates);
      await refreshProfile();
      setSuccess(true);
    } catch (err: any) {
      console.error("NGO profile update failed:", err);
      setError("Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12" id="ngo-profile-settings">
      <div className="bg-white border border-stone-100 p-8 rounded-2xl shadow-xs space-y-6">
        
        <div className="flex items-center gap-3 border-b border-stone-50 pb-4">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-stone-900 leading-none">NGO Organization Portal</h3>
            <p className="text-[10px] text-stone-400 font-semibold uppercase mt-1">Manage certification status and coordinates</p>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-4 flex items-start gap-2 text-xs animate-scale-up">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            <p className="font-semibold">Profile details saved successfully!</p>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">Registered Email</label>
            <input 
              type="email"
              value={userProfile?.email}
              disabled
              className="w-full text-xs border border-stone-200 bg-stone-50 text-stone-400 p-3 rounded-lg cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">Organization / Contact Name *</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-lg transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">Operations Hotline *</label>
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
              <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">Area Coverage *</label>
              <input 
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-lg transition-all"
                required
              />
            </div>
          </div>

          {/* Verification Audit panel */}
          <div className="border-t border-stone-100 pt-4 space-y-4">
            <h4 className="text-xs font-extrabold text-stone-800 uppercase tracking-wider">Onboarding Verification Status</h4>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs text-stone-600">
              <div className="space-y-0.5">
                <p className="font-bold text-stone-800">Verification Badges</p>
                <p className="text-[10px] text-stone-400">Approved organizations can claim meals</p>
              </div>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                userProfile?.verificationStatus === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : userProfile?.verificationStatus === 'PENDING_APPROVAL'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {userProfile?.verificationStatus}
              </span>
            </div>

            {userProfile?.verificationStatus === 'UNVERIFIED' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">Charitable Registration ID / Licences</label>
                  <input 
                    type="text"
                    value={registrationId}
                    onChange={(e) => setRegistrationId(e.target.value)}
                    placeholder="e.g. NGO-9281-NY"
                    className="w-full text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-lg transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">Upload Verification Documentation</label>
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragActive ? 'border-emerald-500 bg-emerald-50/20' : 'border-stone-200 bg-stone-50/40 hover:border-emerald-400'
                    }`}
                  >
                    <input 
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      id="doc-upload"
                    />
                    <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-stone-400" />
                      <p className="text-xs text-stone-600">
                        {docFileName ? (
                          <span className="font-bold text-emerald-700">{docFileName}</span>
                        ) : (
                          <span><span className="text-emerald-600 font-bold hover:underline">Choose file</span> or drop Certificate PDF here</span>
                        )}
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold py-3.5 rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer text-center"
          >
            {loading ? 'Submitting profiles...' : 'Save Organization Details'}
          </button>
        </form>

      </div>
    </div>
  );
};
