import { VideoPlayer } from '@/components/VideoPlayer'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

interface EmbedPageProps {
  params: {
    videoId: string
  }
}

export default async function EmbedPage({ params }: EmbedPageProps) {
  const video = await prisma.video.findUnique({
    where: {
      id: params.videoId,
    },
    include: {
      callToAction: true,
    },
  })

  if (!video) {
    notFound()
  }

  // Construct video URL from S3 key
  // const videoUrl = `${process.env.NEXT_PUBLIC_CDN_URL}/${video.source}`

  return (
    <div className="w-full h-screen bg-black">
      <VideoPlayer
        src={video.source}
        poster={video.thumbnail || undefined}
        videoId={video.id}
        callToAction={video.callToAction || undefined}
        onAnalytics={async (data) => {
          // Track analytics in the background
          try {
            await fetch(`/api/videos/${video.id}/analytics`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            })
          } catch (error) {
            console.error('Failed to track analytics:', error)
          }
        }}
      />
    </div>
  )
} 