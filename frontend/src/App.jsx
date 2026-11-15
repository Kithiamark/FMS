import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import MainLayout from './components/Layout/MainLayout';
import { AggregatorLayout } from './components/Layout/AggregatorLayout';
import LoadingScreen from './components/ui/LoadingScreen';
import { Skeleton } from './components/ui/Skeleton';
import './i18n';

// Lazy-loaded pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const OTPVerification = lazy(() => import('./pages/OTPVerification'));
const HerdOverview = lazy(() => import('./pages/HerdOverview'));
const AnimalDetail = lazy(() => import('./pages/AnimalDetail'));
const DailyMilkEntry = lazy(() => import('./pages/DailyMilkEntry'));
const ProductionDashboard = lazy(() => import('./pages/ProductionDashboard'));
const Insights = lazy(() => import('./pages/Insights'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FindVet = lazy(() => import('./pages/FindVet'));
const Messages = lazy(() => import('./pages/Messages'));
const Finance = lazy(() => import('./pages/Finance'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Settings = lazy(() => import('./pages/Settings'));
const WorkerTasks = lazy(() => import('./pages/WorkerTasks'));
const Community = lazy(() => import('./pages/Community'));
const FindBuyer = lazy(() => import('./pages/FindBuyer'));

// Vet Routes
const VetDashboard = lazy(() => import('./pages/vet/VetDashboard'));
const VetFarms = lazy(() => import('./pages/vet/VetFarms'));
const VetFarmDetail = lazy(() => import('./pages/vet/VetFarmDetail'));
const VetMessages = lazy(() => import('./pages/vet/VetMessages'));
const VetRecords = lazy(() => import('./pages/vet/VetRecords'));
const VetVisits = lazy(() => import('./pages/vet/VetVisits'));
const VetConnections = lazy(() => import('./pages/vet/VetConnections'));
const VetProfile = lazy(() => import('./pages/vet/VetProfile'));

// Aggregator Routes
const AggregatorDashboard = lazy(() => import('./pages/aggregator/AggregatorDashboard'));

// Admin Routes
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminFarmers = lazy(() => import('./pages/admin/AdminFarmers'));
const AdminVets = lazy(() => import('./pages/admin/AdminVets'));
const AdminSubscriptions = lazy(() => import('./pages/admin/AdminSubscriptions'));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets'));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Universal Skeleton Fallback for lazy route boundaries
const PageSkeletonFallback = () => (
  <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48 sm:w-64" />
      <Skeleton className="h-4 w-32 sm:w-44" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="h-72 lg:col-span-2 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  </div>
);

const CommunityPage = () => {
  const { user } = useAuth();
  if (user?.role === 'AGGREGATOR') {
    return (
      <AggregatorLayout>
        <div className="p-4 md:p-8">
          <Community />
        </div>
      </AggregatorLayout>
    );
  }
  return (
    <MainLayout>
      <Community />
    </MainLayout>
  );
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen message="Verifying credentials and loading portal..." />;
  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" />;
    if (user.role === 'VETERINARIAN') return <Navigate to="/vet/dashboard" />;
    if (user.role === 'AGGREGATOR') return <Navigate to="/aggregator/dashboard" />;
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageSkeletonFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/otp" element={<OTPVerification />} />

        {/* Farmer & Worker Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
              <MainLayout><Dashboard /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/animals"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
              <MainLayout><HerdOverview /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/animals/:id"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
              <MainLayout><AnimalDetail /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dairy"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
              <MainLayout><ProductionDashboard /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dairy/record"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
              <MainLayout><DailyMilkEntry /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
              <MainLayout><Insights /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
              <MainLayout><Finance /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
              <MainLayout><Alerts /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
              <MainLayout><Settings /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
              <WorkerTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'AGGREGATOR', 'VETERINARIAN', 'ADMIN']}>
              <CommunityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/find-vet"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FindVet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/find-buyer"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
              <FindBuyer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <Messages />
            </ProtectedRoute>
          }
        />

        {/* Vet Routes */}
        <Route
          path="/vet/dashboard"
          element={
            <ProtectedRoute allowedRoles={['VETERINARIAN']}>
              <VetDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vet/farms"
          element={
            <ProtectedRoute allowedRoles={['VETERINARIAN']}>
              <VetFarms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vet/farms/:farmId"
          element={
            <ProtectedRoute allowedRoles={['VETERINARIAN']}>
              <VetFarmDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vet/messages"
          element={
            <ProtectedRoute allowedRoles={['VETERINARIAN']}>
              <VetMessages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vet/records"
          element={
            <ProtectedRoute allowedRoles={['VETERINARIAN']}>
              <VetRecords />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vet/visits"
          element={
            <ProtectedRoute allowedRoles={['VETERINARIAN']}>
              <VetVisits />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vet/connections"
          element={
            <ProtectedRoute allowedRoles={['VETERINARIAN']}>
              <VetConnections />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vet/profile"
          element={
            <ProtectedRoute allowedRoles={['VETERINARIAN']}>
              <VetProfile />
            </ProtectedRoute>
          }
        />

        {/* Aggregator Routes */}
        <Route
          path="/aggregator/dashboard"
          element={
            <ProtectedRoute allowedRoles={['AGGREGATOR']}>
              <AggregatorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/farmers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminFarmers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/vets"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminVets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSubscriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tickets"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminTickets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAnnouncements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
