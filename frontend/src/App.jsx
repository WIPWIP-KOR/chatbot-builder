import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Bot, Settings, MessageSquare } from 'lucide-react'
import BuilderPage from './pages/BuilderPage'
import ChatPage from './pages/ChatPage'

function App() {
  const location = useLocation()
  const isChatPage = location.pathname.startsWith('/chat/')

  if (isChatPage) {
    return <ChatPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Bot className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Chatbot Builder</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                FutureGen Commerce
              </span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Builder
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<BuilderPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
