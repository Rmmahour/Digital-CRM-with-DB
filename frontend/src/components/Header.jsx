"use client"

import { Bell } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useState } from "react"
import NotificationsPanel from "./NotificationsPanel"

export default function Header() {
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <>
      <header className="bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h2>
            <p className="text-sm text-text-secondary">Here's what's happening today</p>
          </div>

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
          </button>
        </div>
      </header>

      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
    </>
  )
}
