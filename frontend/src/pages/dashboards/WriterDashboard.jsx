"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FileText, CheckSquare, Clock, TrendingUp } from "lucide-react"
import StatCard from "../../components/StatCard"
import TaskList from "../../components/TaskList"
import { tasksAPI } from "../../services/api"
import { useAuth } from "../../contexts/AuthContext"
import TeamActivityWidget from "../../components/TeamActivityWidget"

export default function WriterDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({
    assignedToMe: 0,
    inProgress: 0,
    dueToday: 0,
    completedThisWeek: 0,
  })
  const [myTasks, setMyTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const response = await tasksAPI.getAll({ assignedToId: user.id })
      const tasks = response.tasks || response || []

      const today = new Date()
      today.setHours(23, 59, 59, 999)

      setStats({
        assignedToMe: tasks.length,
        inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
        dueToday: tasks.filter((t) => {
          if (!t.dueDate) return false
          const dueDate = new Date(t.dueDate)
          return dueDate <= today && t.status !== "COMPLETED"
        }).length,
        completedThisWeek: tasks.filter((t) => t.status === "COMPLETED").length,
      })

      setMyTasks(tasks.slice(0, 8))
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
        <h1 className="text-3xl font-bold mb-2">Writer Dashboard</h1>
        <p className="text-text-secondary">Create and manage your content tasks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Assigned to Me" value={stats.assignedToMe} icon={FileText} color="primary" />
        <StatCard title="In Progress" value={stats.inProgress} icon={CheckSquare} color="secondary" />
        <StatCard title="Due Today" value={stats.dueToday} icon={Clock} color="warning" />
        <StatCard title="Completed This Week" value={stats.completedThisWeek} icon={TrendingUp} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TaskList tasks={myTasks} title="My Writing Tasks" onTaskClick={handleTaskClick} />
        </div>

        <TeamActivityWidget />

        {/* <div className="space-y-6">
          <div className="bg-background rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Content Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-text-secondary">Posts This Week</span>
                <span className="font-semibold">{stats.completedThisWeek}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-text-secondary">In Review</span>
                <span className="font-semibold text-warning">0</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-text-secondary">Approved</span>
                <span className="font-semibold text-success">0</span>
              </div>
            </div>
          </div>

          <div className="bg-background rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Writing Tips</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Keep captions concise and engaging</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Use relevant hashtags</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Include clear call-to-actions</span>
              </li>
            </ul>
          </div>
        </div> */}
      </div>
    </div>
  )
}
