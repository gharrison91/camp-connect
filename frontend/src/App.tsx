import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { EventsPage } from '@/features/events/EventsPage'
import { CampersPage } from '@/features/campers/CampersPage'
import { LoginPage } from '@/features/auth/LoginPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="campers" element={<CampersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
