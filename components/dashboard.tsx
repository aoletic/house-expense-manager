"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, Plus, LogOut, DollarSign, ShoppingCart, Droplets, Zap, Flame } from "lucide-react"
import AddExpenseDialog from "@/components/add-expense-dialog"

interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
  created_at: string
}

const categoryIcons = {
  groceries: ShoppingCart,
  water: Droplets,
  electricity: Zap,
  gas: Flame,
}

const categoryColors = {
  groceries: "bg-green-100 text-green-800",
  water: "bg-blue-100 text-blue-800",
  electricity: "bg-yellow-100 text-yellow-800",
  gas: "bg-orange-100 text-orange-800",
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    getUser()
    fetchExpenses()
  }, [selectedMonth])

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchExpenses = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .gte("date", `${selectedMonth}-01`)
      .lt("date", `${selectedMonth}-32`)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching expenses:", error)
    } else {
      setExpenses(data || [])
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const expensesByCategory = expenses.reduce(
    (acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    },
    {} as Record<string, number>,
  )

  const monthName = new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Home className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">House Expense Organizer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.user_metadata?.full_name || user?.email}</span>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Expenses for {monthName}</h2>
            <p className="text-gray-600">Track and organize your monthly house expenses</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date()
                  date.setMonth(date.getMonth() - i)
                  const value = date.toISOString().slice(0, 7)
                  const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>

          {Object.entries(expensesByCategory).map(([category, amount]) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons]
            return (
              <Card key={category}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">{category}</CardTitle>
                  {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${amount.toFixed(2)}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Your latest expense entries for {monthName}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No expenses found for this month. Add your first expense to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense) => {
                  const Icon = categoryIcons[expense.category as keyof typeof categoryIcons]
                  return (
                    <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {Icon && <Icon className="h-5 w-5 text-gray-400" />}
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant="secondary"
                          className={categoryColors[expense.category as keyof typeof categoryColors]}
                        >
                          {expense.category}
                        </Badge>
                        <span className="font-semibold">${expense.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AddExpenseDialog open={showAddDialog} onOpenChange={setShowAddDialog} onExpenseAdded={fetchExpenses} />
    </div>
  )
}
