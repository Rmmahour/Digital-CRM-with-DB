"use client"

import { useState, useEffect } from "react"
import { dashboardAPI } from "../services/api"
import { AlertCircle } from "lucide-react"

export default function TeamActivityWidget() {
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadActivity()
  }, [])

  const loadActivity = async () => {
    try {
      setError(null)
      const data = await dashboardAPI.getStats()
      setActivity(data.teamActivity)
    } catch (error) {
      console.error("[v0] Failed to load team activity:", error)
      
      // Check if it's a 403 error
      if (error.response?.status === 403) {
        setError("You don't have permission to view team activity")
      } else {
        setError("Failed to load team activity")
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-background dark:bg-gray-800 rounded-lg border border-border dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Team Activity</h3>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-text-secondary dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-background dark:bg-gray-800 rounded-lg border border-border dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Team Activity</h3>
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background dark:bg-gray-800 rounded-lg border border-border dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">Team Activity</h3>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
          <span className="text-text-secondary dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">
              {activity?.completedToday || 0}
            </span>{" "}
            {activity?.completedToday === 1 ? "task" : "tasks"} completed today
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></div>
          <span className="text-text-secondary dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">
              {activity?.inReview || 0}
            </span>{" "}
            {activity?.inReview === 1 ? "task" : "tasks"} in review
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
          <span className="text-text-secondary dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">
              {activity?.activeMembers || 0}
            </span>{" "}
            active team {activity?.activeMembers === 1 ? "member" : "members"}
          </span>
        </div>
      </div>
    </div>
  )
}