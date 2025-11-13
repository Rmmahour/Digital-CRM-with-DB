"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, Clock, AlertCircle, Briefcase, Calendar } from "lucide-react"
import api from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { format } from "date-fns"

const statusColors = {
  TODO: "bg-gray-100 text-gray-800 border-gray-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  IN_REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-purple-100 text-purple-800 border-purple-200",
}

const priorityColors = {
  LOW: "text-gray-600",
  MEDIUM: "text-blue-600",
  HIGH: "text-orange-600",
  URGENT: "text-red-600",
}

export default function MyTasksPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")

  useEffect(() => {
    loadMyTasks()
  }, [])

  const loadMyTasks = async () => {
    try {
      const response = await api.get("/tasks/my-tasks")
      setTasks(response.data)
    } catch (error) {
      console.error("[v0] Failed to load tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredTasks = () => {
    let filtered = tasks

    if (filter === "pending") {
      filtered = tasks.filter((t) => t.status === "TODO")
    } else if (filter === "in-progress") {
      filtered = tasks.filter((t) => t.status === "IN_PROGRESS")
    } else if (filter === "completed") {
      filtered = tasks.filter((t) => t.status === "COMPLETED")
    }

    // Sort tasks
    if (sortBy === "dueDate") {
      filtered = [...filtered].sort((a, b) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate) - new Date(b.dueDate)
      })
    } else if (sortBy === "priority") {
      const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
      filtered = [...filtered].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    } else {
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    return filtered
  }

  const groupTasksByStatus = () => {
    const pending = tasks.filter((t) => t.status === "TODO")
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW")
    const completed = tasks.filter((t) => t.status === "COMPLETED" || t.status === "APPROVED")

    return { pending, inProgress, completed }
  }

  const handleTaskClick = (taskId) => {
    navigate(`/dashboard/tasks/${taskId}`)
  }

  if (loading) {
    return <div className="text-center py-12">Loading your tasks...</div>
  }

  const filteredTasks = getFilteredTasks()
  const groupedTasks = groupTasksByStatus()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Tasks</h1>
        <p className="text-gray-600">View and manage all your assigned tasks</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Pending</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{groupedTasks.pending.length}</p>
          <p className="text-xs text-gray-500 mt-1">Tasks to start</p>
        </div>

        <div className="bg-white rounded-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-600">In Progress</h3>
            <AlertCircle className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-blue-900">{groupedTasks.inProgress.length}</p>
          <p className="text-xs text-blue-500 mt-1">Active tasks</p>
        </div>

        <div className="bg-white rounded-lg border border-green-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-600">Completed</h3>
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-900">{groupedTasks.completed.length}</p>
          <p className="text-xs text-green-500 mt-1">Finished tasks</p>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === "pending" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Pending ({groupedTasks.pending.length})
              </button>
              <button
                onClick={() => setFilter("in-progress")}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === "in-progress" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                In Progress ({groupedTasks.inProgress.length})
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === "completed" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Completed ({groupedTasks.completed.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-black"
            >
              <option value="createdAt">Created Date</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">
              {filter === "all"
                ? "You don't have any assigned tasks yet."
                : `No tasks with status: ${filter.replace("-", " ")}`}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task.id)}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                  {task.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>}

                  <div className="flex items-center gap-4 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[task.status]}`}>
                      {task.status.replace("_", " ")}
                    </span>

                    <span className={`flex items-center gap-1 text-xs font-medium ${priorityColors[task.priority]}`}>
                      <AlertCircle className="w-3 h-3" />
                      {task.priority}
                    </span>

                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Briefcase className="w-3 h-3" />
                      {task.brand.name}
                    </span>

                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 ml-4">
                  {task._count.comments > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{task._count.comments}</span>
                      <span>comments</span>
                    </div>
                  )}
                  {task._count.attachments > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{task._count.attachments}</span>
                      <span>files</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Created by: {task.createdBy.firstName} {task.createdBy.lastName}
                </div>
                <div className="text-xs text-gray-500">Created: {format(new Date(task.createdAt), "MMM d, yyyy")}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
