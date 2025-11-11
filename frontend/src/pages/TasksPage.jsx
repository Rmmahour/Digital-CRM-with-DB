"use client"

import { useState, useEffect } from "react"
import { Plus, Filter, Search } from "lucide-react"
import { tasksAPI, brandsAPI, usersAPI } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import TaskList from "../components/TaskList"
import CreateTaskModal from "../components/CreateTaskModal"

export default function TasksPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [brands, setBrands] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    brandId: "",
    search: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [tasks, filters])

  const loadData = async () => {
    try {
      console.log("[v0] Loading tasks for user role:", user.role)

      const [tasksResponse, brandsData] = await Promise.all([tasksAPI.getAll({ limit: 1000 }), brandsAPI.getAll()])

      // Extract tasks array from paginated response
      const tasksData = tasksResponse.tasks || tasksResponse

      console.log("[v0] Tasks loaded:", tasksData.length)
      setTasks(tasksData)
      setBrands(brandsData)

      if (["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"].includes(user.role)) {
        const usersData = await usersAPI.getAll()
        console.log("[v0] Users loaded:", usersData.length)
        setUsers(usersData)
      }
    } catch (error) {
      console.error("[v0] Failed to load tasks:", error)
      console.error("[v0] Error details:", error.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...tasks]

    if (filters.status) {
      filtered = filtered.filter((t) => t.status === filters.status)
    }

    if (filters.priority) {
      filtered = filtered.filter((t) => t.priority === filters.priority)
    }

    if (filters.brandId) {
      filtered = filtered.filter((t) => t.brandId === filters.brandId)
    }

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(
        (t) => t.title.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search),
      )
    }

    setFilteredTasks(filtered)
  }

  const handleTaskClick = (task) => {
    navigate(`/dashboard/tasks/${task.id}`)
  }

  const handleTaskCreated = (newTask) => {
    setTasks([newTask, ...tasks])
    setShowCreateModal(false)
  }

  if (loading) {
    return <div className="text-center py-12">Loading tasks...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tasks</h1>
          <p className="text-text-secondary">Manage and track all your tasks</p>
        </div>
        {["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"].includes(user.role) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Task
          </button>
        )}
      </div>

      <div className="bg-background rounded-lg border border-border p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>
          <Filter className="w-5 h-5 text-text-secondary" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <select
            value={filters.brandId}
            onChange={(e) => setFilters({ ...filters, brandId: e.target.value })}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-text-secondary">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </p>
          <button
            onClick={() => setFilters({ status: "", priority: "", brandId: "", search: "" })}
            className="text-sm text-primary hover:text-primary-dark"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <TaskList tasks={filteredTasks} onTaskClick={handleTaskClick} />

      {showCreateModal && (
        <CreateTaskModal
          brands={brands}
          users={users}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  )
}
