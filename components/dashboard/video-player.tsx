'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { markVideoAsCompleted, markVideoAsStarted } from '@/lib/actions/progress'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
    videoId: string
    videoUrl: string
    title: string
    nextVideoId?: string
    nextExamId?: string
}

export function VideoPlayer({ videoId, videoUrl, title, nextVideoId, nextExamId }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [showCheckpoint, setShowCheckpoint] = useState(false)
    const [isCompleted, setIsCompleted] = useState(false)
    const [progress, setProgress] = useState(0)
    const [canComplete, setCanComplete] = useState(false)
    const [videoDuration, setVideoDuration] = useState(0)
    const [maxTimeReached, setMaxTimeReached] = useState(0) // En son izlenen saniye

    const videoRef = useRef<HTMLVideoElement>(null)
    const router = useRouter()

    // Video izleme eşiği (%60)
    const COMPLETION_THRESHOLD = 0.60

    // Kontrol noktası süresi (Saniye cinsinden) - Şimdilik demo için 5. saniye, gerçeği 5. dakika olabilir.
    const CHECKPOINT_TIME = 300 // 5. dakika

    useEffect(() => {
        markVideoAsStarted(videoId)
    }, [videoId])

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime || 0
            const duration = videoRef.current.duration

            // İleri Sarma Koruması
            // Eğer kullanıcı şu anki izlenen süreden (maxTimeReached) daha ileriye sararsa engelle
            // 2 saniye tolerans tanıyoruz (seeking action)
            if (currentTime > maxTimeReached + 2 && !isCompleted) {
                videoRef.current.currentTime = maxTimeReached
                return
            }

            // Max Time güncelle
            if (currentTime > maxTimeReached) {
                setMaxTimeReached(currentTime)
            }

            // Checkpoint Logic (Demo amaçlı 5. saniyede popup)
            // Checkpoint sadece aktif olarak izlenirken çalışsın
            if (Math.floor(currentTime) === CHECKPOINT_TIME && !showCheckpoint && isPlaying) {
                setShowCheckpoint(true)
                videoRef.current.pause()
                setIsPlaying(false)
            }

            // İlerleme ve Tamamlama Kontrolü
            if (duration > 0) {
                setVideoDuration(duration)
                const currentProgress = (currentTime / duration) * 100
                setProgress(currentProgress)

                // %60 kontrolü (sadece bir kez)
                if (currentProgress >= (COMPLETION_THRESHOLD * 100) && !canComplete) {
                    setCanComplete(true)
                    setIsCompleted(true)
                    markVideoAsCompleted(videoId)
                }
            }
        }
    }

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setVideoDuration(videoRef.current.duration)
        }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    const handleCheckpointContinue = () => {
        setShowCheckpoint(false)
        if (videoRef.current) {
            videoRef.current.play()
        }
    }

    const handleNext = () => {
        if (nextExamId) {
            router.push(`/exam/${nextExamId}`)
        } else if (nextVideoId) {
            router.push(`/watch/${nextVideoId}`)
        } else {
            router.push('/dashboard')
        }
    }

    // Kullanıcı manuel seek etmeye çalışırsa (bar üzerinden)
    const handleSeeking = () => {
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime
            if (currentTime > maxTimeReached + 1 && !isCompleted) {
                // Geri sararsa izin ver, ileri sararsa engelle
                videoRef.current.currentTime = maxTimeReached
                // alert("Eğitim videolarında ileri sarma yapılamaz.") // Opsiyonel uyarı
            }
        }
    }

    return (
        <div className="space-y-4 w-full max-w-4xl mx-auto">
            {/* Video Container - Aspect Ratio ve Mobil Uyumluluk */}
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-gray-800">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    controlsList="nodownload" // İndirmeyi engellemeye çalışır (Chrome)
                    controls // Standart kontrollere izin ver, ama seeking eventinde müdahale edeceğiz
                    onTimeUpdate={handleTimeUpdate}
                    onSeeking={handleSeeking}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    playsInline
                >
                    Tarayıcınız video etiketini desteklemiyor.
                </video>

                {/* Checkpoint Dialog */}
                <Dialog open={showCheckpoint} onOpenChange={setShowCheckpoint}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Hâlâ burada mısınız?</DialogTitle>
                            <DialogDescription>
                                Eğitime devam etmek için lütfen aşağıdaki butona tıklayınız.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button onClick={handleCheckpointContinue} className="w-full sm:w-auto">Devam Et</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Kontrol Paneli ve İlerleme */}
            <div className="bg-white border rounded-lg p-4 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="font-semibold text-lg leading-tight">{title}</h3>
                        <p className={cn("text-sm font-medium mt-1 transition-colors",
                            canComplete ? "text-green-600" : "text-orange-600"
                        )}>
                            {canComplete ? (
                                <span className="flex items-center gap-2">
                                    ✓ Eğitim Tamamlandı (%{Math.round(progress)} İzledi)
                                </span>
                            ) : (
                                <span>İzleniyor... (%{Math.round(progress)}) - %60 Gereklidir</span>
                            )}
                        </p>
                    </div>

                    {/* Tamamlandıysa veya %60 geçildiyse İleri butonu aktif */}
                    <Button
                        onClick={handleNext}
                        className="w-full sm:w-auto whitespace-nowrap"
                        variant={canComplete ? "default" : "secondary"}
                        disabled={!canComplete}
                    >
                        {canComplete ? (nextExamId ? "Sınava Başla →" : (nextVideoId ? "Sonraki Video →" : "Eğitimi Bitir")) : "Video Devam Ediyor..."}
                    </Button>
                </div>

                {/* Custom Progress Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground w-full">
                        <span>0:00</span>
                        <span>%60 Barajı</span>
                        <span>{videoDuration ? `${Math.floor(videoDuration / 60)}:${Math.floor(videoDuration % 60).toString().padStart(2, '0')}` : '--:--'}</span>
                    </div>

                    <div className="relative h-2 w-full bg-secondary rounded-full overflow-hidden">
                        {/* İzlenen Kısım (Mavi/Yeşil) */}
                        <div
                            className={cn("h-full transition-all duration-300 ease-linear absolute left-0 top-0", canComplete ? "bg-green-500" : "bg-blue-600")}
                            style={{ width: `${progress}%` }}
                        />

                        {/* %60 İşareti (Kırmızı Çizgi) */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 opacity-70"
                            style={{ left: `${COMPLETION_THRESHOLD * 100}%` }}
                            title="%60 Geçme Sınırı"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
