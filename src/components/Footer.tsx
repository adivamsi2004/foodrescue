import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <Heart className="w-4 h-4 fill-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                FOOD<span className="text-emerald-500">RESCUE</span>
              </span>
            </div>
            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              We connect local restaurants, caterers, and households with verified non profits and volunteer networks to redirect edible surplus food to those in need.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/available-food" className="hover:text-white transition-colors">Rescue Food</Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">Our Mission</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Get in Touch</Link>
              </li>
            </ul>
          </div>

          {/* Contact and Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Platform Operations</h4>
            <p className="text-sm text-stone-400">
              New York, NY<br />
              Email: info@foodrescue.org<br />
              Support: help@foodrescue.org
            </p>
          </div>
        </div>

        {/* Safety Disclaimer Warning */}
        <div className="bg-stone-800/50 rounded-xl p-5 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-stone-400 leading-relaxed" id="footer-safety-notice">
          <div className="p-2 bg-stone-800 text-emerald-500 rounded-lg shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-emerald-400 block mb-0.5">FOOD SAFETY NOTICE & AGREEMENT</span>
            FoodRescue is a coordination platform. Providers remain responsible for ensuring donated food is safe, properly handled, stored, packaged, labeled where required, and suitable for redistribution. Users should follow applicable local food-safety requirements.
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-stone-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} FoodRescue Platform. Good food shouldn't go to waste.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-stone-300">Privacy Policy</a>
            <a href="#" className="hover:text-stone-300">Terms of Service</a>
            <a href="#" className="hover:text-stone-300">Safety Guidelines</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
