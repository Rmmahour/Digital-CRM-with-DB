"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, CalendarIcon, Eye, Trash2 } from "lucide-react"
import { calendarsAPI, tasksAPI, usersAPI } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { format } from "date-fns"
import AddScopeModal from "../components/AddScopeModal"

const statusColors = {
  TODO: "bg-gray-100 text-gray-800 border-gray-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-300",
  IN_REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-300",
  APPROVED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
  COMPLETED: "bg-purple-100 text-purple-800 border-purple-300",
}

const contentTypeLabels = {
  STATIC: "Static",
  VIDEO: "Video",
  STORY: "Story",
  REEL: "Reel",
  CAROUSEL: "Carousel",
  BLOG_POST: "Blog Post",
}

export default function CalendarPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [calendar, setCalendar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showScopeModal, setShowScopeModal] = useState(false)
  const [users, setUsers] = useState([])
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [assigningTo, setAssigningTo] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(null)

  useEffect(() => {
    loadCalendar()
    loadUsers()
  }, [id])

  const loadCalendar = async () => {
    try {
      console.log("[v0] Loading calendar...")
      const data = await calendarsAPI.getById(id)
      setCalendar(data)
      console.log("[v0] Calendar loaded with", data.tasks?.length, "tasks")
    } catch (error) {
      console.error("[v0] Failed to load calendar:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const data = await usersAPI.getAll()
      setUsers(data)
    } catch (error) {
      console.error("[v0] Failed to load users:", error)
    }
  }

  const handleGenerateTasks = async () => {
    if (!calendar.scopes || calendar.scopes.length === 0) {
      alert("Please add scope items first")
      return
    }

    // Check if tasks already exist for this calendar
    const existingTasksCount = calendar.tasks?.length || 0
    if (existingTasksCount > 0) {
      if (
        !confirm(
          `This calendar already has ${existingTasksCount} tasks. Generating new tasks will create additional tasks. Continue?`,
        )
      ) {
        return
      }
    }

    try {
      console.log("[v0] Generating tasks for scopes:", calendar.scopes)
      const scopesData = {
        scopes: calendar.scopes.map((scope) => ({
          contentType: scope.contentType,
          quantity: scope.quantity,
          startDate: new Date(calendar.year, calendar.month - 1, 1).toISOString(),
        })),
      }

      await calendarsAPI.generateTasks(id, scopesData)
      loadCalendar()
      alert("Tasks generated successfully!")
    } catch (error) {
      console.error("[v0] Failed to generate tasks:", error)
      alert("Failed to generate tasks: " + (error.response?.data?.message || error.message))
    }
  }

  const handleTaskClick = (taskId) => {
    navigate(`/dashboard/tasks/${taskId}`)
  }

  const handleAssignTask = async (taskId, userId) => {
    try {
      await tasksAPI.update(taskId, { assignedToId: userId || null })
      loadCalendar()
      setEditingTaskId(null)
      setAssigningTo("")
    } catch (error) {
      console.error("[v0] Failed to assign task:", error)
      alert("Failed to assign task")
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      await tasksAPI.delete(taskId)
      loadCalendar()
    } catch (error) {
      console.error("[v0] Failed to delete task:", error)
      alert("Failed to delete task")
    }
  }

  const calculateProgress = () => {
    if (!calendar?.scopes) return {}
    const progress = {}
    calendar.scopes.forEach((scope) => {
      const completed =
        calendar.tasks?.filter((task) => task.contentType === scope.contentType && task.status === "COMPLETED")
          .length || 0
      progress[scope.contentType] = {
        completed,
        total: scope.quantity,
        percentage: scope.quantity > 0 ? Math.round((completed / scope.quantity) * 100) : 0,
      }
    })
    return progress
  }

  const getTasksByMonth = () => {
    if (!calendar?.tasks) return {}

    const grouped = {}
    calendar.tasks.forEach((task) => {
      if (task.postingDate) {
        const date = new Date(task.postingDate)
        const monthKey = format(date, "MMMM yyyy")
        if (!grouped[monthKey]) {
          grouped[monthKey] = []
        }
        grouped[monthKey].push(task)
      } else {
        // Tasks without posting date go to "Unscheduled"
        if (!grouped["Unscheduled"]) {
          grouped["Unscheduled"] = []
        }
        grouped["Unscheduled"].push(task)
      }
    })

    return grouped
  }

  const getMonths = () => {
    const tasksByMonth = getTasksByMonth()
    return Object.keys(tasksByMonth).sort((a, b) => {
      if (a === "Unscheduled") return 1
      if (b === "Unscheduled") return -1
      return new Date(a) - new Date(b)
    })
  }

  const getFilteredTasks = () => {
    if (!selectedMonth) {
      return calendar?.tasks || []
    }
    const tasksByMonth = getTasksByMonth()
    return tasksByMonth[selectedMonth] || []
  }

  if (loading) {
    return <div className="text-center py-12">Loading calendar...</div>
  }

  if (!calendar) {
    return <div className="text-center py-12">Calendar not found</div>
  }

  const progress = calculateProgress()
  const canManage = ["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"].includes(user.role)
  const months = getMonths()
  const filteredTasks = getFilteredTasks()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard/brands")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Brands
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 dark:text-black">
              {calendar.brand.name} - {format(new Date(calendar.year, calendar.month - 1), "MMMM yyyy")}
            </h1>
            <p className="text-gray-600">Social Media Calendar & Content Planning</p>
          </div>
          {canManage && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowScopeModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors dark:text-black"
              >
                <Plus className="w-4 h-4" />
                Add Scope
              </button>
              <button
                onClick={handleGenerateTasks}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CalendarIcon className="w-4 h-4" />
                Generate Tasks
              </button>
            </div>
          )}
        </div>

        {calendar.scopes && calendar.scopes.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {calendar.scopes.map((scope) => {
              const prog = progress[scope.contentType] || { completed: 0, total: scope.quantity, percentage: 0 }
              return (
                <div key={scope.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm dark:text-black">{contentTypeLabels[scope.contentType]}</h3>
                    <span className="text-xs text-gray-600 dark:text-black">{prog.percentage}%</span>
                  </div>
                  <div className="text-2xl font-bold mb-2 dark:text-black">
                    {prog.completed}/{prog.total}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${prog.percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {months.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedMonth(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${selectedMonth === null ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              All Tasks ({calendar.tasks?.length || 0})
            </button>
            {months.map((month) => {
              const tasksByMonth = getTasksByMonth()
              const count = tasksByMonth[month]?.length || 0
              return (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${selectedMonth === month ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {month} ({count})
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Idea</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Created Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Copy Idea / Post Copy</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Caption</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Creative Reference</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Publish Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTasks && filteredTasks.length > 0 ? (
                filteredTasks.map((task, index) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm dark:text-black">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium dark:text-black">{task.title}</td>
                    <td className="px-4 py-3 text-sm dark:text-black">
                      {task.createdAt ? format(new Date(task.createdAt), "MM/dd/yyyy") : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {task.contentType ? contentTypeLabels[task.contentType] : "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-black">
                      {editingTaskId === task.id && canManage ? (
                        <select
                          value={assigningTo}
                          onChange={(e) => setAssigningTo(e.target.value)}
                          onBlur={() => {
                            if (assigningTo) {
                              handleAssignTask(task.id, assigningTo)
                            } else {
                              setEditingTaskId(null)
                            }
                          }}
                          autoFocus
                          className="text-sm border border-gray-300 rounded px-2 py-1 dark:text-black"
                        >
                          <option value="">Unassigned</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.firstName} {u.lastName} ({u.role})
                            </option>
                          ))}
                        </select>
                      ) : task.assignedTo ? (
                        <span
                          onClick={() => {
                            if (canManage) {
                              setEditingTaskId(task.id)
                              setAssigningTo(task.assignedToId)
                            }
                          }}
                          className={`${canManage ? "cursor-pointer hover:underline" : ""}`}
                        >
                          {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </span>
                      ) : (
                        <span
                          onClick={() => {
                            if (canManage) {
                              setEditingTaskId(task.id)
                              setAssigningTo("")
                            }
                          }}
                          className={`text-gray-400 ${canManage ? "cursor-pointer hover:underline" : ""}`}
                        >
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs dark:text-black">
                      <div className="truncate">{task.description || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs dark:text-black">
                      <div className="truncate text-gray-400 whitespace-pre-wrap">
                        {task.copyIdea ? (
                        <p className="text-gray-700 whitespace-pre-wrap">{task.copyIdea}</p>
                      ) : (
                        <p className="text-gray-400 italic">No copy idea added yet</p>
                      )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs dark:text-black">
                      <div className="truncate text-gray-400 whitespace-pre-wrap">
                        {task.caption ? (
                        <p className="text-gray-700 whitespace-pre-wrap">{task.caption}</p>
                      ) : (
                        <p className="text-gray-400 italic">No Caption yet</p>
                      )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-black">
                      <div>
                        {task.creativeRef ? (
                          <div className="space-y-2">
                            {task.creativeRef.split('\n').map((link, index) => (
                              link.trim() && (
                                <a
                                  key={index}
                                  href={link.trim()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-blue-600 hover:underline"
                                >
                                  {link.trim()}
                                </a>
                              )
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">No creative added yet</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-black">
                      {task.attachments && task.attachments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {task.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-2xl">{getFileIcon(attachment.fileType)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{attachment.fileName}</p>
                                  <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                                  {attachment.description && <p className="text-xs text-gray-600 mt-1">{attachment.description}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={`http://localhost:5000${attachment.fileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                {canEditContent && (
                                  <button
                                    onClick={() => handleDeleteAttachment(attachment.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">No reference yet</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-black">
                      {task.dueDate ? format(new Date(task.dueDate), "MM/dd/yyyy") : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-black">
                      {task.publishDate ? format(new Date(task.publishDate), "MM/dd/yyyy") : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full border ${statusColors[task.status]}`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTaskClick(task.id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManage && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    {selectedMonth
                      ? `No tasks for ${selectedMonth}`
                      : "No tasks yet. Click 'Generate Tasks' to create tasks based on scope."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showScopeModal && (
        <AddScopeModal
          isOpen={showScopeModal}
          onClose={() => setShowScopeModal(false)}
          onSuccess={loadCalendar}
          calendarId={id}
        />
      )}
    </div>
  )
}
