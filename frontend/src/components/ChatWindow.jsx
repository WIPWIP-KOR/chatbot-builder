import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { sendMessage } from '../api'
import ActionRenderer from './ActionRenderer'

export default function ChatWindow({ chatbotId, chatbot }) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    // Generate a new session ID
    setSessionId(crypto.randomUUID())
    setMessages([])
  }, [chatbotId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await sendMessage({
        chatbot_id: chatbotId,
        message: text,
        session_id: sessionId,
      })
      const data = res.data.data
      setSessionId(data.session_id)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          action: data.action,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: t('chat.errorMessage'),
          error: true,
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleActionSubmitted = (actionResult) => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: t('chat.actionCompleted', { message: actionResult?.message || '' }),
        isSystemMessage: true,
      },
    ])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {chatbot?.name || 'Chatbot'}
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              {chatbot?.description || t('chat.askAnything')}
            </p>
            {chatbot?.department && (
              <span className="mt-2 text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {t('chat.departmentLabel', { department: chatbot.department })}
              </span>
            )}
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, idx) => (
          <div key={idx}>
            <div
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : msg.error
                    ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md'
                    : msg.isSystemMessage
                    ? 'bg-green-50 text-green-700 border border-green-200 rounded-bl-md'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>

            {/* Action Renderer */}
            {msg.action && (
              <div className="ml-11 mt-2">
                <ActionRenderer
                  action={msg.action}
                  chatbotId={chatbotId}
                  sessionId={sessionId}
                  onSubmitted={handleActionSubmitted}
                />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.typeMessage')}
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
