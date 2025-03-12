'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Progress } from './ui/progress'
import { Button } from './ui/button'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
const ALLOWED_FILE_TYPES = ['video/mp4']

interface VideoUploadProps {
  onUploadComplete: (videoData: any) => void
  workspaceId?: string
  folderId?: string
}

export function VideoUpload({ onUploadComplete, workspaceId, folderId }: VideoUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    
    if (!file) return

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Only MP4 files are supported')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 500MB')
      return
    }

    setSelectedFile(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4']
    },
    maxFiles: 1
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      
      // Get presigned URL
      const { data: { uploadUrl, key } } = await axios.post('/api/videos/upload-url', {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        workspaceId,
        folderId
      })

      // Upload to S3
      await axios.put(uploadUrl, selectedFile, {
        headers: {
          'Content-Type': selectedFile.type
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.loaded / progressEvent.total
          setUploadProgress(Math.round(progress * 100))
        }
      })

      // Create video record
      const { data: video } = await axios.post('/api/videos', {
        key,
        title: selectedFile.name,
        workspaceId,
        folderId
      })

      toast.success('Video uploaded successfully')
      onUploadComplete(video)
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload video')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setSelectedFile(null)
    }
  }

  const cancelUpload = () => {
    setSelectedFile(null)
    setUploadProgress(0)
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Drag and drop a video file here, or click to select
          </p>
          <p className="text-xs text-gray-500 mt-1">
            MP4 format only, max 500MB
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="truncate flex-1">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {Math.round(selectedFile.size / 1024 / 1024)}MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelUpload}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-gray-500 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {!uploading && (
            <Button
              className="w-full"
              onClick={handleUpload}
            >
              Upload Video
            </Button>
          )}
        </div>
      )}
    </div>
  )
} 