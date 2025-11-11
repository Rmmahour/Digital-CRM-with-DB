"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar, CheckSquare, Clock, Send } from "lucide-react"
import StatCard from "../../components/StatCard"
import TaskList from "../../components/TaskList"
import { tasksAPI } from "../../services/api"

export default function PostSchedulerDashboard() {
  const [stats, setStats] = useState({
    scheduledPosts: 0,
    publishedToday: 0,
    pendingApproval: 0,
    scheduledThisWeek: 0,
  })
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const allTasks = await tasksAPI.getAll()

      setStats({
        scheduledPosts: allTasks.filter((t) => t.status === "APPROVED").length,
        publishedToday: allTasks.filter((t) => t.status === "COMPLETED").length,
        pendingApproval: allTasks.filter((t) => t.status === "IN_REVIEW").length,
        scheduledThisWeek: allTasks.filter((t) => t.dueDate).length,
      })

      setTasks(allTasks.slice(0, 8))
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
        <h1 className="text-3xl font-bold mb-2">Post Scheduler Dashboard</h1>
        <p className="text-text-secondary">Schedule and publish social media posts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Scheduled Posts" value={stats.scheduledPosts} icon={Calendar} color="primary" />
        <StatCard title="Published Today" value={stats.publishedToday} icon={Send} color="success" />
        <StatCard title="Pending Approval" value={stats.pendingApproval} icon={Clock} color="warning" />
        <StatCard title="Scheduled This Week" value={stats.scheduledThisWeek} icon={CheckSquare} color="secondary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TaskList tasks={tasks} title="Posts to Schedule" onTaskClick={handleTaskClick} />
        </div>

        <div className="space-y-6">
          <div className="bg-background rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Today's Schedule</h3>
            <div className="space-y-3">
              <div className="p-3 bg-surface rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">10:00 AM</span>
                  <span className="text-xs text-success">Ready</span>
                </div>
                <p className="text-sm text-text-secondary">Instagram Post - TechCorp</p>
              </div>
              <div className="p-3 bg-surface rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">2:00 PM</span>
                  <span className="text-xs text-success">Ready</span>
                </div>
                <p className="text-sm text-text-secondary">Facebook Post - FashionHub</p>
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
                Schedule Post
              </button>
              <button
                onClick={() => navigate("/dashboard/tasks")}
                className="w-full px-4 py-3 border border-border rounded-lg hover:bg-surface transition-colors text-left"
              >
                View Calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
