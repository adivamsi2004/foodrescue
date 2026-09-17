import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Donation, DonationStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Plus, Search, MapPin, SlidersHorizontal, ArrowLeft } from 'lucide-react';

export const ProviderDonations: React.FC = () => {
  const { currentUser } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filtered, setFiltered] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DonationStatus | 'ALL'>('ALL');

  useEffect(() => {
    if (!currentUser) return;
    const fetchDonations = async () => {
      try {
        const donationsRef = collection(db, 'donations');
        const q = query(
          donationsRef,
          where('providerId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const list: Donation[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Donation);
        });
        setDonations(list);
        setFiltered(list);
      } catch (err) {
        console.error("Failed to load provider donations list:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, [currentUser]);

  useEffect(() => {
    let result = [...donations];
    if (search.trim() !== '') {
      const s = search.toLowerCase();
      result = result.filter(d => d.foodName.toLowerCase().includes(s));
    }
    if (statusFilter !== 'ALL') {
      result = result.filter(d => d.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, donations]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in" id="provider-donations-list">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/provider/dashboard" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Your Donation Logs</h2>
          <p className="text-xs text-stone-500">Track claim statuses, pickup verification schedules, and historical delivery logs.</p>
        </div>

        <Link 
          to="/provider/donations/create"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-lg text-sm transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create New Listing
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-stone-100 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listed items..."
            className="w-full text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden pl-9 pr-4 py-2.5 rounded-lg transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-2.5 rounded-lg transition-all bg-white w-full sm:w-48"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="CLAIMED">Claimed</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="COMPLETED">Completed</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-3 py-6">
          <div className="h-10 bg-stone-50 animate-pulse rounded-md"></div>
          <div className="h-10 bg-stone-50 animate-pulse rounded-md"></div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white border border-stone-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[10px] font-extrabold text-stone-400 uppercase tracking-wider bg-stone-50/50">
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Date Created</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 text-sm font-medium text-stone-700">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-stone-50/50">
                    <td className="p-4">
                      <p className="font-bold text-stone-900">{d.foodName}</p>
                      <span className="text-[10px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {d.area}, {d.city}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-stone-500 font-bold">{d.foodType}</td>
                    <td className="p-4 font-bold text-stone-800">{d.quantity} {d.unit}</td>
                    <td className="p-4 text-xs text-stone-400">
                      {d.createdAt ? new Date(d.createdAt.toDate ? d.createdAt.toDate() : d.createdAt).toLocaleDateString() : 'Demo'}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        to={`/provider/donations/${d.id}`}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/60 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Manage Listing
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-100 py-16 text-center space-y-3 rounded-2xl">
          <p className="text-sm text-stone-500 font-medium">No matching listings found.</p>
          <button onClick={handleClearFilters} className="text-xs font-bold text-emerald-600 hover:underline">Reset filters</button>
        </div>
      )}

    </div>
  );

  function handleClearFilters() {
    setSearch('');
    setStatusFilter('ALL');
  }
};
