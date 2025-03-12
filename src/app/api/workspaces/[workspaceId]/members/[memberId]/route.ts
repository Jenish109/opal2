import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: Request,
  { params }: { params: { workspaceId: string; memberId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { workspaceId, memberId } = params

    // Check if user has permission to remove members
    const currentMember = await prisma.member.findFirst({
      where: {
        userId,
        workSpaceId: workspaceId,
      },
      include: {
        User: true,
      },
    })

    if (!currentMember || !['SUPER_ADMIN', 'ADMIN'].includes(currentMember.User?.role || '')) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Get member to be removed
    const memberToRemove = await prisma.member.findFirst({
      where: {
        id: memberId,
        workSpaceId: workspaceId,
      },
      include: {
        User: true,
      },
    })

    if (!memberToRemove) {
      return new NextResponse('Member not found', { status: 404 })
    }

    // Prevent removal of SUPER_ADMIN
    if (memberToRemove.User?.role === 'SUPER_ADMIN') {
      return new NextResponse('Cannot remove SUPER_ADMIN', { status: 403 })
    }

    // Remove member
    await prisma.member.delete({
      where: {
        id: memberId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Member removal error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 