"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Package2,
  BarChart3,
  ShoppingCart,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  User,
  Home,
  Users,
  Zap,
} from "lucide-react"
import { useAuth } from "./auth-provider"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuth()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "products", label: "Products", icon: Package2 },
    { id: "stock", label: "Stock Movements", icon: BarChart3 },
    { id: "sales", label: "Sales Summary", icon: ShoppingCart },
    { id: "reports", label: "Reports", icon: FileText },
    ...(user?.role === "admin" ? [{ id: "users", label: "Manage Users", icon: Users }] : []),
  ]

  // Get display username - fallback to email prefix if username not available
  const displayUsername = user?.username || user?.email?.split("@")[0] || "user"

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 shadow-lg transform transition-transform duration-300 ease-in-out
        ${isCollapsed ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:inset-0
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="relative p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md">
                <div className="relative">
                  <Package2 className="h-6 w-6 text-white" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Zap className="h-2 w-2 text-yellow-800" />
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">SmartStock</h1>
                <p className="text-xs text-slate-600">Smart Inventory System</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 rounded-full">
                {user?.role === "admin" ? (
                  <Shield className="h-4 w-4 text-slate-600" />
                ) : (
                  <User className="h-4 w-4 text-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-600 truncate">@{displayUsername}</p>
                  <Badge variant={user?.role === "admin" ? "default" : "secondary"} className="text-xs">
                    {user?.role}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start gap-3 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => {
                      onTabChange(item.id)
                      if (window.innerWidth < 1024) {
                        setIsCollapsed(false)
                      }
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                )
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isCollapsed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsCollapsed(false)} />
      )}
    </>
  )
}
