import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Donation } from '../../types';
import { DashboardCard } from '../../components/DashboardCard';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Heart, 
  UtensilsCrossed, 
  CheckCircle, 
  Calendar, 
  AlertCircle, 
  Plus,
  ArrowRight,
  TrendingUp,
  MapPin
} from 'lucide-react';

export const ProviderDashboard: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    expired: 0,
    mealsDonated: 0
  });

  // Chart data state
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const donationsRef = collection(db, 'donations');
    const q = query(
      donationsRef,
      where('providerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    // Dynamic real-time snapshot subscription
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Donation[] = [];
      let total = 0;
      let active = 0;
      let completed = 0;
      let expired = 0;
      let mealsDonated = 0;

      const categories: { [key: string]: number } = {};
      const statusCounts: { [key: string]: number } = {};

      snapshot.forEach((docSnap) => {
        const d = { id: docSnap.id, ...docSnap.data() } as Donation;
        list.push(d);
        total++;

        // Status groupings
        if (d.status === 'AVAILABLE') active++;
        else if (d.status === 'COMPLETED') {
          completed++;
          if (d.unit === 'MEALS') {
            mealsDonated += (d.quantity || 0);
          } else {
            mealsDonated += Math.round((d.quantity || 0) * 2); // Approximation for standard metric (1KG = ~2 meals)
          }
        }
        else if (d.status === 'EXPIRED') expired++;

        // Category tally
        categories[d.category] = (categories[d.category] || 0) + 1;
        // Status tally
        statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
      });

      setDonations(list);
      setStats({ total, active, completed, expired, mealsDonated });

      // Transform for Recharts
      setCategoryData(Object.keys(categories).map(k => ({ name: k, value: categories[k] })));
      setStatusData(Object.keys(statusCounts).map(k => ({ name: k.replace(/_/g, ' '), value: statusCounts[k] })));
      setLoading(false);
    }, (error) => {
      console.error("Provider dashboard subscription failed:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#64748b'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in" id="provider-dashboard">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-100 p-6 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <p className="text-xs text-stone-400 font-extrabold uppercase">Supplier Executive Center</p>
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Welcome back, {userProfile?.name}!</h2>
          <p className="text-xs text-stone-500 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
            Profile Status: {userProfile?.verificationStatus} Verified Badge
          </p>
        </div>
        
        <Link 
          to="/provider/donations/create"
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold px-5 py-3 rounded-xl transition-all shadow-md hover:shadow-emerald-100 inline-flex items-center gap-1.5 text-center cursor-pointer"
          id="dashboard-new-donation-btn"
        >
          <Plus className="w-4 h-4" />
          Create Food Donation
        </Link>
      </div>

      {/* Analytics KPI Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <DashboardCard 
          title="Meals Redistributed"
          value={stats.mealsDonated}
          subtitle="Approx. total meals saved"
          icon={<Heart className="w-5 h-5 fill-emerald-600 text-emerald-600" />}
        />
        <DashboardCard 
          title="Total Listings"
          value={stats.total}
          subtitle="All created donations"
          icon={<UtensilsCrossed className="w-5 h-5" />}
        />
        <DashboardCard 
          title="Active Listings"
          value={stats.active}
          subtitle="Currently listed AVAILABLE"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <DashboardCard 
          title="Completed Picks"
          value={stats.completed}
          subtitle="Safely delivered to shelters"
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <DashboardCard 
          title="Expired Batches"
          value={stats.expired}
          subtitle="Lapsed best-before times"
          icon={<AlertCircle className="w-5 h-5" />}
        />
      </div>

      {/* Graph Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Category breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-stone-100 p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Donations by Category</h3>
          <div className="h-64">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" fontSize={11} stroke="#78716c" />
                  <YAxis fontSize={11} stroke="#78716c" allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f5f5f4' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                Seeding active lists will render statistics.
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-stone-100 p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Status Index Distribution</h3>
          <div className="h-48 relative flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-stone-400">No statuses recorded.</div>
            )}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center pt-2 text-[10px] font-semibold text-stone-500">
            {statusData.map((d, index) => (
              <div key={d.name} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Donations List */}
      <div className="bg-white border border-stone-100 rounded-2xl shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-50 pb-3">
          <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">Your Active / Recent Listings</h3>
          <Link 
            to="/provider/donations" 
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-0.5"
          >
            All Listings <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 py-6">
            <div className="h-10 bg-stone-50 animate-pulse rounded-md"></div>
            <div className="h-10 bg-stone-50 animate-pulse rounded-md"></div>
          </div>
        ) : donations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="provider-recent-table">
              <thead>
                <tr className="border-b border-stone-100 text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">
                  <th className="pb-3 font-bold">Food Item</th>
                  <th className="pb-3 font-bold">Category</th>
                  <th className="pb-3 font-bold">Quantity</th>
                  <th className="pb-3 font-bold">Best Before</th>
                  <th className="pb-3 font-bold">Current Status</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 text-sm font-medium text-stone-700">
                {donations.slice(0, 5).map((d) => (
                  <tr key={d.id} className="hover:bg-stone-50/50">
                    <td className="py-3.5 pr-2">
                      <div className="font-bold text-stone-900">{d.foodName}</div>
                      <div className="text-[10px] text-stone-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {d.area}, {d.city}
                      </div>
                    </td>
                    <td className="py-3.5 text-xs font-bold text-stone-500">{d.category}</td>
                    <td className="py-3.5 font-bold text-stone-800">{d.quantity} {d.unit}</td>
                    <td className="py-3.5 text-xs text-stone-500 truncate max-w-[120px]">
                      {new Date(d.expiresAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="py-3.5 text-right">
                      <Link 
                        to={`/provider/donations/${d.id}`}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/60 px-3 py-1.5 rounded-lg transition-colors inline-block"
                        id={`view-donation-btn-${d.id}`}
                      >
                        Manage & Handoff
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <div className="p-3 bg-stone-50 text-stone-400 w-12 h-12 rounded-full mx-auto flex items-center justify-center">
              🍲
            </div>
            <p className="text-xs text-stone-500 font-medium">You have not created any surplus food listings yet.</p>
            <Link 
              to="/provider/donations/create" 
              className="inline-flex text-xs font-bold text-emerald-600 hover:underline"
            >
              List your first surplus package here
            </Link>
          </div>
        )}
      </div>

    </div>
  );
};
