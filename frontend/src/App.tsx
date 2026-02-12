import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ToastProvider } from '@/components/ui/Toast'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { LandingPage } from '@/features/landing/LandingPage'
import { MarketingLayout } from '@/features/landing/MarketingLayout'

// Lazy-loaded page components (code splitting)
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const EventsPage = lazy(() => import('@/features/events/EventsPage').then(m => ({ default: m.EventsPage })))
const EventDetailPage = lazy(() => import('@/features/events/EventDetailPage').then(m => ({ default: m.EventDetailPage })))
const CampersPage = lazy(() => import('@/features/campers/CampersPage').then(m => ({ default: m.CampersPage })))
const CamperDetailPage = lazy(() => import('@/features/campers/CamperDetailPage').then(m => ({ default: m.CamperDetailPage })))
const ContactsPage = lazy(() => import('@/features/contacts/ContactsPage').then(m => ({ default: m.ContactsPage })))
const ContactDetailPage = lazy(() => import('@/features/contacts/ContactDetailPage').then(m => ({ default: m.ContactDetailPage })))
const RegistrationListPage = lazy(() => import('@/features/registrations/RegistrationListPage').then(m => ({ default: m.RegistrationListPage })))

// Settings pages
const SettingsLayout = lazy(() => import('@/features/admin/SettingsLayout').then(m => ({ default: m.SettingsLayout })))
const OrgProfilePage = lazy(() => import('@/features/admin/OrgProfilePage').then(m => ({ default: m.OrgProfilePage })))
const LocationsPage = lazy(() => import('@/features/admin/LocationsPage').then(m => ({ default: m.LocationsPage })))
const RolesPage = lazy(() => import('@/features/admin/RolesPage').then(m => ({ default: m.RolesPage })))
const UsersPage = lazy(() => import('@/features/admin/UsersPage').then(m => ({ default: m.UsersPage })))
const GeneralSettingsPage = lazy(() => import('@/features/admin/GeneralSettingsPage').then(m => ({ default: m.GeneralSettingsPage })))
const NotificationSettingsPage = lazy(() => import('@/features/admin/NotificationSettingsPage').then(m => ({ default: m.NotificationSettingsPage })))
const CertificationsSettingsPage = lazy(() => import('@/features/admin/CertificationsSettingsPage').then(m => ({ default: m.CertificationsSettingsPage })))
const JobTitlesSettingsPage = lazy(() => import('@/features/admin/JobTitlesSettingsPage').then(m => ({ default: m.JobTitlesSettingsPage })))
const DeveloperReferencePage = lazy(() => import('@/features/admin/DeveloperReferencePage').then(m => ({ default: m.DeveloperReferencePage })))

// Phase 3
const PhotosPage = lazy(() => import('@/features/photos/PhotosPage').then(m => ({ default: m.PhotosPage })))
const CommunicationsPage = lazy(() => import('@/features/communications/CommunicationsPage').then(m => ({ default: m.CommunicationsPage })))
const HealthSafetyPage = lazy(() => import('@/features/health/HealthSafetyPage').then(m => ({ default: m.HealthSafetyPage })))

// Marketing pages
const FeaturesPage = lazy(() => import('@/features/landing/FeaturesPage').then(m => ({ default: m.FeaturesPage })))
const GalleryPage = lazy(() => import('@/features/landing/GalleryPage').then(m => ({ default: m.GalleryPage })))
const ScheduleDemoPage = lazy(() => import('@/features/landing/ScheduleDemoPage').then(m => ({ default: m.ScheduleDemoPage })))
const DashboardPreviewPage = lazy(() => import('@/features/landing/DashboardPreviewPage').then(m => ({ default: m.DashboardPreviewPage })))
const AboutPage = lazy(() => import('@/features/landing/AboutPage').then(m => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('@/features/landing/ContactPage').then(m => ({ default: m.ContactPage })))
const BlogPage = lazy(() => import('@/features/landing/BlogPage').then(m => ({ default: m.BlogPage })))
const MapPage = lazy(() => import('@/features/landing/MapPage').then(m => ({ default: m.MapPage })))

// Phase 4: Staff & Onboarding
const StaffDirectoryPage = lazy(() => import('@/features/staff/StaffDirectoryPage').then(m => ({ default: m.StaffDirectoryPage })))
const StaffProfilePage = lazy(() => import('@/features/staff/StaffProfilePage').then(m => ({ default: m.StaffProfilePage })))
const OnboardingWizard = lazy(() => import('@/features/onboarding/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })))
const OnboardingDashboard = lazy(() => import('@/features/onboarding/OnboardingDashboard').then(m => ({ default: m.OnboardingDashboard })))

// Phase 5: Analytics, Activities, Bunks, Families
const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const ActivitiesPage = lazy(() => import('@/features/activities/ActivitiesPage').then(m => ({ default: m.ActivitiesPage })))
const BunksPage = lazy(() => import('@/features/bunks/BunksPage').then(m => ({ default: m.BunksPage })))
const FamiliesPage = lazy(() => import('@/features/families/FamiliesPage').then(m => ({ default: m.FamiliesPage })))
const FamilyDetailPage = lazy(() => import('@/features/families/FamilyDetailPage').then(m => ({ default: m.FamilyDetailPage })))

// Phase 7: Schedule, Payments, Reports, Store
const SchedulePage = lazy(() => import('@/features/schedule/SchedulePage').then(m => ({ default: m.SchedulePage })))
const PaymentsPage = lazy(() => import('@/features/payments/PaymentsPage').then(m => ({ default: m.PaymentsPage })))
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage').then(m => ({ default: m.ReportsPage })))
const StoreManagementPage = lazy(() => import('@/features/store/StoreManagementPage').then(m => ({ default: m.StoreManagementPage })))
const SpendingAccountsPage = lazy(() => import('@/features/store/SpendingAccountsPage').then(m => ({ default: m.SpendingAccountsPage })))

// Phase 7: Portal
const PortalLayout = lazy(() => import('@/features/portal/PortalLayout').then(m => ({ default: m.PortalLayout })))
const PortalCamperView = lazy(() => import('@/features/portal/PortalCamperView').then(m => ({ default: m.PortalCamperView })))
const PortalPhotos = lazy(() => import('@/features/portal/PortalPhotos').then(m => ({ default: m.PortalPhotos })))
const PortalInvoices = lazy(() => import('@/features/portal/PortalInvoices').then(m => ({ default: m.PortalInvoices })))
const PortalMessages = lazy(() => import('@/features/portal/PortalMessages').then(m => ({ default: m.PortalMessages })))
const PortalMedicine = lazy(() => import('@/features/portal/PortalMedicine').then(m => ({ default: m.PortalMedicine })))
const PortalDocuments = lazy(() => import('@/features/portal/PortalDocuments').then(m => ({ default: m.PortalDocuments })))
const PortalForms = lazy(() => import('@/features/portal/PortalForms').then(m => ({ default: m.PortalForms })))
const PortalBunkBuddies = lazy(() => import('@/features/portal/PortalBunkBuddies').then(m => ({ default: m.PortalBunkBuddies })))
const PortalDashboardPage = lazy(() => import('@/features/portal/PortalDashboardPage').then(m => ({ default: m.PortalDashboardPage })))

// Phase 8: Form Builder, Workflows
const FormsPage = lazy(() => import('@/features/forms/FormsPage').then(m => ({ default: m.FormsPage })))
const FormEditorPage = lazy(() => import('@/features/forms/FormEditorPage').then(m => ({ default: m.FormEditorPage })))
const WorkflowsPage = lazy(() => import('@/features/workflows/WorkflowsPage').then(m => ({ default: m.WorkflowsPage })))
const WorkflowEditorPage = lazy(() => import('@/features/workflows/WorkflowEditorPage').then(m => ({ default: m.WorkflowEditorPage })))

// Phase 9: Lists
const ListsPage = lazy(() => import('@/features/lists/ListsPage').then(m => ({ default: m.ListsPage })))
const ListDetailPage = lazy(() => import('@/features/lists/ListDetailPage').then(m => ({ default: m.ListDetailPage })))

// Phase 10: AI Insights
const AIInsightsPage = lazy(() => import('@/features/ai/AIInsightsPage').then(m => ({ default: m.AIInsightsPage })))

// Phase 11: Messaging, Health, Alerts
const CamperMessagingPage = lazy(() => import('@/features/messaging/CamperMessagingPage').then(m => ({ default: m.CamperMessagingPage })))
const NurseSchedulePage = lazy(() => import('@/features/health/NurseSchedulePage').then(m => ({ default: m.NurseSchedulePage })))
const AlertsPage = lazy(() => import('@/features/alerts/AlertsPage').then(m => ({ default: m.AlertsPage })))

// Phase 13: CRM / Deals, Embeddable Forms, Invoice Template
const DealsPage = lazy(() => import('@/features/deals/DealsPage').then(m => ({ default: m.DealsPage })))
const JobsPage = lazy(() => import('@/features/jobs/JobsPage').then(m => ({ default: m.JobsPage })))
const BackgroundChecksPage = lazy(() => import('@/features/staff/BackgroundChecksPage').then(m => ({ default: m.BackgroundChecksPage })))
const CertificationsPage = lazy(() => import('@/features/staff/CertificationsPage').then(m => ({ default: m.CertificationsPage })))
const StaffSchedulePage = lazy(() => import('@/features/staff/StaffSchedulePage').then(m => ({ default: m.StaffSchedulePage })))
const IncidentsPage = lazy(() => import('@/features/incidents/IncidentsPage').then(m => ({ default: m.IncidentsPage })))
const PublicFormPage = lazy(() => import('@/features/forms/PublicFormPage').then(m => ({ default: m.PublicFormPage })))
const InvoiceTemplateSettings = lazy(() => import('@/features/admin/InvoiceTemplateSettings').then(m => ({ default: m.InvoiceTemplateSettings })))
const CustomFieldsSettingsPage = lazy(() => import('@/features/admin/CustomFieldsSettingsPage').then(m => ({ default: m.CustomFieldsSettingsPage })))

// Phase 14: Camp Directory
const CampDetailPage = lazy(() => import('@/features/directory/CampDetailPage').then(m => ({ default: m.CampDetailPage })))
const CampProfileSettings = lazy(() => import('@/features/admin/CampProfileSettings').then(m => ({ default: m.CampProfileSettings })))

// Phase 15: Lead Enrichment, Portal enhancements
const LeadEnrichmentPage = lazy(() => import('@/features/leads/LeadEnrichmentPage').then(m => ({ default: m.LeadEnrichmentPage })))

// Awards & Achievements
const AwardsPage = lazy(() => import('@/features/awards/AwardsPage').then(m => ({ default: m.AwardsPage })))
const BrandingSettingsPage = lazy(() => import('@/features/admin/BrandingSettingsPage').then(m => ({ default: m.BrandingSettingsPage })))

// Phase 17: Inventory & Equipment
const InventoryPage = lazy(() => import('@/features/inventory/InventoryPage').then(m => ({ default: m.InventoryPage })))

// Meal Planning
const MealsPage = lazy(() => import('@/features/meals/MealsPage').then(m => ({ default: m.MealsPage })))

// Transportation
const TransportationPage = lazy(() => import('@/features/transportation/TransportationPage').then(m => ({ default: m.TransportationPage })))

// Packing Lists
const PackingListsPage = lazy(() => import('@/features/events/PackingListsPage').then(m => ({ default: m.PackingListsPage })))

// Parent Communication Log
const ParentLogsPage = lazy(() => import('@/features/parent-logs/ParentLogsPage').then(m => ({ default: m.ParentLogsPage })))

// Volunteer Management
const VolunteersPage = lazy(() => import('@/features/volunteers/VolunteersPage').then(m => ({ default: m.VolunteersPage })))

// Emergency Action Plans & Drills
const EmergencyPage = lazy(() => import('@/features/emergency/EmergencyPage').then(m => ({ default: m.EmergencyPage })))

// Facility Maintenance
const MaintenancePage = lazy(() => import('@/features/maintenance/MaintenancePage').then(m => ({ default: m.MaintenancePage })))

// Task Assignments
const TasksPage = lazy(() => import('@/features/tasks/TasksPage').then(m => ({ default: m.TasksPage })))

// Weather Monitoring
const WeatherPage = lazy(() => import('@/features/weather/WeatherPage').then(m => ({ default: m.WeatherPage })))

// Document Management
const DocumentsPage = lazy(() => import('@/features/documents/DocumentsPage').then(m => ({ default: m.DocumentsPage })))

// Visitor Management
const VisitorsPage = lazy(() => import('@/features/visitors/VisitorsPage').then(m => ({ default: m.VisitorsPage })))

// Attendance Tracking
const AttendancePage = lazy(() => import('@/features/attendance/AttendancePage').then(m => ({ default: m.AttendancePage })))

// Team Chat
const TeamChatPage = lazy(() => import('@/features/chat/TeamChatPage').then(m => ({ default: m.TeamChatPage })))

// Skill Tracking
const SkillTrackingPage = lazy(() => import('@/features/skills/SkillTrackingPage').then(m => ({ default: m.SkillTrackingPage })))

// Notification Preferences
const NotificationPreferencesPage = lazy(() => import('@/features/admin/NotificationPreferencesPage').then(m => ({ default: m.NotificationPreferencesPage })))

// Audit Log
const AuditLogPage = lazy(() => import('@/features/audit/AuditLogPage').then(m => ({ default: m.AuditLogPage })))

// Face Tagging
const FaceTaggingPage = lazy(() => import('@/features/photos/FaceTaggingPage').then(m => ({ default: m.FaceTaggingPage })))

// Waitlist
const WaitlistPage = lazy(() => import('@/features/waitlist/WaitlistPage').then(m => ({ default: m.WaitlistPage })))

// Medical Dashboard
const MedicalDashboardPage = lazy(() => import('@/features/health/MedicalDashboardPage').then(m => ({ default: m.MedicalDashboardPage })))

// Medical Log
const MedicalLogPage = lazy(() => import('@/features/health/MedicalLogPage').then(m => ({ default: m.MedicalLogPage })))

// Camp Directory (public)
const CampDirectoryPage = lazy(() => import('@/features/directory/CampDirectoryPage').then(m => ({ default: m.CampDirectoryPage })))

// Camp Sessions
const CampSessionsPage = lazy(() => import('@/features/events/CampSessionsPage').then(m => ({ default: m.CampSessionsPage })))

// Permission Slips
const PermissionSlipsPage = lazy(() => import('@/features/forms/PermissionSlipsPage').then(m => ({ default: m.PermissionSlipsPage })))

// Phase 23
const BudgetTrackerPage = lazy(() => import('@/features/budget/BudgetTrackerPage').then(m => ({ default: m.BudgetTrackerPage })))
const AlumniNetworkPage = lazy(() => import('@/features/alumni/AlumniNetworkPage').then(m => ({ default: m.AlumniNetworkPage })))
const SurveysPage = lazy(() => import('@/features/surveys/SurveysPage').then(m => ({ default: m.SurveysPage })))
const ResourceBookingPage = lazy(() => import('@/features/resources/ResourceBookingPage').then(m => ({ default: m.ResourceBookingPage })))
const SupplyRequestsPage = lazy(() => import('@/features/supplies/SupplyRequestsPage').then(m => ({ default: m.SupplyRequestsPage })))

// Phase 24: Carpool, Lost & Found, Allergy Matrix, Group Notes, Check-In/Out
const CarpoolPage = lazy(() => import('@/features/carpools/CarpoolPage').then(m => ({ default: m.CarpoolPage })))
const LostFoundPage = lazy(() => import('@/features/lost-found/LostFoundPage').then(m => ({ default: m.LostFoundPage })))
const AllergyMatrixPage = lazy(() => import('@/features/health/AllergyMatrixPage').then(m => ({ default: m.AllergyMatrixPage })))
const DietaryPage = lazy(() => import('@/features/dietary/DietaryPage').then(m => ({ default: m.DietaryPage })))
const GroupNotesPage = lazy(() => import('@/features/groups/GroupNotesPage').then(m => ({ default: m.GroupNotesPage })))
const CheckInOutPage = lazy(() => import('@/features/checkin/CheckInOutPage').then(m => ({ default: m.CheckInOutPage })))

// Phase 25: Behavior, Program Eval, Referrals
const BehaviorPage = lazy(() => import('@/features/behavior/BehaviorPage').then(m => ({ default: m.BehaviorPage })))
const GoalsPage = lazy(() => import('@/features/goals/GoalsPage').then(m => ({ default: m.GoalsPage })))
const AnnouncementsPage = lazy(() => import('@/features/announcements/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })))
const ProgramEvalPage = lazy(() => import('@/features/programs/ProgramEvalPage').then(m => ({ default: m.ProgramEvalPage })))
const FeedbackPage = lazy(() => import('@/features/feedback/FeedbackPage').then(m => ({ default: m.FeedbackPage })))
const ReferralsPage = lazy(() => import('@/features/referrals/ReferralsPage').then(m => ({ default: m.ReferralsPage })))
const RoomBookingPage = lazy(() => import('@/features/rooms/RoomBookingPage').then(m => ({ default: m.RoomBookingPage })))


function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Suspense fallback={<LoadingSpinner />}>
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
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/map" element={<MapPage />} />
            </Route>

            {/* Public embeddable forms */}
            <Route path="/embed/form/:id" element={<PublicFormPage />} />

            {/* Public camp directory */}
            <Route path="/directory" element={<CampDirectoryPage />} />
            <Route path="/directory/:slug" element={<CampDetailPage />} />

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
              <Route path="face-tagging" element={<FaceTaggingPage />} />

              {/* Phase 4: Staff & Onboarding */}
              <Route path="staff" element={<StaffDirectoryPage />} />
              <Route path="staff/:id" element={<StaffProfilePage />} />
              <Route path="staff-schedule" element={<StaffSchedulePage />} />
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
              <Route path="spending-accounts" element={<SpendingAccountsPage />} />

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

              {/* Phase 13: CRM / Deals */}
              <Route path="deals" element={<DealsPage />} />
              <Route path="jobs" element={<JobsPage />} />

              {/* Phase 14: Background Checks */}
              <Route path="background-checks" element={<BackgroundChecksPage />} />
              <Route path="certifications" element={<CertificationsPage />} />
              <Route path="incidents" element={<IncidentsPage />} />
              <Route path="waitlist" element={<WaitlistPage />} />
              <Route path="medical-dashboard" element={<MedicalDashboardPage />} />
              <Route path="medical-log" element={<MedicalLogPage />} />

              {/* Phase 16: Lead Enrichment */}
              <Route path="leads" element={<LeadEnrichmentPage />} />

              {/* Awards & Achievements */}
              <Route path="awards" element={<AwardsPage />} />

              {/* Phase 17: Inventory & Equipment */}
              <Route path="inventory" element={<InventoryPage />} />

              {/* Meal Planning */}
              <Route path="meals" element={<MealsPage />} />

              {/* Transportation */}
              <Route path="transportation" element={<TransportationPage />} />

              {/* Packing Lists */}
              <Route path="packing-lists" element={<PackingListsPage />} />

              {/* Camp Sessions */}
              <Route path="sessions" element={<CampSessionsPage />} />

              {/* Permission Slips */}
              <Route path="permission-slips" element={<PermissionSlipsPage />} />

              {/* Phase 23 */}
              <Route path="budget" element={<BudgetTrackerPage />} />
              <Route path="alumni" element={<AlumniNetworkPage />} />
              <Route path="surveys" element={<SurveysPage />} />
              <Route path="resource-booking" element={<ResourceBookingPage />} />
              <Route path="supply-requests" element={<SupplyRequestsPage />} />

              {/* Phase 24 */}
              <Route path="carpools" element={<CarpoolPage />} />
              <Route path="lost-found" element={<LostFoundPage />} />
              <Route path="allergy-matrix" element={<AllergyMatrixPage />} />
              <Route path="dietary" element={<DietaryPage />} />
              <Route path="group-notes" element={<GroupNotesPage />} />
              <Route path="check-in" element={<CheckInOutPage />} />

              {/* Phase 25 */}
              <Route path="behavior" element={<BehaviorPage />} />
              <Route path="goals" element={<GoalsPage />} />

              {/* Announcement Board */}
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="program-eval" element={<ProgramEvalPage />} />
              <Route path="referrals" element={<ReferralsPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="room-booking" element={<RoomBookingPage />} />

              {/* Parent Communication Log */}
              <Route path="parent-logs" element={<ParentLogsPage />} />

              {/* Volunteer Management */}
              <Route path="volunteers" element={<VolunteersPage />} />

              {/* Emergency Action Plans & Drills */}
              <Route path="emergency" element={<EmergencyPage />} />

              {/* Facility Maintenance */}
              <Route path="maintenance" element={<MaintenancePage />} />

              {/* Task Assignments */}
              <Route path="tasks" element={<TasksPage />} />

              {/* Weather Monitoring */}
              <Route path="weather" element={<WeatherPage />} />

              {/* Document Management */}
              <Route path="documents" element={<DocumentsPage />} />

              {/* Visitor Management */}
              <Route path="visitors" element={<VisitorsPage />} />

              {/* Attendance Tracking */}
              <Route path="attendance" element={<AttendancePage />} />

              {/* Team Chat */}
              <Route path="team-chat" element={<TeamChatPage />} />

              {/* Skill Tracking */}
              <Route path="skills" element={<SkillTrackingPage />} />

              {/* Notification Preferences */}
              <Route path="notification-preferences" element={<NotificationPreferencesPage />} />

              {/* Audit Log */}
              <Route path="audit-log" element={<AuditLogPage />} />

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
                <Route path="developer" element={<DeveloperReferencePage />} />
                <Route path="invoice-template" element={<InvoiceTemplateSettings />} />
                <Route path="custom-fields" element={<CustomFieldsSettingsPage />} />
                <Route path="camp-profile" element={<CampProfileSettings />} />
                <Route path="branding" element={<BrandingSettingsPage />} />
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
              <Route index element={<PortalDashboardPage />} />
              <Route path="campers/:id" element={<PortalCamperView />} />
              <Route path="photos" element={<PortalPhotos />} />
              <Route path="invoices" element={<PortalInvoices />} />
              <Route path="messages" element={<PortalMessages />} />
              <Route path="medicine" element={<PortalMedicine />} />
              <Route path="documents" element={<PortalDocuments />} />
              <Route path="forms" element={<PortalForms />} />
              <Route path="bunk-buddies" element={<PortalBunkBuddies />} />
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
        </Suspense>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
