import { useState } from 'react'
import { Plus, Trash2, Zap, Edit2, Check, X } from 'lucide-react'
import { createAction, updateAction, deleteAction } from '../api'

const ACTION_TYPES = [
  { value: 'SHOW_FORM', label: 'Show Form', desc: 'Display a form for user input (e.g., reservation)' },
  { value: 'SHOW_GUIDE', label: 'Show Guide', desc: 'Display step-by-step guide cards' },
  { value: 'REDIRECT', label: 'Redirect', desc: 'Direct user to a specific URL' },
  { value: 'NOTIFY', label: 'Notify', desc: 'Send notification to a person in charge' },
]

const DEFAULT_CONFIGS = {
  SHOW_FORM: {
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'phone', label: 'Phone', type: 'text', required: true },
      { name: 'date', label: 'Preferred Date', type: 'date', required: true },
      { name: 'time', label: 'Preferred Time', type: 'select', options: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'], required: true },
      { name: 'address', label: 'Address', type: 'text', required: true },
      { name: 'details', label: 'Details', type: 'textarea', required: false },
    ],
  },
  SHOW_GUIDE: {
    steps: [
      { title: 'Step 1', content: 'First step description' },
      { title: 'Step 2', content: 'Second step description' },
      { title: 'Step 3', content: 'Third step description' },
    ],
  },
  REDIRECT: { url: 'https://example.com', label: 'Open Link' },
  NOTIFY: { message: 'Customer needs assistance', recipient: 'manager' },
}

export default function ActionEditor({ chatbotId, actions, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    action_type: 'SHOW_FORM',
    trigger_keywords: '',
    description: '',
    config: DEFAULT_CONFIGS.SHOW_FORM,
  })

  const resetForm = () => {
    setForm({
      name: '',
      action_type: 'SHOW_FORM',
      trigger_keywords: '',
      description: '',
      config: DEFAULT_CONFIGS.SHOW_FORM,
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleTypeChange = (type) => {
    setForm({ ...form, action_type: type, config: DEFAULT_CONFIGS[type] })
  }

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateAction(editingId, form)
      } else {
        await createAction({ ...form, chatbot_id: chatbotId })
      }
      resetForm()
      onUpdate()
    } catch (err) {
      alert('Failed to save action: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this action?')) return
    try {
      await deleteAction(id)
      onUpdate()
    } catch (err) {
      alert('Failed to delete action')
    }
  }

  const startEdit = (action) => {
    setForm({
      name: action.name,
      action_type: action.action_type,
      trigger_keywords: action.trigger_keywords,
      description: action.description,
      config: action.config || DEFAULT_CONFIGS[action.action_type],
    })
    setEditingId(action.id)
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          <Zap className="w-4 h-4" />
          Actions ({actions.length})
        </h3>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <Plus className="w-4 h-4" /> Add Action
          </button>
        )}
      </div>

      {/* Action List */}
      {actions.map((action) => (
        <div key={action.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-800">{action.name}</span>
              <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                {action.action_type}
              </span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => startEdit(action)}
                className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(action.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {action.trigger_keywords && (
            <div className="mt-1 text-xs text-gray-500">
              Keywords: {action.trigger_keywords}
            </div>
          )}
        </div>
      ))}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-3">
          <div className="text-sm font-semibold text-blue-800">
            {editingId ? 'Edit Action' : 'New Action'}
          </div>

          <input
            type="text"
            placeholder="Action Name (e.g., Technician Reservation)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={form.action_type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            {ACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label} - {t.desc}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Trigger Keywords (comma separated, e.g., reservation,book,schedule)"
            value={form.trigger_keywords}
            onChange={(e) => setForm({ ...form, trigger_keywords: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            placeholder="Description (when should this action trigger?)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />

          {/* Config editor for SHOW_FORM */}
          {form.action_type === 'SHOW_FORM' && (
            <div className="bg-white p-3 rounded border border-gray-200">
              <div className="text-xs font-medium text-gray-600 mb-2">Form Fields (JSON)</div>
              <textarea
                value={JSON.stringify(form.config, null, 2)}
                onChange={(e) => {
                  try {
                    setForm({ ...form, config: JSON.parse(e.target.value) })
                  } catch {}
                }}
                rows={6}
                className="w-full px-2 py-1 border border-gray-200 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Config editor for SHOW_GUIDE */}
          {form.action_type === 'SHOW_GUIDE' && (
            <div className="bg-white p-3 rounded border border-gray-200">
              <div className="text-xs font-medium text-gray-600 mb-2">Guide Steps (JSON)</div>
              <textarea
                value={JSON.stringify(form.config, null, 2)}
                onChange={(e) => {
                  try {
                    setForm({ ...form, config: JSON.parse(e.target.value) })
                  } catch {}
                }}
                rows={6}
                className="w-full px-2 py-1 border border-gray-200 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Config editor for REDIRECT */}
          {form.action_type === 'REDIRECT' && (
            <div className="bg-white p-3 rounded border border-gray-200 space-y-2">
              <input
                type="text"
                placeholder="Redirect URL"
                value={form.config?.url || ''}
                onChange={(e) => setForm({ ...form, config: { ...form.config, url: e.target.value } })}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Button Label"
                value={form.config?.label || ''}
                onChange={(e) => setForm({ ...form, config: { ...form.config, label: e.target.value } })}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
