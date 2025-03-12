import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { key, title, workspaceId, folderId } = await req.json()

    if (!key || !title) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const video = await prisma.video.create({
      data: {
        title,
        source: key,
        userId,
        workSpaceId: workspaceId,
        folderId,
        processing: true, // Will be set to false after transcoding
      },
    })

    // Trigger video processing (transcoding) in the background
    // This would typically be handled by a queue system like AWS SQS
    // For now, we'll just return the video data
    
    return NextResponse.json(video)
  } catch (error) {
    console.error('Video creation error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get('workspaceId')
    const folderId = searchParams.get('folderId')

    const where = {
      userId,
      ...(workspaceId && { workSpaceId: workspaceId }),
      ...(folderId && { folderId }),
    }

    const videos = await prisma.video.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        analytics: true,
        callToAction: true,
      },
    })

    return NextResponse.json(videos)
  } catch (error) {
    console.error('Video fetch error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 