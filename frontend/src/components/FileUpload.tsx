import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { calculateFileHash, formatFileSize, truncateHash } from '../utils/hash'
import { FileInfo } from '../types'

interface FileUploadProps {
  onFileSelect: (fileInfo: FileInfo) => void
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    setIsProcessing(true)
    setError(null)

    try {
      const hash = await calculateFileHash(file)
      const info: FileInfo = {
        name: file.name,
        size: file.size,
        type: file.type || 'unknown',
        hash
      }
      setFileInfo(info)
      onFileSelect(info)
    } catch (err) {
      setError('Failed to process file. Please try again.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      await processFile(files[0])
    }
  }

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await processFile(files[0])
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleRemove = () => {
    setFileInfo(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {!fileInfo ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
            ${isDragging 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            onChange={handleChange}
            className="hidden"
          />
          
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Processing file...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Click or drag file to upload</p>
                <p className="text-gray-500 text-sm mt-1">点击或拖拽文件上传</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">{fileInfo.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(fileInfo.size)}</p>
              </div>
            </div>
            <button onClick={handleRemove} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">SHA-256 Hash</p>
            <p className="font-mono text-sm text-gray-700 break-all">{fileInfo.hash}</p>
            <p className="font-mono text-xs text-gray-400 mt-1">{truncateHash(fileInfo.hash, 20, 16)}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}