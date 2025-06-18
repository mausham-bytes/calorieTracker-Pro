import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, Plus } from 'lucide-react'

const FoodImageAnalyzer = ({ onFoodItemsDetected }) => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [detectedItems, setDetectedItems] = useState([])
  const [error, setError] = useState(null)

  const GROQ_API_KEY = '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'
  const IMGBB_API_KEY = 'def78749691757dd233f93f1d65f023b'

  const handleImageSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(file)
      setError(null)
      setDetectedItems([])
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImageToImgBB = async (imageFile) => {
    const formData = new FormData()
    formData.append('image', imageFile)

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('ImgBB upload error:', errorData)
        throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error?.message || 'Image upload failed')
      }
      
      return data.data.url
    } catch (error) {
      console.error('Upload error:', error)
      throw new Error(`Image upload failed: ${error.message}`)
    }
  }

  const analyzeImageWithGroq = async (imageUrl) => {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Give calories of each item in this image in this below JSON format only\n {items:[{item_name:name of item, total_calories:in gm, total_protien:in gm , toal_carbs: in gm ,toal_fats:in gm},...]}"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          model: "llama-3.2-90b-vision-preview",
          temperature: 1,
          max_completion_tokens: 1024,
          top_p: 1,
          stream: false,
          response_format: {
            type: "json_object"
          },
          stop: null
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Groq API error:', errorData)
        throw new Error(`Failed to analyze image: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from AI service')
      }

      const content = data.choices[0].message.content
      try {
        return JSON.parse(content)
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Content:', content)
        throw new Error('Failed to parse AI response')
      }
    } catch (error) {
      console.error('Groq analysis error:', error)
      throw new Error(`AI analysis failed: ${error.message}`)
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setError(null)

    try {
      // Validate file size (max 32MB for ImgBB)
      if (selectedImage.size > 32 * 1024 * 1024) {
        throw new Error('Image file is too large. Please use an image smaller than 32MB.')
      }

      // Validate file type
      if (!selectedImage.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.')
      }

      console.log('Starting image analysis...', {
        fileName: selectedImage.name,
        fileSize: selectedImage.size,
        fileType: selectedImage.type
      })

      // Step 1: Upload image (30% progress)
      setAnalysisProgress(30)
      console.log('Uploading image to ImgBB...')
      const imageUrl = await uploadImageToImgBB(selectedImage)
      console.log('Image uploaded successfully:', imageUrl)

      // Step 2: Analyze with Groq (70% progress)
      setAnalysisProgress(70)
      console.log('Analyzing image with Groq AI...')
      const analysisResult = await analyzeImageWithGroq(imageUrl)
      console.log('Analysis result:', analysisResult)

      // Step 3: Complete (100% progress)
      setAnalysisProgress(100)
      setDetectedItems(analysisResult.items || [])

      // Auto-hide progress after completion
      setTimeout(() => {
        setAnalysisProgress(0)
      }, 1000)

    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message || 'Failed to analyze image')
      setAnalysisProgress(0)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const addItemToTracker = (item) => {
    const foodItem = {
      name: item.item_name,
      calories: Math.round(item.total_calories),
      quantity: 1,
      meal: 'lunch', // Default meal
      date: new Date().toISOString().split('T')[0],
      protein: item.total_protien || 0,
      carbs: item.toal_carbs || 0,
      fats: item.toal_fats || 0
    }
    
    onFoodItemsDetected(foodItem)
  }

  const addAllItems = () => {
    detectedItems.forEach(item => addItemToTracker(item))
    setDetectedItems([])
    setSelectedImage(null)
    setImagePreview(null)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="text-blue-600" size={24} />
          AI Food Recognition
        </CardTitle>
        <CardDescription>
          Upload a photo of your food to automatically detect nutritional information
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Image Upload Section */}
        <div className="space-y-4">
          <Label htmlFor="food-image">Upload Food Image</Label>
          <div className="flex items-center gap-4">
            <Input
              id="food-image"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="flex-1"
            />
            <Button
              onClick={analyzeImage}
              disabled={!selectedImage || isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="space-y-2">
            <Label>Image Preview</Label>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={imagePreview}
                alt="Food preview"
                className="max-w-full h-48 object-contain mx-auto rounded"
              />
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {(isAnalyzing || analysisProgress > 0) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Analysis Progress</Label>
              <span className="text-sm text-gray-600">{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
            <div className="text-sm text-gray-600">
              {analysisProgress <= 30 && "Uploading image..."}
              {analysisProgress > 30 && analysisProgress <= 70 && "Analyzing food items..."}
              {analysisProgress > 70 && analysisProgress < 100 && "Processing results..."}
              {analysisProgress === 100 && "Analysis complete!"}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Detected Items */}
        {detectedItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Detected Food Items</Label>
              <Button onClick={addAllItems} className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Add All Items
              </Button>
            </div>
            
            <div className="grid gap-4">
              {detectedItems.map((item, index) => (
                <Card key={index} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">{item.item_name}</h4>
                      <Button
                        size="sm"
                        onClick={() => addItemToTracker(item)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="#e5e7eb"
                              strokeWidth="4"
                              fill="none"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="#3b82f6"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${(item.total_calories / 500) * 175.93} 175.93`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold">{Math.round(item.total_calories)}</span>
                          </div>
                        </div>
                        <Badge variant="secondary">Calories</Badge>
                      </div>
                      
                      <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="#e5e7eb"
                              strokeWidth="4"
                              fill="none"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="#10b981"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${((item.total_protien || 0) / 50) * 175.93} 175.93`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold">{Math.round(item.total_protien || 0)}g</span>
                          </div>
                        </div>
                        <Badge variant="secondary">Protein</Badge>
                      </div>
                      
                      <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="#e5e7eb"
                              strokeWidth="4"
                              fill="none"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="#f59e0b"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${((item.toal_carbs || 0) / 100) * 175.93} 175.93`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold">{Math.round(item.toal_carbs || 0)}g</span>
                          </div>
                        </div>
                        <Badge variant="secondary">Carbs</Badge>
                      </div>
                      
                      <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="#e5e7eb"
                              strokeWidth="4"
                              fill="none"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="#ef4444"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${((item.toal_fats || 0) / 50) * 175.93} 175.93`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold">{Math.round(item.toal_fats || 0)}g</span>
                          </div>
                        </div>
                        <Badge variant="secondary">Fats</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {analysisProgress === 100 && detectedItems.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-green-700">Items successfully added to your food log!</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FoodImageAnalyzer

