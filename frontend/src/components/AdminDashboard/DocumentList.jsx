import React, { useState } from 'react'
import { Trash2, RefreshCw, FileText, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { deleteDocument, reprocessDocument } from '../../api/api'

const STATUS_CONFIG = {
  ready: { label: 'Ready', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
  processing: { label: 'Processing', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Clock },
  error: { label: 'Error', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle },
}

const FILE_EMOJI = { pdf: '📄', docx: '📝', doc: '📝', txt: '📃' }

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function DocumentCard({ doc, onRefresh }) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reprocessing, setReprocessing] = useState(false)
  const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.processing
  const StatusIcon = status.icon

  const handleDelete = async () => {
    if (!confirm(`Delete "${doc.original_name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await deleteDocument(doc.id)
      toast.success('Document deleted')
      onRefresh()
    } catch {
      toast.error('Failed to delete document')
      setDeleting(false)
    }
  }

  const handleReprocess = async () => {
    setReprocessing(true)
    try {
      await reprocessDocument(doc.id)
      toast.success('Reprocessing started')
      setTimeout(onRefresh, 2000)
    } catch {
      toast.error('Failed to reprocess')
    } finally {
      setReprocessing(false)
    }
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{FILE_EMOJI[doc.file_type] || '📄'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-white text-sm truncate" title={doc.original_name}>
                {doc.original_name}
              </p>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${status.bg} ${status.color}`}>
                <StatusIcon size={11} className={doc.status === 'processing' ? 'animate-spin' : ''} />
                {status.label}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
              <span>{doc.file_type.toUpperCase()}</span>
              <span>•</span>
              <span>{formatSize(doc.file_size)}</span>
              {doc.status === 'ready' && (
                <>
                  <span>•</span>
                  <span>{doc.chunk_count} chunks</span>
                </>
              )}
            </div>

            {doc.description && (
              <p className="text-xs text-white/40 mt-1 italic">{doc.description}</p>
            )}

            {doc.status === 'error' && doc.error_message && (
              <p className="text-xs text-red-400/70 mt-1 bg-red-500/5 px-2 py-1 rounded">
                {doc.error_message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <span className="text-xs text-white/30">{formatDate(doc.created_at)}</span>
          <div className="flex gap-2">
            {(doc.status === 'error' || doc.status === 'ready') && (
              <button
                onClick={handleReprocess}
                disabled={reprocessing}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Reprocess document"
              >
                <RefreshCw size={14} className={`text-white/40 hover:text-white/70 ${reprocessing ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
              title="Delete document"
            >
              <Trash2 size={14} className="text-white/40 hover:text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DocumentList({ documents, onRefresh, loading }) {
  if (loading) {
    return (
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Knowledge Base Documents</h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Knowledge Base Documents</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/40">{documents.length} documents</span>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={15} className="text-white/40 hover:text-white/70" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {documents.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: documents.length, color: 'text-blue-400' },
            { label: 'Ready', value: documents.filter(d => d.status === 'ready').length, color: 'text-green-400' },
            { label: 'Chunks', value: documents.reduce((s, d) => s + (d.chunk_count || 0), 0), color: 'text-violet-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 rounded-xl p-3 text-center">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Document cards */}
      {documents.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No documents yet</p>
          <p className="text-sm mt-1">Upload admission brochures, fee structures, etc.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {documents.map(doc => (
            <DocumentCard key={doc.id} doc={doc} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  )
}
