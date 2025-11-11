"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { usersAPI, brandsAPI, activityAPI } from "../services/api"
import { Settings, Users, Building2, Activity, Database, Shield } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalBrands: 0,
    activeBrands: 0,
    recentActivities: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [users, brands, activities] = await Promise.all([
        usersAPI.getAll(),
        brandsAPI.getAll(),
        activityAPI.getAll({ limit: 100 }),
      ])

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.isActive).length,
        totalBrands: brands.length,
        activeBrands: brands.filter((b) => b.isActive).length,
        recentActivities: activities.length,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN"

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700">You don't have permission to access system settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">System Settings</h1>
        <p className="text-gray-600">Manage system configuration and monitor statistics</p>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-gray-500">Total Users</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
          <p className="text-sm text-gray-600 mt-2">{stats.activeUsers} active users</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Building2 className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-gray-500">Total Brands</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalBrands}</div>
          <p className="text-sm text-gray-600 mt-2">{stats.activeBrands} active brands</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-purple-600" />
            <span className="text-sm font-medium text-gray-500">Activities</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.recentActivities}</div>
          <p className="text-sm text-gray-600 mt-2">Recent system activities</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Database className="w-8 h-8 text-orange-600" />
            <span className="text-sm font-medium text-gray-500">System Status</span>
          </div>
          <div className="text-3xl font-bold text-green-600">Healthy</div>
          <p className="text-sm text-gray-600 mt-2">All systems operational</p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold">General Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium">System Name</p>
                <p className="text-sm text-gray-600">Abacus CRM</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium">Version</p>
                <p className="text-sm text-gray-600">1.0.0</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Environment</p>
                <p className="text-sm text-gray-600">Production</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Management Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold">User Management</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium">Default Role</p>
                <p className="text-sm text-gray-600">Client Viewer</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium">Password Policy</p>
                <p className="text-sm text-gray-600">Minimum 6 characters</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Session Timeout</p>
                <p className="text-sm text-gray-600">7 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold">Security</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600">Coming soon</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium">Activity Logging</p>
                <p className="text-sm text-green-600">Enabled</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">API Rate Limiting</p>
                <p className="text-sm text-green-600">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold">Storage</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium">File Upload Limit</p>
                <p className="text-sm text-gray-600">10 MB per file</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium">Storage Provider</p>
                <p className="text-sm text-gray-600">Local + Cloudinary</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Backup Schedule</p>
                <p className="text-sm text-gray-600">Daily at 2:00 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Need to modify settings?</h3>
        <p className="text-blue-700 text-sm">
          Most system settings are configured through environment variables. Contact your system administrator to make
          changes to core system configuration.
        </p>
      </div>
    </div>
  )
}
