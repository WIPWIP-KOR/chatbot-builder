import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

// Chatbot APIs
export const listChatbots = () => api.get('/chatbots')
export const getChatbot = (id) => api.get(`/chatbots/${id}`)
export const createChatbot = (data) => api.post('/chatbots', data)
export const updateChatbot = (id, data) => api.put(`/chatbots/${id}`, data)
export const deleteChatbot = (id) => api.delete(`/chatbots/${id}`)
export const listProviders = () => api.get('/chatbots/providers/list')
export const getChatbotByShareToken = (token) => api.get(`/chatbots/share/${token}`)

// Document APIs
export const uploadDocument = (chatbotId, file) => {
  const formData = new FormData()
  formData.append('chatbot_id', chatbotId)
  formData.append('file', file)
  return api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export const listDocuments = (chatbotId) => api.get(`/documents/${chatbotId}`)
export const deleteDocument = (id) => api.delete(`/documents/${id}`)

// Action APIs
export const listActions = (chatbotId) => api.get(`/actions/${chatbotId}`)
export const createAction = (data) => api.post('/actions', data)
export const updateAction = (id, data) => api.put(`/actions/${id}`, data)
export const deleteAction = (id) => api.delete(`/actions/${id}`)
export const submitAction = (data) => api.post('/actions/submit', data)

// Chat APIs
export const sendMessage = (data) => api.post('/chat', data)
export const getChatHistory = (chatbotId, sessionId) =>
  api.get(`/chat/history/${chatbotId}/${sessionId}`)

// Settings APIs
export const getApiKeys = () => api.get('/settings/api-keys')
export const updateApiKeys = (keys) => api.put('/settings/api-keys', { keys })
export const deleteApiKey = (provider) => api.delete(`/settings/api-keys/${provider}`)

export default api
