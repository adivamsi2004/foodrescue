import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Donation, AppUser, DonationStatus } from '../../types';
import { DashboardCard } from '../../components/DashboardCard';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { 
  ShieldCheck, 
  Users, 
  Building, 
  FileText, 
  Check, 
  X, 
  Trash2, 
  AlertTriangle,
  Layers,
  Heart,
  Globe,
  Activity
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { sendNotification } = useNotifications();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtered lists
  const [pendingNgos, setPendingNgos] = useState<AppUser[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    userCount: 0,
    ngoCount: 0,
    providerCount: 0,
    donationCount: 0,
    pendingVerifications: 0,
    completedCount: 0
  });

  // Action states
  const [activeUser, setActiveUser] = useState<AppUser | null>(null);
  const [activeDonation, setActiveDonation] = useState<Donation | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    setLoading(true);

    // 1. Fetch real-time snapshot of users
    const usersRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const list: AppUser[] = [];
      let ngoCount = 0;
      let providerCount = 0;
      let pendingVerifications = 0;

      snapshot.forEach((docSnap) => {
        const u = { uid: docSnap.id, ...docSnap.data() } as AppUser;
        list.push(u);

        if (u.role === 'NGO') {
          ngoCount++;
          if (u.verificationStatus === 'PENDING_APPROVAL') {
            pendingVerifications++;
          }
        } else if (u.role === 'PROVIDER') {
          providerCount++;
        }
      });

      setUsers(list);
      setPendingNgos(list.filter(u => u.role === 'NGO' && u.verificationStatus === 'PENDING_APPROVAL'));
      setStats(prev => ({
        ...prev,
        userCount: list.length,
        ngoCount,
        providerCount,
        pendingVerifications
      }));
    });

    // 2. Fetch real-time snapshot of donations
    const donationsRef = collection(db, 'donations');
    const unsubscribeDonations = onSnapshot(donationsRef, (snapshot) => {
      const list: Donation[] = [];
      let completedCount = 0;

      snapshot.forEach((docSnap) => {
        const d = { id: docSnap.id, ...docSnap.data() } as Donation;
        list.push(d);

        if (d.status === 'COMPLETED') {
          completedCount++;
        }
      });

      setDonations(list);
      setStats(prev => ({
        ...prev,
        donationCount: list.length,
        completedCount
      }));
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeDonations();
    };

  }, []);

  // Verification approval
  const handleApproveNgo = async () => {
    if (!activeUser) return;
    setApproveOpen(false);

    try {
      const userRef = doc(db, 'users', activeUser.uid);
      await updateDoc(userRef, {
        verificationStatus: 'APPROVED',
        updatedAt: serverTimestamp()
      });

      await sendNotification(
        activeUser.uid,
        "Organization verification approved!",
        "Your NGO certification documents have been approved by operations. You can now claim local surplus listings.",
        'STATUS_CHANGE',
        ''
      );

      setActiveUser(null);
    } catch (err) {
      console.error("NGO Approval write failed:", err);
    }
  };

  // Verification rejection
  const handleRejectNgo = async () => {
    if (!activeUser) return;
    setRejectOpen(false);

    try {
      const userRef = doc(db, 'users', activeUser.uid);
      await updateDoc(userRef, {
        verificationStatus: 'UNVERIFIED',
        updatedAt: serverTimestamp()
      });

      await sendNotification(
        activeUser.uid,
        "Organization verification declined.",
        "Your NGO verification documents could not be verified. Please submit a valid registration ID or contact support.",
        'STATUS_CHANGE',
        ''
      );

      setActiveUser(null);
    } catch (err) {
      console.error("NGO Rejection write failed:", err);
    }
  };

  // Admin listing cancellation override
  const handleCancelListing = async () => {
    if (!activeDonation) return;
    setCancelOpen(false);

    try {
      const donationRef = doc(db, 'donations', activeDonation.id!);
      await updateDoc(donationRef, {
        status: 'CANCELLED' as DonationStatus,
        updatedAt: serverTimestamp()
      });

      await sendNotification(
        activeDonation.providerId,
        "Your listing was cancelled by Admin.",
        `The administrator cancelled your surplus listing for "${activeDonation.foodName}".`,
        'STATUS_CHANGE',
        activeDonation.id
      );

      if (activeDonation.claimedBy) {
        await sendNotification(
          activeDonation.claimedBy,
          "Claim cancelled by Admin.",
          `The administrator cancelled the surplus listing for "${activeDonation.foodName}".`,
          'STATUS_CHANGE',
          activeDonation.id
        );
      }

      setActiveDonation(null);
    } catch (err) {
      console.error("Admin donation cancellation override failed:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in" id="admin-oversight-panel">
      
      {/* Header Banner */}
      <div className="bg-stone-900 rounded-2xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-emerald-500/15 blur-xl"></div>
        <div className="space-y-2 relative">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Operations Command Desk
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">System Operations Console</h2>
          <p className="text-xs text-stone-400 max-w-lg leading-relaxed">
            Monitor real-time food rescue transactions, verify charitable certification documents, and handle admin overrides.
          </p>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
        <DashboardCard title="Total Accounts" value={stats.userCount} subtitle="All registered profiles" icon={<Users className="w-4 h-4" />} />
        <DashboardCard title="NGO Networks" value={stats.ngoCount} subtitle="Non profits registered" icon={<Building className="w-4 h-4" />} />
        <DashboardCard title="Suppliers" value={stats.providerCount} subtitle="Hotels, kitchens" icon={<Globe className="w-4 h-4" />} />
        <DashboardCard title="Pending Review" value={stats.pendingVerifications} subtitle="NGOs awaiting approval" icon={<FileText className="w-4 h-4" />} />
        <DashboardCard title="Total Listings" value={stats.donationCount} subtitle="All surplus listings" icon={<Layers className="w-4 h-4" />} />
        <DashboardCard title="Redistributed" value={stats.completedCount} subtitle="Delivered successfully" icon={<Heart className="w-4 h-4 fill-emerald-600 text-emerald-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (5 cols): NGO Document Verification Board */}
        <div className="lg:col-span-5 bg-white border border-stone-100 rounded-2xl shadow-xs p-6 space-y-4" id="ngo-verification-board">
          <div className="border-b border-stone-50 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              NGO Certification Approvals ({pendingNgos.length})
            </h3>
          </div>

          {loading ? (
            <div className="h-10 bg-stone-50 animate-pulse rounded-md"></div>
          ) : pendingNgos.length > 0 ? (
            <div className="space-y-4">
              {pendingNgos.map((ngo) => (
                <div key={ngo.uid} className="p-4 bg-stone-50/50 rounded-xl border border-stone-100 space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-stone-900 text-sm">{ngo.name}</h4>
                    <p className="text-xs text-stone-500">Reg ID: <strong className="text-stone-800">{ngo.registrationId}</strong></p>
                    <p className="text-[10px] text-stone-400 font-semibold">{ngo.area}, {ngo.city}</p>
                    {ngo.verificationDocUrl && (
                      <a 
                        href={ngo.verificationDocUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex text-[10px] font-bold text-emerald-600 hover:underline pt-1"
                      >
                        📄 View Registration Certificate PDF
                      </a>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setActiveUser(ngo);
                        setApproveOpen(true);
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition-colors inline-flex justify-center items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => {
                        setActiveUser(ngo);
                        setRejectOpen(true);
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3.5 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-500 text-center py-10">Zero pending NGO verifications. Excellent!</p>
          )}
        </div>

        {/* Right Column (7 cols): Global Listings Management */}
        <div className="lg:col-span-7 bg-white border border-stone-100 rounded-2xl shadow-xs p-6 space-y-4" id="listings-management-board">
          <div className="border-b border-stone-50 pb-3">
            <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              Global Listings Logs & Overrides
            </h3>
          </div>

          {loading ? (
            <div className="space-y-2 py-4">
              <div className="h-10 bg-stone-50 animate-pulse rounded-md"></div>
            </div>
          ) : donations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-100 text-[10px] font-extrabold text-stone-400 uppercase tracking-wider bg-stone-50/50">
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Supplier / Location</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Overrides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 text-stone-700 font-medium">
                  {donations.slice(0, 10).map((d) => (
                    <tr key={d.id} className="hover:bg-stone-50/50">
                      <td className="p-3 font-bold text-stone-900">{d.foodName}</td>
                      <td className="p-3">
                        <p className="font-semibold">{d.providerName}</p>
                        <span className="text-[10px] text-stone-400">{d.area}</span>
                      </td>
                      <td className="p-3"><StatusBadge status={d.status} /></td>
                      <td className="p-3 text-right">
                        {d.status !== 'CANCELLED' && d.status !== 'COMPLETED' ? (
                          <button
                            onClick={() => {
                              setActiveDonation(d);
                              setCancelOpen(true);
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Admin Cancel Override"
                            id={`admin-cancel-btn-${d.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-stone-400">Locked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-stone-500 text-center py-10">No listings posted yet.</p>
          )}
        </div>

      </div>

      {/* Approve Confirm */}
      <ConfirmDialog 
        isOpen={approveOpen}
        title="Approve NGO Verification"
        message={`Are you sure you want to verify and approve "${activeUser?.name}"? Approved organizations are granted authorization to claim local food surplus packages immediately.`}
        confirmLabel="Verify & Approve"
        cancelLabel="Discard"
        onConfirm={handleApproveNgo}
        onCancel={() => {
          setApproveOpen(false);
          setActiveUser(null);
        }}
      />

      {/* Reject Confirm */}
      <ConfirmDialog 
        isOpen={rejectOpen}
        title="Decline NGO Verification"
        message={`Are you sure you want to reject the verification documentation for "${activeUser?.name}"? They will return to UNVERIFIED status levels.`}
        confirmLabel="Decline & Notify"
        cancelLabel="Discard"
        isDanger={true}
        onConfirm={handleRejectNgo}
        onCancel={() => {
          setRejectOpen(false);
          setActiveUser(null);
        }}
      />

      {/* Override Cancel Confirm */}
      <ConfirmDialog 
        isOpen={cancelOpen}
        title="Admin Override: Cancel Listing"
        message={`Are you sure you want to cancel the surplus listing for "${activeDonation?.foodName}"? This action overrides active claims and can not be undone.`}
        confirmLabel="Cancel Listing"
        cancelLabel="Keep Listing"
        isDanger={true}
        onConfirm={handleCancelListing}
        onCancel={() => {
          setCancelOpen(false);
          setActiveDonation(null);
        }}
      />

    </div>
  );
};
