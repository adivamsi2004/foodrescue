import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Donation } from '../types';
import { FoodCard } from '../components/FoodCard';
import { 
  Heart, 
  ArrowRight, 
  ShieldAlert, 
  ChevronRight, 
  UtensilsCrossed, 
  Truck, 
  Users, 
  MapPin, 
  AlertCircle 
} from 'lucide-react';

export const Home: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [recentFood, setRecentFood] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  // Load 3 recent active donations
  useEffect(() => {
    const loadRecentFood = async () => {
      try {
        const donationsRef = collection(db, 'donations');
        const q = query(
          donationsRef,
          where('status', '==', 'AVAILABLE'),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const querySnapshot = await getDocs(q);
        const list: Donation[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Donation);
        });
        setRecentFood(list);
      } catch (err) {
        console.error("Error loading home page food preview:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRecentFood();
  }, []);

  const handleCreateDonationClick = () => {
    if (!userProfile) {
      navigate('/login?redirect=create-donation');
    } else if (userProfile.role === 'PROVIDER') {
      navigate('/provider/donations/create');
    } else {
      navigate('/provider/dashboard');
    }
  };

  const handleRescueFoodClick = () => {
    if (!userProfile) {
      navigate('/login?redirect=available-food');
    } else if (userProfile.role === 'NGO') {
      navigate('/ngo/food');
    } else if (userProfile.role === 'VOLUNTEER') {
      navigate('/volunteer/tasks');
    } else {
      navigate('/available-food');
    }
  };

  return (
    <div className="space-y-16 pb-16" id="homepage-container">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-white py-16 md:py-24 border-b border-stone-100" id="hero-section">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-50/40 via-transparent to-transparent opacity-70"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col */}
            <div className="space-y-6 lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                <Heart className="w-3.5 h-3.5 fill-emerald-700 text-emerald-700 animate-pulse" />
                Empowering Communities, Saving Resources
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight leading-none">
                GOOD FOOD<br />
                <span className="text-emerald-600">SHOULDN'T GO</span><br />
                TO WASTE.
              </h1>
              <p className="text-lg text-stone-500 max-w-xl leading-relaxed">
                Connect surplus food from restaurants, hotels, hostels, caterers, and households with verified non-profit organizations and volunteer networks to feed people in need.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button 
                  onClick={handleCreateDonationClick}
                  className="bg-emerald-600 text-white font-extrabold px-6 py-3.5 rounded-xl hover:bg-emerald-700 active:bg-emerald-800 shadow-md hover:shadow-emerald-100 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                  id="hero-donate-btn"
                >
                  DONATE SURPLUS FOOD
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleRescueFoodClick}
                  className="bg-stone-900 text-white font-extrabold px-6 py-3.5 rounded-xl hover:bg-stone-800 active:bg-stone-950 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                  id="hero-rescue-btn"
                >
                  RESCUE AVAILABLE FOOD
                </button>
              </div>
            </div>

            {/* Right Col */}
            <div className="lg:col-span-5 relative">
              <div className="aspect-square rounded-3xl bg-emerald-50 p-6 flex flex-col justify-between border border-emerald-100 shadow-inner relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-100/50"></div>
                <div className="space-y-4 relative">
                  <span className="text-5xl">🍲</span>
                  <h3 className="text-xl font-bold text-stone-900 leading-tight">Your community is waiting to make a difference.</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    By coordinating surplus collections, local communities can redirect hundreds of pounds of perfectly safe, wholesome food each week.
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-md relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">✓</div>
                  <div>
                    <p className="text-xs text-stone-400 font-semibold uppercase">Latest Status</p>
                    <p className="text-sm font-bold text-stone-800">100% Client-to-NGO matching</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="how-it-works-section">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">How FoodRescue Works</h2>
          <p className="text-sm text-stone-500 leading-relaxed">
            Our multi-role coordination network safely bridges surplus supplies with real demand, tracking handover codes and deliveries at every step.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg border border-emerald-100">
                1
              </div>
              <h3 className="text-lg font-bold text-stone-950">Publish Surplus Food</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Food providers list their surplus food, detailing categories, quantities, allergens, preparation dates, and pick up availability.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              For Providers <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg border border-amber-100">
                2
              </div>
              <h3 className="text-lg font-bold text-stone-950">NGO Claims & Matches</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Verified NGOs browse the active listings feed. They claim donations instantly, triggering private coordinate unlocks and automatic volunteer notifications.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
              For NGOs & Volunteers <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg border border-indigo-100">
                3
              </div>
              <h3 className="text-lg font-bold text-stone-950">Verify & Redeem Impact</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                At pickup, the provider verifies a secure code. Once delivered, the rescue count updates, tracking meals saved in real-time.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
              For Everyone <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </section>

      {/* 3. IMPACT STATISTICS AREA */}
      <section className="bg-stone-900 text-white py-16" id="impact-statistics-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <p className="text-4xl font-extrabold text-emerald-400">100%</p>
              <p className="text-sm font-bold uppercase tracking-wider text-stone-400">Verified Rescue Partners</p>
              <p className="text-xs text-stone-500">Every claiming NGO is manual approved by administrators</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-extrabold text-emerald-400">&lt; 4 Hours</p>
              <p className="text-sm font-bold uppercase tracking-wider text-stone-400">Average Turnaround</p>
              <p className="text-xs text-stone-500">From listing to community distribution</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-extrabold text-emerald-400">Zero Waste</p>
              <p className="text-sm font-bold uppercase tracking-wider text-stone-400">Our Core Objective</p>
              <p className="text-xs text-stone-500">Helping restaurants hit corporate sustainability goals</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-extrabold text-emerald-400">Safe Handover</p>
              <p className="text-sm font-bold uppercase tracking-wider text-stone-400">Pickup Codes</p>
              <p className="text-xs text-stone-500">Secure verification PINs protect transfers</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ACTIVE FOOD LIST PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8" id="active-listings-preview">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">Active Redistribution Feed</h2>
            <p className="text-sm text-stone-500">
              Explore a snapshot of surplus edible food currently available for immediate rescue in your community.
            </p>
          </div>
          <Link 
            to="/available-food" 
            className="inline-flex items-center gap-1 text-sm font-extrabold text-emerald-600 hover:text-emerald-700 hover:underline shrink-0"
          >
            Explore Complete Directory <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-stone-100 rounded-xl p-5 h-80 animate-pulse space-y-4">
                <div className="w-full h-44 bg-stone-100 rounded-lg"></div>
                <div className="h-6 bg-stone-100 rounded-md w-3/4"></div>
                <div className="h-4 bg-stone-100 rounded-md w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recentFood.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentFood.map((donation) => (
              <FoodCard key={donation.id} donation={donation} />
            ))}
          </div>
        ) : (
          <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-200 py-12 px-6 text-center space-y-4">
            <div className="p-3 bg-white w-14 h-14 rounded-full shadow-xs mx-auto flex items-center justify-center text-stone-400">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h4 className="font-bold text-stone-800">All surplus food is rescued!</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                There are no available donations at this second. Check back shortly, or configure your profile notifications to be alerted of new listings.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 5. USER PARTICIPATION GUIDES */}
      <section className="bg-emerald-50/40 border-y border-emerald-100 py-16" id="participation-guides">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">Who We Support</h2>
            <p className="text-sm text-stone-500">
              We empower food businesses, charitable organizations, and neighborhood volunteers with structured dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Providers */}
            <div className="bg-white rounded-2xl border border-stone-100 p-8 shadow-xs hover:shadow-md transition-all space-y-6">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl w-fit">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-stone-900">Food Providers</h3>
                <p className="text-sm text-stone-500 leading-relaxed">
                  Bakeries, hosteliers, hotel networks, event planners, and restaurants list surplus food packages in under a minute. Monitor claim logs, configure automatic safety allergen disclosures, and track sustainability impact reports.
                </p>
              </div>
              <ul className="text-xs text-stone-500 space-y-2">
                <li className="flex items-center gap-2">✓ Complete Allergen Wizards</li>
                <li className="flex items-center gap-2">✓ Dynamic Handover PIN Security</li>
                <li className="flex items-center gap-2">✓ Meals Donated analytics</li>
              </ul>
              <Link 
                to="/register?role=PROVIDER" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Become a Food Provider <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* NGOs */}
            <div className="bg-white rounded-2xl border border-stone-100 p-8 shadow-xs hover:shadow-md transition-all space-y-6">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl w-fit">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-stone-900">NGOs & Charities</h3>
                <p className="text-sm text-stone-500 leading-relaxed">
                  Food banks, neighborhood shelters, and non-profits instantly discover and claim available batches. Securely unlock private pickup directions after claiming, coordinate pickup schedules, and record delivery impact indices.
                </p>
              </div>
              <ul className="text-xs text-stone-500 space-y-2">
                <li className="flex items-center gap-2">✓ Admin verification credentials badge</li>
                <li className="flex items-center gap-2">✓ Real-time available list search</li>
                <li className="flex items-center gap-2">✓ Multi-member active claims map</li>
              </ul>
              <Link 
                to="/register?role=NGO" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Register your NGO <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Volunteers */}
            <div className="bg-white rounded-2xl border border-stone-100 p-8 shadow-xs hover:shadow-md transition-all space-y-6">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl w-fit">
                <Truck className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-stone-900">Volunteers</h3>
                <p className="text-sm text-stone-500 leading-relaxed">
                  Neighborhood logistics heroes select pickup tasks based on their service areas and preferred transport mode (walk, bike, vehicle). Complete rapid point-to-point transports and expand localized impact.
                </p>
              </div>
              <ul className="text-xs text-stone-500 space-y-2">
                <li className="flex items-center gap-2">✓ Flexible area filters</li>
                <li className="flex items-center gap-2">✓ GPS open maps integration</li>
                <li className="flex items-center gap-2">✓ Personal rescue counter logs</li>
              </ul>
              <Link 
                to="/register?role=VOLUNTEER" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Join as Volunteer <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION & COMPLIANCE WARNING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="cta-homepage">
        <div className="bg-stone-900 text-white rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-emerald-600/10 blur-xl"></div>
          <div className="space-y-4 max-w-xl relative">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Ready to make a positive impact?</h2>
            <p className="text-sm text-stone-400 leading-relaxed">
              Join thousands of community members and businesses across New York working together to reduce waste, save resources, and alleviate hunger safely.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative shrink-0">
            <Link 
              to="/register" 
              className="bg-emerald-600 text-white font-extrabold px-6 py-3.5 rounded-xl hover:bg-emerald-700 transition-colors text-center"
            >
              Get Started Now
            </Link>
            <Link 
              to="/contact" 
              className="bg-stone-800 text-stone-300 font-extrabold px-6 py-3.5 rounded-xl hover:bg-stone-700 transition-colors text-center"
            >
              Contact Representative
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
