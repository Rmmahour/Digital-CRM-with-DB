"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Briefcase, CheckSquare, Users, TrendingUp } from "lucide-react"
import StatCard from "../../components/StatCard"
import TaskList from "../../components/TaskList"
import { brandsAPI, tasksAPI } from "../../services/api"
import TeamActivityWidget from "../../components/TeamActivityWidget"

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalBrands: 0,
    totalTasks: 0,
    pendingApprovals: 0,
    completedThisWeek: 0,
  })
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [brandsResponse, tasksResponse] = await Promise.all([brandsAPI.getAll(), tasksAPI.getAll()])
      
      // ✅ Ensure we have arrays before using array methods
      const brands = Array.isArray(brandsResponse) ? brandsResponse : []
      const tasks = Array.isArray(tasksResponse) ? tasksResponse : []

      setStats({
        totalBrands: brands.length,
        totalTasks: tasks.length,
        pendingApprovals: tasks.filter((t) => t.status === "IN_REVIEW").length,
        completedThisWeek: tasks.filter((t) => t.status === "COMPLETED").length,
      })

      setRecentTasks(tasks.slice(0, 5))
    } catch (error) {
      console.error("[v0] Failed to load dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskClick = (task) => {
    navigate(`/dashboard/tasks/${task.id}`)
  }

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-text-secondary">Manage brands, tasks, and team approvals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Brands" value={stats.totalBrands} icon={Briefcase} color="primary" />
        <StatCard title="Total Tasks" value={stats.totalTasks} icon={CheckSquare} color="secondary" />
        <StatCard title="Pending Approvals" value={stats.pendingApprovals} icon={Users} color="warning" />
        <StatCard title="Completed This Week" value={stats.completedThisWeek} icon={TrendingUp} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TaskList tasks={recentTasks} title="Recent Tasks" onTaskClick={handleTaskClick} />
        </div>

        <div className="space-y-6">
          <div className="bg-background rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/dashboard/tasks")}
                className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-left"
              >
                Create Task
              </button>
              <button
                onClick={() => navigate("/dashboard/brands")}
                className="w-full px-4 py-3 bg-secondary text-white rounded-lg hover:opacity-90 transition-opacity text-left"
              >
                Add Brand
              </button>
              <button
                onClick={() => navigate("/dashboard/tasks")}
                className="w-full px-4 py-3 border border-border rounded-lg hover:bg-surface transition-colors text-left"
              >
                View Reports
              </button>
            </div>
          </div>
          <TeamActivityWidget />
          

          {/* <div className="bg-background rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Team Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-text-secondary">5 tasks completed today</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <span className="text-text-secondary">3 tasks in review</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-text-secondary">12 active team members</span>
              </div>
            </div>
          </div> */}
        </div>



      </div>
    </div>
  )
}
