"use client"

import { User, Bell } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useEffect, useState } from "react"
import NotificationsPanel from "./NotificationsPanel"
import { notificationsAPI } from "../services/api"
import { useSocket } from "../contexts/SocketContext"
import { useNavigate } from "react-router-dom"

export default function Header() {
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)

  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const { socket } = useSocket()

  useEffect(() => {
    loadNotifications()

    if (socket) {
      socket.on("notification", (notification) => {
        setNotifications((prev) => [notification, ...prev])
      })

      return () => {
        socket.off("notification")
      }
    }
  }, [socket])

  const loadNotifications = async () => {
    try {
      const data = await notificationsAPI.getAll()
      setNotifications(data)
    } catch (error) {
      console.error("[v0] Failed to load notifications:", error)
    } finally {
      setLoading(false)
    }
  }


  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <>
      <header className="bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 items-center">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.firstName || "User"}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-blue-600 bg-gray-400 rounded-full p-2" />
            )}
            <div>
              <h2 className="flex text-2xl font-bold">Welcome back, {user?.firstName}!</h2>
              <p className="text-sm text-text-secondary">Here's what's happening today</p>
            </div>
          </div>

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>}
          </button>
        </div>
      </header>

      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
    </>
  )
}
