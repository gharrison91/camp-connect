import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ToastProvider } from '@/components/ui/Toast'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { EventsPage } from '@/features/events/EventsPage'
import { EventDetailPage } from '@/features/events/EventDetailPage'
import { CampersPage } from '@/features/campers/CampersPage'
import { CamperDetailPage } from '@/features/campers/CamperDetailPage'
import { ContactsPage } from '@/features/contacts/ContactsPage'
import { ContactDetailPage } from '@/features/contacts/ContactDetailPage'
import { RegistrationListPage } from '@/features/registrations/RegistrationListPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { SettingsLayout } from '@/features/admin/SettingsLayout'
import { OrgProfilePage } from '@/features/admin/OrgProfilePage'
import { LocationsPage } from '@/features/admin/LocationsPage'
import { RolesPage } from '@/features/admin/RolesPage'
import { UsersPage } from '@/features/admin/UsersPage'
import { GeneralSettingsPage } from '@/features/admin/GeneralSettingsPage'
import { PhotosPage } from '@/features/photos/PhotosPage'
import { CommunicationsPage } from '@/features/communications/CommunicationsPage'
import { HealthSafetyPage } from '@/features/health/HealthSafetyPage'
import { LandingPage } from '@/features/landing/LandingPage'
import { StaffDirectoryPage } from '@/features/staff/StaffDirectoryPage'
import { StaffProfilePage } from '@/features/staff/StaffProfilePage'
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard'
import { OnboardingDashboard } from '@/features/onboarding/OnboardingDashboard'
import { StorePage } from '@/features/placeholder/PlaceholderPages'

// Phase 5: Analytics, Activities, Bunks, Families
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'
import { ActivitiesPage } from '@/features/activities/ActivitiesPage'
import { BunksPage } from '@/features/bunks/BunksPage'
import { FamiliesPage } from '@/features/families/FamiliesPage'
import { FamilyDetailPage } from '@/features/families/FamilyDetailPage'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Public marketing landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/:id" element={<EventDetailPage />} />
            <Route path="campers" element={<CampersPage />} />
            <Route path="campers/:id" element={<CamperDetailPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="contacts/:id" element={<ContactDetailPage />} />
            <Route path="registrations" element={<RegistrationListPage />} />

            {/* Phase 3 */}
            <Route path="communications" element={<CommunicationsPage />} />
            <Route path="health-safety" element={<HealthSafetyPage />} />
            <Route path="photos" element={<PhotosPage />} />

            {/* Phase 4: Staff & Onboarding */}
            <Route path="staff" element={<StaffDirectoryPage />} />
            <Route path="staff/:id" element={<StaffProfilePage />} />
            <Route path="onboarding" element={<OnboardingWizard />} />
            <Route path="onboarding/manage" element={<OnboardingDashboard />} />

            {/* Phase 5: Analytics, Activities, Bunks, Families */}
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="bunks" element={<BunksPage />} />
            <Route path="families" element={<FamiliesPage />} />
            <Route path="families/:id" element={<FamilyDetailPage />} />

            {/* Placeholder pages */}
            <Route path="store" element={<StorePage />} />

            {/* Settings (nested routes) */}
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="/app/settings/profile" replace />} />
              <Route path="profile" element={<OrgProfilePage />} />
              <Route path="locations" element={<LocationsPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="general" element={<GeneralSettingsPage />} />
            </Route>
          </Route>

          {/* Legacy redirects - old routes to new /app prefix */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/events" element={<Navigate to="/app/events" replace />} />
          <Route path="/campers" element={<Navigate to="/app/campers" replace />} />
          <Route path="/contacts" element={<Navigate to="/app/contacts" replace />} />
          <Route path="/registrations" element={<Navigate to="/app/registrations" replace />} />
          <Route path="/communications" element={<Navigate to="/app/communications" replace />} />
          <Route path="/health-safety" element={<Navigate to="/app/health-safety" replace />} />
          <Route path="/photos" element={<Navigate to="/app/photos" replace />} />
          <Route path="/staff" element={<Navigate to="/app/staff" replace />} />
          <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
          <Route path="/store" element={<Navigate to="/app/store" replace />} />
          <Route path="/settings/*" element={<Navigate to="/app/settings" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
