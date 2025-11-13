"use client"

import { useState, useEffect } from "react"
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react"
import api from "../services/api"

export default function RecoveryPage() {
  const [activeTab, setActiveTab] = useState("users")
  const [deletedUsers, setDeletedUsers] = useState([])
  const [deletedBrands, setDeletedBrands] = useState([])
  const [deletedTasks, setDeletedTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllDeletedData()
  }, [])

  const loadAllDeletedData = async () => {
    try {
      const [users, brands, tasks] = await Promise.all([
        api.get("/recovery/users"),
        api.get("/recovery/brands"),
        api.get("/recovery/tasks"),
      ])

      setDeletedUsers(users.data)
      setDeletedBrands(brands.data)
      setDeletedTasks(tasks.data)
    } catch (error) {
      console.error("[v0] Failed to load deleted data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecover = async (type, id) => {
    if (!confirm(`Are you sure you want to recover this ${type}?`)) return

    try {
      await api.put(`/recovery/${type}/${id}/recover`)
      loadAllDeletedData()
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} recovered successfully`)
    } catch (error) {
      console.error(`[v0] Failed to recover ${type}:`, error)
      alert(`Failed to recover ${type}`)
    }
  }

  const handlePermanentDelete = async (type, id) => {
    if (!confirm(`WARNING: This will PERMANENTLY delete this ${type}. This action cannot be undone. Are you sure?`))
      return

    try {
      await api.delete(`/recovery/${type}/${id}`)
      loadAllDeletedData()
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} permanently deleted`)
    } catch (error) {
      console.error(`[v0] Failed to permanently delete ${type}:`, error)
      alert(`Failed to permanently delete ${type}`)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading deleted items...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trash2 className="w-8 h-8 text-gray-600" />
        <div>
          <h1 className="text-3xl font-bold dark:text-black">Data Recovery</h1>
          <p className="text-gray-600">Restore or permanently delete items</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium dark:text-black">Super Admin Access Only</p>
          <p>Be careful when recovering or permanently deleting items. Permanent deletion cannot be undone.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "users" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Users ({deletedUsers.length})
            </button>
            <button
              onClick={() => setActiveTab("brands")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "brands"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Brands ({deletedBrands.length})
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "tasks" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tasks ({deletedTasks.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "users" && (
            <div className="space-y-4">
              {deletedUsers.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No deleted users</p>
              ) : (
                deletedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">Deleted: {new Date(user.deletedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRecover("users", user.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Recover
                      </button>
                      <button
                        onClick={() => handlePermanentDelete("users", user.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Forever
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "brands" && (
            <div className="space-y-4">
              {deletedBrands.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No deleted brands</p>
              ) : (
                deletedBrands.map((brand) => (
                  <div
                    key={brand.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{brand.name}</p>
                      <p className="text-sm text-gray-600">{brand.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Deleted: {new Date(brand.deletedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRecover("brands", brand.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Recover
                      </button>
                      <button
                        onClick={() => handlePermanentDelete("brands", brand.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Forever
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-4">
              {deletedTasks.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No deleted tasks</p>
              ) : (
                deletedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-600">Brand: {task.brand.name}</p>
                      {task.assignedTo && (
                        <p className="text-sm text-gray-600">
                          Assigned to: {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Deleted: {new Date(task.deletedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRecover("tasks", task.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Recover
                      </button>
                      <button
                        onClick={() => handlePermanentDelete("tasks", task.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Forever
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
