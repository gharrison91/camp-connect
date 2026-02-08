import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { EventsPage } from '@/features/events/EventsPage'
import { CampersPage } from '@/features/campers/CampersPage'
import { ContactsPage } from '@/features/contacts/ContactsPage'
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="campers" element={<CampersPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="registrations" element={<RegistrationListPage />} />

          {/* Settings (nested routes) */}
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="/settings/profile" replace />} />
            <Route path="profile" element={<OrgProfilePage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="general" element={<GeneralSettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
