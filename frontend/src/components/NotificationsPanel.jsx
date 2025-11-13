"use client"

import { useState, useEffect } from "react"
import { X, Check, CheckCheck, ChevronRight } from "lucide-react"
import { notificationsAPI } from "../services/api"
import { useSocket } from "../contexts/SocketContext"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import TaskList from "./TaskList.jsx"

export default function NotificationsPanel({ onClose }) {
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

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation() // Prevent notification click
    try {
      await notificationsAPI.markAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch (error) {
      console.error("[v0] Failed to mark notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("[v0] Failed to mark all as read:", error)
    }
  }

  // const handleNotificationClick = async (notification) => {
  //   // Mark as read when clicked
  //   if (!notification.isRead) {
  //     try {
  //       await notificationsAPI.markAsRead(notification.id)
  //       setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)))
  //     } catch (error) {
  //       console.error("[v0] Failed to mark notification as read:", error)
  //     }
  //   }

  //   // Navigate based on notification type and data
  //   if (notification.type === 'TASK_ASSIGNED' || 
  //       notification.type === 'TASK_UPDATED' || 
  //       notification.type === 'TASK_COMMENT' ||
  //       notification.type === 'TASK_STATUS_CHANGED') {
      
  //     // Extract task ID from metadata or link
  //     const taskId = notification.metadata?.taskId || notification.link?.split('/').pop()
      
  //     if (taskId) {
  //       navigate(`/dashboard/tasks/${taskId}`)
  //       onClose() // Close the panel after navigation
  //     }
  //   } else if (notification.link) {
  //     // If there's a direct link, navigate to it
  //     navigate(notification.link)
  //     onClose()
  //   }
  // }

  const handleNotificationClick = async (notification) => {
  console.log('Notification clicked:', notification)
  
  // Mark as read when clicked
  if (!notification.isRead) {
    try {
      await notificationsAPI.markAsRead(notification.id)
      setNotifications((prev) => 
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      )
    } catch (error) {
      console.error("[v0] Failed to mark notification as read:", error)
    }
  }

  // Navigate based on notification type and data
  if (notification.type === 'TASK_ASSIGNED' || 
      notification.type === 'TASK_UPDATED' || 
      notification.type === 'TASK_COMMENT' ||
      notification.type === 'COMMENT' ||
      notification.type === 'TASK_STATUS_CHANGED') {
    
    // Try to get taskId from metadata first
    let taskId = notification.metadata?.taskId
    
    // If not in metadata, try to extract from link
    if (!taskId && notification.link) {
      taskId = notification.link.split('/').pop()
    }
    
    // If still no taskId, try to extract from message
    if (!taskId && notification.message) {
      // Try multiple patterns:
      // Pattern 1: "STATIC #10" or "task #10"
      let match = notification.message.match(/:\s*(\w+)\s*#(\d+)/i)
      if (match && match[2]) {
        taskId = match[2]  // Gets "10" from "STATIC #10"
      } else {
        // Pattern 2: Just "#10"
        match = notification.message.match(/#(\d+)/i)
        if (match && match[1]) {
          taskId = match[1]
        }
      }
    }
    
    console.log('Extracted taskId:', taskId)
    
    if (taskId) {
      console.log('Navigating to:', `/dashboard/tasks/${taskId}`)
      navigate(`/dashboard/tasks/${taskId}`)
      onClose()
    } else {
      console.log('No taskId found in notification')
    }
  } else if (notification.link) {
    // For other notification types with direct links
    navigate(notification.link)
    onClose()
  }
}


  const getNotificationIcon = (type) => {
    // You can customize icons based on notification type
    switch (type) {
      case 'TASK_ASSIGNED':
        return '📋'
      case 'TASK_UPDATED':
        return '✏️'
      case 'TASK_COMMENT':
        return '💬'
      case 'TASK_STATUS_CHANGED':
        return '🔄'
      case 'MENTION':
        return '@'
      default:
        return '🔔'
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-start sm:justify-end z-50">
      <div className="bg-white w-full sm:w-96 h-[80vh] sm:h-screen sm:max-h-screen flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold dark:text-black">Notifications</h2>
            {unreadCount > 0 && <p className="text-sm text-gray-600">{unreadCount} unread</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        {unreadCount > 0 && (
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-600">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <div className="mb-3">🔔</div>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1">
                      {/* Icon */}
                      <div className="text-2xl dark:text-black">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1 dark:text-black">{notification.message}</h3>
                        {/* <p className="text-sm text-gray-600 mb-2 line-clamp-2">{notification.message}</p> */}
                        <p className="text-xs text-gray-500">
                          {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>

                      {/* Arrow indicator for clickable notifications */}
                      {(notification.link || notification.metadata?.taskId) && (
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>

                    {/* Mark as read button */}
                    {!notification.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}