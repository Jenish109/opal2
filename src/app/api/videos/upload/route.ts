import { client } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getAuth } from '@clerk/nextjs/server';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const videoFile = formData.get('video');
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!videoFile || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure videoFile is a File or Blob
    if (!(videoFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'Invalid video file' },
        { status: 400 }
      );
    }

    // Generate a unique filename with extension
    const originalName = 'recorded-video.webm';
    const extension = originalName.split('.').pop() || 'webm';
    const filename = `${uuidv4()}.${extension}`;

    // Convert Blob/File to Buffer
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Get the user's personal workspace
    const personalWorkspace = await client.user.findUnique({
      where: {
        clerkid: userId,
      },
      select: {
        id: true,
        workspace: {
          where: {
            type: 'PERSONAL',
          },
          select: {
            id: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!personalWorkspace?.workspace[0]?.id) {
      return NextResponse.json(
        { error: 'Personal workspace not found' },
        { status: 404 }
      );
    }

    // Create a new video record in the database
    const newVideo = await client.video.create({
      data: {
        title,
        description,
        source: filename,
        userId: personalWorkspace.id, // Use the actual user ID from the database
        workSpaceId: personalWorkspace.workspace[0].id,
        processing: true,
      },
    });

    // Mark as processed (in a real app, you'd want to handle transcoding)
    await client.video.update({
      where: {
        id: newVideo.id,
      },
      data: {
        processing: false,
      },
    });

    return NextResponse.json({ 
      success: true, 
      videoId: newVideo.id,
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
} 