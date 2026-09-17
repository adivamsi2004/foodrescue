import React from 'react';
import { Utensils, Users, CheckCircle, Smartphone, MapPin } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12 animate-fade-in" id="how-it-works-container">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">How It Works</h1>
        <p className="text-lg text-stone-500 max-w-xl mx-auto">
          A synchronized coordination system managing food redistribution from handover to final community serving.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-8">
        {/* Step 1 */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-6">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 font-bold text-lg rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            01
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-lg text-stone-900">Food Providers Publish Surplus</h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              Caterers, bakeries, or hotels fill out our multi-section safety wizard detailing food categories, allergens, quantity, storage instructions, and exact pickup windows. This populates our active map feed.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-6">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 font-bold text-lg rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            02
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-lg text-stone-900">Verified NGOs Claim Immediately</h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              Only approved non profits who pass manual administrative audits can claim active listings. This creates a secure, race-condition protected claim log, unlocking detailed pickup routes and contact numbers.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-6">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 font-bold text-lg rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            03
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-lg text-stone-900">Verification Code Transfer</h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              At collection, the provider types in a unique 6-digit verification code generated in their database portal. This guarantees that only authorized claimants handle the handover, automatically updating the status to "Picked Up".
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-6">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 font-bold text-lg rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            04
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-lg text-stone-900">Delivery & Impact Tally</h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              Once distributed to families or shelter locations, the claimant marks the task completed, optionally logging the total headcount served. These metrics update our visual dashboards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
