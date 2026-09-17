import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Donation, DonationStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  User as UserIcon, 
  CheckCircle, 
  AlertCircle,
  Truck,
  Heart,
  Calendar,
  Lock,
  Building,
  Navigation
} from 'lucide-react';

export const ClaimDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, userProfile } = useAuth();
  const { sendNotification } = useNotifications();
  const navigate = useNavigate();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delivery Dialog state
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [deliveredTo, setDeliveredTo] = useState('');
  const [peopleServed, setPeopleServed] = useState<number>(10);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  const fetchDonation = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'donations', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Donation;
        // Verify claimant permissions
        if (data.claimedBy !== currentUser?.uid && userProfile?.role !== 'ADMIN') {
          setError("You are not authorized to view this claim.");
          return;
        }
        setDonation({ id: docSnap.id, ...data });
      } else {
        setError("Donation record not found.");
      }
    } catch (err) {
      console.error("Error loading claim detail:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonation();
  }, [id, currentUser]);

  const handleMarkDelivered = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donation || !deliveredTo || peopleServed <= 0) return;

    setSubmittingDelivery(true);
    try {
      const donationRef = doc(db, 'donations', donation.id!);
      await updateDoc(donationRef, {
        status: 'COMPLETED' as DonationStatus,
        deliveredTo,
        peopleServed,
        deliveryNotes,
        deliveredAt: serverTimestamp(),
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Dispatch real-time alerts
      await sendNotification(
        donation.providerId,
        "Redistribution delivery complete!",
        `Claimant reported that "${donation.foodName}" was successfully delivered, serving ${peopleServed} people.`,
        'STATUS_CHANGE',
        donation.id
      );

      setDeliveryOpen(false);
      await fetchDonation();
    } catch (err: any) {
      console.error("Marking delivery failed:", err);
      setError("Failed to record delivery logs.");
    } finally {
      setSubmittingDelivery(false);
    }
  };

  // Maps navigation helper
  const handleOpenMaps = () => {
    if (!donation) return;
    const addressEscaped = encodeURIComponent(donation.pickupAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${addressEscaped}`, '_blank');
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
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto animate-pulse" />
        <h3 className="text-xl font-bold text-stone-900">{error || "Access Restrained"}</h3>
        <Link to="/ngo/dashboard" className="text-sm font-bold text-emerald-600 hover:underline inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fade-in" id="claim-detail-panel">
      
      {/* Header */}
      <div className="space-y-1">
        <Link to="/ngo/dashboard" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5" id="claim-back-link">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Claim Coordination</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (7 cols): Food Specs & Private Pickup details */}
        <div className="md:col-span-7 bg-white border border-stone-100 p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex items-start justify-between border-b border-stone-50 pb-4">
            <div className="space-y-1">
              <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest">{donation.category}</span>
              <h3 className="text-lg font-extrabold text-stone-900 leading-tight">{donation.foodName}</h3>
              <p className="text-xs text-stone-500">{donation.description}</p>
            </div>
            <StatusBadge status={donation.status} />
          </div>

          {/* Unlocked private provider details */}
          <div className="space-y-4" id="unlocked-private-info">
            <h4 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              Private Contact Credentials Unlocked
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-stone-700 bg-emerald-50/20 border border-emerald-100 p-4 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Building className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-stone-400 uppercase leading-none mb-0.5">Supplier Name</p>
                  <p className="font-bold text-stone-800">{donation.providerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <MapPin className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-stone-400 uppercase leading-none mb-0.5">Pickup Address</p>
                  <p className="font-bold text-stone-800">{donation.pickupAddress}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleOpenMaps}
                className="inline-flex items-center gap-1 text-xs font-bold bg-white hover:bg-stone-50 border border-stone-200 p-2.5 rounded-lg transition-colors cursor-pointer"
                id="maps-navigation-btn"
              >
                <Navigation className="w-4 h-4 text-emerald-600" />
                Open Directions in Google Maps
              </button>
            </div>
          </div>

          <div className="border-t border-stone-50 pt-4 grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
            <div>
              <p className="text-stone-400 font-bold uppercase">Meals Count</p>
              <p className="text-stone-800 font-extrabold text-sm">{donation.quantity} {donation.unit}</p>
            </div>
            <div>
              <p className="text-stone-400 font-bold uppercase">Diet Classification</p>
              <p className="text-stone-800 font-bold text-sm">{donation.foodType}</p>
            </div>
            <div>
              <p className="text-stone-400 font-bold uppercase">Allergens List</p>
              <p className="text-rose-700 font-bold text-sm">{donation.allergens || 'NoneDeclared'}</p>
            </div>
            <div>
              <p className="text-stone-400 font-bold uppercase">Storage Methods</p>
              <p className="text-stone-800 font-semibold">{donation.storageCondition}</p>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Code handoff guides & delivery triggers */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Code handoff instruction card */}
          {donation.status === 'CLAIMED' && (
            <div className="bg-white border border-stone-100 p-6 rounded-2xl shadow-xs space-y-4">
              <h4 className="font-extrabold text-xs text-stone-400 uppercase tracking-wider">Handoff Verification Code</h4>
              <div className="bg-amber-50/50 p-4 border border-amber-100 rounded-xl text-center space-y-1.5" id="claimant-pickup-pin-container">
                <p className="text-[10px] text-amber-800 font-extrabold uppercase">State this PIN at collection</p>
                <p className="text-3xl font-extrabold text-stone-900 tracking-widest">{donation.pickupCode}</p>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed text-center">
                The provider will type this PIN on their device to verify your collection. Status changes to PICKED_UP automatically.
              </p>
            </div>
          )}

          {/* If picked up: MARK AS DELIVERED */}
          {donation.status === 'PICKED_UP' && (
            <div className="bg-white border border-stone-100 p-6 rounded-2xl shadow-xs space-y-4">
              <h4 className="font-extrabold text-xs text-stone-400 uppercase tracking-wider">Transit Coordination</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Surplus package collected. Transport the food immediately and mark delivery completed below.
              </p>
              
              <button
                onClick={() => setDeliveryOpen(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold py-3.5 rounded-xl text-xs transition-colors shadow-xs hover:shadow-emerald-100 cursor-pointer text-center"
                id="claim-mark-delivered-btn"
              >
                Mark as Delivered
              </button>
            </div>
          )}

          {donation.status === 'COMPLETED' && (
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-xs text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Delivery Tally Complete
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                This surplus batch has been delivered, serving <strong>{donation.peopleServed}</strong> people in the community. Thank you for your support!
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Delivery Logger Modal Form */}
      {deliveryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" id="delivery-modal">
          <div className="bg-white rounded-xl max-w-md w-full border border-stone-200 overflow-hidden shadow-xl animate-scale-up">
            <form onSubmit={handleMarkDelivered}>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-stone-50">
                  <h3 className="text-base font-bold text-stone-900">Complete Delivery Impact</h3>
                  <button type="button" onClick={() => setDeliveryOpen(false)} className="text-stone-400 hover:text-stone-600">✕</button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">Delivered To *</label>
                  <input 
                    type="text"
                    value={deliveredTo}
                    onChange={(e) => setDeliveredTo(e.target.value)}
                    placeholder="e.g. Hope Homeless Shelter"
                    className="w-full text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-lg transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">Number of People Served *</label>
                  <input 
                    type="number"
                    min={1}
                    value={peopleServed}
                    onChange={(e) => setPeopleServed(Number(e.target.value))}
                    className="w-full text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-lg transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">Optional Delivery Notes</label>
                  <textarea 
                    rows={3}
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Provide any additional comments or thank you notes..."
                    className="w-full text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-lg transition-all resize-none"
                  />
                </div>
              </div>

              <div className="bg-stone-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setDeliveryOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDelivery}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer shadow-xs"
                >
                  {submittingDelivery ? 'Recording details...' : 'Submit & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
