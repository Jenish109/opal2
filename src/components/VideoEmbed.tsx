'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface VideoEmbedProps {
  videoId: string
  title: string
}

export function VideoEmbed({ videoId, title }: VideoEmbedProps) {
  const [copied, setCopied] = useState(false)
  const embedCodeRef = useRef<HTMLInputElement>(null)

  const embedCode = `<iframe
  width="560"
  height="315"
  src="${process.env.NEXT_PUBLIC_APP_URL}/embed/${videoId}"
  title="${title}"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
></iframe>`

  const handleCopy = () => {
    if (embedCodeRef.current) {
      embedCodeRef.current.select()
      document.execCommand('copy')
      setCopied(true)
      toast.success('Embed code copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Embed Video</h3>
      <div className="flex gap-2">
        <Input
          ref={embedCodeRef}
          value={embedCode}
          readOnly
          className="font-mono text-sm"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-sm text-gray-500">
        Copy and paste this code into your email or website to embed the video.
      </p>
    </div>
  )
} 