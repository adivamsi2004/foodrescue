import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, runTransaction, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Donation, FoodCategory, FoodType } from '../types';
import { FoodCard } from '../components/FoodCard';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { 
  Search, 
  SlidersHorizontal, 
  UtensilsCrossed, 
  MapPin, 
  ShieldCheck, 
  Leaf, 
  Flame, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';

export const AvailableFood: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const { sendNotification } = useNotifications();
  
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<FoodType | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'ALL'>('ALL');
  const [selectedArea, setSelectedArea] = useState('');

  // Claim process state
  const [activeDonation, setActiveDonation] = useState<Donation | null>(null);
  const [claimConfirmOpen, setClaimConfirmOpen] = useState(false);
  const [claimingState, setClaimingState] = useState(false);

  // Load available donations
  const loadDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const donationsRef = collection(db, 'donations');
      // For discovery, we display AVAILABLE donations
      const q = query(
        donationsRef,
        where('status', '==', 'AVAILABLE'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const list: Donation[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Donation);
      });
      setDonations(list);
      setFilteredDonations(list);
    } catch (err: any) {
      console.error("Error loading available food listing:", err);
      setError("Failed to fetch available donations. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  // Filter application
  useEffect(() => {
    let result = [...donations];

    // Search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.foodName.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.providerName.toLowerCase().includes(q) ||
        d.area.toLowerCase().includes(q)
      );
    }

    // Food Type filter
    if (selectedType !== 'ALL') {
      result = result.filter(d => d.foodType === selectedType);
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter(d => d.category === selectedCategory);
    }

    // Area filter
    if (selectedArea.trim() !== '') {
      const areaLower = selectedArea.toLowerCase();
      result = result.filter(d => d.area.toLowerCase().includes(areaLower));
    }

    setFilteredDonations(result);
  }, [searchQuery, selectedType, selectedCategory, selectedArea, donations]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedCategory('ALL');
    setSelectedArea('');
  };

  // Initiates the claim flow
  const handleClaimClick = (donation: Donation) => {
    if (!currentUser || !userProfile) {
      setError("Please sign in or register to claim available food donations.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Providers cannot claim
    if (userProfile.role === 'PROVIDER') {
      setError("Providers are restricted from claiming food donations.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check NGO verification
    if (userProfile.role === 'NGO' && userProfile.verificationStatus !== 'APPROVED') {
      setError("Only approved NGOs can claim donations. Please submit verification documents in your NGO Profile.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Cannot claim own donation (safety guard)
    if (donation.providerId === currentUser.uid) {
      setError("You cannot claim your own donation.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Expired check
    if (new Date(donation.expiresAt) < new Date()) {
      setError("This donation has expired and cannot be claimed.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActiveDonation(donation);
    setClaimConfirmOpen(true);
  };

  // Performs transaction claim
  const executeClaim = async () => {
    if (!activeDonation || !currentUser || !userProfile) return;
    setClaimingState(true);
    setClaimConfirmOpen(false);
    setError(null);
    setSuccessMsg(null);

    const donationRef = doc(db, 'donations', activeDonation.id!);

    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(donationRef);
        if (!docSnap.exists()) {
          throw new Error("Donation record does not exist.");
        }

        const data = docSnap.data() as Donation;
        if (data.status !== 'AVAILABLE') {
          throw new Error("This donation is no longer available. Someone else may have claimed it.");
        }

        // Generate a 6-digit pickup verification code
        const secureCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Perform transaction write
        transaction.update(donationRef, {
          status: 'CLAIMED',
          claimedBy: currentUser.uid,
          claimedByName: userProfile.name,
          claimedAt: serverTimestamp(),
          pickupCode: secureCode,
          updatedAt: serverTimestamp()
        });
      });

      // Claims record matching (Optional MVP logging, but we can also write the claims collection)
      const claimId = `claim_${activeDonation.id}_${currentUser.uid}`;
      const claimsRef = doc(db, 'claims', claimId);
      
      // We can use a transaction or standard write for sub logging
      // Since it is claimed, write detailed notification
      await sendNotification(
        activeDonation.providerId,
        "Your food donation has been claimed!",
        `Your listing for "${activeDonation.foodName}" was claimed by ${userProfile.name}. Coordinate pickup via dashboard.`,
        'CLAIM',
        activeDonation.id
      );

      await sendNotification(
        currentUser.uid,
        "Food claim successful!",
        `You have successfully claimed "${activeDonation.foodName}". Your pickup verification code is saved on your dashboard.`,
        'CLAIM',
        activeDonation.id
      );

      setSuccessMsg(`Congratulations! You have successfully claimed "${activeDonation.foodName}". The provider has been notified.`);
      // Reload matching dataset
      await loadDonations();
    } catch (err: any) {
      console.error("Claim transaction failed:", err);
      setError(err.message || "An unexpected error occurred during claim. Please try again.");
    } finally {
      setClaimingState(false);
      setActiveDonation(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in" id="available-food-hub">
      
      {/* 1. Header Banner */}
      <div className="bg-stone-900 rounded-2xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-emerald-500/15 blur-xl"></div>
        <div className="space-y-2 relative">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-3 h-3 fill-emerald-400" />
            Live Neighborhood Feed
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Rescue Surplus Edible Food</h2>
          <p className="text-xs text-stone-400 max-w-lg leading-relaxed">
            Search, filter, and claim surplus food listed by local hotels, restaurants, bakeries, and kitchens. Ensure rapid collection to keep meals safe.
          </p>
        </div>
        <div className="bg-stone-800 p-4 border border-stone-800 rounded-xl relative shrink-0 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-xs font-bold text-stone-300">Listening to active Firestore listings</span>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex items-start gap-3.5 text-emerald-900 text-sm animate-scale-up" id="claim-success-banner">
          <CheckCircle2 className="w-5.5 h-5.5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-base text-emerald-800">Claim Handover Secured!</span>
            <p className="leading-relaxed">{successMsg}</p>
            <p className="text-xs text-emerald-600 font-semibold pt-1">
              Go to your Claim Dashboard or Task portal to retrieve the pickup coordination address.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 flex items-start gap-3.5 text-rose-900 text-sm animate-scale-up" id="claim-error-banner">
          <AlertCircle className="w-5.5 h-5.5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-base text-rose-800">Action Restricted</span>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* 2. SEARCH & FILTER HUB */}
      <div className="bg-white border border-stone-100 p-6 rounded-2xl shadow-xs space-y-4" id="search-filter-hub">
        <div className="flex items-center gap-2 text-stone-700 font-bold text-sm pb-1 border-b border-stone-50">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          Filter & Search Listings
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Keyword Search */}
          <div className="space-y-1.5 col-span-1 sm:col-span-2">
            <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wide">Search Term</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food name, description, area, provider..."
                className="w-full text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden pl-10 pr-4 py-3 rounded-xl transition-all"
                id="search-input"
              />
            </div>
          </div>

          {/* Area Search */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wide">Specific Neighborhood</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
              <input 
                type="text"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                placeholder="e.g. Manhattan, Brooklyn..."
                className="w-full text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden pl-9 pr-4 py-3 rounded-xl transition-all"
                id="area-filter"
              />
            </div>
          </div>

          {/* Food Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wide">Food Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-xl transition-all bg-white"
              id="type-filter"
            >
              <option value="ALL">All Food Types</option>
              <option value="VEGETARIAN">Vegetarian Only</option>
              <option value="NON_VEGETARIAN">Non-Vegetarian Only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          {/* Category Select */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wide">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-xl transition-all bg-white"
              id="category-filter"
            >
              <option value="ALL">All Categories</option>
              <option value="RICE">Rice Bowls / Biryani</option>
              <option value="MEALS">Prepared Meals / Curries</option>
              <option value="BAKERY">Bakery & Breads</option>
              <option value="FRUITS">Fruits Basket</option>
              <option value="VEGETABLES">Vegetables</option>
              <option value="SNACKS">Snacks & Dry Food</option>
              <option value="PACKAGED_FOOD">Packaged Goods</option>
              <option value="OTHER">Other Food Items</option>
            </select>
          </div>

          <div className="flex items-end col-span-1 sm:col-span-3">
            <button 
              onClick={handleClearFilters}
              className="px-4 py-3 text-xs font-bold text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-all border border-transparent hover:border-stone-200 shrink-0 cursor-pointer"
              id="clear-filters-btn"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE CARDS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-stone-100 rounded-xl p-5 h-80 animate-pulse space-y-4">
              <div className="w-full h-44 bg-stone-100 rounded-lg animate-pulse"></div>
              <div className="h-6 bg-stone-100 rounded-md w-3/4"></div>
              <div className="h-4 bg-stone-100 rounded-md w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredDonations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="listings-grid">
          {filteredDonations.map((donation) => (
            <FoodCard 
              key={donation.id} 
              donation={donation} 
              actionButton={
                <button
                  onClick={() => handleClaimClick(donation)}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-center flex-1 transition-colors cursor-pointer"
                  id={`claim-btn-${donation.id}`}
                >
                  Claim Food
                </button>
              }
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-stone-200 py-16 px-6 text-center space-y-4 shadow-sm" id="empty-listings-state">
          <div className="p-4 bg-stone-50 w-16 h-16 rounded-full shadow-xs mx-auto flex items-center justify-center text-stone-400">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h4 className="font-extrabold text-stone-800 text-lg">No surplus food listings matches</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              We couldn't find any available surplus food matching your current search options. Try reducing keyword search parameters or changing categories.
            </p>
            <button 
              onClick={handleClearFilters}
              className="mt-2 inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Reset Search Parameters
            </button>
          </div>
        </div>
      )}

      {/* Claim confirmation dialog */}
      <ConfirmDialog 
        isOpen={claimConfirmOpen}
        title="Confirm Redistribution Claim"
        message={`Are you sure you want to claim the surplus listing: "${activeDonation?.foodName}"? By confirming, you commit to picking up the package within the specified window (${activeDonation ? new Date(activeDonation.pickupStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} - ${activeDonation ? new Date(activeDonation.pickupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}).`}
        confirmLabel={claimingState ? "Processing Claim..." : "Confirm Claim"}
        cancelLabel="Cancel"
        onConfirm={executeClaim}
        onCancel={() => {
          setClaimConfirmOpen(false);
          setActiveDonation(null);
        }}
      />
    </div>
  );
};
