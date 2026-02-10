import { NextResponse } from 'next/server';
import { s3Client } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const { filename, contentType } = await req.json();

        if (!filename || !contentType) {
            return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 });
        }

        const uniqueFilename = `${uuidv4()}-${filename}`;
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: uniqueFilename,
            ContentType: contentType,
        });

        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        return NextResponse.json({
            url: presignedUrl,
            key: uniqueFilename,
            viewUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${uniqueFilename}`
        });
    } catch (error: any) {
        console.error("Presigned URL Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
