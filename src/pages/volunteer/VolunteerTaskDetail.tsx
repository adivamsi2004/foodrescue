import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Donation } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  ArrowLeft, 
  MapPin, 
  Building, 
  Phone, 
  User as UserIcon, 
  Clock, 
  Calendar,
  Lock,
  Navigation
} from 'lucide-react';

export const VolunteerTaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [task, setTask] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !currentUser) return;
    const fetchTask = async () => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, 'donations', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Donation;
          if (data.volunteerId !== currentUser.uid) {
            setError("You are not authorized to manage this volunteer assignment.");
            return;
          }
          setTask({ id: docSnap.id, ...data });
        } else {
          setError("Task record not found.");
        }
      } catch (err) {
        console.error("Failed to load volunteer task detail:", err);
        setError("Error fetching task.");
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id, currentUser]);

  const handleOpenMaps = () => {
    if (!task) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.pickupAddress)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h3 className="text-xl font-bold text-stone-900">{error || "Access Denied"}</h3>
        <Link to="/volunteer/dashboard" className="text-sm font-bold text-emerald-600 hover:underline inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 animate-fade-in" id="volunteer-task-detail">
      
      <div className="space-y-1">
        <Link to="/volunteer/dashboard" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Missions Board
        </Link>
        <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Mission Routing Board</h2>
      </div>

      <div className="bg-white border border-stone-100 p-6 rounded-2xl shadow-xs space-y-6">
        <div className="flex items-start justify-between border-b border-stone-50 pb-4">
          <div className="space-y-1">
            <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest">{task.category}</span>
            <h3 className="text-lg font-extrabold text-stone-900 leading-tight">{task.foodName}</h3>
            <p className="text-xs text-stone-500">Tally: {task.quantity} {task.unit}</p>
          </div>
          <StatusBadge status={task.status} />
        </div>

        {/* Unlocked Credentials */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            Route Addresses Unlocked
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-stone-700 bg-emerald-50/20 border border-emerald-100 p-4 rounded-xl">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Building className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-stone-400 uppercase leading-none mb-1">Pickup From Supplier</p>
                  <p className="font-bold text-stone-800">{task.providerName}</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">{task.pickupAddress}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t sm:border-t-0 sm:border-l border-stone-150 pt-3 sm:pt-0 sm:pl-4">
              <div className="flex items-start gap-2">
                <UserIcon className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-stone-400 uppercase leading-none mb-1">Redistribution NGO Partner</p>
                  <p className="font-bold text-stone-800">{task.claimedByName}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleOpenMaps}
              className="inline-flex items-center gap-1 text-xs font-bold bg-white hover:bg-stone-50 border border-stone-200 p-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-emerald-600" />
              Open GPS Routing
            </button>
          </div>
        </div>

        <div className="border-t border-stone-50 pt-4 text-xs text-stone-500 space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Pickup Window: <strong>{new Date(task.pickupStart).toLocaleTimeString()} - {new Date(task.pickupEnd).toLocaleTimeString()}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Expiration: <strong>{new Date(task.expiresAt).toLocaleString()}</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
};
