import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Donation } from '../../types';
import { DashboardCard } from '../../components/DashboardCard';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  Building, 
  Heart, 
  MapPin, 
  CheckCircle, 
  Calendar, 
  ChevronRight, 
  Sparkles,
  UtensilsCrossed,
  Truck
} from 'lucide-react';

export const NgoDashboard: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  
  const [activeClaims, setActiveClaims] = useState<Donation[]>([]);
  const [availablePreview, setAvailablePreview] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  // Statistics
  const [stats, setStats] = useState({
    activeCount: 0,
    pickedUpCount: 0,
    completedCount: 0,
    mealsRescued: 0
  });

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    // 1. Fetch claims assigned to this NGO
    const donationsRef = collection(db, 'donations');
    const claimsQuery = query(
      donationsRef,
      where('claimedBy', '==', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribeClaims = onSnapshot(claimsQuery, (snapshot) => {
      const list: Donation[] = [];
      let activeCount = 0;
      let pickedUpCount = 0;
      let completedCount = 0;
      let mealsRescued = 0;

      snapshot.forEach((docSnap) => {
        const d = { id: docSnap.id, ...docSnap.data() } as Donation;
        list.push(d);

        if (d.status === 'CLAIMED' || d.status === 'CLAIM_REQUESTED' || d.status === 'PICKUP_SCHEDULED') {
          activeCount++;
        } else if (d.status === 'PICKED_UP') {
          pickedUpCount++;
        } else if (d.status === 'COMPLETED' || d.status === 'DELIVERED') {
          completedCount++;
          if (d.unit === 'MEALS') {
            mealsRescued += (d.quantity || 0);
          } else {
            mealsRescued += Math.round((d.quantity || 0) * 2); // approximation
          }
        }
      });

      setActiveClaims(list.filter(d => ['CLAIMED', 'CLAIM_REQUESTED', 'PICKUP_SCHEDULED', 'PICKED_UP'].includes(d.status)));
      setStats({ activeCount, pickedUpCount, completedCount, mealsRescued });
      setLoading(false);
    }, (error) => {
      console.error("NGO Claims subscription failed:", error);
      setLoading(false);
    });

    // 2. Fetch active AVAILABLE donations preview (excluding self if any, but since NGO != Provider, load all available)
    const availableQuery = query(
      donationsRef,
      where('status', '==', 'AVAILABLE'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeAvailable = onSnapshot(availableQuery, (snapshot) => {
      const list: Donation[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Donation);
      });
      setAvailablePreview(list.slice(0, 3)); // preview top 3
    }, (error) => {
      console.error("NGO Available preview subscription failed:", error);
    });

    return () => {
      unsubscribeClaims();
      unsubscribeAvailable();
    };

  }, [currentUser]);

  const isApproved = userProfile?.verificationStatus === 'APPROVED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in" id="ngo-dashboard">
      
      {/* Welcome & Verification Alerts */}
      <div className="bg-white border border-stone-100 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs text-stone-400 font-extrabold uppercase">Charity Operations Portal</p>
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Onboarding Desk, {userProfile?.name}</h2>
          <p className="text-xs text-stone-500 font-semibold flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${isApproved ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            Verification Status: {userProfile?.verificationStatus}
          </p>
        </div>

        {!isApproved && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 font-bold max-w-sm">
            ⚠️ Verification Pending. You can browse lists, but can only claim once Approved by operations admin. Submit details in Profile.
          </div>
        )}
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <DashboardCard 
          title="Meals Rescued"
          value={stats.mealsRescued}
          subtitle="Approx. total meals distributed"
          icon={<Heart className="w-5 h-5 fill-emerald-600 text-emerald-600" />}
        />
        <DashboardCard 
          title="Active Claims"
          value={stats.activeCount}
          subtitle="Awaiting pickup/transit"
          icon={<Building className="w-5 h-5" />}
        />
        <DashboardCard 
          title="In Transit"
          value={stats.pickedUpCount}
          subtitle="Currently picked up"
          icon={<Truck className="w-5 h-5" />}
        />
        <DashboardCard 
          title="Completed Deliveries"
          value={stats.completedCount}
          subtitle="Delivered successfully"
          icon={<CheckCircle className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Col (7 cols): Active Claims List */}
        <div className="lg:col-span-7 bg-white border border-stone-100 rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-50 pb-3">
            <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">Your Active Claim Pipelines</h3>
            <Link to="/ngo/claims" className="text-xs font-bold text-emerald-600 hover:underline">All Claims</Link>
          </div>

          {loading ? (
            <div className="space-y-2 py-4">
              <div className="h-10 bg-stone-50 animate-pulse rounded-lg"></div>
            </div>
          ) : activeClaims.length > 0 ? (
            <div className="space-y-4">
              {activeClaims.map((claim) => (
                <div key={claim.id} className="p-4 bg-stone-50/50 rounded-xl border border-stone-100 flex justify-between items-center gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-stone-900 text-sm leading-snug">{claim.foodName}</p>
                    <p className="text-xs text-stone-400">Listed by: <strong>{claim.providerName}</strong></p>
                    <div className="flex items-center gap-2 text-[10px] text-stone-500 font-semibold pt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-stone-400" />{claim.area}</span>
                      <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-stone-400" />Pickup PIN: {claim.pickupCode}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={claim.status} />
                    <Link
                      to={`/ngo/claims/${claim.id}`}
                      className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors inline-block"
                      id={`manage-claim-btn-${claim.id}`}
                    >
                      Retrieve Address & Complete
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 space-y-2">
              <p className="text-xs text-stone-500">You do not have any active claims in progress.</p>
              <Link to="/ngo/food" className="text-xs font-bold text-emerald-600 hover:underline inline-block">Discover available food listings now</Link>
            </div>
          )}
        </div>

        {/* Right Col (5 cols): Nearby Available Listings */}
        <div className="lg:col-span-5 bg-white border border-stone-100 rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-50 pb-3">
            <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">Surplus Alerts Nearby</h3>
            <Link to="/ngo/food" className="text-xs font-bold text-emerald-600 hover:underline">See All</Link>
          </div>

          <div className="space-y-4">
            {availablePreview.length > 0 ? (
              availablePreview.map((d) => (
                <div key={d.id} className="p-3 bg-stone-50/20 rounded-xl border border-stone-50 hover:border-emerald-100 transition-colors flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center font-extrabold text-sm text-emerald-700 shrink-0">
                    🍲
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h5 className="font-bold text-stone-900 text-xs truncate leading-none">{d.foodName}</h5>
                    <p className="text-[10px] text-stone-400 font-semibold">{d.quantity} {d.unit} listed in <strong>{d.area}</strong></p>
                    <p className="text-[9px] text-stone-400 font-medium">Expires: {new Date(d.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <Link
                    to="/ngo/food"
                    className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-400 text-center py-6">All nearby food currently rescued!</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
