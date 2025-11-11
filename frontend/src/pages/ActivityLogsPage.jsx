"use client"

import { useState, useEffect } from "react"
import { Activity, User, Calendar } from "lucide-react"
import { activityAPI } from "../services/api"
import { format } from "date-fns"

const actionColors = {
  CREATE_USER: "bg-green-100 text-green-800",
  UPDATE_USER: "bg-blue-100 text-blue-800",
  DELETE_USER: "bg-red-100 text-red-800",
  CREATE_TASK: "bg-purple-100 text-purple-800",
  UPDATE_TASK: "bg-blue-100 text-blue-800",
  DELETE_TASK: "bg-red-100 text-red-800",
  CREATE_BRAND: "bg-green-100 text-green-800",
  UPDATE_BRAND: "bg-blue-100 text-blue-800",
  DELETE_BRAND: "bg-red-100 text-red-800",
  UPLOAD_ATTACHMENT: "bg-yellow-100 text-yellow-800",
  DELETE_ATTACHMENT: "bg-red-100 text-red-800",
}

const actionLabels = {
  CREATE_USER: "Created User",
  UPDATE_USER: "Updated User",
  DELETE_USER: "Deleted User",
  CREATE_TASK: "Created Task",
  UPDATE_TASK: "Updated Task",
  DELETE_TASK: "Deleted Task",
  CREATE_BRAND: "Created Brand",
  UPDATE_BRAND: "Updated Brand",
  DELETE_BRAND: "Deleted Brand",
  UPLOAD_ATTACHMENT: "Uploaded File",
  DELETE_ATTACHMENT: "Deleted File",
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterEntity, setFilterEntity] = useState("")
  const [limit, setLimit] = useState(100)

  useEffect(() => {
    loadLogs()
  }, [filterEntity, limit])

  const loadLogs = async () => {
    try {
      const params = {}
      if (filterEntity) params.entity = filterEntity
      if (limit) params.limit = limit

      const data = await activityAPI.getAll(params)
      setLogs(data)
    } catch (error) {
      console.error("Failed to load activity logs:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading activity logs...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Logs</h1>
          <p className="text-gray-600 mt-1">System-wide activity and audit trail</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Entities</option>
            <option value="User">Users</option>
            <option value="Task">Tasks</option>
            <option value="Brand">Brands</option>
            <option value="Attachment">Attachments</option>
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="50">Last 50</option>
            <option value="100">Last 100</option>
            <option value="200">Last 200</option>
            <option value="500">Last 500</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || "bg-gray-100 text-gray-800"}`}
                      >
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{log.entity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {log.user.firstName} {log.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{log.user.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No activity logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">About Activity Logs</h3>
            <p className="text-sm text-blue-700 mt-1">
              Activity logs track all important actions in the system including user management, task operations, brand
              changes, and file uploads. This helps maintain accountability and audit compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
