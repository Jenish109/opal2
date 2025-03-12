import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'

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

    const cta = await prisma.callToAction.findFirst({
      where: {
        videoId,
      },
    })

    if (!cta) {
      return new NextResponse('CTA not found', { status: 404 })
    }

    // Increment clicks count
    await prisma.callToAction.update({
      where: {
        id: cta.id,
      },
      data: {
        clicks: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CTA click tracking error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 