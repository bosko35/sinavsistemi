import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2, Circle, PlayCircle, FileQuestion, RotateCcw } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    let modules: any[] = []
    let progress: any[] = []
    let exams: any[] = []
    let attempts: any[] = []
    let showEmptyState = false

    try {
        // 1. Fetch Modules
        const { data: dbModules, error: moduleError } = await supabase
            .from('modules')
            .select('*')
            .order('order', { ascending: true })

        if (moduleError) throw moduleError

        // 2. Fetch Videos
        // We fetch all videos and filter them locally to avoid complex join issues for now
        const { data: dbVideos, error: videoError } = await supabase
            .from('videos')
            .select('*')
            .order('order', { ascending: true })

        if (videoError) throw videoError

        // 3. Fetch Exams
        const { data: dbExams, error: examError } = await supabase
            .from('exams')
            .select('*')

        if (examError) console.error("Exam fetch error:", examError)
        exams = dbExams || []

        // 4. Fetch User Progress (Video Watch)
        const { data: dbProgress, error: progressError } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)

        if (progressError) {
            console.error("Progress fetch error:", progressError)
        } else {
            progress = dbProgress || []
        }

        // 5. Fetch User Exam Attempts
        const { data: dbAttempts, error: attemptError } = await supabase
            .from('user_exam_attempts')
            .select('*')
            .eq('user_id', user.id) // Filter by user explicitly just in case

        if (attemptError) console.error("Attempt fetch error:", attemptError)
        attempts = dbAttempts || []


        // Join videos to modules
        modules = (dbModules || []).map(m => ({
            ...m,
            videos: (dbVideos || []).filter((v: any) => v.module_id === m.id)
        }))

        if (modules.length === 0) {
            showEmptyState = true
        }

    } catch (e: any) {
        console.error("Dashboard Data Fetch Error:", e.message)
        showEmptyState = true
    }

    const isVideoWatched = (videoId: string) => {
        return progress?.some(p => p.video_id === videoId && p.status === 'completed')
    }

    const getExamStatus = (videoId: string) => {
        const exam = exams.find(e => e.video_id === videoId)
        if (!exam) return { hasExam: false, passed: false, examId: null, attemptsCount: 0 }

        const userAttempts = attempts.filter(a => a.exam_id === exam.id)
        const passed = userAttempts.some(a => a.passed) // Check 'passed' boolean column
        return { hasExam: true, passed, examId: exam.id, attemptsCount: userAttempts.length }
    }


    if (showEmptyState) {
        return (
            <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <h1 className="text-3xl font-bold">Eğitim Paneli</h1>
                <p className="text-muted-foreground text-lg">Henüz atanmış bir eğitim modülü bulunmamaktadır.</p>
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200 max-w-md">
                    <p>Yönetici panelinden yeni modül ve videolar eklediğinizde burada görünecektir.</p>
                </div>
                <Button asChild>
                    <Link href="/admin/videos">Yönetim Paneline Git</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Eğitim Paneli</h1>
                <p className="text-muted-foreground">Atanmış eğitim modülleriniz ve ilerleme durumunuz.</p>
            </div>

            <div className="grid gap-6">
                {modules.map((module: any) => (
                    <Card key={module.id}>
                        <CardHeader>
                            <CardTitle>{module.title}</CardTitle>
                            <CardDescription>{module.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {module.videos?.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">Bu modülde henüz video yok.</p>
                                ) : (
                                    module.videos?.map((video: any) => {
                                        const watched = isVideoWatched(video.id)
                                        const { hasExam, passed, examId, attemptsCount } = getExamStatus(video.id)

                                        // Module item complete if:
                                        // 1. Video is watched
                                        // 2. AND (If exam exists, it must be passed)
                                        const isFullyCompleted = watched && (!hasExam || passed)

                                        return (
                                            <div key={video.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors gap-4">
                                                <div className="flex items-center gap-4">
                                                    {isFullyCompleted ? (
                                                        <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                                                    ) : (watched ? (
                                                        // Video watched but exam pending
                                                        <div className="relative">
                                                            <Circle className="h-6 w-6 text-yellow-500 shrink-0" />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Circle className="h-6 w-6 text-muted-foreground shrink-0" />
                                                    ))}

                                                    <div>
                                                        <h3 className="font-medium">{video.title}</h3>
                                                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                                                            <span>{Math.floor(video.duration / 60)} dk {video.duration % 60 > 0 && `${video.duration % 60} sn`}</span>

                                                            {hasExam && (
                                                                passed ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                                        Sınav Başarılı
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                                        Sınav Zorunlu
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-end md:self-auto">
                                                    {/* Exam Button Logic */}
                                                    {watched && hasExam && !passed && (
                                                        <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm">
                                                            <Link href={`/exam/${examId}`}>
                                                                <FileQuestion className="mr-2 h-4 w-4" />
                                                                {attemptsCount > 0 ? 'Sınavı Tekrarla' : 'Sınava Gir'}
                                                            </Link>
                                                        </Button>
                                                    )}

                                                    <Button asChild variant={isFullyCompleted ? "outline" : "default"} size="sm">
                                                        <Link href={`/watch/${video.id}`}>
                                                            {watched ? (
                                                                <>
                                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                                    Tekrar İzle
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Başla
                                                                    <PlayCircle className="ml-2 h-4 w-4" />
                                                                </>
                                                            )}
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
