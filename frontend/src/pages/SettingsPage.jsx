import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff, Save, Trash2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getApiKeys, updateApiKeys, deleteApiKey } from '../api'

const PROVIDERS = [
  {
    key: 'claude',
    name: 'Anthropic Claude',
    placeholder: 'sk-ant-api...',
    color: 'bg-orange-50 border-orange-200',
    iconColor: 'text-orange-600',
    link: 'https://console.anthropic.com/settings/keys',
  },
  {
    key: 'openai',
    name: 'OpenAI',
    placeholder: 'sk-...',
    color: 'bg-green-50 border-green-200',
    iconColor: 'text-green-600',
    link: 'https://platform.openai.com/api-keys',
  },
  {
    key: 'gemini',
    name: 'Google Gemini',
    placeholder: 'AI...',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    link: 'https://aistudio.google.com/app/apikey',
  },
]

export default function SettingsPage() {
  const { t } = useTranslation()
  const [savedKeys, setSavedKeys] = useState({})
  const [formKeys, setFormKeys] = useState({ claude: '', openai: '', gemini: '' })
  const [showKeys, setShowKeys] = useState({ claude: false, openai: false, gemini: false })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      const res = await getApiKeys()
      setSavedKeys(res.data.data)
    } catch (err) {
      console.error('Failed to fetch API keys', err)
    }
  }

  const handleSave = async () => {
    const keysToUpdate = {}
    for (const [provider, value] of Object.entries(formKeys)) {
      if (value.trim()) {
        keysToUpdate[provider] = value.trim()
      }
    }

    if (Object.keys(keysToUpdate).length === 0) {
      setMessage({ type: 'error', text: t('settings.enterKeyToSave') })
      return
    }

    setSaving(true)
    try {
      await updateApiKeys(keysToUpdate)
      setFormKeys({ claude: '', openai: '', gemini: '' })
      setShowKeys({ claude: false, openai: false, gemini: false })
      await fetchKeys()
      setMessage({ type: 'success', text: t('settings.keySaved') })
    } catch (err) {
      setMessage({ type: 'error', text: t('settings.saveFailed') + (err.response?.data?.detail || err.message) })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (provider) => {
    const providerName = PROVIDERS.find(p => p.key === provider)?.name
    if (!confirm(t('settings.confirmDeleteKey', { provider: providerName }))) return
    try {
      await deleteApiKey(provider)
      await fetchKeys()
      setMessage({ type: 'success', text: t('settings.keyDeleted') })
    } catch (err) {
      setMessage({ type: 'error', text: t('settings.deleteFailed') })
    }
  }

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Toast Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success'
            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />
          }
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {PROVIDERS.map((provider) => {
          const saved = savedKeys[provider.key]
          return (
            <div
              key={provider.key}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden`}
            >
              <div className={`px-6 py-4 ${provider.color} border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className={`w-5 h-5 ${provider.iconColor}`} />
                    <h3 className="font-semibold text-gray-800">{provider.name}</h3>
                  </div>
                  {saved?.is_set ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      {t('settings.configured')}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {t('settings.notConfigured')}
                    </span>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 space-y-3">
                {/* Current key status */}
                {saved?.is_set && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-xs text-gray-500">{t('settings.currentKey')}</span>
                      <p className="text-sm font-mono text-gray-700">{saved.masked_key}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(provider.key)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      title={t('settings.deleteApiKey')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Input new key */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {saved?.is_set ? t('settings.replaceKey') : t('settings.enterApiKey')}
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys[provider.key] ? 'text' : 'password'}
                      value={formKeys[provider.key]}
                      onChange={(e) => setFormKeys({ ...formKeys, [provider.key]: e.target.value })}
                      placeholder={provider.placeholder}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys({ ...showKeys, [provider.key]: !showKeys[provider.key] })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showKeys[provider.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <a
                    href={provider.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-600 mt-1 inline-block"
                  >
                    {t('settings.getApiKey')} &rarr;
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('common.save')}
        </button>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('settings.priorityTitle')}</h4>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>{t('settings.priority1')}</li>
          <li>{t('settings.priority2')}</li>
          <li>{t('settings.priority3')}</li>
        </ol>
      </div>
    </div>
  )
}
