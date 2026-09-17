import React from 'react';
import { Heart, ShieldCheck, Award, MessageCircle } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12" id="about-container">
      {/* Header */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">Our Mission</h1>
        <p className="text-lg text-stone-500 max-w-2xl mx-auto">
          "Good Food Shouldn't Go to Waste." Connecting surplus food suppliers directly with community rescue operators to maximize social impact and sustainability.
        </p>
      </div>

      {/* Narrative grid */}
      <div className="bg-white rounded-2xl border border-stone-100 p-8 shadow-xs space-y-6">
        <h2 className="text-xl font-bold text-stone-900">Why FoodRescue Exists</h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          Each day, millions of meals are discarded across restaurants, hotels, and households because of scheduling overruns or minor surplus. Simultaneously, families and local shelters struggle to secure healthy nourishment. FoodRescue serves as a coordinates bridge, turning excess supplies into real community meals safely and instantly.
        </p>
        <p className="text-sm text-stone-600 leading-relaxed">
          Through secure, dynamic handoff controls, certified NGOs, and a highly responsive volunteer network, we manage the complete lifecycle of surplus food — from listing, to claim, to pickup, to delivery verification — ensuring that all excess food is utilized.
        </p>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-stone-100 p-6 space-y-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg w-fit">
            <Heart className="w-5 h-5 fill-emerald-100" />
          </div>
          <h3 className="font-bold text-stone-900">Empathy-First</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Putting human dignity and community nourishment at the core of all redistribution efforts.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-stone-100 p-6 space-y-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg w-fit">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900">Strict Safety</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Encouraging compliance with local health regulations, strict temperature guides, and detailed allergen listings.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-stone-100 p-6 space-y-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg w-fit">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900">Operational Integrity</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Using manual non-profit credential approvals and verification handoffs to prevent system abuse.
          </p>
        </div>
      </div>
    </div>
  );
};
