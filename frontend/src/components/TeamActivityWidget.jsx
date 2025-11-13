"use client"

import { useState, useEffect } from "react"
import { dashboardAPI } from "../services/api"

export default function TeamActivityWidget() {
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivity()
  }, [])

  const loadActivity = async () => {
    try {
      const data = await dashboardAPI.getStats()
      setActivity(data.teamActivity)
    } catch (error) {
      console.error("[v0] Failed to load team activity:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-background rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Team Activity</h3>
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-background rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold mb-4">Team Activity</h3>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-success rounded-full"></div>
          <span className="text-text-secondary">
            {activity?.completedToday || 0} {activity?.completedToday === 1 ? 'task' : 'tasks'} completed today
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-warning rounded-full"></div>
          <span className="text-text-secondary">
            {activity?.inReview || 0} {activity?.inReview === 1 ? 'task' : 'tasks'} in review
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span className="text-text-secondary">
            {activity?.activeMembers || 0} active team {activity?.activeMembers === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>
    </div>
  )
}