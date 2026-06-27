import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

// Chat APIs
export const sendMessage = (sessionId, message, language) =>
  api.post('/chat/', { session_id: sessionId, message, language })

export const getChatHistory = (sessionId) =>
  api.get(`/chat/${sessionId}/history`)

export const clearSession = (sessionId) =>
  api.delete(`/chat/${sessionId}`)

// Document APIs
export const getDocuments = () =>
  api.get('/documents/')

export const uploadDocument = (file, description, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  if (description) formData.append('description', description)
  return api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  })
}

export const deleteDocument = (docId) =>
  api.delete(`/documents/${docId}`)

export const reprocessDocument = (docId) =>
  api.put(`/documents/${docId}/reprocess`)

export const getHealth = () =>
  api.get('/health')

export default api
