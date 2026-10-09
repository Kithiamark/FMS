import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import OTPVerification from './pages/OTPVerification';
import HerdOverview from './pages/HerdOverview';
import AnimalDetail from './pages/AnimalDetail';
import DailyMilkEntry from './pages/DailyMilkEntry';
import ProductionDashboard from './pages/ProductionDashboard';
import Insights from './pages/Insights';
import Dashboard from './pages/Dashboard';
import FindVet from './pages/FindVet';
import Messages from './pages/Messages';
import Finance from './pages/Finance';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import WorkerTasks from "./pages/WorkerTasks";
import Community from './pages/Community';
import VetDashboard from './pages/vet/VetDashboard';
import VetFarms from './pages/vet/VetFarms';
import VetFarmDetail from './pages/vet/VetFarmDetail';
import VetMessages from './pages/vet/VetMessages';
import VetRecords from './pages/vet/VetRecords';
import VetVisits from './pages/vet/VetVisits';
import VetConnections from './pages/vet/VetConnections';
import VetProfile from './pages/vet/VetProfile';
// Aggregator Imports
import AggregatorDashboard from './pages/aggregator/AggregatorDashboard';
// Admin Imports
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFarmers from './pages/admin/AdminFarmers';
import AdminVets from './pages/admin/AdminVets';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminTickets from './pages/admin/AdminTickets';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminLogs from './pages/admin/AdminLogs';
import AdminSettings from './pages/admin/AdminSettings';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import MainLayout from './components/Layout/MainLayout';
import './i18n';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    
    // Role check
    // Note: User model has 'is_staff' but role field might be sufficient if managed correctly.
    // For admin routes, we check if role is ADMIN (or verify is_staff if available in user object)
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
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/otp" element={<OTPVerification />} />
            
            {/* Farmer Routes */}
            <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
                    <MainLayout><Dashboard /></MainLayout>
                </ProtectedRoute>
            } />
            <Route path="/animals" element={
                <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
                    <MainLayout><HerdOverview /></MainLayout>
                </ProtectedRoute>
            } />
            <Route path="/animals/:id" element={
                <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
                    <MainLayout><AnimalDetail /></MainLayout>
                </ProtectedRoute>
            } />
            <Route path="/dairy" element={
                <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
                    <MainLayout><ProductionDashboard /></MainLayout>
                </ProtectedRoute>
            } />
            <Route path="/dairy/record" element={
                <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
                    <MainLayout><DailyMilkEntry /></MainLayout>
                </ProtectedRoute>
            } />
            <Route path="/insights" element={
                <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
                    <MainLayout><Insights /></MainLayout>
                </ProtectedRoute>
            } />
            <Route path="/finance" element={
                <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
                    <MainLayout><Finance /></MainLayout>
                </ProtectedRoute>
            } />
            <Route path="/alerts" element={
                <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
                    <MainLayout><Alerts /></MainLayout>
                </ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
                    <MainLayout><Settings /></MainLayout>
                </ProtectedRoute>
            } />
            <Route path="/tasks" element={
                <ProtectedRoute allowedRoles={['FARMER', 'FARM_WORKER']}>
                    <WorkerTasks />
                </ProtectedRoute>
            } />
            <Route path="/community" element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                    <MainLayout><Community /></MainLayout>
                </ProtectedRoute>
            } />
            <Route path="/find-vet" element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                    <FindVet />
                </ProtectedRoute>
            } />
            <Route path="/messages" element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                    <Messages />
                </ProtectedRoute>
            } />

            {/* Vet Routes */}
            <Route path="/vet/dashboard" element={
                <ProtectedRoute allowedRoles={['VETERINARIAN']}>
                    <VetDashboard />
                </ProtectedRoute>
            } />
            <Route path="/vet/farms" element={
                <ProtectedRoute allowedRoles={['VETERINARIAN']}>
                    <VetFarms />
                </ProtectedRoute>
            } />
            <Route path="/vet/farms/:farmId" element={
                <ProtectedRoute allowedRoles={['VETERINARIAN']}>
                    <VetFarmDetail />
                </ProtectedRoute>
            } />
            <Route path="/vet/messages" element={
                <ProtectedRoute allowedRoles={['VETERINARIAN']}>
                    <VetMessages />
                </ProtectedRoute>
            } />
            <Route path="/vet/records" element={
                <ProtectedRoute allowedRoles={['VETERINARIAN']}>
                    <VetRecords />
                </ProtectedRoute>
            } />
            <Route path="/vet/visits" element={
                <ProtectedRoute allowedRoles={['VETERINARIAN']}>
                    <VetVisits />
                </ProtectedRoute>
            } />
            <Route path="/vet/connections" element={
                <ProtectedRoute allowedRoles={['VETERINARIAN']}>
                    <VetConnections />
                </ProtectedRoute>
            } />
            <Route path="/vet/profile" element={
                <ProtectedRoute allowedRoles={['VETERINARIAN']}>
                    <VetProfile />
                </ProtectedRoute>
            } />

            {/* Aggregator Routes */}
            <Route path="/aggregator/dashboard" element={
                <ProtectedRoute allowedRoles={['AGGREGATOR']}>
                    <AggregatorDashboard />
                </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            <Route path="/admin/farmers" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminFarmers />
                </ProtectedRoute>
            } />
            <Route path="/admin/vets" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminVets />
                </ProtectedRoute>
            } />
            <Route path="/admin/subscriptions" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminSubscriptions />
                </ProtectedRoute>
            } />
            <Route path="/admin/tickets" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminTickets />
                </ProtectedRoute>
            } />
            <Route path="/admin/announcements" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminAnnouncements />
                </ProtectedRoute>
            } />
            <Route path="/admin/logs" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminLogs />
                </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminSettings />
                </ProtectedRoute>
            } />
            <Route path="/admin/*" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
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
