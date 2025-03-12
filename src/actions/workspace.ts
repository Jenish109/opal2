'use server'

import { client } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { sendEmail } from './user'
import { createClient, OAuthStrategy } from '@wix/sdk'
import { items } from '@wix/data'
import axios from 'axios'

export const verifyAccessToWorkspace = async (workspaceId: string) => {
  try {
    const user = await currentUser()
    if (!user) return { status: 403 }

    const isUserInWorkspace = await client.workSpace.findUnique({
      where: {
        id: workspaceId,
        OR: [
          {
            User: {
              clerkid: user.id,
            },
          },
          {
            members: {
              every: {
                User: {
                  clerkid: user.id,
                },
              },
            },
          },
        ],
      },
    })
    return {
      status: 200,
      data: { workspace: isUserInWorkspace },
    }
  } catch (error) {
    return {
      status: 403,
      data: { workspace: null },
    }
  }
}

export const getWorkspaceFolders = async (workSpaceId: string) => {
  try {
    const isFolders = await client.folder.findMany({
      where: {
        workSpaceId,
      },
      include: {
        _count: {
          select: {
            videos: true,
          },
        },
      },
    })
    if (isFolders && isFolders.length > 0) {
      return { status: 200, data: isFolders }
    }
    return { status: 404, data: [] }
  } catch (error) {
    return { status: 403, data: [] }
  }
}

export const getAllUserVideos = async (workSpaceId: string) => {
  try {
    const user = await currentUser()
    if (!user) return { status: 404 }
    const videos = await client.video.findMany({
      where: {
        OR: [{ workSpaceId }, { folderId: workSpaceId }],
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        source: true,
        processing: true,
        Folder: {
          select: {
            id: true,
            name: true,
          },
        },
        User: {
          select: {
            firstname: true,
            lastname: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (videos && videos.length > 0) {
      return { status: 200, data: videos }
    }

    return { status: 404 }
  } catch (error) {
    return { status: 400 }
  }
}

export const getWorkSpaces = async () => {
  try {
    const user = await currentUser()

    if (!user) return { status: 404 }

    const workspaces = await client.user.findUnique({
      where: {
        clerkid: user.id,
      },
      select: {
        subscription: {
          select: {
            plan: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        members: {
          select: {
            WorkSpace: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    })

    if (workspaces) {
      return { status: 200, data: workspaces }
    }
  } catch (error) {
    return { status: 400 }
  }
}

export const createWorkspace = async (name: string) => {
  try {
    const user = await currentUser()
    if (!user) return { status: 404 }
    const authorized = await client.user.findUnique({
      where: {
        clerkid: user.id,
      },
      select: {
        subscription: {
          select: {
            plan: true,
          },
        },
      },
    })

    if (authorized?.subscription?.plan === 'PRO') {
      const workspace = await client.user.update({
        where: {
          clerkid: user.id,
        },
        data: {
          workspace: {
            create: {
              name,
              type: 'PUBLIC',
            },
          },
        },
      })
      if (workspace) {
        return { status: 201, data: 'Workspace Created' }
      }
    }
    return {
      status: 401,
      data: 'You are not authorized to create a workspace.',
    }
  } catch (error) {
    return { status: 400 }
  }
}

export const renameFolders = async (folderId: string, name: string) => {
  try {
    const folder = await client.folder.update({
      where: {
        id: folderId,
      },
      data: {
        name,
      },
    })
    if (folder) {
      return { status: 200, data: 'Folder Renamed' }
    }
    return { status: 400, data: 'Folder does not exist' }
  } catch (error) {
    return { status: 500, data: 'Opps! something went wrong' }
  }
}

export const createFolder = async (workspaceId: string) => {
  try {
    const isNewFolder = await client.workSpace.update({
      where: {
        id: workspaceId,
      },
      data: {
        folders: {
          create: { name: 'Untitled' },
        },
      },
    })
    if (isNewFolder) {
      return { status: 200, message: 'New Folder Created' }
    }
  } catch (error) {
    return { status: 500, message: 'Oppse something went wrong' }
  }
}

export const getFolderInfo = async (folderId: string) => {
  try {
    const folder = await client.folder.findUnique({
      where: {
        id: folderId,
      },
      select: {
        name: true,
        _count: {
          select: {
            videos: true,
          },
        },
      },
    })
    if (folder)
      return {
        status: 200,
        data: folder,
      }
    return {
      status: 400,
      data: null,
    }
  } catch (error) {
    return {
      status: 500,
      data: null,
    }
  }
}

export const moveVideoLocation = async (
  videoId: string,
  workSpaceId: string,
  folderId: string
) => {
  try {
    const location = await client.video.update({
      where: {
        id: videoId,
      },
      data: {
        folderId: folderId || null,
        workSpaceId,
      },
    })
    if (location) return { status: 200, data: 'folder changed successfully' }
    return { status: 404, data: 'workspace/folder not found' }
  } catch (error) {
    return { status: 500, data: 'Oops! something went wrong' }
  }
}

export const getPreviewVideo = async (videoId: string) => {
  try {
    const user = await currentUser()
    if (!user) return { status: 404 }
    const video = await client.video.findUnique({
      where: {
        id: videoId,
      },
      select: {
        title: true,
        createdAt: true,
        source: true,
        description: true,
        processing: true,
        views: true,
        summery: true,
        User: {
          select: {
            firstname: true,
            lastname: true,
            image: true,
            clerkid: true,
            trial: true,
            subscription: {
              select: {
                plan: true,
              },
            },
          },
        },
      },
    })
    if (video) {
      return {
        status: 200,
        data: video,
        author: user.id === video.User?.clerkid ? true : false,
      }
    }

    return { status: 404 }
  } catch (error) {
    return { status: 400 }
  }
}

export const sendEmailForFirstView = async (videoId: string) => {
  try {
    const user = await currentUser()
    if (!user) return { status: 404 }
    const firstViewSettings = await client.user.findUnique({
      where: { clerkid: user.id },
      select: {
        firstView: true,
      },
    })
    if (!firstViewSettings?.firstView) return

    const video = await client.video.findUnique({
      where: {
        id: videoId,
      },
      select: {
        title: true,
        views: true,
        User: {
          select: {
            email: true,
          },
        },
      },
    })
    if (video && video.views === 0) {
      await client.video.update({
        where: {
          id: videoId,
        },
        data: {
          views: video.views + 1,
        },
      })

      const emailResult = await sendEmail(
        video.User?.email!,
        'You got a viewer',
        `Your video ${video.title} just got its first viewer`
      )

      // If email functionality is disabled, just update the notification without sending email
      if (emailResult.error) {
        const notification = await client.user.update({
          where: { clerkid: user.id },
          data: {
            notification: {
              create: {
                content: `Your video ${video.title} just got its first viewer`,
              },
            },
          },
        })
        if (notification) {
          return { status: 200 }
        }
        return
      }

      // If email functionality is enabled, proceed with sending email
      const { transporter, mailOptions } = emailResult
      if (transporter && mailOptions) {
        transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            console.log(error.message)
          } else {
            const notification = await client.user.update({
              where: { clerkid: user.id },
              data: {
                notification: {
                  create: {
                    content: mailOptions.text,
                  },
                },
              },
            })
            if (notification) {
              return { status: 200 }
            }
          }
        })
      }
    }
  } catch (error) {
    console.log(error)
  }
}

export const editVideoInfo = async (
  videoId: string,
  title: string,
  description: string
) => {
  try {
    const video = await client.video.update({
      where: { id: videoId },
      data: {
        title,
        description,
      },
    })
    if (video) return { status: 200, data: 'Video successfully updated' }
    return { status: 404, data: 'Video not found' }
  } catch (error) {
    return { status: 400 }
  }
}

export const getWixContent = async () => {
  try {
    // Query videos directly from our database
    const video = await client.video.findMany({
      select: {
        id: true,
        createdAt: true,
        title: true,
        source: true,
        processing: true,
        workSpaceId: true,
        User: {
          select: {
            firstname: true,
            lastname: true,
            image: true,
          },
        },
        Folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to 10 most recent videos
    });

    if (video && video.length > 0) {
      return { status: 200, data: video }
    }
    return { status: 404 }
  } catch (error) {
    console.log(error)
    return { status: 400 }
  }
}

export const howToPost = async () => {
  try {
    if (!process.env.CLOUD_WAYS_POST) {
      return { status: 404, message: 'CLOUD_WAYS_POST configuration is missing' }
    }
    
    const response = await axios.get(process.env.CLOUD_WAYS_POST as string)
    if (response.data) {
      return {
        title: response.data[0].title.rendered,
        content: response.data[0].content.rendered,
      }
    }
  } catch (error) {
    return { status: 400 }
  }
}

export const inviteMembers = async (
  workspaceId: string,
  recieverId: string,
  email: string
) => {
  try {
    const user = await currentUser()
    if (!user) return { status: 404 }
    const senderInfo = await client.user.findUnique({
      where: {
        clerkid: user.id,
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
      },
    })
    if (senderInfo?.id) {
      const workspace = await client.workSpace.findUnique({
        where: {
          id: workspaceId,
        },
        select: {
          name: true,
        },
      })
      if (workspace) {
        const invitation = await client.invite.create({
          data: {
            senderId: senderInfo.id,
            recieverId,
            workSpaceId: workspaceId,
            content: `You are invited to join ${workspace.name} Workspace, click accept to confirm`,
          },
          select: {
            id: true,
          },
        })

        await client.user.update({
          where: {
            clerkid: user.id,
          },
          data: {
            notification: {
              create: {
                content: `${user.firstName} ${user.lastName} invited ${senderInfo.firstname} into ${workspace.name}`,
              },
            },
          },
        })
        
        if (invitation) {
          const emailResult = await sendEmail(
            email,
            'You got an invitation',
            `You are invited to join ${workspace.name} Workspace, click accept to confirm`,
            `<a href="${process.env.NEXT_PUBLIC_HOST_URL}/invite/${invitation.id}" style="background-color: #000; padding: 5px 10px; border-radius: 10px;">Accept Invite</a>`
          )

          // If email functionality is disabled, return success but note email wasn't sent
          if (emailResult.error) {
            return { 
              status: 200, 
              data: 'Invite created but email notification is disabled' 
            }
          }

          // If email functionality is enabled, send the email
          const { transporter, mailOptions } = emailResult
          if (transporter && mailOptions) {
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('🔴', error.message)
              } else {
                console.log('✅ Email send')
              }
            })
          }
          return { status: 200, data: 'Invite sent' }
        }
        return { status: 400, data: 'invitation failed' }
      }
      return { status: 404, data: 'workspace not found' }
    }
    return { status: 404, data: 'recipient not found' }
  } catch (error) {
    console.log(error)
    return { status: 400, data: 'Oops! something went wrong' }
  }
}
