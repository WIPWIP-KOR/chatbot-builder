import { useState, useEffect } from 'react'
import { Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getChatbotByShareToken } from '../api'
import ChatWindow from '../components/ChatWindow'

export default function SharedChatPage() {
  const { t } = useTranslation()
  const shareToken = window.location.pathname.split('/s/')[1]
  const [chatbot, setChatbot] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (shareToken) {
      fetchChatbot()
    }
  }, [shareToken])

  const fetchChatbot = async () => {
    try {
      const res = await getChatbotByShareToken(shareToken)
      setChatbot(res.data.data)
    } catch (err) {
      if (err.response?.status === 403) {
        setError(t('chat.inactive'))
      } else {
        setError(t('chat.notFound'))
      }
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!chatbot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-dvh bg-gray-50 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-800">{chatbot.name}</h1>
            {chatbot.department && (
              <p className="text-xs text-gray-500">{chatbot.department}</p>
            )}
          </div>
          <div className={`ml-auto w-2.5 h-2.5 rounded-full ${chatbot.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
        </div>
      </header>

      <div className="flex-1 min-h-0 max-w-3xl w-full mx-auto flex flex-col">
        <ChatWindow chatbotId={chatbot.id} chatbot={chatbot} />
      </div>
    </div>
  )
}
