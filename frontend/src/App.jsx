import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Bot, Settings, MessageSquare, Key, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import BuilderPage from './pages/BuilderPage'
import ChatPage from './pages/ChatPage'
import SharedChatPage from './pages/SharedChatPage'
import SettingsPage from './pages/SettingsPage'

function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const toggleLang = () => {
    const next = i18n.language === 'ko' ? 'en' : 'ko'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }
  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
    >
      <Globe className="w-4 h-4" />
      {i18n.language === 'ko' ? 'EN' : '한국어'}
    </button>
  )
}

function App() {
  const location = useLocation()
  const { t } = useTranslation()
  const isChatPage = location.pathname.startsWith('/chat/')
  const isSharedChatPage = location.pathname.startsWith('/s/')

  if (isChatPage) {
    return <ChatPage />
  }

  if (isSharedChatPage) {
    return <SharedChatPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Bot className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">{t('header.title')}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {t('header.badge')}
              </span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                to="/"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === '/'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                {t('header.builder')}
              </Link>
              <Link
                to="/settings"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === '/settings'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                <Key className="w-4 h-4" />
                {t('header.apiKeys')}
              </Link>
              <LanguageSwitcher />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<BuilderPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
