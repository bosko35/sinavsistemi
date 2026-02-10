import { createClient } from '@/lib/supabase/server'
import { VideoPlayer } from '@/components/dashboard/video-player'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSignedVideoUrl } from '@/lib/actions/video'
import { getExamForVideo } from '@/lib/actions/exam'

interface WatchPageProps {
    params: {
        videoId: string
    }
}

export default async function WatchPage({ params }: WatchPageProps) {
    const supabase = await createClient()
    const { videoId } = await params

    let video: any = null;

    try {
        const { data: dbVideo, error } = await supabase
            .from('videos')
            .select('*')
            .eq('id', videoId)
            .single()

        if (!error && dbVideo) {
            video = dbVideo
        }
    } catch (e) {
        console.error("Supabase fetch failed", e)
    }

    if (!video) {
        return <div className="p-8">Video bulunamadı.</div>
    }

    // Generate signed URL if needed (for private buckets) or use public URL
    // If bucket is public, video.video_url works. 
    // If private, we need signed URL.
    // Let's try to get a signed URL regardless, it's safer.
    const playbackUrl = await getSignedVideoUrl(video.video_url)

    // Check if there is an exam for this video
    const exam = await getExamForVideo(video.id)

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Geri Dön
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">{video.title}</h1>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <VideoPlayer
                        videoId={video.id}
                        videoUrl={playbackUrl}
                        title={video.title}
                        nextExamId={exam?.id}
                    />
                </div>
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Video Hakkında</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {video.description || 'Bu video için açıklama girilmemiş.'}
                            </p>
                            <div className="mt-4 p-4 bg-muted rounded text-xs">
                                <p><strong>Not:</strong> Video oynarken 5 saniye sonra bir kontrol noktası çıkacaktır. Lütfen tarayıcınızın otomatik oynatmasına izin verin.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
