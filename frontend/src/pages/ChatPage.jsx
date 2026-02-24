import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Bot, ArrowLeft } from 'lucide-react'
import { getChatbot } from '../api'
import ChatWindow from '../components/ChatWindow'

export default function ChatPage() {
  const params = useParams()
  // Extract chatbot ID from the URL path manually
  const chatbotId = parseInt(window.location.pathname.split('/chat/')[1])
  const [chatbot, setChatbot] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (chatbotId) {
      fetchChatbot()
    }
  }, [chatbotId])

  const fetchChatbot = async () => {
    try {
      const res = await getChatbot(chatbotId)
      setChatbot(res.data.data)
    } catch (err) {
      setError('Chatbot not found or unavailable.')
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{error}</p>
          <a href="/" className="mt-4 inline-flex items-center gap-1 text-blue-600 hover:underline text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Builder
          </a>
        </div>
      </div>
    )
  }

  if (!chatbot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Chat Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-800">{chatbot.name}</h1>
            <p className="text-xs text-gray-500">
              {chatbot.department && `${chatbot.department} | `}
              {chatbot.llm_provider} / {chatbot.llm_model}
            </p>
          </div>
          <div className={`ml-auto w-2.5 h-2.5 rounded-full ${chatbot.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto flex flex-col">
        <ChatWindow chatbotId={chatbotId} chatbot={chatbot} />
      </div>
    </div>
  )
}
