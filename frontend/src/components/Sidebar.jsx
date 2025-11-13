"use client"

import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  Settings,
  LogOut,
  User,
  MessageCircle,
  Users2,
  Trash2,
} from "lucide-react"

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER", "WRITER", "DESIGNER", "POST_SCHEDULER", "CLIENT_VIEWER"],
    },
    { name: "Users", href: "/dashboard/users", icon: Users, roles: ["SUPER_ADMIN", "ADMIN"] },
    { name: "Brands", href: "/dashboard/brands", icon: Briefcase, roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"] },
    {
      name: "Tasks",
      href: "/dashboard/tasks",
      icon: CheckSquare,
      roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER", "WRITER", "DESIGNER", "POST_SCHEDULER"],
    },
    {
      name: "Chat",
      href: "/dashboard/chat",
      icon: MessageCircle,
      roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER", "WRITER", "DESIGNER", "POST_SCHEDULER", "CLIENT_VIEWER"],
    },
    {
      name: "Teams",
      href: "/dashboard/teams",
      icon: Users2,
      roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"],
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
      roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER", "WRITER", "DESIGNER", "POST_SCHEDULER", "CLIENT_VIEWER"],
    },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["SUPER_ADMIN"] },
    { name: "Trash", href: "/dashboard/trash", icon: Trash2, roles: ["SUPER_ADMIN"] }
  ]

  const filteredNav = navigation.filter((item) => item.roles.includes(user?.role))

  return (
    <div className="w-64 bg-background border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        {/* <img src="abacusdesk-logo.svg" alt="Abacus CRM" className="w-32 h-auto mb-2" /> */}
        <h1 className="text-2xl font-bold text-primary">Abacus CRM</h1>
        <p className="text-sm text-text-secondary mt-1">{user?.role?.replace("_", " ")}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredNav.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? "bg-primary text-white" : "text-text-secondary hover:bg-surface"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="mb-4 p-3 bg-surface rounded-lg">
          <p className="text-sm font-medium flex items-center gap-2">
            {user?.avatar && (
              <img
                src={user.avatar || "/placeholder.svg"}
                alt={user.firstName}
                className="w-6 h-6 rounded-full object-cover"
              />
            )}
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-text-secondary">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-danger hover:bg-danger/10 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}
