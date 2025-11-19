"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Briefcase, CheckSquare, Clock, TrendingUp, CheckCircle, AlertCircle, Users, ListTodo } from "lucide-react"
import StatCard from "../../components/StatCard"
import TaskList from "../../components/TaskList"
import { brandsAPI, tasksAPI, dashboardAPI } from "../../services/api"
import TeamActivityWidget from "../../components/TeamActivityWidget"

export default function AccountManagerDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    myBrands: 0,
    myTasks: 0,
    dueSoon: 0,
    completedThisMonth: 0,
  })
  const [myTasks, setMyTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])


  

  const loadDashboard = async () => {
    try {
      // const [brands, tasksResponse] = await Promise.all([brandsAPI.getAll(), tasksAPI.getAll({ limit: 1000 })])

      const [brandsResponse, tasksResponse] = await Promise.all([brandsAPI.getAll(), tasksAPI.getAll()])
            
            // ✅ Ensure we have arrays before using array methods
            const brands = Array.isArray(brandsResponse) ? brandsResponse : []
            const tasks = Array.isArray(tasksResponse) ? tasksResponse : []


      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      setStats({
        myBrands: brands.length,
        myTasks: tasks.length,
        dueSoon: tasks.filter((t) => {
          if (!t.dueDate) return false
          const dueDate = new Date(t.dueDate)
          return dueDate <= weekFromNow && t.status !== "COMPLETED"
        }).length,
        completedThisMonth: tasks.filter((t) => t.status === "COMPLETED").length,
      })

      setMyTasks(tasks.slice(0, 6))
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
        <h1 className="text-3xl font-bold mb-2">Account Manager Dashboard</h1>
        <p className="text-text-secondary">Manage your client accounts and tasks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="My Brands" value={stats.myBrands} icon={Briefcase} color="primary" />
        <StatCard title="My Tasks" value={stats.myTasks} icon={CheckSquare} color="secondary" />
        <StatCard title="Due Soon" value={stats.dueSoon} icon={Clock} color="warning" />
        <StatCard title="Completed This Month" value={stats.completedThisMonth} icon={TrendingUp} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TaskList tasks={myTasks} title="My Tasks" onTaskClick={handleTaskClick} />
        </div>

        {/* <div className="space-y-6">
          <div className="bg-background rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Client Overview</h3>
            <div className="space-y-3">
              <div className="p-3 bg-surface rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">TechCorp</span>
                  <span className="text-xs text-success">Active</span>
                </div>
                <p className="text-sm text-text-secondary">8 active tasks</p>
              </div>
              <div className="p-3 bg-surface rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">FashionHub</span>
                  <span className="text-xs text-success">Active</span>
                </div>
                <p className="text-sm text-text-secondary">5 active tasks</p>
              </div>
            </div>
          </div>
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
                className="w-full px-4 py-3 border border-border rounded-lg hover:bg-surface transition-colors text-left"
              >
                View All Brands
              </button>
            </div>
          </div>
          </div> */}

<TeamActivityWidget />

      </div>
    </div>
  )
}
