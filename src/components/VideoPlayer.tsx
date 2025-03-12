'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'
import { Slider } from './ui/slider'
import { cn } from '@/lib/utils'
import axios from 'axios'

interface VideoPlayerProps {
  src: string
  poster?: string
  videoId: string
  callToAction?: {
    buttonText: string
    buttonLink: string
    buttonColor: string
    textColor: string
  }
  onAnalytics?: (data: {
    watchTime: number
    watchPercentage: number
  }) => void
  className?: string
}

export function VideoPlayer({
  src,
  poster,
  videoId,
  callToAction,
  onAnalytics,
  className
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showCTA, setShowCTA] = useState(false)
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const analyticsIntervalRef = useRef<NodeJS.Timeout>()
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      
      // Show CTA near the end of the video
      if (video.duration - video.currentTime <= 10) {
        setShowCTA(true)
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setShowCTA(true)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    // Track analytics
    if (isPlaying && !analyticsIntervalRef.current) {
      startTimeRef.current = Date.now()
      analyticsIntervalRef.current = setInterval(() => {
        const watchTime = Math.floor((Date.now() - startTimeRef.current) / 1000)
        const watchPercentage = (currentTime / duration) * 100
        
        onAnalytics?.({
          watchTime,
          watchPercentage
        })
      }, 5000) // Send analytics every 5 seconds
    }

    if (!isPlaying && analyticsIntervalRef.current) {
      clearInterval(analyticsIntervalRef.current)
      analyticsIntervalRef.current = undefined
    }

    return () => {
      if (analyticsIntervalRef.current) {
        clearInterval(analyticsIntervalRef.current)
      }
    }
  }, [isPlaying, currentTime, duration, onAnalytics])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
      setVolume(isMuted ? 1 : 0)
    }
  }

  const handleProgressChange = (value: number[]) => {
    const newTime = value[0]
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 2000)
  }

  const handleCTAClick = async () => {
    if (callToAction) {
      try {
        await axios.post(`/api/videos/${videoId}/cta-click`)
      } catch (error) {
        console.error('Failed to track CTA click:', error)
      }
    }
  }

  return (
    <div 
      className={cn("relative group", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        onClick={togglePlay}
      />

      {/* Video Controls */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 transition-opacity",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        {/* Progress bar */}
        <Slider
          value={[currentTime]}
          min={0}
          max={duration}
          step={1}
          onValueChange={handleProgressChange}
          className="mb-4"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>

            <span className="text-sm text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Call to Action */}
      {showCTA && callToAction && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center p-8">
            <Button
              onClick={handleCTAClick}
              style={{
                backgroundColor: callToAction.buttonColor,
                color: callToAction.textColor
              }}
            >
              {callToAction.buttonText}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 