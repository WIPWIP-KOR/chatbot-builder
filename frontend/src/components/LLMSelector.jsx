import { useState, useEffect } from 'react'
import { Cpu, Key, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getApiKeys } from '../api'

const PROVIDERS = {
  claude: {
    name: 'Anthropic Claude',
    models: ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001'],
    requiresApiKey: true,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  openai: {
    name: 'OpenAI GPT',
    models: ['gpt-4o', 'gpt-4o-mini'],
    requiresApiKey: true,
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  gemini: {
    name: 'Google Gemini',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    requiresApiKey: true,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  ollama: {
    name: 'Ollama (Local)',
    models: ['llama3', 'mistral', 'gemma3'],
    requiresApiKey: false,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
}

export default function LLMSelector({ provider, model, apiKey, onChange }) {
  const { t } = useTranslation()
  const [showKey, setShowKey] = useState(false)
  const [globalKeys, setGlobalKeys] = useState({})
  const currentProvider = PROVIDERS[provider] || PROVIDERS.claude

  useEffect(() => {
    getApiKeys()
      .then((res) => setGlobalKeys(res.data.data))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700">
        <Cpu className="w-4 h-4 inline mr-1" />
        {t('llm.provider')}
      </label>

      {/* Provider Selection */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(PROVIDERS).map(([key, info]) => (
          <button
            key={key}
            type="button"
            onClick={() =>
              onChange({
                llm_provider: key,
                llm_model: info.models[0],
                api_key: key === provider ? apiKey : '',
              })
            }
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              provider === key
                ? `${info.color} border-current font-semibold shadow-sm`
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-medium">{info.name}</div>
            <div className="text-xs mt-0.5 opacity-70">
              {t('llm.models', { count: info.models.length })}
            </div>
          </button>
        ))}
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">{t('llm.model')}</label>
        <select
          value={model}
          onChange={(e) => onChange({ llm_model: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          {currentProvider.models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* API Key */}
      {currentProvider.requiresApiKey && (
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            <Key className="w-3.5 h-3.5 inline mr-1" />
            {t('llm.apiKey')}
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey || ''}
              onChange={(e) => onChange({ api_key: e.target.value })}
              placeholder={t('llm.enterApiKeyFor', { name: currentProvider.name })}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {globalKeys[provider]?.is_set ? (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {t('llm.globalKeySet')}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">
              {t('llm.botSpecificKey')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
