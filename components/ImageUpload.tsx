"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusIcon, DeleteIcon, ImageIcon, EyeIcon, CloseIcon } from "@/components/AppIcon"

interface ImageUploadProps {
  value?: File | string | null
  onChange?: (file: File | null) => void
  label?: string
  error?: string
  className?: string
  accept?: string
}

export default function ImageUpload({
  value,
  onChange,
  label,
  error,
  className = "",
  accept = "image/*"
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>("")
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update preview when value changes
  const updatePreview = (fileOrUrl: File | string | null | undefined) => {
    if (!fileOrUrl) {
      setPreview("")
      return
    }

    if (typeof fileOrUrl === "string") {
      setPreview(fileOrUrl)
    } else if (fileOrUrl instanceof File) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(fileOrUrl)
    }
  }

  // Initialize preview on mount and when value changes
  useEffect(() => {
    updatePreview(value)
  }, [value])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      updatePreview(file)
      onChange?.(file)
    }
  }

  const handleRemove = () => {
    setPreview("")
    onChange?.(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="flex">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border border-gray-300"
            />
            <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full p-2 h-8 w-8"
                onClick={() => setShowPreviewModal(true)}
              >
                <EyeIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="rounded-full p-2 h-8 w-8"
                onClick={handleRemove}
              >
                <DeleteIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={handleClick}
            className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 dark:bg-gray-800"
          >
            <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500">Upload</span>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowPreviewModal(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 rounded-full p-2 h-8 w-8"
              onClick={() => setShowPreviewModal(false)}
            >
              <CloseIcon className="h-4 w-4" />
            </Button>
            <img
              src={preview}
              alt="Full preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
