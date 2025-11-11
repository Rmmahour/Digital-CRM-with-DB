"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "./AuthContext"

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setConnected(false)
      }
      return
    }

    const newSocket = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000", {
      auth: {
        token: localStorage.getItem("token"),
      },
    })

    newSocket.on("connect", () => {
      console.log("[v0] Socket connected")
      setConnected(true)
      newSocket.emit("join-room", user.id)
    })

    newSocket.on("disconnect", () => {
      console.log("[v0] Socket disconnected")
      setConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [user])

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider")
  }
  return context
}
