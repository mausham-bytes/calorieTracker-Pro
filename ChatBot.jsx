import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { MessageCircle, Send, Bot, User, X } from 'lucide-react'

const ChatBot = ({ isOpen, onToggle, foods, dailyGoal, stats }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your nutrition assistant. I can help you with calorie tracking, meal planning, and nutrition advice. How can I help you today?"
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const GEMINI_API_KEY = 'AIzaSyD_jc45SFOR8i7IvwwwxP2AL8MHXQ-uhyA'

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Create context about user's current nutrition data
      const nutritionContext = `
        User's current nutrition data:
        - Daily calorie goal: ${dailyGoal}
        - Today's calories consumed: ${stats.todayCalories}
        - Remaining calories: ${stats.remainingCalories}
        - Weekly average: ${stats.weeklyAverage}
        - Recent foods logged: ${foods.slice(-5).map(f => `${f.name} (${f.calories * f.quantity} cal)`).join(', ')}
      `

      const prompt = `You are a helpful nutrition and calorie tracking assistant. 
      ${nutritionContext}
      
      User question: ${inputMessage}
      
      Please provide helpful, accurate nutrition advice. Keep responses concise but informative. 
      If the user asks about their current progress, use the data provided above.
      Focus on nutrition, calorie tracking, healthy eating, and meal planning advice.`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response from AI')
      }

      const data = await response.json()
      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
        "I'm sorry, I couldn't process your request right now. Please try again."

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later."
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg z-50"
        size="icon"
      >
        <MessageCircle size={24} className="text-white" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-green-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <div>
            <CardTitle className="text-lg">Nutrition Assistant</CardTitle>
            <CardDescription className="text-green-100 text-sm">
              Your AI nutrition helper
            </CardDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-white hover:bg-green-700 h-8 w-8"
        >
          <X size={16} />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === 'bot' && <Bot size={16} className="mt-1 flex-shrink-0" />}
                    {message.type === 'user' && <User size={16} className="mt-1 flex-shrink-0" />}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Bot size={16} />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about nutrition, calories, or meal planning..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
              className="bg-green-600 hover:bg-green-700"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ChatBot

