import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Donation } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { MapPin, SlidersHorizontal, ArrowLeft } from 'lucide-react';

export const NgoClaims: React.FC = () => {
  const { currentUser } = useAuth();
  const [claims, setClaims] = useState<Donation[]>([]);
  const [filtered, setFiltered] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<'ACTIVE' | 'COMPLETED' | 'ALL'>('ACTIVE');

  useEffect(() => {
    if (!currentUser) return;
    const fetchClaims = async () => {
      try {
        const donationsRef = collection(db, 'donations');
        const q = query(
          donationsRef,
          where('claimedBy', '==', currentUser.uid),
          orderBy('updatedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const list: Donation[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Donation);
        });
        setClaims(list);
        setFiltered(list.filter(d => ['CLAIMED', 'CLAIM_REQUESTED', 'PICKUP_SCHEDULED', 'PICKED_UP'].includes(d.status)));
      } catch (err) {
        console.error("Failed to fetch NGO claims logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, [currentUser]);

  useEffect(() => {
    if (filter === 'ALL') {
      setFiltered(claims);
    } else if (filter === 'ACTIVE') {
      setFiltered(claims.filter(d => ['CLAIMED', 'CLAIM_REQUESTED', 'PICKUP_SCHEDULED', 'PICKED_UP'].includes(d.status)));
    } else {
      setFiltered(claims.filter(d => ['COMPLETED', 'DELIVERED'].includes(d.status)));
    }
  }, [filter, claims]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in" id="ngo-claims-panel">
      
      {/* Header */}
      <div className="space-y-1">
        <Link to="/ngo/dashboard" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Your Claims Logs</h2>
        <p className="text-xs text-stone-500 font-semibold">Coordinate ongoing rescues and track historical impact deliveries.</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-stone-100 p-3 rounded-xl shadow-xs flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filter === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-500 hover:bg-stone-50'
            }`}
          >
            Active Pipeline
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filter === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-500 hover:bg-stone-50'
            }`}
          >
            Delivered History
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filter === 'ALL' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-500 hover:bg-stone-50'
            }`}
          >
            All Logs
          </button>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="space-y-3 py-6">
          <div className="h-10 bg-stone-50 animate-pulse rounded-md"></div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white border border-stone-100 rounded-2xl shadow-xs divide-y divide-stone-50">
          {filtered.map((claim) => (
            <div key={claim.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-stone-900 text-base leading-snug">{claim.foodName}</h4>
                <p className="text-xs text-stone-500">Supplier: <strong>{claim.providerName}</strong></p>
                <div className="flex items-center gap-2 text-[10px] text-stone-400 font-semibold mt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{claim.area}, {claim.city}</span>
                  <span className="w-1 h-1 bg-stone-200 rounded-full"></span>
                  <span>Quantity: {claim.quantity} {claim.unit}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={claim.status} />
                <Link
                  to={`/ngo/claims/${claim.id}`}
                  className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/60 px-4 py-2 rounded-lg transition-all"
                >
                  Manage Coordination
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-stone-100 py-16 text-center rounded-2xl">
          <p className="text-xs text-stone-500 font-semibold">No records matches under this filter.</p>
        </div>
      )}

    </div>
  );
};
