"use client"

import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext"
import Login from "./pages/Login"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import DashboardLayout from "./layouts/DashboardLayout"
import SuperAdminDashboard from "./pages/dashboards/SuperAdminDashboard"
import AdminDashboard from "./pages/dashboards/AdminDashboard"
import AccountManagerDashboard from "./pages/dashboards/AccountManagerDashboard"
import WriterDashboard from "./pages/dashboards/WriterDashboard"
import DesignerDashboard from "./pages/dashboards/DesignerDashboard"
import PostSchedulerDashboard from "./pages/dashboards/PostSchedulerDashboard"
import ClientViewerDashboard from "./pages/dashboards/ClientViewerDashboard"
import TasksPage from "./pages/TasksPage"
import TaskDetailPage from "./pages/TaskDetailPage"
import UsersPage from "./pages/UsersPage"
import BrandsPage from "./pages/BrandsPage"
import ActivityLogsPage from "./pages/ActivityLogsPage"
import ApprovalsPage from "./pages/ApprovalsPage"
import ProfilePage from "./pages/ProfilePage"
import SettingsPage from "./pages/SettingsPage"
import CalendarPage from "./pages/CalendarPage"
import ChatPage from "./pages/ChatPage"
import TeamsPage from "./pages/TeamsPage"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardRouter />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="brands"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"]}>
              <BrandsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="calendars/:id"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER", "WRITER", "DESIGNER", "POST_SCHEDULER"]}>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="activity-logs"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN"]}>
              <ActivityLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="approvals"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"]}>
              <ApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route path="chat" element={<ChatPage />} />
        <Route
          path="teams"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"]}>
              <TeamsPage />
            </ProtectedRoute>
          }
        />
        <Route path="profile" element={<ProfilePage />} />
        <Route
          path="settings"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN"]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

function DashboardRouter() {
  const { user } = useAuth()

  const dashboards = {
    SUPER_ADMIN: <SuperAdminDashboard />,
    ADMIN: <AdminDashboard />,
    ACCOUNT_MANAGER: <AccountManagerDashboard />,
    WRITER: <WriterDashboard />,
    DESIGNER: <DesignerDashboard />,
    POST_SCHEDULER: <PostSchedulerDashboard />,
    CLIENT_VIEWER: <ClientViewerDashboard />,
  }

  return dashboards[user?.role] || <div>Invalid role</div>
}

export default App
