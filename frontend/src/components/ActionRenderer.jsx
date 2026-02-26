import { useState } from 'react'
import {
  ClipboardList, ChevronRight, ChevronDown, ExternalLink,
  Bell, Check, Loader2, Send
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { submitAction } from '../api'

export default function ActionRenderer({ action, chatbotId, sessionId, onSubmitted }) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  if (!action) return null

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await submitAction({
        chatbot_id: chatbotId,
        action_id: action.action_id,
        session_id: sessionId,
        form_data: formData,
      })
      setSubmitted(true)
      onSubmitted?.(res.data.data)
    } catch (err) {
      alert(t('actionRenderer.submissionFailed') + (err.response?.data?.detail || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  // SHOW_FORM
  if (action.action_type === 'SHOW_FORM') {
    if (submitted) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="font-medium text-green-800">{t('actionRenderer.submittedSuccess')}</div>
            <div className="text-sm text-green-600">
              {t('actionRenderer.formReceived', { name: action.action_name || 'form' })}
            </div>
          </div>
        </div>
      )
    }

    const fields = action.data?.fields || [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'phone', label: 'Phone', type: 'text', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'details', label: 'Details', type: 'textarea', required: false },
    ]

    return (
      <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 flex items-center gap-2 border-b border-blue-200">
          <ClipboardList className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-800">
            {action.action_name || t('actionRenderer.reservationForm')}
          </span>
        </div>
        <form onSubmit={handleFormSubmit} className="p-4 space-y-3">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              ) : field.type === 'select' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('actionRenderer.select')}</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {t('common.submit')}
          </button>
        </form>
      </div>
    )
  }

  // SHOW_GUIDE
  if (action.action_type === 'SHOW_GUIDE') {
    const steps = action.data?.steps || [
      { title: 'Step 1', content: 'Follow this step' },
    ]

    return (
      <div className="bg-white border border-amber-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-amber-50 px-4 py-3 flex items-center gap-2 border-b border-amber-200">
          <ClipboardList className="w-5 h-5 text-amber-600" />
          <span className="font-semibold text-amber-800">
            {action.action_name || t('actionRenderer.stepByStepGuide')}
          </span>
        </div>
        <div className="p-4 space-y-2">
          {steps.map((step, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                currentStep === idx
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx < currentStep
                      ? 'bg-green-500 text-white'
                      : currentStep === idx
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-300 text-white'
                  }`}
                >
                  {idx < currentStep ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className="font-medium text-sm text-gray-800">{step.title}</span>
                {currentStep === idx ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                )}
              </div>
              {currentStep === idx && (
                <div className="mt-2 ml-8 text-sm text-gray-600">{step.content}</div>
              )}
            </div>
          ))}
          {currentStep < steps.length - 1 && (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="w-full py-2 mt-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium"
            >
              {t('actionRenderer.nextStep')}
            </button>
          )}
          {currentStep === steps.length - 1 && (
            <div className="text-center text-sm text-green-600 font-medium py-2">
              {t('actionRenderer.guideComplete')}
            </div>
          )}
        </div>
      </div>
    )
  }

  // REDIRECT
  if (action.action_type === 'REDIRECT') {
    return (
      <a
        href={action.data?.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-white border border-purple-200 rounded-xl p-4 hover:bg-purple-50 transition-colors"
      >
        <ExternalLink className="w-5 h-5 text-purple-600" />
        <span className="font-medium text-purple-800">
          {action.data?.label || action.action_name || t('actionRenderer.openLink')}
        </span>
      </a>
    )
  }

  // NOTIFY
  if (action.action_type === 'NOTIFY') {
    return (
      <div className="bg-white border border-teal-200 rounded-xl p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
          <Bell className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <div className="font-medium text-teal-800">{t('actionRenderer.notificationSent')}</div>
          <div className="text-sm text-teal-600">
            {action.data?.message || t('actionRenderer.personNotified')}
          </div>
        </div>
      </div>
    )
  }

  return null
}
