import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginOrRegisterDemoUser, DEMO_ACCOUNTS } from '../utils/demoAuth';
import { 
  Lock, 
  Mail, 
  ShieldAlert, 
  Sparkles, 
  ChevronRight, 
  KeyRound, 
  ArrowRight,
  UtensilsCrossed,
  Heart,
  Truck,
  Building
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login, error: authError, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please complete all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      handleRedirect();
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      await loginOrRegisterDemoUser(demoEmail);
      handleRedirect();
    } catch (err: any) {
      console.error("Demo login failed:", err);
      setError(err.message || "Demo sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = () => {
    if (redirect === 'create-donation') {
      navigate('/provider/donations/create');
    } else if (redirect === 'available-food') {
      navigate('/available-food');
    } else {
      // Standard redirect based on current role in storage is handled inside AuthContext
      // But we can also check localStorage or wait and let Route guards trigger it, or trigger dashboard
      navigate('/');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    setError(null);
    try {
      await resetPassword(forgotEmail);
      setForgotSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to trigger recovery email.");
    } finally {
      setLoading(false);
    }
  };

  const getDemoIcon = (role: string) => {
    switch (role) {
      case 'PROVIDER': return <UtensilsCrossed className="w-4 h-4 text-emerald-600" />;
      case 'NGO': return <Building className="w-4 h-4 text-amber-600" />;
      case 'VOLUNTEER': return <Truck className="w-4 h-4 text-indigo-600" />;
      default: return <KeyRound className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12" id="login-container">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Side: Traditional Form (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-stone-100 p-8 rounded-2xl shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Log In</h2>
            <p className="text-xs text-stone-400 font-semibold uppercase">Access your FoodRescue account</p>
          </div>

          {error && error.includes('configuration-not-found') ? (
            <div className="bg-amber-50 border border-amber-200 text-stone-900 rounded-xl p-5 space-y-4 text-xs shadow-xs animate-scale-up animate-fade-in" id="auth-config-error-guide-login">
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
                💡 <span>Once enabled, return to this tab and try signing in or using the Demo Console!</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3 text-rose-800 text-sm animate-scale-up" id="login-error-alert">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          ) : null}

          {!showForgot ? (
            <form onSubmit={handleLogin} className="space-y-4" id="login-form">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sarah@example.com"
                    className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden pl-10 pr-4 py-3.5 rounded-xl transition-all"
                    required
                    id="login-email-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Password</label>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowForgot(true);
                      setForgotSuccess(false);
                      setForgotEmail('');
                    }}
                    className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
                    id="forgot-password-trigger"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden pl-10 pr-4 py-3.5 rounded-xl transition-all"
                    required
                    id="login-password-input"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold py-3.5 rounded-xl transition-colors shadow-xs hover:shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer"
                id="login-submit-btn"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-stone-500">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-emerald-600 font-bold hover:underline" id="register-redirect">
                    Register Here
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4" id="forgot-form">
              <div className="space-y-2">
                <h3 className="font-bold text-stone-800">Password Recovery</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Enter your registered email below, and we will dispatch a secure link to reset your account password.
                </p>
              </div>

              {forgotSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-emerald-800 text-sm">
                  <span className="font-bold block">Reset Link Dispatched!</span>
                  Check your inbox for further instructions.
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Email Address</label>
                <input 
                  type="email" 
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e.g. sarah@example.com"
                  className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3.5 rounded-xl transition-all"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowForgot(false)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-3 rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Sending link...' : 'Send Recovery Email'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Side: Demo Console (7 cols) */}
        <div className="lg:col-span-7 bg-stone-50 border border-stone-200/60 p-8 rounded-2xl space-y-6" id="demo-console-container">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Sparkles className="w-3 h-3 fill-emerald-800" />
              Instant Sandbox Access
            </span>
            <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">One-Click Demo Console</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              No registration required for testing! Click any account role below to login instantly. If the account is missing, the system automatically registers them and seeds their profile.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEMO_ACCOUNTS.map((demo) => (
              <button
                key={demo.email}
                onClick={() => handleDemoLogin(demo.email)}
                disabled={loading}
                className="bg-white border border-stone-200 hover:border-emerald-500 hover:shadow-xs rounded-xl p-4 text-left transition-all relative flex flex-col justify-between group cursor-pointer"
                id={`demo-btn-${demo.role.toLowerCase()}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-block text-[10px] font-extrabold text-stone-400 group-hover:text-emerald-700 tracking-wider">
                      {demo.role}
                    </span>
                    <div className="p-1.5 bg-stone-50 group-hover:bg-emerald-50 rounded-lg transition-colors">
                      {getDemoIcon(demo.role)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800 text-sm">{demo.name}</h4>
                    <p className="text-[10px] text-stone-400 font-semibold">{demo.email}</p>
                    {demo.role === 'NGO' && (
                      <span className={`inline-block mt-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        demo.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        NGO STATUS: {demo.status}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-xs font-bold text-stone-500 group-hover:text-emerald-600 flex items-center gap-1 justify-end w-full">
                  Instant Login <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>

          <div className="bg-stone-100 rounded-xl p-4 border border-stone-200/50 text-xs text-stone-500 flex gap-2.5">
            <span>💡</span>
            <p className="leading-relaxed">
              Open multiple incognito tabs or separate browsers to test real-time notification handoffs between a <strong>Provider</strong> and an <strong>Approved NGO</strong>!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
