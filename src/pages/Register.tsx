import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldAlert, Sparkles, Building, UtensilsCrossed, Truck, CheckCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const { register, error: authError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') as UserRole || 'PROVIDER';

  const [role, setRole] = useState<UserRole>(defaultRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('New York');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('role')) {
      const paramRole = searchParams.get('role') as UserRole;
      if (['PROVIDER', 'NGO', 'VOLUNTEER'].includes(paramRole)) {
        setRole(paramRole);
      }
    }
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone || !city || !area) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await register(email, password, name, phone, role, city, area);
      setSuccess(true);
      setTimeout(() => {
        // Redirect to dashboard depending on role
        if (role === 'PROVIDER') navigate('/provider/dashboard');
        else if (role === 'NGO') navigate('/ngo/dashboard');
        else if (role === 'VOLUNTEER') navigate('/volunteer/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err.message || "Failed to create account. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12" id="register-container">
      <div className="bg-white border border-stone-100 p-8 rounded-2xl shadow-xs space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Join FoodRescue</h2>
          <p className="text-xs text-stone-400 font-semibold uppercase">Register as a Supplier, NGO, or Volunteer</p>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-4 flex items-start gap-3 text-sm" id="register-success-alert">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Account Provisioned!</span>
              Your profile has been created successfully. Redirecting you to your user dashboard shortly...
            </div>
          </div>
        )}

        {error && error.includes('configuration-not-found') ? (
          <div className="bg-amber-50 border border-amber-200 text-stone-900 rounded-xl p-5 space-y-4 text-xs shadow-xs animate-scale-up animate-fade-in" id="auth-config-error-guide">
            <div className="flex gap-2.5 items-start">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-stone-950 text-sm block">Email & Password Auth Required</span>
                <p className="text-stone-600 mt-1 leading-relaxed">
                  Firebase Authentication is initialized, but the <strong>Email/Password</strong> sign-in provider has not been enabled in your Firebase console.
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-amber-100 rounded-lg p-4 space-y-3">
              <h4 className="font-bold text-stone-900 text-[11px] uppercase tracking-wider">How to enable it (2 clicks):</h4>
              <ol className="list-decimal list-inside space-y-2 text-stone-600 pl-1 font-medium">
                <li>
                  Open your{' '}
                  <a 
                    href="https://console.firebase.google.com/project/totemic-sandbox-bbndl/authentication/providers" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-emerald-700 font-extrabold underline hover:text-emerald-800"
                  >
                    Firebase Auth Console ↗
                  </a>
                </li>
                <li>Click <strong>Add new provider</strong> (or select <strong>Email/Password</strong>)</li>
                <li>Enable the <strong>Email/Password</strong> toggle and click <strong>Save</strong></li>
              </ol>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold bg-amber-100/50 p-2.5 rounded-lg border border-amber-200/40">
              💡 <span>After enabling it, return to this screen and click <strong>Complete Onboarding</strong> again to create your account!</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 flex items-start gap-3 text-sm" id="register-error-alert">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Onboarding Blocked</span>
              {error}
            </div>
          </div>
        ) : null}

        <form onSubmit={handleRegister} className="space-y-6" id="register-form">
          {/* Role Choice Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wide block">Select Your Platform Role</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('PROVIDER')}
                className={`py-3.5 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  role === 'PROVIDER' 
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800' 
                    : 'border-stone-200 hover:border-stone-300 text-stone-500 bg-white'
                }`}
                id="role-pill-provider"
              >
                <UtensilsCrossed className="w-4 h-4" />
                PROVIDER
              </button>
              <button
                type="button"
                onClick={() => setRole('NGO')}
                className={`py-3.5 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  role === 'NGO' 
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800' 
                    : 'border-stone-200 hover:border-stone-300 text-stone-500 bg-white'
                }`}
                id="role-pill-ngo"
              >
                <Building className="w-4 h-4" />
                NGO / SHELTER
              </button>
              <button
                type="button"
                onClick={() => setRole('VOLUNTEER')}
                className={`py-3.5 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  role === 'VOLUNTEER' 
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800' 
                    : 'border-stone-200 hover:border-stone-300 text-stone-500 bg-white'
                }`}
                id="role-pill-volunteer"
              >
                <Truck className="w-4 h-4" />
                VOLUNTEER
              </button>
            </div>
          </div>

          <div className="border-t border-stone-50 pt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">
                {role === 'NGO' ? 'NGO Representative Name' : role === 'PROVIDER' ? 'Provider Contact Name' : 'Your Full Name'}
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Michael Scott"
                className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                required
                id="register-name-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. michael@dundermifflin.com"
                  className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                  required
                  id="register-email-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 012-3456"
                  className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                  required
                  id="register-phone-input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Password (min 6 chars)</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Secure password"
                className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                required
                id="register-password-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Serving City</label>
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. New York"
                  className="w-full text-sm border border-stone-200 bg-stone-50 text-stone-500 px-4 py-3 rounded-xl cursor-not-allowed"
                  disabled
                  id="register-city-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Serving Area / Neighborhood</label>
                <input 
                  type="text" 
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Manhattan"
                  className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                  required
                  id="register-area-input"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold py-3.5 rounded-xl transition-colors shadow-xs hover:shadow-emerald-100 disabled:opacity-50 cursor-pointer"
            id="register-submit-btn"
          >
            {loading ? 'Creating Profile...' : 'Complete Onboarding'}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-stone-500">
              Already registered on the platform?{' '}
              <Link to="/login" className="text-emerald-600 font-bold hover:underline" id="login-redirect">
                Log In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
