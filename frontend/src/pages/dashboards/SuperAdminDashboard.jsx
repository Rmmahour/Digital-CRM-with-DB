"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Users, Briefcase, CheckSquare, Activity } from "lucide-react"
import StatCard from "../../components/StatCard"
import { usersAPI, brandsAPI, tasksAPI } from "../../services/api"
import TeamActivityWidget from "../../components/TeamActivityWidget"

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBrands: 0,
    totalTasks: 0,
    activeTasks: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const handleTaskClick = (task) => {
  navigate(`/dashboard/tasks/${task.id}`)
}

  const loadStats = async () => {
    try {
      const [users, brands, tasksResponse] = await Promise.all([
        usersAPI.getAll(),
        brandsAPI.getAll(),
        tasksAPI.getAll({ limit: 1000 }), // Get all tasks for stats
      ])

      // Extract tasks array from paginated response
      const tasks = tasksResponse.tasks || tasksResponse

      setStats({
        totalUsers: users.length,
        totalBrands: brands.length,
        totalTasks: tasks.length,
        activeTasks: tasks.filter((t) => ["TODO", "IN_PROGRESS", "IN_REVIEW"].includes(t.status)).length,
      })
    } catch (error) {
      console.error("[v0] Failed to load stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Super Admin Dashboard</h1>
        <p className="text-text-secondary">Complete system overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="primary" trend={12} />
        <StatCard title="Total Brands" value={stats.totalBrands} icon={Briefcase} color="secondary" trend={8} />
        <StatCard title="Total Tasks" value={stats.totalTasks} icon={CheckSquare} color="success" trend={15} />
        <StatCard title="Active Tasks" value={stats.activeTasks} icon={Activity} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">System Overview</h3>
          <div className="space-y-4">
            <div
              onClick={() => navigate("/dashboard/users")}
              className="flex items-center justify-between p-3 bg-surface rounded-lg hover:bg-primary/10 cursor-pointer transition-colors"
            >
              <span className="text-text-secondary">Active Users</span>
              <span className="font-semibold">{stats.totalUsers}</span>
            </div>
            <div
              onClick={() => navigate("/dashboard/brands")}
              className="flex items-center justify-between p-3 bg-surface rounded-lg hover:bg-primary/10 cursor-pointer transition-colors"
            >
              <span className="text-text-secondary">Active Brands</span>
              <span className="font-semibold">{stats.totalBrands}</span>
            </div>
            <div
              onClick={() => navigate("/dashboard/tasks?status=IN_REVIEW")}
              className="flex items-center justify-between p-3 bg-surface rounded-lg hover:bg-primary/10 cursor-pointer transition-colors"
            >
              <span className="text-text-secondary">Pending Approvals</span>
              <span className="font-semibold text-warning">0</span>
            </div>
          </div>
        </div>

        {/* <div className="bg-background rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/dashboard/users")}
              className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-left"
            >
              Create New User
            </button>
            <button
              onClick={() => navigate("/dashboard/brands")}
              className="w-full px-4 py-3 bg-secondary text-white rounded-lg hover:opacity-90 transition-opacity text-left"
            >
              Add New Brand
            </button>
            <button
              onClick={() => navigate("/dashboard/tasks")}
              className="w-full px-4 py-3 border border-border rounded-lg hover:bg-surface transition-colors text-left"
            >
              View All Tasks
            </button>
          </div>
        </div> */}

          <TeamActivityWidget />

      </div>
    </div>
  )
}
