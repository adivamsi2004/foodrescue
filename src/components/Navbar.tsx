import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Heart, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  Settings, 
  AlertCircle 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getDashboardLink = () => {
    if (!userProfile) return '/login';
    switch (userProfile.role) {
      case 'PROVIDER': return '/provider/dashboard';
      case 'NGO': return '/ngo/dashboard';
      case 'VOLUNTEER': return '/volunteer/dashboard';
      case 'ADMIN': return '/admin/dashboard';
      default: return '/';
    }
  };

  const getNotificationLink = () => {
    if (!userProfile) return '/login';
    if (userProfile.role === 'PROVIDER') return '/provider/notifications';
    if (userProfile.role === 'NGO') return '/ngo/notifications';
    return '/';
  };

  const hasNotificationSupport = userProfile && (userProfile.role === 'PROVIDER' || userProfile.role === 'NGO');

  return (
    <nav className="bg-white border-b border-stone-100 sticky top-0 z-40" id="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2" id="nav-logo">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-stone-900">
                FOOD<span className="text-emerald-600">RESCUE</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/available-food" 
              className={`text-sm font-semibold transition-colors ${isActive('/available-food') ? 'text-emerald-600' : 'text-stone-600 hover:text-stone-900'}`}
              id="nav-link-available"
            >
              Rescue Food
            </Link>
            <Link 
              to="/how-it-works" 
              className={`text-sm font-semibold transition-colors ${isActive('/how-it-works') ? 'text-emerald-600' : 'text-stone-600 hover:text-stone-900'}`}
              id="nav-link-how"
            >
              How It Works
            </Link>
            <Link 
              to="/about" 
              className={`text-sm font-semibold transition-colors ${isActive('/about') ? 'text-emerald-600' : 'text-stone-600 hover:text-stone-900'}`}
              id="nav-link-about"
            >
              Our Mission
            </Link>
            <Link 
              to="/contact" 
              className={`text-sm font-semibold transition-colors ${isActive('/contact') ? 'text-emerald-600' : 'text-stone-600 hover:text-stone-900'}`}
              id="nav-link-contact"
            >
              Contact Us
            </Link>

            {userProfile && (
              <Link 
                to={getDashboardLink()} 
                className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                id="nav-link-dashboard"
              >
                Dashboard ({userProfile.role})
              </Link>
            )}
          </div>

          {/* Authenticated Controls / Login Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {userProfile ? (
              <div className="flex items-center space-x-4">
                {/* Notification Bell */}
                {hasNotificationSupport && (
                  <Link 
                    to={getNotificationLink()} 
                    className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-50 relative transition-colors"
                    id="nav-bell"
                  >
                    <Bell className="w-5.5 h-5.5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse" id="unread-count">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* User Dropdown Trigger */}
                <div className="relative">
                  <button 
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
                    id="user-menu-btn"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-stone-700">{userProfile.name}</span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-100 rounded-xl shadow-lg py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-stone-50">
                        <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-bold text-stone-800 truncate">{userProfile.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-extrabold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full uppercase">
                          {userProfile.role}
                        </span>
                      </div>

                      <Link 
                        to={userProfile.role === 'PROVIDER' ? '/provider/profile' : userProfile.role === 'NGO' ? '/ngo/profile' : userProfile.role === 'VOLUNTEER' ? '/volunteer/profile' : '#'}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                        onClick={() => setUserDropdownOpen(false)}
                        id="menu-item-profile"
                      >
                        <UserIcon className="w-4 h-4 text-stone-400" />
                        My Profile
                      </Link>

                      {userProfile.role === 'ADMIN' && (
                        <Link 
                          to="/admin/settings"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                          onClick={() => setUserDropdownOpen(false)}
                          id="menu-item-settings"
                        >
                          <Settings className="w-4 h-4 text-stone-400" />
                          Platform Settings
                        </Link>
                      )}

                      <button 
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 text-left border-t border-stone-50 cursor-pointer"
                        id="menu-item-logout"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="text-sm font-bold text-stone-700 hover:text-stone-950 px-3 py-2 transition-colors"
                  id="nav-btn-login"
                >
                  Log In
                </Link>
                <Link 
                  to="/register" 
                  className="text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-lg transition-all shadow-xs"
                  id="nav-btn-register"
                >
                  Join Platform
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            {userProfile && hasNotificationSupport && (
              <Link 
                to={getNotificationLink()} 
                className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg mr-2 relative transition-colors"
                id="nav-bell-mobile"
              >
                <Bell className="w-5.5 h-5.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-50 cursor-pointer"
              id="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-100 bg-white px-4 py-3 space-y-1.5 shadow-md">
          <Link 
            to="/available-food" 
            className="block px-3 py-2 rounded-lg text-base font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900"
            onClick={() => setMobileMenuOpen(false)}
          >
            Rescue Food
          </Link>
          <Link 
            to="/how-it-works" 
            className="block px-3 py-2 rounded-lg text-base font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900"
            onClick={() => setMobileMenuOpen(false)}
          >
            How It Works
          </Link>
          <Link 
            to="/about" 
            className="block px-3 py-2 rounded-lg text-base font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900"
            onClick={() => setMobileMenuOpen(false)}
          >
            Our Mission
          </Link>
          <Link 
            to="/contact" 
            className="block px-3 py-2 rounded-lg text-base font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact Us
          </Link>

          {userProfile ? (
            <div className="pt-4 border-t border-stone-100 space-y-2">
              <Link 
                to={getDashboardLink()} 
                className="block text-center bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-4 py-2.5 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Go to Dashboard ({userProfile.role})
              </Link>
              <Link 
                to={userProfile.role === 'PROVIDER' ? '/provider/profile' : userProfile.role === 'NGO' ? '/ngo/profile' : userProfile.role === 'VOLUNTEER' ? '/volunteer/profile' : '#'}
                className="block text-center bg-stone-100 text-stone-700 font-semibold px-4 py-2.5 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Profile
              </Link>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-center bg-rose-50 text-rose-600 font-bold px-4 py-2.5 rounded-lg cursor-pointer"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-stone-100 flex flex-col gap-2">
              <Link 
                to="/login" 
                className="block text-center text-stone-700 font-bold py-2.5 rounded-lg border border-stone-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link 
                to="/register" 
                className="block text-center bg-emerald-600 text-white font-bold py-2.5 rounded-lg shadow-xs"
                onClick={() => setMobileMenuOpen(false)}
              >
                Join Platform
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
