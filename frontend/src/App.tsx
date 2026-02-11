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
import { NotificationSettingsPage } from '@/features/admin/NotificationSettingsPage'
import { CertificationsSettingsPage } from '@/features/admin/CertificationsSettingsPage'
import { JobTitlesSettingsPage } from '@/features/admin/JobTitlesSettingsPage'
import { PhotosPage } from '@/features/photos/PhotosPage'
import { CommunicationsPage } from '@/features/communications/CommunicationsPage'
import { HealthSafetyPage } from '@/features/health/HealthSafetyPage'
import { LandingPage } from '@/features/landing/LandingPage'
import { MarketingLayout } from '@/features/landing/MarketingLayout'
import { FeaturesPage } from '@/features/landing/FeaturesPage'
import { GalleryPage } from '@/features/landing/GalleryPage'
import { ScheduleDemoPage } from '@/features/landing/ScheduleDemoPage'
import { DashboardPreviewPage } from '@/features/landing/DashboardPreviewPage'
import { AboutPage } from '@/features/landing/AboutPage'
import { ContactPage } from '@/features/landing/ContactPage'
import { StaffDirectoryPage } from '@/features/staff/StaffDirectoryPage'
import { StaffProfilePage } from '@/features/staff/StaffProfilePage'
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard'
import { OnboardingDashboard } from '@/features/onboarding/OnboardingDashboard'

// Phase 5: Analytics, Activities, Bunks, Families
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'
import { ActivitiesPage } from '@/features/activities/ActivitiesPage'
import { BunksPage } from '@/features/bunks/BunksPage'
import { FamiliesPage } from '@/features/families/FamiliesPage'
import { FamilyDetailPage } from '@/features/families/FamilyDetailPage'

// Phase 8: Form Builder, Workflows
import { FormsPage } from '@/features/forms/FormsPage'
import { FormEditorPage } from '@/features/forms/FormEditorPage'
import { WorkflowsPage } from '@/features/workflows/WorkflowsPage'
import { WorkflowEditorPage } from '@/features/workflows/WorkflowEditorPage'

// Phase 9: Lists
import { ListsPage } from '@/features/lists/ListsPage'
import { ListDetailPage } from '@/features/lists/ListDetailPage'

// Phase 10: AI Insights
import { AIInsightsPage } from '@/features/ai/AIInsightsPage'

// Phase 11: Messaging, Health, Alerts
import { CamperMessagingPage } from '@/features/messaging/CamperMessagingPage'
import { NurseSchedulePage } from '@/features/health/NurseSchedulePage'
import { AlertsPage } from '@/features/alerts/AlertsPage'

// Phase 7: Schedule, Payments, Reports, Store, Portal
import { SchedulePage } from '@/features/schedule/SchedulePage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { StoreManagementPage } from '@/features/store/StoreManagementPage'
import { PortalLayout } from '@/features/portal/PortalLayout'
import { PortalDashboard } from '@/features/portal/PortalDashboard'
import { PortalCamperView } from '@/features/portal/PortalCamperView'
import { PortalPhotos } from '@/features/portal/PortalPhotos'
import { PortalInvoices } from '@/features/portal/PortalInvoices'
import { PortalMessages } from '@/features/portal/PortalMessages'
import { PortalMedicine } from '@/features/portal/PortalMedicine'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Public marketing pages */}
          <Route path="/" element={<LandingPage />} />
          <Route element={<MarketingLayout />}>
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/schedule-demo" element={<ScheduleDemoPage />} />
            <Route path="/dashboard-preview" element={<DashboardPreviewPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

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

            {/* Phase 7: Schedule, Payments, Reports, Store */}
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="store" element={<StoreManagementPage />} />

            {/* Phase 8: Form Builder, Workflows */}
            <Route path="forms" element={<FormsPage />} />
            <Route path="forms/:id" element={<FormEditorPage />} />
            <Route path="workflows" element={<WorkflowsPage />} />
            <Route path="workflows/:id" element={<WorkflowEditorPage />} />

            {/* Phase 9: Lists */}
            <Route path="lists" element={<ListsPage />} />
            <Route path="lists/:id" element={<ListDetailPage />} />

            {/* Phase 10: AI Insights */}
            <Route path="ai-insights" element={<AIInsightsPage />} />

            {/* Phase 11: Messaging, Health, Alerts */}
            <Route path="camper-messages" element={<CamperMessagingPage />} />
            <Route path="nurse-schedule" element={<NurseSchedulePage />} />
            <Route path="alerts" element={<AlertsPage />} />

            {/* Settings (nested routes) */}
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="/app/settings/profile" replace />} />
              <Route path="profile" element={<OrgProfilePage />} />
              <Route path="locations" element={<LocationsPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="general" element={<GeneralSettingsPage />} />
              <Route path="notifications" element={<NotificationSettingsPage />} />
              <Route path="certifications" element={<CertificationsSettingsPage />} />
              <Route path="job-titles" element={<JobTitlesSettingsPage />} />
            </Route>
          </Route>

          {/* Parent Portal */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <PortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PortalDashboard />} />
            <Route path="campers/:id" element={<PortalCamperView />} />
            <Route path="photos" element={<PortalPhotos />} />
            <Route path="invoices" element={<PortalInvoices />} />
            <Route path="messages" element={<PortalMessages />} />
            <Route path="medicine" element={<PortalMedicine />} />
          </Route>

          {/* Legacy redirects - old routes to new /app prefix */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/events/*" element={<Navigate to="/app/events" replace />} />
          <Route path="/campers/*" element={<Navigate to="/app/campers" replace />} />
          <Route path="/contacts/*" element={<Navigate to="/app/contacts" replace />} />
          <Route path="/registrations" element={<Navigate to="/app/registrations" replace />} />
          <Route path="/communications" element={<Navigate to="/app/communications" replace />} />
          <Route path="/health-safety" element={<Navigate to="/app/health-safety" replace />} />
          <Route path="/photos" element={<Navigate to="/app/photos" replace />} />
          <Route path="/staff/*" element={<Navigate to="/app/staff" replace />} />
          <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
          <Route path="/store" element={<Navigate to="/app/store" replace />} />
          <Route path="/settings/*" element={<Navigate to="/app/settings" replace />} />

          {/* Catch-all: redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
