"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, TrendingUp, Calendar, BarChart } from "lucide-react"
import StatCard from "../../components/StatCard"
import TaskList from "../../components/TaskList"
import { tasksAPI, brandsAPI } from "../../services/api"
import TeamActivityWidget from "../../components/TeamActivityWidget"

export default function ClientViewerDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedThisMonth: 0,
    scheduledPosts: 0,
    engagement: 0,
  })
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [tasks, brands] = await Promise.all([tasksAPI.getAll(), brandsAPI.getAll()])

      setStats({
        totalPosts: tasks.length,
        publishedThisMonth: tasks.filter((t) => t.status === "COMPLETED").length,
        scheduledPosts: tasks.filter((t) => t.status === "APPROVED").length,
        engagement: 0,
      })

      setRecentTasks(tasks.slice(0, 6))
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
        <h1 className="text-3xl font-bold mb-2">Client Dashboard</h1>
        <p className="text-text-secondary">View your social media performance and content</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Posts" value={stats.totalPosts} icon={Eye} color="primary" />
        <StatCard title="Published This Month" value={stats.publishedThisMonth} icon={TrendingUp} color="success" />
        <StatCard title="Scheduled Posts" value={stats.scheduledPosts} icon={Calendar} color="secondary" />
        <StatCard title="Avg. Engagement" value={`${stats.engagement}%`} icon={BarChart} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TaskList tasks={recentTasks} title="Recent Content" onTaskClick={handleTaskClick} />
        </div>

        {/* <div className="space-y-6">
          <div className="bg-background rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-text-secondary">Total Reach</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-text-secondary">Total Impressions</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-text-secondary">Engagement Rate</span>
                <span className="font-semibold">0%</span>
              </div>
            </div>
          </div>

          <div className="bg-background rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Upcoming Posts</h3>
            <p className="text-sm text-text-secondary">
              Your team is working on {stats.scheduledPosts} posts scheduled for publication.
            </p>
          </div>
        </div> */}

          <TeamActivityWidget />

      </div>
    </div>
  )
}
