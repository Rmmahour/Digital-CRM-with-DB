"use client"

import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import logo from "../../public/abacusdesk-logo.svg"
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
        <div className="flex flex-wrap sm:flex-nowrap justify-center align-center mb-4 gap-3">
          <img src={logo} alt="Abacus CRM" className="w-16 h-16" />
          <h1 className="text-xl font-bold text-primary align-center items-center">Abacus Desk CRM</h1>
        </div>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? "bg-primary text-white" : "text-text-secondary hover:bg-surface"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex bg-surface rounded-lg gap-2 py-4 items-center">
          {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.firstName || "User"}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-blue-600 bg-gray-400 rounded-full p-2" />
            )}
          <div className="text-sm font-medium items-center gap-2 text-xl">
            <p>{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-text-secondary">{user?.email}</p>
          </div>
          
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
