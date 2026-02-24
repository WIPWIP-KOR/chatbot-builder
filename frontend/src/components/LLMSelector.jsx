import { useState, useEffect } from 'react'
import { Cpu, Key, Eye, EyeOff } from 'lucide-react'

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
  const [showKey, setShowKey] = useState(false)
  const currentProvider = PROVIDERS[provider] || PROVIDERS.claude

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700">
        <Cpu className="w-4 h-4 inline mr-1" />
        LLM Provider
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
              {info.models.length} models
            </div>
          </button>
        ))}
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Model</label>
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
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey || ''}
              onChange={(e) => onChange({ api_key: e.target.value })}
              placeholder={`Enter ${currentProvider.name} API Key`}
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
          <p className="text-xs text-gray-400 mt-1">
            Key is stored for this chatbot only. Leave empty to use environment variable.
          </p>
        </div>
      )}
    </div>
  )
}
