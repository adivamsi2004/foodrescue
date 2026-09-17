import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { Home } from './pages/Home';
import { About } from './pages/About';
import { HowItWorks } from './pages/HowItWorks';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Food Search Listing Feed
import { AvailableFood } from './pages/AvailableFood';

// Supplier (Provider) Pages
import { ProviderDashboard } from './pages/provider/ProviderDashboard';
import { CreateDonation } from './pages/provider/CreateDonation';
import { ProviderDonations } from './pages/provider/ProviderDonations';
import { DonationDetail } from './pages/provider/DonationDetail';
import { ProviderProfile } from './pages/provider/ProviderProfile';

// Charity (NGO) Pages
import { NgoDashboard } from './pages/ngo/NgoDashboard';
import { NgoClaims } from './pages/ngo/NgoClaims';
import { ClaimDetail } from './pages/ngo/ClaimDetail';
import { NgoProfile } from './pages/ngo/NgoProfile';

// Volunteers Pages
import { VolunteerDashboard } from './pages/volunteer/VolunteerDashboard';
import { VolunteerTaskDetail } from './pages/volunteer/VolunteerTaskDetail';
import { VolunteerProfile } from './pages/volunteer/VolunteerProfile';

// System Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Shared Notification center
import { NotificationsList } from './pages/shared/NotificationsList';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <div className="flex flex-col min-h-screen bg-[#fafaf9] text-stone-900 font-sans antialiased" id="applet-root">
            
            {/* Header Navigation Bar */}
            <Navbar />

            {/* Dynamic Routed Views */}
            <main className="flex-grow">
              <Routes>
                {/* Public Routing */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Shared Discovery (Available to all logged in, primarily NGOs/Volunteers) */}
                <Route path="/food" element={
                  <ProtectedRoute>
                    <AvailableFood />
                  </ProtectedRoute>
                } />

                {/* Provider (Supplier) Protected Routes */}
                <Route path="/provider/dashboard" element={
                  <ProtectedRoute allowedRoles={['PROVIDER']}>
                    <ProviderDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/provider/donations" element={
                  <ProtectedRoute allowedRoles={['PROVIDER']}>
                    <ProviderDonations />
                  </ProtectedRoute>
                } />
                <Route path="/provider/donations/create" element={
                  <ProtectedRoute allowedRoles={['PROVIDER']}>
                    <CreateDonation />
                  </ProtectedRoute>
                } />
                <Route path="/provider/donations/:id" element={
                  <ProtectedRoute allowedRoles={['PROVIDER']}>
                    <DonationDetail />
                  </ProtectedRoute>
                } />
                <Route path="/provider/profile" element={
                  <ProtectedRoute allowedRoles={['PROVIDER']}>
                    <ProviderProfile />
                  </ProtectedRoute>
                } />
                <Route path="/provider/notifications" element={
                  <ProtectedRoute allowedRoles={['PROVIDER']}>
                    <NotificationsList />
                  </ProtectedRoute>
                } />

                {/* NGO (Charity) Protected Routes */}
                <Route path="/ngo/dashboard" element={
                  <ProtectedRoute allowedRoles={['NGO']}>
                    <NgoDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/ngo/food" element={
                  <ProtectedRoute allowedRoles={['NGO']}>
                    <AvailableFood />
                  </ProtectedRoute>
                } />
                <Route path="/ngo/claims" element={
                  <ProtectedRoute allowedRoles={['NGO']}>
                    <NgoClaims />
                  </ProtectedRoute>
                } />
                <Route path="/ngo/claims/:id" element={
                  <ProtectedRoute allowedRoles={['NGO']}>
                    <ClaimDetail />
                  </ProtectedRoute>
                } />
                <Route path="/ngo/profile" element={
                  <ProtectedRoute allowedRoles={['NGO']}>
                    <NgoProfile />
                  </ProtectedRoute>
                } />
                <Route path="/ngo/notifications" element={
                  <ProtectedRoute allowedRoles={['NGO']}>
                    <NotificationsList />
                  </ProtectedRoute>
                } />

                {/* Volunteer Protected Routes */}
                <Route path="/volunteer/dashboard" element={
                  <ProtectedRoute allowedRoles={['VOLUNTEER']}>
                    <VolunteerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/volunteer/tasks/:id" element={
                  <ProtectedRoute allowedRoles={['VOLUNTEER']}>
                    <VolunteerTaskDetail />
                  </ProtectedRoute>
                } />
                <Route path="/volunteer/profile" element={
                  <ProtectedRoute allowedRoles={['VOLUNTEER']}>
                    <VolunteerProfile />
                  </ProtectedRoute>
                } />

                {/* Admin Operations Protected Routes */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                {/* General Fallback redirection */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />

          </div>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
