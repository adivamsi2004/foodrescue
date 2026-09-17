import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-500 font-medium">Verifying access credentials...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !userProfile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    // If user's role is not allowed, redirect to their home dashboard
    const homeRedirect = {
      PROVIDER: '/provider/dashboard',
      NGO: '/ngo/dashboard',
      VOLUNTEER: '/volunteer/dashboard',
      ADMIN: '/admin/dashboard'
    }[userProfile.role] || '/';

    return <Navigate to={homeRedirect} replace />;
  }

  return <>{children}</>;
};
