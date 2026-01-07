import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Loading from './components/common/Loading';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Lazy Load Pages
const Login = lazy(() => import('./pages/Login'));
const Akun = lazy(() => import('./pages/shared/Akun'));

// KUA Pages
const KuaDashboard = lazy(() => import('./pages/kua/Dashboard'));
const SubmissionWizard = lazy(() => import('./pages/kua/wizard/SubmissionWizard'));
const SubmissionList = lazy(() => import('./pages/kua/SubmissionList'));
const SubmissionDetail = lazy(() => import('./pages/kua/SubmissionDetail'));
const SubmissionHistory = lazy(() => import('./pages/kua/SubmissionHistory'));
const LaporanKUA = lazy(() => import('./pages/kua/Laporan'));

// Shared Dukcapil Pages
const VerificationDetail = lazy(() => import('./pages/dukcapil/VerificationDetail'));
const LaporanDukcapil = lazy(() => import('./pages/dukcapil/Laporan'));

// Operator Dukcapil Pages
const OperatorDashboard = lazy(() => import('./pages/dukcapil/operator/Dashboard'));
const OperatorQueue = lazy(() => import('./pages/dukcapil/operator/Queue'));
const OperatorMyWork = lazy(() => import('./pages/dukcapil/operator/MyWork'));
const OperatorHistory = lazy(() => import('./pages/dukcapil/operator/History'));

// Verifier Dukcapil Pages
const VerifierDashboard = lazy(() => import('./pages/dukcapil/verifier/Dashboard'));
const VerifierQueue = lazy(() => import('./pages/dukcapil/verifier/Queue'));
const VerifierHistory = lazy(() => import('./pages/dukcapil/verifier/History'));

// Kemenag Pages
const KemenagDashboard = lazy(() => import('./pages/kemenag/Dashboard'));
const LaporanKemenag = lazy(() => import('./pages/kemenag/Laporan'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const SystemLogs = lazy(() => import('./pages/admin/SystemLogs'));
const MasterKecamatan = lazy(() => import('./pages/admin/MasterKecamatan'));

// Component to handle root redirect based on role
const RootRedirect = () => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

    switch (user.role) {
        case 'KUA': return <Navigate to="/kua/dashboard" replace />;
        case 'OPERATOR_DUKCAPIL': return <Navigate to="/dukcapil/dashboard" replace />;
        case 'VERIFIKATOR_DUKCAPIL': return <Navigate to="/dukcapil/dashboard" replace />;
        case 'KEMENAG': return <Navigate to="/kemenag/dashboard" replace />;
        case 'ADMIN': return <Navigate to="/admin/dashboard" replace />;
        default: return <Navigate to="/auth/login" replace />;
    }
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Suspense fallback={<Loading />}>
                    <Routes>
                        {/* Auth Routes */}
                        <Route path="/auth" element={<AuthLayout />}>
                            <Route path="login" element={<Login />} />
                            <Route index element={<Navigate to="/auth/login" replace />} />
                        </Route>

                        {/* Redirect Root */}
                        <Route path="/" element={<RootRedirect />} />
                        <Route path="/login" element={<Navigate to="/auth/login" replace />} />

                        {/* Protected Application Routes */}
                        <Route element={<DashboardLayout />}>
                            {/* KUA Routes */}
                            <Route path="/kua">
                                <Route
                                    path="dashboard"
                                    element={
                                        <ProtectedRoute roles={['KUA']}>
                                            <KuaDashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="submission/new"
                                    element={
                                        <ProtectedRoute roles={['KUA']}>
                                            <SubmissionWizard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="submission/edit/:id"
                                    element={
                                        <ProtectedRoute roles={['KUA']}>
                                            <SubmissionWizard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="submission/:id"
                                    element={
                                        <ProtectedRoute roles={['KUA']}>
                                            <SubmissionDetail />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="submissions/active"
                                    element={
                                        <ProtectedRoute roles={['KUA']}>
                                            <SubmissionList />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="submissions/history"
                                    element={
                                        <ProtectedRoute roles={['KUA']}>
                                            <SubmissionHistory />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="laporan"
                                    element={
                                        <ProtectedRoute roles={['KUA']}>
                                            <LaporanKUA />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="akun"
                                    element={
                                        <ProtectedRoute roles={['KUA']}>
                                            <Akun />
                                        </ProtectedRoute>
                                    }
                                />
                            </Route>

                            {/* Dukcapil Routes - Unified Interface */}
                            <Route path="/dukcapil">
                                {/* Dashboard - Both roles */}
                                <Route
                                    path="dashboard"
                                    element={
                                        <ProtectedRoute roles={['OPERATOR_DUKCAPIL', 'VERIFIKATOR_DUKCAPIL']}>
                                            <OperatorDashboard />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Operator Functions - Both roles can access */}
                                <Route
                                    path="queue"
                                    element={
                                        <ProtectedRoute roles={['OPERATOR_DUKCAPIL', 'VERIFIKATOR_DUKCAPIL']}>
                                            <OperatorQueue />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="my-work"
                                    element={
                                        <ProtectedRoute roles={['OPERATOR_DUKCAPIL', 'VERIFIKATOR_DUKCAPIL']}>
                                            <OperatorMyWork />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="history"
                                    element={
                                        <ProtectedRoute roles={['OPERATOR_DUKCAPIL', 'VERIFIKATOR_DUKCAPIL']}>
                                            <OperatorHistory />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="process/:id"
                                    element={
                                        <ProtectedRoute roles={['OPERATOR_DUKCAPIL', 'VERIFIKATOR_DUKCAPIL']}>
                                            <VerificationDetail />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Verification Queue - Verifier only */}
                                <Route
                                    path="verification-queue"
                                    element={
                                        <ProtectedRoute roles={['VERIFIKATOR_DUKCAPIL']}>
                                            <VerifierQueue />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="verify/:id"
                                    element={
                                        <ProtectedRoute roles={['VERIFIKATOR_DUKCAPIL']}>
                                            <VerificationDetail />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Shared */}
                                <Route
                                    path="submission/:id"
                                    element={
                                        <ProtectedRoute roles={['OPERATOR_DUKCAPIL', 'VERIFIKATOR_DUKCAPIL']}>
                                            <VerificationDetail />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="laporan"
                                    element={
                                        <ProtectedRoute roles={['OPERATOR_DUKCAPIL', 'VERIFIKATOR_DUKCAPIL']}>
                                            <LaporanDukcapil />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="akun"
                                    element={
                                        <ProtectedRoute roles={['OPERATOR_DUKCAPIL', 'VERIFIKATOR_DUKCAPIL']}>
                                            <Akun />
                                        </ProtectedRoute>
                                    }
                                />
                            </Route>

                            {/* Kemenag Routes */}
                            <Route path="/kemenag">
                                <Route
                                    path="dashboard"
                                    element={
                                        <ProtectedRoute roles={['KEMENAG']}>
                                            <KemenagDashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="laporan"
                                    element={
                                        <ProtectedRoute roles={['KEMENAG']}>
                                            <LaporanKemenag />
                                        </ProtectedRoute>
                                    }
                                />
                            </Route>

                            {/* Admin Routes */}
                            <Route path="/admin">
                                <Route
                                    path="dashboard"
                                    element={
                                        <ProtectedRoute roles={['ADMIN']}>
                                            <AdminDashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="users"
                                    element={
                                        <ProtectedRoute roles={['ADMIN']}>
                                            <UserManagement />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="logs"
                                    element={
                                        <ProtectedRoute roles={['ADMIN']}>
                                            <SystemLogs />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="master"
                                    element={
                                        <ProtectedRoute roles={['ADMIN']}>
                                            <MasterKecamatan />
                                        </ProtectedRoute>
                                    }
                                />
                            </Route>
                        </Route>

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

