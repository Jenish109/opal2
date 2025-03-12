import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

// const s3Client = new S3Client({
//   region: process.env.AWS_REGION!,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//   },
// })

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { fileName, fileType, workspaceId, folderId } = await req.json()

    if (!fileName || !fileType) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Generate unique key for S3
    const key = `videos/${userId}/${uuidv4()}-${fileName}`

    // Create presigned URL
    // const putObjectCommand = new PutObjectCommand({
    //   Bucket: process.env.AWS_S3_BUCKET_NAME!,
    //   Key: key,
    //   ContentType: fileType,
    // })

    // const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, {
    //   expiresIn: 3600, // URL expires in 1 hour
    // })

    // return NextResponse.json({ uploadUrl, key })
  } catch (error) {
    console.error('Upload URL generation error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 