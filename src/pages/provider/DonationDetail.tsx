import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Donation, DonationStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  ShieldAlert,
  Building, 
  Phone, 
  Calendar,
  AlertTriangle,
  FileCheck2,
  Lock
} from 'lucide-react';

export const DonationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, userProfile } = useAuth();
  const { sendNotification } = useNotifications();
  const navigate = useNavigate();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Verification portal
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Cancel dialog
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchDonation = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'donations', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Donation;
        // Verify ownership
        if (data.providerId !== currentUser?.uid && userProfile?.role !== 'ADMIN') {
          setError("You are not authorized to manage this donation.");
          return;
        }
        setDonation({ id: docSnap.id, ...data });
      } else {
        setError("Donation record not found.");
      }
    } catch (err) {
      console.error("Failed to load donation detail:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonation();
  }, [id, currentUser]);

  // Execute verification code checking
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donation || !verifyCode) return;
    
    setVerifyError(null);
    setVerifying(true);
    setSuccess(null);

    if (verifyCode !== donation.pickupCode) {
      setVerifyError("Incorrect verification code. Please check with the claimant.");
      setVerifying(false);
      return;
    }

    const donationRef = doc(db, 'donations', donation.id!);

    try {
      // Use Firestore Transaction for critical safety transitions
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(donationRef);
        const data = snap.data() as Donation;
        if (data.status !== 'CLAIMED' && data.status !== 'CLAIM_REQUESTED') {
          throw new Error("Only claimed donations can perform code handovers.");
        }

        transaction.update(donationRef, {
          status: 'PICKED_UP' as DonationStatus,
          pickedUpAt: serverTimestamp(),
          pickedUpBy: donation.claimedByName || "Verified Claimant",
          updatedAt: serverTimestamp()
        });
      });

      // Dispatch real-time alerts
      await sendNotification(
        donation.claimedBy!,
        "Surplus pickup verified!",
        `The provider verified your handover code for "${donation.foodName}". Keep up the great work!`,
        'STATUS_CHANGE',
        donation.id
      );

      setSuccess("Verification successful! Handoff complete. Status updated to PICKED_UP.");
      await fetchDonation();
    } catch (err: any) {
      console.error("Verification transaction failed:", err);
      setVerifyError(err.message || "Handoff verification transaction error.");
    } finally {
      setVerifying(false);
      setVerifyCode('');
    }
  };

  // Perform cancellation
  const handleCancelDonation = async () => {
    if (!donation) return;
    setCancelling(true);
    setCancelOpen(false);
    setError(null);

    try {
      const docRef = doc(db, 'donations', donation.id!);
      await updateDoc(docRef, {
        status: 'CANCELLED' as DonationStatus,
        updatedAt: serverTimestamp()
      });

      // If claimed, alert claimant
      if (donation.claimedBy) {
        await sendNotification(
          donation.claimedBy,
          "Donation listing cancelled.",
          `The provider has cancelled the listing for "${donation.foodName}".`,
          'STATUS_CHANGE',
          donation.id
        );
      }

      setSuccess("Surplus listing cancelled successfully.");
      await fetchDonation();
    } catch (err: any) {
      console.error("Cancellation failed:", err);
      setError("Failed to cancel listed donation.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <h3 className="text-xl font-bold text-stone-900">{error || "Access Denied"}</h3>
        <Link to="/provider/dashboard" className="text-sm font-bold text-emerald-600 hover:underline inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fade-in" id="provider-donation-detail">
      
      {/* Navigation */}
      <div className="space-y-1">
        <Link to="/provider/donations" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5" id="detail-back-link">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Logs
        </Link>
        <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Redistribution Manager</h2>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3.5 text-emerald-800 text-sm animate-scale-up" id="detail-success-banner">
          <FileCheck2 className="w-5.5 h-5.5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="font-bold">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left column (7 cols): Food overview details */}
        <div className="md:col-span-7 bg-white border border-stone-100 p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex items-start justify-between border-b border-stone-50 pb-4">
            <div className="space-y-1">
              <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest">{donation.category}</span>
              <h3 className="text-lg font-extrabold text-stone-900 leading-tight">{donation.foodName}</h3>
              <p className="text-xs text-stone-500">{donation.description}</p>
            </div>
            <StatusBadge status={donation.status} />
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
            <div>
              <p className="text-stone-400 font-bold uppercase">Quantity Listed</p>
              <p className="text-stone-800 font-extrabold text-sm">{donation.quantity} {donation.unit}</p>
            </div>
            <div>
              <p className="text-stone-400 font-bold uppercase">Classification</p>
              <p className="text-stone-800 font-bold text-sm">{donation.foodType}</p>
            </div>
            <div>
              <p className="text-stone-400 font-bold uppercase">Allergen Safety</p>
              <p className="text-rose-700 font-bold text-sm">{donation.allergens || 'NoneDeclared'}</p>
            </div>
            <div>
              <p className="text-stone-400 font-bold uppercase">Storage Method</p>
              <p className="text-stone-800 font-semibold">{donation.storageCondition}</p>
            </div>
          </div>

          <div className="border-t border-stone-50 pt-4 space-y-3 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
              <span>Prepared: <strong>{new Date(donation.preparedAt).toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-400 shrink-0" />
              <span>Expires: <strong>{new Date(donation.expiresAt).toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
              <span>Pickup address: <strong>{donation.pickupAddress}</strong></span>
            </div>
          </div>

          {donation.status === 'AVAILABLE' && (
            <div className="border-t border-stone-50 pt-4 flex justify-end">
              <button
                onClick={() => setCancelOpen(true)}
                disabled={cancelling}
                className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold px-4 py-2.5 rounded-lg text-xs cursor-pointer transition-colors"
                id="listing-cancel-btn"
              >
                {cancelling ? 'Cancelling listing...' : 'Cancel Donation Listing'}
              </button>
            </div>
          )}
        </div>

        {/* Right column (5 cols): Secure Handover portal */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Active claim status card */}
          {donation.status === 'AVAILABLE' ? (
            <div className="bg-stone-50 border border-stone-200/60 p-6 rounded-2xl space-y-3">
              <h4 className="font-bold text-sm text-stone-800">Claimant Status: Awaiting Match</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                This listing is active and visible to verified non profit organizations. You will receive a real-time notification as soon as it is claimed.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-stone-100 p-6 rounded-2xl shadow-xs space-y-4">
              <h4 className="font-extrabold text-xs text-stone-400 uppercase tracking-wider">Active Claimant Details</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-stone-800 leading-none">{donation.claimedByName || "Verified NGO"}</h5>
                  <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block mt-1">APPROVED NGO</span>
                </div>
              </div>

              {/* Handover Code Verification form */}
              {(donation.status === 'CLAIMED' || donation.status === 'CLAIM_REQUESTED') && (
                <div className="border-t border-stone-50 pt-4 space-y-4" id="pickup-verification-portal">
                  <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex gap-2 text-xs text-stone-600 leading-relaxed">
                    <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-800 block mb-0.5">Secure Pickup Code Handover</span>
                      Type the claimant's internal 6-digit confirmation PIN below at handover to confirm the pickup.
                    </div>
                  </div>

                  {verifyError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3 text-xs flex gap-2 font-semibold">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      {verifyError}
                    </div>
                  )}

                  <form onSubmit={handleVerifyCode} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-stone-400 uppercase">6-Digit Verification PIN</label>
                      <input 
                        type="text"
                        maxLength={6}
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 482913"
                        className="w-full text-center tracking-widest text-lg font-extrabold border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-xl bg-stone-50 focus:bg-white transition-all"
                        required
                        id="verify-code-input"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={verifying}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold py-3 rounded-xl text-xs transition-colors shadow-xs hover:shadow-emerald-100 disabled:opacity-50 cursor-pointer"
                      id="verify-code-submit"
                    >
                      {verifying ? 'Verifying handoff PIN...' : 'Verify Code & Handover'}
                    </button>
                  </form>
                </div>
              )}

              {/* If already picked up */}
              {donation.status === 'PICKED_UP' && (
                <div className="border-t border-stone-50 pt-4 flex gap-2 items-center text-xs text-emerald-800 font-bold bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  Handoff verified successfully. Awaiting delivery completion.
                </div>
              )}

              {/* Completed */}
              {donation.status === 'COMPLETED' && (
                <div className="border-t border-stone-50 pt-4 space-y-3">
                  <div className="flex gap-2 items-center text-xs text-emerald-800 font-bold bg-emerald-100/50 p-3 rounded-xl border border-emerald-200">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    Redistribution Complete! Impact reported below.
                  </div>

                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/50 text-xs text-stone-600 space-y-1.5">
                    <p className="font-bold">Delivered To: <span className="text-stone-800">{donation.deliveredTo || 'Local shelters'}</span></p>
                    <p className="font-bold">People Served: <span className="text-emerald-700 font-extrabold text-sm">{donation.peopleServed || donation.quantity}</span></p>
                    {donation.deliveryNotes && (
                      <p className="italic text-[11px] text-stone-400">"{donation.deliveryNotes}"</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Cancel confirmation dialog */}
      <ConfirmDialog 
        isOpen={cancelOpen}
        title="Cancel Surplus Listing"
        message="Are you sure you want to cancel this surplus food listing? It will immediately disappear from the live available feed."
        confirmLabel="Yes, Cancel"
        cancelLabel="Discard"
        isDanger={true}
        onConfirm={handleCancelDonation}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
};
