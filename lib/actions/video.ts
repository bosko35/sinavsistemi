'use server'

import { createClient } from '@/lib/supabase/server'
import { s3Client } from '@/lib/s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export async function getSignedVideoUrl(videoUrl: string) {
    try {
        // videoUrl format: https://BUCKET.s3.REGION.amazonaws.com/KEY
        // We need to extract the KEY.

        // Simple extraction logic: getting everything after the last slash might work, 
        // but full URL split is safer if key contains slashes (folders).

        const urlParts = videoUrl.split('.amazonaws.com/')
        if (urlParts.length < 2) {
            // Maybe it's already a key or different format? Return as is to try.
            return videoUrl;
        }

        const key = urlParts[1]; // The part after amazonaws.com/

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: key,
        })

        // URL valid for 3 hours (plenty time to watch)
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 10800 })
        return signedUrl

    } catch (error) {
        console.error('Error generating signed URL:', error)
        return videoUrl // Fallback to public URL
    }
}
