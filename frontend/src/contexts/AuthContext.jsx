"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { authAPI } from "../services/api"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const userData = await authAPI.getMe()
        setUser(userData)
      } catch (error) {
        localStorage.removeItem("token")
      }
    }
    setLoading(false)
  }

  const login = async (email, password) => {
    const { token, user: userData } = await authAPI.login(email, password)
    localStorage.setItem("token", token)
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
  }

  const updateProfile = async (profileData) => {
    const updatedUser = await authAPI.updateProfile(profileData)
    setUser(updatedUser)
    return updatedUser
  }

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
