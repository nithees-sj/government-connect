import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { MainLayout } from '@/layouts/MainLayout';
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { ApplicationDetailPage } from '@/pages/ApplicationDetailPage';
import { NewApplicationPage } from '@/pages/NewApplicationPage';
import { DocumentsVaultPage } from '@/pages/DocumentsVaultPage';
import { ConsentCenterPage } from '@/pages/ConsentCenterPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { OfficerQueuePage } from '@/pages/OfficerQueuePage';
import { AdminConnectorsPage } from '@/pages/AdminConnectorsPage';
import { AdminSchemaMappingPage } from '@/pages/AdminSchemaMappingPage';
import { AdminAuditPage } from '@/pages/AdminAuditPage';
import { AdminMonitoringPage } from '@/pages/AdminMonitoringPage';
import { AdminDemoControlsPage } from '@/pages/AdminDemoControlsPage';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/new" element={<NewApplicationPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/documents" element={<DocumentsVaultPage />} />
          <Route path="/consents" element={<ConsentCenterPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Officer & Admin routes */}
          <Route path="/officer/queue" element={<OfficerQueuePage />} />
          <Route path="/connectors" element={<AdminConnectorsPage />} />
          <Route path="/schema-mappings" element={<AdminSchemaMappingPage />} />
          <Route path="/audit" element={<AdminAuditPage />} />
          <Route path="/monitoring" element={<AdminMonitoringPage />} />
          <Route path="/demo-controls" element={<AdminDemoControlsPage />} />
        </Route>

        {/* Unauthorized */}
        <Route
          path="/unauthorized"
          element={
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                gap: 16,
              }}
            >
              <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>🚫 Unauthorized</h1>
              <p style={{ color: '#64748b' }}>
                You do not have permission to access this government resource.
              </p>
            </div>
          }
        />

        {/* Public Landing Home */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
