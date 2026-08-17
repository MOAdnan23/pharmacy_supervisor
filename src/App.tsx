/**
 * App = خريطة الصفحات (Routes)
 *
 * كل Route يقول: إذا كان المسار كذا → اعرض هذه الصفحة.
 * ProtectedRoute: يمنع الدخول للصفحات الداخلية قبل تسجيل الدخول.
 */
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './features/auth/AuthContext'
import { LoginPage } from './features/auth/pages/LoginPage'
import { CompensationPage } from './features/compensation/pages/CompensationPage'
import { DashboardPage } from './features/dashboard/pages/DashboardPage'
import { EvaluationPage } from './features/evaluation/pages/EvaluationPage'
import { FinancePage } from './features/finance/pages/FinancePage'
import { NotificationsPage } from './features/notifications/pages/NotificationsPage'
import { OfferDetailPage } from './features/offers/pages/OfferDetailPage'
import { OfferWizardPage } from './features/offers/pages/OfferWizardPage'
import { OffersArchivePage } from './features/offers/pages/OffersArchivePage'
import { OffersListPage } from './features/offers/pages/OffersListPage'
import { PlanDetailPage } from './features/plans/pages/PlanDetailPage'
import { PlanWizardPage } from './features/plans/pages/PlanWizardPage'
import { PlansListPage } from './features/plans/pages/PlansListPage'
import { RatesPage } from './features/rates/pages/RatesPage'
import { RegionsPage } from './features/regions/pages/RegionsPage'
import { ReportsPage } from './features/reports/pages/ReportsPage'
import { SettingsPage } from './features/settings/pages/SettingsPage'
import { UsersPage } from './features/users/pages/UsersPage'
import { WarehousePage } from './features/warehouse/pages/WarehousePage'
import { AppShell } from './shared/layout/AppShell'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    // غير مسجّل → أعد توجيهه لصفحة الدخول
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* الصفحات داخل الهيكل (Sidebar + Header) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* index = المسار "/" نفسه */}
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="regions" element={<RegionsPage />} />
        <Route path="offers" element={<OffersListPage />} />
        <Route path="offers/new" element={<OfferWizardPage />} />
        <Route path="offers/archive" element={<OffersArchivePage />} />
        <Route path="offers/:id" element={<OfferDetailPage />} />
        <Route path="offers/:id/edit" element={<OfferWizardPage />} />
        <Route path="plans" element={<PlansListPage />} />
        <Route path="plans/new" element={<PlanWizardPage />} />
        <Route path="plans/:id" element={<PlanDetailPage />} />
        <Route path="plans/:id/edit" element={<PlanWizardPage />} />
        <Route path="rates" element={<RatesPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="evaluation" element={<EvaluationPage />} />
        <Route path="compensation" element={<CompensationPage />} />
        <Route path="warehouse" element={<WarehousePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* أي مسار غير معروف → الصفحة الرئيسية */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
