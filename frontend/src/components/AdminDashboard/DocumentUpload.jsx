import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadDocument } from '../../api/api'

const FILE_ICONS = { pdf: '📄', docx: '📝', doc: '📝', txt: '📃' }
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/plain': ['.txt'],
}

export default function DocumentUpload({ onUploaded }) {
  const [file, setFile] = useState(null)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error('Invalid file. Use PDF, DOCX, or TXT (max 10MB)')
      return
    }
    setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setProgress(0)

    try {
      await uploadDocument(file, description, setProgress)
      toast.success(`"${file.name}" uploaded and processing started!`)
      setFile(null)
      setDescription('')
      setProgress(0)
      onUploaded?.()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const ext = file?.name.split('.').pop()?.toLowerCase()

  return (
    <div className="glass-card p-6 space-y-5">
      <h2 className="text-lg font-semibold text-white">Upload Document</h2>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-white/20 hover:border-blue-500/50 hover:bg-white/5'
          }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <span className="text-4xl">{FILE_ICONS[ext] || '📄'}</span>
            <div>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-white/40 text-sm mt-1">
                {(file.size / 1024).toFixed(1)} KB • {ext?.toUpperCase()}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null) }}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <X size={12} /> Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/50">
            <Upload size={32} className={isDragActive ? 'text-blue-400' : ''} />
            <div>
              <p className="font-medium text-white/70">
                {isDragActive ? 'Drop file here' : 'Drag & drop or click to select'}
              </p>
              <p className="text-sm mt-1">PDF, DOCX, TXT • Max 10MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-white/60 mb-2">Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., B.Tech 2025-26 Admission Brochure"
          className="input-field w-full"
        />
      </div>

      {/* Upload progress */}
      {uploading && (
        <div>
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Upload size={16} />
        {uploading ? 'Uploading...' : 'Upload & Process'}
      </button>

      {/* Tips */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300/70 space-y-1">
        <p className="font-medium text-blue-300">Tips for best results:</p>
        <p>• Use clear, searchable PDFs (not scanned images)</p>
        <p>• Include admission brochures, fee structures, syllabi</p>
        <p>• One document per upload for better tracking</p>
      </div>
    </div>
  )
}
