import React, { useState, useEffect, useCallback } from 'react'
import { Shield, Activity, Database, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import DocumentUpload from './DocumentUpload'
import DocumentList from './DocumentList'
import { getDocuments, getHealth } from '../../api/api'

export default function AdminDashboard() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDocuments()
      setDocuments(res.data)
    } catch {
      toast.error('Failed to load documents. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHealth = useCallback(async () => {
    try {
      const res = await getHealth()
      setHealth(res.data)
    } catch {
      setHealth(null)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
    fetchHealth()
    // Poll for status updates (for processing docs)
    const interval = setInterval(fetchDocuments, 8000)
    return () => clearInterval(interval)
  }, [fetchDocuments, fetchHealth])

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">Admin Dashboard</h1>
            <p className="text-xs text-white/40">Manage knowledge base documents</p>
          </div>
        </div>

        {/* Health indicator */}
        {health && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">
              {health.llm_provider === 'gemini' ? 'Gemini' : 'Groq'} Active
            </span>
          </div>
        )}
      </div>

      {/* System status banner */}
      {health && (
        <div className="mx-6 mt-4 grid grid-cols-2 gap-3">
          <div className="glass-card px-4 py-3 flex items-center gap-3">
            <Activity size={16} className="text-blue-400" />
            <div>
              <p className="text-xs text-white/40">LLM Provider</p>
              <p className="text-sm font-medium text-white capitalize">
                {health.llm_provider} {health.gemini_configured ? '✓' : health.groq_configured ? '✓' : '✗'}
              </p>
            </div>
          </div>
          <div className="glass-card px-4 py-3 flex items-center gap-3">
            <Database size={16} className="text-violet-400" />
            <div>
              <p className="text-xs text-white/40">Knowledge Base</p>
              <p className="text-sm font-medium text-white">
                {documents.filter(d => d.status === 'ready').length} docs ready
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
        <DocumentUpload onUploaded={fetchDocuments} />
        <DocumentList documents={documents} onRefresh={fetchDocuments} loading={loading} />
      </div>
    </div>
  )
}
