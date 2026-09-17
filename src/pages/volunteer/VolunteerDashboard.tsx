import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Donation } from '../../types';
import { DashboardCard } from '../../components/DashboardCard';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  Truck, 
  MapPin, 
  Heart, 
  CheckCircle, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  Award
} from 'lucide-react';

export const VolunteerDashboard: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const { sendNotification } = useNotifications();

  const [availableTasks, setAvailableTasks] = useState<Donation[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  // Statistics
  const [stats, setStats] = useState({
    assignedCount: 0,
    completedCount: 0,
    mealsTransported: 0
  });

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    const donationsRef = collection(db, 'donations');

    // 1. Fetch live unassigned claimed donations
    const unassignedQuery = query(
      donationsRef,
      where('status', '==', 'CLAIMED')
    );

    const unsubscribeUnassigned = onSnapshot(unassignedQuery, (snapshot) => {
      const list: Donation[] = [];
      snapshot.forEach((docSnap) => {
        const d = { id: docSnap.id, ...docSnap.data() } as Donation;
        // Exclude self assigned
        if (!d.volunteerId) {
          list.push(d);
        }
      });
      setAvailableTasks(list);
    });

    // 2. Fetch tasks assigned to this volunteer
    const assignedQuery = query(
      donationsRef,
      where('volunteerId', '==', currentUser.uid)
    );

    const unsubscribeAssigned = onSnapshot(assignedQuery, (snapshot) => {
      const list: Donation[] = [];
      let assignedCount = 0;
      let completedCount = 0;
      let mealsTransported = 0;

      snapshot.forEach((docSnap) => {
        const d = { id: docSnap.id, ...docSnap.data() } as Donation;
        list.push(d);

        if (d.status === 'CLAIMED' || d.status === 'PICKED_UP') {
          assignedCount++;
        } else if (d.status === 'COMPLETED') {
          completedCount++;
          mealsTransported += (d.quantity || 0);
        }
      });

      setAssignedTasks(list.filter(d => ['CLAIMED', 'PICKED_UP'].includes(d.status)));
      setStats({ assignedCount, completedCount, mealsTransported });
      setLoading(false);
    });

    return () => {
      unsubscribeUnassigned();
      unsubscribeAssigned();
    };

  }, [currentUser]);

  // Sign up for task
  const handleAssignTask = async (task: Donation) => {
    if (!currentUser || !userProfile) return;
    try {
      const donationRef = doc(db, 'donations', task.id!);
      await updateDoc(donationRef, {
        volunteerId: currentUser.uid,
        volunteerName: userProfile.name,
        updatedAt: serverTimestamp()
      });

      // Alerts
      if (task.claimedBy) {
        await sendNotification(
          task.claimedBy,
          "Volunteer matched for your claim!",
          `Volunteer ${userProfile.name} has signed up to transport "${task.foodName}".`,
          'STATUS_CHANGE',
          task.id
        );
      }

      await sendNotification(
        task.providerId,
        "Volunteer assigned to pickup!",
        `Volunteer ${userProfile.name} will handle collection of "${task.foodName}".`,
        'STATUS_CHANGE',
        task.id
      );

    } catch (err) {
      console.error("Failed to assign volunteer transport task:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in" id="volunteer-dashboard">
      
      {/* Header Panel */}
      <div className="bg-stone-900 rounded-2xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-emerald-500/15 blur-xl"></div>
        <div className="space-y-2 relative">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            Volunteer Rescue Force
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome, Hero {userProfile?.name}!</h2>
          <p className="text-xs text-stone-400 max-w-lg leading-relaxed">
            Support local non-profits and food kitchens by transport coordination. Sign up below to deliver edible surplus food safely.
          </p>
        </div>
        <div className="bg-stone-800 p-4 border border-stone-800 rounded-xl relative shrink-0 text-center">
          <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block mb-0.5">Hero Level</span>
          <span className="text-xl font-extrabold text-emerald-400">Impact level {stats.completedCount > 5 ? 'Master' : 'Active'}</span>
        </div>
      </div>

      {/* KPI Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <DashboardCard 
          title="Deliveries Handled"
          value={stats.completedCount}
          subtitle="Successful transports"
          icon={<Heart className="w-5 h-5 fill-emerald-600 text-emerald-600" />}
        />
        <DashboardCard 
          title="Active Missions"
          value={stats.assignedCount}
          subtitle="Assigned tasks in transit"
          icon={<Truck className="w-5 h-5" />}
        />
        <DashboardCard 
          title="Meals Handled"
          value={stats.mealsTransported}
          subtitle="Est. redistribution weight count"
          icon={<CheckCircle className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: My Assignments (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-stone-100 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">Your Assigned Missions</h3>
          
          {loading ? (
            <div className="h-10 bg-stone-50 animate-pulse rounded-lg"></div>
          ) : assignedTasks.length > 0 ? (
            <div className="space-y-4">
              {assignedTasks.map((task) => (
                <div key={task.id} className="p-4 bg-stone-50/50 rounded-xl border border-stone-100 flex justify-between items-center gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-stone-900 text-sm leading-snug">{task.foodName}</p>
                    <p className="text-xs text-stone-400">NGO: <strong>{task.claimedByName}</strong></p>
                    <div className="flex items-center gap-2 text-[10px] text-stone-500 pt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-stone-400" />{task.area}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={task.status} />
                    <Link
                      to={`/volunteer/tasks/${task.id}`}
                      className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors inline-block"
                    >
                      View Coordinates
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-500 text-center py-10">No active pickup assignments yet. Select a live mission on the right!</p>
          )}
        </div>

        {/* Right column: Available Missions Board (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-stone-100 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">Open Transport Missions Board</h3>
          
          {availableTasks.length > 0 ? (
            <div className="space-y-4">
              {availableTasks.map((task) => (
                <div key={task.id} className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-stone-900 text-xs truncate leading-none">{task.foodName}</h4>
                    <p className="text-[10px] text-stone-400 font-semibold">Tally: {task.quantity} {task.unit} | {task.area}</p>
                    <p className="text-[9px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block">NGO Claimed - Awaiting Driver</p>
                  </div>

                  <button
                    onClick={() => handleAssignTask(task)}
                    className="w-full text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg transition-colors cursor-pointer text-center"
                    id={`accept-task-btn-${task.id}`}
                  >
                    Assign to Me
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 text-center py-10">No unassigned claims available. Check back soon!</p>
          )}
        </div>

      </div>

    </div>
  );
};
