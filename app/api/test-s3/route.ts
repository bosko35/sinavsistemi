import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export async function GET() {
    try {
        const region = process.env.AWS_REGION;
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

        console.log("Checking AWS Config:");
        console.log("Region:", region);
        console.log("AccessKey:", accessKeyId ? accessKeyId.substring(0, 5) + "..." : "MISSING");
        console.log("SecretKey Length:", secretAccessKey ? secretAccessKey.length : 0);
        console.log("SecretKey First Char:", secretAccessKey ? secretAccessKey.charAt(0) : "N/A");

        const s3Client = new S3Client({
            region: region!,
            credentials: {
                accessKeyId: accessKeyId!,
                secretAccessKey: secretAccessKey!,
            },
        });

        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);

        return NextResponse.json({
            success: true,
            buckets: response.Buckets?.map(b => b.Name),
            message: "AWS bağlantısı başarılı!"
        });
    } catch (error: any) {
        console.error("AWS S3 Hatası:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            code: error.Code
        }, { status: 500 });
    }
}
