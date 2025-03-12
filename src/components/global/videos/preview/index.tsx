'use client'
import { getPreviewVideo, sendEmailForFirstView } from '@/actions/workspace'
import { useQueryData } from '@/hooks/useQueryData'
import { VideoProps } from '@/types/index.type'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import CopyLink from '../copy-link'
import RichLink from '../rich-link'
import { truncateString } from '@/lib/utils'
import { Download } from 'lucide-react'
import TabMenu from '../../tabs'
import AiTools from '../../ai-tools'
import VideoTranscript from '../../video-transcript'
import { TabsContent } from '@/components/ui/tabs'
import Activities from '../../activities'
import EditVideo from '../edit'
import { toast } from 'sonner'
import ReactPlayer from 'react-player'

type Props = {
  videoId: string
}

const VideoPreview = ({ videoId }: Props) => {
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const playerRef = useRef<ReactPlayer>(null)

  const { data } = useQueryData(['preview-video'], () =>
    getPreviewVideo(videoId)
  )

  const notifyFirstView = async () => await sendEmailForFirstView(videoId)

  // Check if data exists and has the expected structure
  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  const { data: video, status, author } = data as VideoProps
  if (status !== 200) {
    router.push('/')
    return null
  }

  const daysAgo = Math.floor(
    (new Date().getTime() - new Date(video.createdAt).getTime()) / (24 * 60 * 60 * 1000)
  )

  useEffect(() => {
    // Check if video exists before accessing its properties
    if (video && video.views === 0) {
      notifyFirstView()
    }

    // Cleanup function
    return () => {
      // if (playerRef?.current != null) {
      //   playerRef?.current.getInternalPlayer().pause();
      //   playerRef.current.getInternalPlayer().src = ""
      // }
    }
  }, [video])

  // Get video source URL
  const videoUrl = video.source?.startsWith('http')
    ? video.source
    : process.env.NEXT_PUBLIC_CLOUD_FRONT_STREAM_URL
      ? `${process.env.NEXT_PUBLIC_CLOUD_FRONT_STREAM_URL}/${video.source}`
      : `/uploads/${video.source}`

  // Debug log
  useEffect(() => {
    console.log("Video URL:", videoUrl)
  }, [videoUrl])

  const handleVideoError = (e: any) => {
    console.error("Video error:", e)
    setError('Failed to load video. Please try again later.')
    setIsLoading(false)
    toast.error('Failed to load video')
  }

  const handleVideoReady = () => {
    setIsLoading(false)
    setError(null)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 lg:py-10 overflow-y-auto gap-5">
      <div className="flex flex-col lg:col-span-2 gap-y-10">
        <div>
          <div className="flex gap-x-5 items-start justify-between">
            <h2 className="text-white text-4xl font-bold">{video.title}</h2>
            {author ? (
              <EditVideo
                videoId={videoId}
                title={video.title as string}
                description={video.description as string}
              />
            ) : null}
          </div>
          <span className="flex gap-x-3 mt-2">
            <p className="text-[#9D9D9D] capitalize">
              {video.User?.firstname} {video.User?.lastname}
            </p>
            <p className="text-[#707070]">
              {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
            </p>
          </span>
        </div>
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-red-500">
              {error}
            </div>
          )}
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            width="100%"
            height="100%"
            playing={isPlaying}
            controls={true}
            playsinline
            onError={handleVideoError}
            onReady={handleVideoReady}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload',
                },
              },
            }}
            style={{ backgroundColor: 'black' }}
          />
        </div>
        <div className="flex flex-col text-2xl gap-y-4">
          <div className="flex gap-x-5 items-center justify-between">
            <p className="text-[#BDBDBD] text-semibold">Description</p>
            {author ? (
              <EditVideo
                videoId={videoId}
                title={video.title as string}
                description={video.description as string}
              />
            ) : null}
          </div>
          <p className="text-[#9D9D9D] text-lg text-medium">
            {video.description || 'No description available'}
          </p>
        </div>
      </div>
      <div className="lg:col-span-1 flex flex-col gap-y-16">
        <div className="flex justify-end gap-x-3 items-center">
          <CopyLink
            variant="outline"
            className="rounded-full bg-transparent px-10"
            videoId={videoId}
          />
          <RichLink
            description={truncateString(video.description as string || '', 150)}
            id={videoId}
            source={video.source}
            title={video.title as string}
          />
          <Download className="text-[#4d4c4c]" />
        </div>
        <div>
          <TabMenu
            defaultValue="Ai tools"
            triggers={['Ai tools', 'Transcript', 'Activity']}
          >
            <TabsContent value="Ai tools">
              <AiTools
                videoId={videoId}
                trial={video.User?.trial!}
                plan={video.User?.subscription?.plan!}
              />
            </TabsContent>
            <TabsContent value="Transcript">
              <VideoTranscript transcript={video.summery || ''} />
            </TabsContent>
            <TabsContent value="Activity">
              <Activities
                author={video.User?.firstname as string || 'User'}
                videoId={videoId}
              />
            </TabsContent>
          </TabMenu>
        </div>
      </div>
    </div>
  )
}

export default VideoPreview