import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { email } = await req.json()
    const { workspaceId } = params

    // Check if user has permission to invite
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

    // Check if user exists
    const invitedUser = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (!invitedUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await prisma.member.findFirst({
      where: {
        userId: invitedUser.id,
        workSpaceId: workspaceId,
      },
    })

    if (existingMember) {
      return new NextResponse('User is already a member', { status: 400 })
    }

    // Create invitation
    const invite = await prisma.invite.create({
      data: {
        senderId: userId,
        recieverId: invitedUser.id,
        workSpaceId: workspaceId,
        content: `You have been invited to join a workspace by ${currentMember.User?.email}`,
      },
    })

    // Send email notification
    await sendEmail({
      to: email,
      subject: 'Workspace Invitation',
      text: `You have been invited to join a workspace. Click here to accept: ${process.env.NEXT_PUBLIC_APP_URL}/invites/${invite.id}`,
    })

    return NextResponse.json(invite)
  } catch (error) {
    console.error('Invitation error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 