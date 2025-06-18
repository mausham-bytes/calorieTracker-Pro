import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { Apple, Target, TrendingUp, Calendar, Plus, Trash2, Edit, Save, Utensils } from 'lucide-react'
import ChatBot from './components/ChatBot.jsx'
import FoodImageAnalyzer from './components/FoodImageAnalyzer.jsx'
import './App.css'

function App() {
  const [meals, setMeals] = useState([])
  const [foods, setFoods] = useState([])
  const [dailyGoal, setDailyGoal] = useState(2000)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [newFood, setNewFood] = useState({
    name: '',
    calories: '',
    quantity: '',
    meal: 'breakfast',
    date: new Date().toISOString().split('T')[0]
  })
  const [newGoal, setNewGoal] = useState('')
  const [stats, setStats] = useState({
    todayCalories: 0,
    weeklyAverage: 0,
    remainingCalories: 0,
    weeklyProgress: []
  })

  // Common food database
  const commonFoods = [
    { name: 'Apple', calories: 95 },
    { name: 'Banana', calories: 105 },
    { name: 'Chicken Breast (100g)', calories: 165 },
    { name: 'Rice (1 cup)', calories: 205 },
    { name: 'Bread Slice', calories: 80 },
    { name: 'Egg', calories: 70 },
    { name: 'Milk (1 cup)', calories: 150 },
    { name: 'Pasta (1 cup)', calories: 220 },
    { name: 'Salmon (100g)', calories: 208 },
    { name: 'Broccoli (1 cup)', calories: 25 },
    { name: 'Yogurt (1 cup)', calories: 150 },
    { name: 'Oatmeal (1 cup)', calories: 150 }
  ]

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedFoods = localStorage.getItem('calorietracker-foods')
    const savedGoal = localStorage.getItem('calorietracker-goal')
    
    if (savedFoods) {
      setFoods(JSON.parse(savedFoods))
    }
    if (savedGoal) {
      setDailyGoal(parseInt(savedGoal))
    }
  }, [])

  // Save data to localStorage whenever foods or goal change
  useEffect(() => {
    localStorage.setItem('calorietracker-foods', JSON.stringify(foods))
    calculateStats()
  }, [foods, dailyGoal])

  useEffect(() => {
    localStorage.setItem('calorietracker-goal', dailyGoal.toString())
  }, [dailyGoal])

  const calculateStats = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayFoods = foods.filter(f => f.date === today)
    const todayCalories = todayFoods.reduce((sum, food) => sum + (food.calories * food.quantity), 0)
    
    // Calculate weekly progress (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const weeklyProgress = last7Days.map(date => {
      const dayFoods = foods.filter(f => f.date === date)
      const dayCalories = dayFoods.reduce((sum, f) => sum + (f.calories * f.quantity), 0)
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        calories: dayCalories,
        goal: dailyGoal
      }
    })

    const weeklyAverage = weeklyProgress.reduce((sum, day) => sum + day.calories, 0) / 7
    const remainingCalories = Math.max(0, dailyGoal - todayCalories)

    setStats({ 
      todayCalories: Math.round(todayCalories), 
      weeklyAverage: Math.round(weeklyAverage), 
      remainingCalories: Math.round(remainingCalories),
      weeklyProgress 
    })
  }

  const addFood = () => {
    if (newFood.name && newFood.calories && newFood.quantity) {
      const food = {
        id: Date.now(),
        ...newFood,
        calories: parseInt(newFood.calories),
        quantity: parseFloat(newFood.quantity)
      }
      setFoods([...foods, food])
      setNewFood({
        name: '',
        calories: '',
        quantity: '',
        meal: 'breakfast',
        date: new Date().toISOString().split('T')[0]
      })
    }
  }

  const addFoodFromImage = (foodItem) => {
    const food = {
      id: Date.now(),
      ...foodItem
    }
    setFoods([...foods, food])
  }

  const deleteFood = (id) => {
    setFoods(foods.filter(f => f.id !== id))
  }

  const updateDailyGoal = () => {
    if (newGoal && parseInt(newGoal) > 0) {
      setDailyGoal(parseInt(newGoal))
      setNewGoal('')
    }
  }

  const selectCommonFood = (food) => {
    setNewFood({
      ...newFood,
      name: food.name,
      calories: food.calories.toString(),
      quantity: '1'
    })
  }

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
  
  const todayFoods = foods.filter(f => f.date === new Date().toISOString().split('T')[0])
  const mealBreakdown = mealTypes.map(meal => {
    const mealFoods = todayFoods.filter(f => f.meal === meal)
    const mealCalories = mealFoods.reduce((sum, f) => sum + (f.calories * f.quantity), 0)
    return {
      meal: meal.charAt(0).toUpperCase() + meal.slice(1),
      calories: mealCalories,
      foods: mealFoods.length
    }
  })

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']

  const progressPercentage = Math.min((stats.todayCalories / dailyGoal) * 100, 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Apple className="text-green-600" size={40} />
            CalorieTracker Pro
          </h1>
          <p className="text-gray-600 text-lg">Your Personal Nutrition Companion</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Today's Calories</p>
                  <p className="text-3xl font-bold">{stats.todayCalories}</p>
                </div>
                <Utensils size={32} className="text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Daily Goal</p>
                  <p className="text-3xl font-bold">{dailyGoal}</p>
                </div>
                <Target size={32} className="text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Remaining</p>
                  <p className="text-3xl font-bold">{stats.remainingCalories}</p>
                </div>
                <TrendingUp size={32} className="text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Weekly Avg</p>
                  <p className="text-3xl font-bold">{stats.weeklyAverage}</p>
                </div>
                <Calendar size={32} className="text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Daily Progress</CardTitle>
            <CardDescription>Your calorie intake vs daily goal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Progress: {stats.todayCalories} / {dailyGoal} calories</span>
                <Badge variant={progressPercentage >= 100 ? "destructive" : progressPercentage >= 80 ? "default" : "secondary"}>
                  {Math.round(progressPercentage)}%
                </Badge>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-sm text-gray-600">
                {progressPercentage >= 100 
                  ? `You've exceeded your daily goal by ${stats.todayCalories - dailyGoal} calories`
                  : `${stats.remainingCalories} calories remaining for today`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="log-food">Log Food</TabsTrigger>
            <TabsTrigger value="ai-scan">AI Scan</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Meals */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Meals</CardTitle>
                  <CardDescription>Breakdown by meal type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mealBreakdown.map(meal => (
                      <div key={meal.meal} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{meal.meal}</p>
                          <p className="text-sm text-gray-600">{meal.foods} items</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{Math.round(meal.calories)}</p>
                          <p className="text-sm text-gray-600">calories</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Set Daily Goal */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Calorie Goal</CardTitle>
                  <CardDescription>Adjust your target calories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{dailyGoal}</p>
                    <p className="text-gray-600">Current daily goal</p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Enter new goal"
                    />
                    <Button onClick={updateDailyGoal}>
                      <Save size={16} className="mr-2" />
                      Update
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Recommended daily intake:</p>
                    <p>• Women: 1,800-2,000 calories</p>
                    <p>• Men: 2,200-2,500 calories</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Log Food Tab */}
          <TabsContent value="log-food" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Food Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Log Food</CardTitle>
                  <CardDescription>Add food to your daily intake</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="food-name">Food Name</Label>
                    <Input
                      id="food-name"
                      value={newFood.name}
                      onChange={(e) => setNewFood({...newFood, name: e.target.value})}
                      placeholder="e.g., Grilled Chicken"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="calories">Calories</Label>
                      <Input
                        id="calories"
                        type="number"
                        value={newFood.calories}
                        onChange={(e) => setNewFood({...newFood, calories: e.target.value})}
                        placeholder="250"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.1"
                        value={newFood.quantity}
                        onChange={(e) => setNewFood({...newFood, quantity: e.target.value})}
                        placeholder="1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="meal-type">Meal Type</Label>
                    <Select value={newFood.meal} onValueChange={(value) => setNewFood({...newFood, meal: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mealTypes.map(meal => (
                          <SelectItem key={meal} value={meal}>
                            {meal.charAt(0).toUpperCase() + meal.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newFood.date}
                      onChange={(e) => setNewFood({...newFood, date: e.target.value})}
                    />
                  </div>
                  
                  <Button onClick={addFood} className="w-full">
                    <Plus size={16} className="mr-2" />
                    Add Food
                  </Button>
                </CardContent>
              </Card>

              {/* Common Foods */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Add</CardTitle>
                  <CardDescription>Common foods with preset calories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                    {commonFoods.map((food, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-between h-auto p-3"
                        onClick={() => selectCommonFood(food)}
                      >
                        <span>{food.name}</span>
                        <Badge variant="secondary">{food.calories} cal</Badge>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Scan Tab */}
          <TabsContent value="ai-scan" className="space-y-6">
            <FoodImageAnalyzer onFoodItemsDetected={addFoodFromImage} />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Food History</CardTitle>
                <CardDescription>All your logged foods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {foods.slice().reverse().map(food => (
                    <div key={food.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{food.meal}</Badge>
                          <span className="font-medium">{food.name}</span>
                          <span className="text-gray-600">x{food.quantity}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(food.date).toLocaleDateString()} • {Math.round(food.calories * food.quantity)} calories
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFood(food.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                  {foods.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No foods logged yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Calorie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Calorie Intake</CardTitle>
                  <CardDescription>Your daily calories vs goal over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.weeklyProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="calories" stroke="#10B981" strokeWidth={2} name="Calories" />
                      <Line type="monotone" dataKey="goal" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" name="Goal" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Meal Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Meal Distribution</CardTitle>
                  <CardDescription>Calorie breakdown by meal type</CardDescription>
                </CardHeader>
                <CardContent>
                  {mealBreakdown.some(m => m.calories > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={mealBreakdown.filter(m => m.calories > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ meal, calories }) => `${meal}: ${Math.round(calories)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="calories"
                        >
                          {mealBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      No meal data for today
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Nutrition Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Nutrition Summary</CardTitle>
                <CardDescription>Your calorie tracking insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{stats.todayCalories}</p>
                    <p className="text-gray-600">Today's Intake</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{dailyGoal}</p>
                    <p className="text-gray-600">Daily Goal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">{stats.weeklyAverage}</p>
                    <p className="text-gray-600">Weekly Average</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600">{todayFoods.length}</p>
                    <p className="text-gray-600">Foods Logged Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ChatBot Component */}
        <ChatBot 
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
          foods={foods}
          dailyGoal={dailyGoal}
          stats={stats}
        />
      </div>
    </div>
  )
}

export default App

