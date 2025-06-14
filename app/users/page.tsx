"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Users, UserCheck, UserX, Activity, Shield, Eye } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface User {
  id: number
  username: string
  email: string
  role: "admin" | "user"
  status: "active" | "inactive"
  lastLogin: string
  createdAt: string
  totalSales: number
  totalProducts: number
}

interface UserActivity {
  id: number
  userId: number
  username: string
  action: string
  details: string
  timestamp: string
}

export default function UsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [userActivities, setUserActivities] = useState<UserActivity[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    status: "active",
  })
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, router])

  useEffect(() => {
    // Simulate API call to fetch users and activities
    const fetchData = () => {
      setUsers([
        {
          id: 1,
          username: "admin",
          email: "admin@inventory.com",
          role: "admin",
          status: "active",
          lastLogin: "2024-01-15 10:30:00",
          createdAt: "2024-01-01 00:00:00",
          totalSales: 15,
          totalProducts: 5,
        },
        {
          id: 2,
          username: "harshil",
          email: "harshil@inventory.com",
          role: "user",
          status: "active",
          lastLogin: "2024-01-15 09:15:00",
          createdAt: "2024-01-02 08:00:00",
          totalSales: 8,
          totalProducts: 0,
        },
        {
          id: 3,
          username: "krishan",
          email: "krishan@inventory.com",
          role: "user",
          status: "active",
          lastLogin: "2024-01-14 16:45:00",
          createdAt: "2024-01-03 12:30:00",
          totalSales: 3,
          totalProducts: 0,
        },
        {
          id: 4,
          username: "hiren",
          email: "hiren@inventory.com",
          role: "user",
          status: "inactive",
          lastLogin: "2024-01-10 14:20:00",
          createdAt: "2024-01-05 09:15:00",
          totalSales: 1,
          totalProducts: 0,
        },
      ])

      setUserActivities([
        {
          id: 1,
          userId: 2,
          username: "harshil",
          action: "Sale Recorded",
          details: "Sold 2x Laptop Dell XPS 13 to Krishan Patel",
          timestamp: "2024-01-15 09:30:00",
        },
        {
          id: 2,
          userId: 1,
          username: "admin",
          action: "Product Added",
          details: 'Added new product: Monitor 27"',
          timestamp: "2024-01-15 08:45:00",
        },
        {
          id: 3,
          userId: 2,
          username: "harshil",
          action: "Stock Movement",
          details: "Stock out: 5x Wireless Mouse",
          timestamp: "2024-01-14 16:20:00",
        },
        {
          id: 4,
          userId: 3,
          username: "krishan",
          action: "Sale Recorded",
          details: "Sold 1x iPhone 15 Pro to Hiren Solanki",
          timestamp: "2024-01-14 15:10:00",
        },
        {
          id: 5,
          userId: 1,
          username: "admin",
          action: "User Created",
          details: "Created new user account for krishan",
          timestamp: "2024-01-14 10:00:00",
        },
      ])
    }

    fetchData()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const errors: { [key: string]: string } = {}
    if (!formData.username) {
      errors.username = "Username is required"
    }
    if (!formData.email) {
      errors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid"
    }
    if (!editingUser && !formData.password) {
      errors.password = "Password is required"
    }

    // Check for duplicate username/email
    const existingUser = users.find(
      (u) => u.id !== editingUser?.id && (u.username === formData.username || u.email === formData.email),
    )
    if (existingUser) {
      if (existingUser.username === formData.username) {
        errors.username = "Username already exists"
      }
      if (existingUser.email === formData.email) {
        errors.email = "Email already exists"
      }
    }

    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    const userData = {
      username: formData.username,
      email: formData.email,
      role: formData.role as "admin" | "user",
      status: formData.status as "active" | "inactive",
    }

    if (editingUser) {
      // Update existing user
      setUsers(users.map((u) => (u.id === editingUser.id ? { ...editingUser, ...userData } : u)))
    } else {
      // Add new user
      const newUser: User = {
        id: Date.now(),
        ...userData,
        lastLogin: "Never",
        createdAt: new Date().toISOString().replace("T", " ").split(".")[0],
        totalSales: 0,
        totalProducts: 0,
      }
      setUsers([...users, newUser])
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "user",
      status: "active",
    })
    setEditingUser(null)
    setIsDialogOpen(false)
    setFormErrors({})
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    })
    setIsDialogOpen(true)
    setFormErrors({})
  }

  const handleView = (user: User) => {
    setViewingUser(user)
    setIsViewDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    const userToDelete = users.find((u) => u.id === id)
    if (userToDelete?.role === "admin" && users.filter((u) => u.role === "admin").length === 1) {
      alert("Cannot delete the last admin user!")
      return
    }

    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((u) => u.id !== id))
    }
  }

  const toggleUserStatus = (id: number) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u)))
  }

  const getUserActivities = (userId: number) => {
    return userActivities.filter((activity) => activity.userId === userId)
  }

  const activeUsers = users.filter((u) => u.status === "active").length
  const totalAdmins = users.filter((u) => u.role === "admin").length

  if (user?.role !== "admin") {
    return (
      <DashboardLayout title="Access Denied">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>You don't have permission to access this page. Admin access required.</AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">System Users</h3>
            <p className="text-sm text-gray-600">Manage user accounts and permissions</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                  {formErrors.username && <p className="text-red-500 text-sm">{formErrors.username}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
                </div>
                {!editingUser && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    {formErrors.password && <p className="text-red-500 text-sm">{formErrors.password}</p>}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingUser ? "Update" : "Create"} User
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{users.length - activeUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrators</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalAdmins}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "default" : "destructive"}>{user.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{user.lastLogin}</TableCell>
                        <TableCell>{user.totalSales}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleView(user)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => toggleUserStatus(user.id)}>
                              {user.status === "active" ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(user.id)}
                              disabled={user.id === 1} // Prevent deleting main admin
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent User Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="text-sm">{activity.timestamp}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{activity.username}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            {activity.action}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{activity.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Username</Label>
                    <p className="text-lg">{viewingUser.username}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-lg">{viewingUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Role</Label>
                    <Badge variant={viewingUser.role === "admin" ? "default" : "secondary"}>{viewingUser.role}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <Badge variant={viewingUser.status === "active" ? "default" : "destructive"}>
                      {viewingUser.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Created</Label>
                    <p>{viewingUser.createdAt}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Last Login</Label>
                    <p>{viewingUser.lastLogin}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{viewingUser.totalSales}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Products Added</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{viewingUser.totalProducts}</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500 mb-2 block">Recent Activity</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {getUserActivities(viewingUser.id)
                      .slice(0, 5)
                      .map((activity) => (
                        <div key={activity.id} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-gray-600">{activity.details}</div>
                          <div className="text-xs text-gray-500">{activity.timestamp}</div>
                        </div>
                      ))}
                    {getUserActivities(viewingUser.id).length === 0 && (
                      <p className="text-gray-500 text-sm">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
