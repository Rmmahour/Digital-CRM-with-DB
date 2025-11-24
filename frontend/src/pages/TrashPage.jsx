"use client"

import { useState, useEffect } from "react"
import { Trash2, RotateCcw, XCircle, AlertTriangle, Filter, Search } from "lucide-react"
import { trashAPI } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { format } from "date-fns"

export default function TrashPage() {
  const { user } = useAuth()
  const [trashedItems, setTrashedItems] = useState({
    brands: [],
    users: [],
    tasks: []
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadTrash()
  }, [filter])

  const loadTrash = async () => {
    try {
      setLoading(true)
      const data = await trashAPI.getAll(filter === "all" ? null : filter)
      
      // Ensure data has the correct structure
      setTrashedItems({
        brands: data.brands || [],
        users: data.users || [],
        tasks: data.tasks || []
      })
    } catch (error) {
      console.error("[TrashPage] Failed to load trash:", error)
      
      // Set empty state on error
      setTrashedItems({
        brands: [],
        users: [],
        tasks: []
      })
      
      // More specific error messages
      if (error.response?.status === 403) {
        alert("You don't have permission to view trash")
      } else if (error.response?.status === 500) {
        alert("Server error. Please try again later.")
      } else {
        alert("Failed to load trash items")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (type, id, name) => {
    if (!confirm(`Are you sure you want to restore this ${type}: ${name}?`)) return

    setIsProcessing(true)
    try {
      const response = await trashAPI.restore(type, id)
      
      console.log(`[TrashPage] Restore ${type} response:`, response) // Debug log
      
      // Handle response - backend might return different formats
      if (response) {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} restored successfully!`)
        await loadTrash() // Reload the trash items
      }
    } catch (error) {
      console.error(`[TrashPage] Failed to restore ${type}:`, error)
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        alert(`${type} not found in trash`)
      } else if (error.response?.status === 403) {
        alert(`You don't have permission to restore this ${type}`)
      } else if (error.response?.status === 400) {
        alert(error.response?.data?.message || `Invalid ${type} data`)
      } else {
        alert(error.response?.data?.message || `Failed to restore ${type}`)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePermanentDelete = async (type, id, name) => {
    // Check permissions
    if (user.role !== "SUPER_ADMIN") {
      alert("Only Super Admin can permanently delete items")
      return
    }

    // Double confirmation for permanent delete
    if (!confirm(`⚠️ PERMANENT DELETE\n\nAre you absolutely sure you want to permanently delete this ${type}: ${name}?\n\nThis action CANNOT be undone!`)) {
      return
    }

    if (!confirm("This is your final warning. The item will be deleted forever. Continue?")) {
      return
    }

    setIsProcessing(true)
    try {
      const response = await trashAPI.permanentlyDelete(type, id)
      
      console.log(`[TrashPage] Permanent delete ${type} response:`, response) // Debug log
      
      if (response) {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} permanently deleted`)
        await loadTrash()
      }
    } catch (error) {
      console.error(`[TrashPage] Failed to permanently delete ${type}:`, error)
      
      if (error.response?.status === 403) {
        alert("You don't have permission to permanently delete items")
      } else if (error.response?.status === 404) {
        alert(`${type} not found`)
      } else {
        alert(error.response?.data?.message || `Failed to permanently delete ${type}`)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEmptyTrash = async () => {
    // Check permissions
    if (user.role !== "SUPER_ADMIN") {
      alert("Only Super Admin can empty trash")
      return
    }

    if (!confirm("⚠️ EMPTY TRASH\n\nThis will permanently delete ALL items that have been in trash for more than 14 days.\n\nThis action CANNOT be undone!")) {
      return
    }

    setIsProcessing(true)
    try {
      const result = await trashAPI.emptyTrash()
      
      // Backend returns: {message: string, deleted: {brands: n, users: n, tasks: n}}
      if (result && result.deleted) {
        const { brands = 0, users = 0, tasks = 0 } = result.deleted
        const totalDeleted = brands + users + tasks
        
        if (totalDeleted > 0) {
          alert(`✅ Trash emptied successfully!\n\nPermanently deleted:\n• ${brands} brand${brands !== 1 ? 's' : ''}\n• ${users} user${users !== 1 ? 's' : ''}\n• ${tasks} task${tasks !== 1 ? 's' : ''}`)
        } else {
          alert("ℹ️ No items were deleted\n\nOnly items that have been in trash for more than 14 days can be permanently deleted.\n\nAll current items are still within the 14-day retention period.")
        }
        
        // Reload even if nothing was deleted, to refresh the UI
        await loadTrash()
      } else if (result && result.message) {
        // Fallback if structure is different
        alert(result.message)
        await loadTrash()
      }
    } catch (error) {
      console.error("[TrashPage] Failed to empty trash:", error)
      
      if (error.response?.status === 403) {
        alert("❌ Access Denied\n\nOnly Super Admin can empty trash")
      } else if (error.response?.data?.message) {
        alert(`❌ Error: ${error.response.data.message}`)
      } else {
        alert("❌ Failed to empty trash\n\nPlease try again or contact support if the issue persists.")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const getDaysRemaining = (deletedAt) => {
    if (!deletedAt) return 0
    
    try {
      const deleteDate = new Date(deletedAt)
      const expiryDate = new Date(deleteDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      const now = new Date()
      const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
      return daysLeft > 0 ? daysLeft : 0
    } catch (error) {
      console.error("Error calculating days remaining:", error)
      return 0
    }
  }

  const filterItems = (items, type) => {
    if (!items || !Array.isArray(items)) return []
    if (!searchQuery) return items

    return items.filter(item => {
      const searchLower = searchQuery.toLowerCase()
      
      switch(type) {
        case 'brand':
          return item.name?.toLowerCase().includes(searchLower)
        case 'user':
          return (
            item.firstName?.toLowerCase().includes(searchLower) ||
            item.lastName?.toLowerCase().includes(searchLower) ||
            item.email?.toLowerCase().includes(searchLower)
          )
        case 'task':
          return (
            item.title?.toLowerCase().includes(searchLower) ||
            item.brand?.name?.toLowerCase().includes(searchLower)
          )
        default:
          return true
      }
    })
  }

  const getTotalCount = () => {
    return (trashedItems.brands?.length || 0) + 
           (trashedItems.users?.length || 0) + 
           (trashedItems.tasks?.length || 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading trash items...</p>
        </div>
      </div>
    )
  }

  const totalItems = getTotalCount()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Trash2 className="w-8 h-8" />
            Trash
          </h1>
          <p className="text-text-secondary">
            Items will be permanently deleted after 14 days
          </p>
        </div>
        {user.role === "SUPER_ADMIN" && totalItems > 0 && (
          <button
            onClick={handleEmptyTrash}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isProcessing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
            } text-white`}
          >
            <Trash2 className="w-5 h-5" />
            {isProcessing ? 'Processing...' : 'Empty Trash'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-background rounded-lg border border-border p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search trash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <Filter className="w-5 h-5 text-text-secondary" />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setFilter("all")}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "all"
                ? "bg-primary text-white"
                : "bg-surface text-text-secondary hover:bg-gray-100"
            }`}
          >
            All ({totalItems})
          </button>
          <button
            onClick={() => setFilter("brand")}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "brand"
                ? "bg-primary text-white"
                : "bg-surface text-text-secondary hover:bg-gray-100"
            }`}
          >
            Brands ({trashedItems.brands?.length || 0})
          </button>
          <button
            onClick={() => setFilter("user")}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "user"
                ? "bg-primary text-white"
                : "bg-surface text-text-secondary hover:bg-gray-100"
            }`}
          >
            Users ({trashedItems.users?.length || 0})
          </button>
          <button
            onClick={() => setFilter("task")}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "task"
                ? "bg-primary text-white"
                : "bg-surface text-text-secondary hover:bg-gray-100"
            }`}
          >
            Tasks ({trashedItems.tasks?.length || 0})
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      {totalItems > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900">Items in trash</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Items will be automatically deleted after 14 days. You can restore them before that.
              {user.role === "SUPER_ADMIN" && " As Super Admin, you can also permanently delete items immediately."}
            </p>
          </div>
        </div>
      )}

      {/* Trashed Brands */}
      {(filter === "all" || filter === "brand") && trashedItems.brands && trashedItems.brands.length > 0 && (
        <div className="bg-background rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Brands</h2>
          <div className="space-y-3">
            {filterItems(trashedItems.brands, 'brand').map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-surface transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{brand.name}</h3>
                  <p className="text-sm text-text-secondary">
                    Deleted {brand.deletedAt ? format(new Date(brand.deletedAt), "MMM d, yyyy") : "Unknown date"} by{" "}
                    {brand.deleter?.firstName} {brand.deleter?.lastName}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {brand._count?.tasks || 0} tasks
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">
                      {getDaysRemaining(brand.deletedAt)} days left
                    </p>
                    <p className="text-xs text-text-secondary">
                      Until permanent deletion
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore("brand", brand.id, brand.name)}
                      disabled={isProcessing}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white ${
                        isProcessing 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </button>
                    {user.role === "SUPER_ADMIN" && (
                      <button
                        onClick={() => handlePermanentDelete("brand", brand.id, brand.name)}
                        disabled={isProcessing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white ${
                          isProcessing 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                        title="Permanently Delete"
                      >
                        <XCircle className="w-4 h-4" />
                        Delete Forever
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trashed Users */}
      {(filter === "all" || filter === "user") && trashedItems.users && trashedItems.users.length > 0 && (
        <div className="bg-background rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          <div className="space-y-3">
            {filterItems(trashedItems.users, 'user').map((userItem) => (
              <div
                key={userItem.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-surface transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium">
                    {userItem.firstName} {userItem.lastName}
                  </h3>
                  <p className="text-sm text-text-secondary">{userItem.email}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    Role: {userItem.role} • Deleted {userItem.deletedAt ? format(new Date(userItem.deletedAt), "MMM d, yyyy") : "Unknown date"} by{" "}
                    {userItem.deleter?.firstName} {userItem.deleter?.lastName}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">
                      {getDaysRemaining(userItem.deletedAt)} days left
                    </p>
                    <p className="text-xs text-text-secondary">
                      Until permanent deletion
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore("user", userItem.id, `${userItem.firstName} ${userItem.lastName}`)}
                      disabled={isProcessing}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white ${
                        isProcessing 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </button>
                    {user.role === "SUPER_ADMIN" && (
                      <button
                        onClick={() => handlePermanentDelete("user", userItem.id, `${userItem.firstName} ${userItem.lastName}`)}
                        disabled={isProcessing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white ${
                          isProcessing 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                        title="Permanently Delete"
                      >
                        <XCircle className="w-4 h-4" />
                        Delete Forever
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trashed Tasks */}
      {(filter === "all" || filter === "task") && trashedItems.tasks && trashedItems.tasks.length > 0 && (
        <div className="bg-background rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Tasks</h2>
          <div className="space-y-3">
            {filterItems(trashedItems.tasks, 'task').map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-surface transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm text-text-secondary">
                    Brand: {task.brand?.name} • Deleted {task.deletedAt ? format(new Date(task.deletedAt), "MMM d, yyyy") : "Unknown date"} by{" "}
                    {task.deleter?.firstName} {task.deleter?.lastName}
                  </p>
                  {task.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">
                      {getDaysRemaining(task.deletedAt)} days left
                    </p>
                    <p className="text-xs text-text-secondary">
                      Until permanent deletion
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore("task", task.id, task.title)}
                      disabled={isProcessing}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white ${
                        isProcessing 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </button>
                    {user.role === "SUPER_ADMIN" && (
                      <button
                        onClick={() => handlePermanentDelete("task", task.id, task.title)}
                        disabled={isProcessing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white ${
                          isProcessing 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                        title="Permanently Delete"
                      >
                        <XCircle className="w-4 h-4" />
                        Delete Forever
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <div className="bg-background rounded-lg border border-border p-12 text-center">
          <Trash2 className="w-16 h-16 text-text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Trash is empty</h3>
          <p className="text-text-secondary">
            Deleted items will appear here and will be kept for 14 days before permanent deletion.
          </p>
        </div>
      )}
    </div>
  )
}