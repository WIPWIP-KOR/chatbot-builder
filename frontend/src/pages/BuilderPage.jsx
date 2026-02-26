import { useState, useEffect } from 'react'
import {
  Plus, Bot, Trash2, FileText, Upload, X, MessageSquare,
  ChevronRight, Power, PowerOff, RefreshCw, ExternalLink, Link2, Copy
} from 'lucide-react'
import {
  listChatbots, createChatbot, getChatbot, updateChatbot, deleteChatbot,
  uploadDocument, listDocuments, deleteDocument, listActions
} from '../api'
import LLMSelector from '../components/LLMSelector'
import ActionEditor from '../components/ActionEditor'

export default function BuilderPage() {
  const [chatbots, setChatbots] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedBot, setSelectedBot] = useState(null)
  const [documents, setDocuments] = useState([])
  const [actions, setActions] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    department: '',
    description: '',
    llm_provider: 'claude',
    llm_model: 'claude-sonnet-4-5-20250929',
    api_key: '',
  })
  const [editForm, setEditForm] = useState({})
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchChatbots()
  }, [])

  useEffect(() => {
    if (selectedId) {
      fetchChatbotDetail(selectedId)
    }
  }, [selectedId])

  const fetchChatbots = async () => {
    try {
      const res = await listChatbots()
      setChatbots(res.data.data)
    } catch (err) {
      console.error('Failed to fetch chatbots', err)
    }
  }

  const fetchChatbotDetail = async (id) => {
    try {
      const [botRes, docsRes, actionsRes] = await Promise.all([
        getChatbot(id),
        listDocuments(id),
        listActions(id),
      ])
      const bot = botRes.data.data
      setSelectedBot(bot)
      setDocuments(docsRes.data.data)
      setActions(actionsRes.data.data)
      setEditForm({
        name: bot.name,
        department: bot.department || '',
        description: bot.description || '',
        system_prompt: bot.system_prompt || '',
        llm_provider: bot.llm_provider,
        llm_model: bot.llm_model,
        api_key: '',
        is_active: bot.is_active,
      })
    } catch (err) {
      console.error('Failed to fetch chatbot detail', err)
    }
  }

  const handleCreate = async () => {
    if (!createForm.name) return
    try {
      await createChatbot(createForm)
      setShowCreateForm(false)
      setCreateForm({
        name: '', department: '', description: '',
        llm_provider: 'claude', llm_model: 'claude-sonnet-4-5-20250929', api_key: '',
      })
      fetchChatbots()
    } catch (err) {
      alert('Failed to create chatbot: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleUpdate = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      const data = { ...editForm }
      if (!data.api_key) delete data.api_key
      await updateChatbot(selectedId, data)
      fetchChatbots()
      fetchChatbotDetail(selectedId)
    } catch (err) {
      alert('Failed to update chatbot')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this chatbot?')) return
    try {
      await deleteChatbot(id)
      if (selectedId === id) {
        setSelectedId(null)
        setSelectedBot(null)
      }
      fetchChatbots()
    } catch (err) {
      alert('Failed to delete chatbot')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !selectedId) return
    setUploading(true)
    try {
      await uploadDocument(selectedId, file)
      fetchChatbotDetail(selectedId)
    } catch (err) {
      alert('Failed to upload: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteDoc = async (docId) => {
    try {
      await deleteDocument(docId)
      fetchChatbotDetail(selectedId)
    } catch (err) {
      alert('Failed to delete document')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex gap-6">
        {/* Left Sidebar - Chatbot List */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">My Chatbots</h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Create New Chatbot"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
              <div className="p-4 bg-blue-50 border-b border-blue-200 space-y-3">
                <input
                  type="text"
                  placeholder="Chatbot Name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Department (e.g., CS, HR, Sales)"
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
                <LLMSelector
                  provider={createForm.llm_provider}
                  model={createForm.llm_model}
                  apiKey={createForm.api_key}
                  onChange={(changes) => setCreateForm({ ...createForm, ...changes })}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!createForm.name}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            {/* Chatbot List */}
            <div className="divide-y divide-gray-100 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {chatbots.length === 0 && !showCreateForm && (
                <div className="p-6 text-center text-gray-400 text-sm">
                  No chatbots yet. Click + to create one.
                </div>
              )}
              {chatbots.map((bot) => (
                <div
                  key={bot.id}
                  onClick={() => setSelectedId(bot.id)}
                  className={`p-3 cursor-pointer transition-colors flex items-center gap-3 ${
                    selectedId === bot.id
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    bot.is_active ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Bot className={`w-5 h-5 ${bot.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-sm truncate">{bot.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      {bot.department && <span>{bot.department}</span>}
                      <span className="text-gray-300">|</span>
                      <span>{bot.llm_provider}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Detail/Settings */}
        <div className="flex-1">
          {!selectedBot ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500">Select a chatbot to configure</h3>
              <p className="text-sm text-gray-400 mt-2">
                Or create a new one using the + button
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      editForm.is_active ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Bot className={`w-6 h-6 ${editForm.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{selectedBot.name}</h2>
                      <p className="text-sm text-gray-500">ID: {selectedBot.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/chat/${selectedId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      <MessageSquare className="w-4 h-4" /> Open Chat
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => handleDelete(selectedId)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Delete Chatbot"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Share URL */}
                {selectedBot.share_token && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                      <Link2 className="w-4 h-4" />
                      Share URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/s/${selectedBot.share_token}`}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700"
                        onClick={(e) => e.target.select()}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/s/${selectedBot.share_token}`)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Anyone with this URL can chat with this chatbot.
                    </p>
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h3 className="font-bold text-gray-800">Settings</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Chatbot Name</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
                    <input
                      type="text"
                      value={editForm.department || ''}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">System Prompt (Custom Instructions)</label>
                  <textarea
                    value={editForm.system_prompt || ''}
                    onChange={(e) => setEditForm({ ...editForm, system_prompt: e.target.value })}
                    rows={3}
                    placeholder="Additional instructions for the chatbot..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3 py-2">
                  <button
                    onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editForm.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {editForm.is_active ? (
                      <><Power className="w-4 h-4" /> Active</>
                    ) : (
                      <><PowerOff className="w-4 h-4" /> Inactive</>
                    )}
                  </button>
                </div>

                <LLMSelector
                  provider={editForm.llm_provider}
                  model={editForm.llm_model}
                  apiKey={editForm.api_key}
                  onChange={(changes) => setEditForm({ ...editForm, ...changes })}
                />

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Knowledge Base ({documents.length} documents)
                  </h3>
                  <label className={`flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload File
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>

                {documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No documents uploaded. Upload PDF, Word, or TXT files to build the knowledge base.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-800">{doc.filename}</div>
                            <div className="text-xs text-gray-500">
                              {formatFileSize(doc.file_size)} | {doc.chunk_count} chunks
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <ActionEditor
                  chatbotId={selectedId}
                  actions={actions}
                  onUpdate={() => fetchChatbotDetail(selectedId)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
