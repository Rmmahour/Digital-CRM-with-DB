"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle, XCircle, Clock, Calendar, User, Briefcase } from "lucide-react"
import { tasksAPI } from "../services/api"
import { format } from "date-fns"

const priorityColors = {
  LOW: "text-gray-600",
  MEDIUM: "text-blue-600",
  HIGH: "text-orange-600",
  URGENT: "text-red-600",
}

export default function ApprovalsPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("IN_REVIEW")

  useEffect(() => {
    loadTasks()
  }, [filter])

  const loadTasks = async () => {
    try {
      const data = await tasksAPI.getAll({ status: filter })
      setTasks(data)
    } catch (error) {
      console.error("Failed to load tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (taskId) => {
    try {
      await tasksAPI.update(taskId, { status: "APPROVED" })
      loadTasks()
    } catch (error) {
      console.error("Failed to approve task:", error)
      alert("Failed to approve task")
    }
  }

  const handleReject = async (taskId) => {
    try {
      await tasksAPI.update(taskId, { status: "REJECTED" })
      loadTasks()
    } catch (error) {
      console.error("Failed to reject task:", error)
      alert("Failed to reject task")
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading approvals...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve pending tasks</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-black"
        >
          <option value="IN_REVIEW">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3
                      onClick={() => navigate(`/dashboard/tasks/${task.id}`)}
                      className="text-xl font-semibold hover:text-blue-600 cursor-pointer"
                    >
                      {task.title}
                    </h3>
                    <span className={`flex items-center gap-1 text-sm font-medium ${priorityColors[task.priority]}`}>
                      <Clock className="w-4 h-4" />
                      {task.priority}
                    </span>
                  </div>

                  {task.description && <p className="text-gray-600 mb-4 line-clamp-2">{task.description}</p>}

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {task.brand?.name}
                    </div>
                    {task.assignedTo && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {task.assignedTo.firstName} {task.assignedTo.lastName}
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>
                </div>

                {filter === "IN_REVIEW" && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(task.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(task.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {filter === "IN_REVIEW" ? "No tasks pending review" : `No ${filter.toLowerCase()} tasks`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
