import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function POST(
  req: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { videoId } = params
    const { watchTime, watchPercentage } = await req.json()

    const headersList = headers()
    const ip = headersList.get('x-forwarded-for') || 'unknown'
    const country = headersList.get('x-vercel-ip-country') || 'unknown'

    // Create analytics record
    await prisma.videoAnalytics.create({
      data: {
        videoId,
        watchTime,
        watchPercentage,
        viewerIp: ip,
        viewerCountry: country,
      },
    })

    // Increment view count if this is a new view
    const existingAnalytics = await prisma.videoAnalytics.findFirst({
      where: {
        videoId,
        viewerIp: ip,
        viewedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    })

    if (!existingAnalytics) {
      await prisma.video.update({
        where: {
          id: videoId,
        },
        data: {
          views: {
            increment: 1,
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { videoId } = params

    // Get video analytics
    const analytics = await prisma.videoAnalytics.findMany({
      where: {
        videoId,
      },
      orderBy: {
        viewedAt: 'desc',
      },
    })

    // Calculate aggregate metrics
    const totalViews = await prisma.video.findUnique({
      where: {
        id: videoId,
      },
      select: {
        views: true,
      },
    })

    const averageWatchTime = analytics.reduce((acc, curr) => acc + curr.watchTime, 0) / analytics.length
    const averageWatchPercentage = analytics.reduce((acc, curr) => acc + curr.watchPercentage, 0) / analytics.length

    const viewsByCountry = analytics.reduce((acc, curr) => {
      acc[curr.viewerCountry] = (acc[curr.viewerCountry] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      totalViews: totalViews?.views || 0,
      averageWatchTime,
      averageWatchPercentage,
      viewsByCountry,
      analytics,
    })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 