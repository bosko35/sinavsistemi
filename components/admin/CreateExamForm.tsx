'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createExam, getVideosByModule } from '@/app/(dashboard)/admin/actions'

interface Module {
    id: string
    title: string
}

interface Video {
    id: string
    title: string
}

export function CreateExamForm({ modules }: { modules: Module[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [moduleId, setModuleId] = useState('')
    const [videoId, setVideoId] = useState('')
    const [videos, setVideos] = useState<Video[]>([])

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [passingScore, setPassingScore] = useState(70)
    const [duration, setDuration] = useState(30) // minutes

    // Modül değişince videoları getir
    useEffect(() => {
        if (moduleId) {
            getVideosByModule(moduleId).then((data) => {
                setVideos(data as Video[])
                setVideoId('') // Modül değişince seçili videoyu sıfırla
            })
        } else {
            setVideos([])
            setVideoId('')
        }
    }, [moduleId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await createExam({
                moduleId,
                videoId: videoId || undefined, // Video seçilmediyse undefined gönder
                title,
                description,
                passingScore,
                duration
            })

            if (res.error) throw new Error(res.error)

            alert('Sınav oluşturuldu!')
            router.refresh()
            setTitle('')
            setDescription('')
            // Modül ve video seçimini koruyabiliriz veya sıfırlayabiliriz, kullanıcı seri ekleme yapacaksa korumak daha iyi olabilir.

        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border p-6 rounded shadow-sm bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="exam-module">Modül Seç</Label>
                    <select
                        id="exam-module"
                        value={moduleId}
                        onChange={(e) => setModuleId(e.target.value)}
                        className="w-full border rounded p-2"
                        required
                    >
                        <option value="">Modül Seçiniz...</option>
                        {modules.map((m) => (
                            <option key={m.id} value={m.id}>{m.title}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <Label htmlFor="exam-video">Video Seç (Opsiyonel)</Label>
                    <select
                        id="exam-video"
                        value={videoId}
                        onChange={(e) => setVideoId(e.target.value)}
                        className="w-full border rounded p-2"
                        disabled={!moduleId || videos.length === 0}
                    >
                        <option value="">
                            {moduleId && videos.length === 0 ? "Bu modülde video yok" : "Video Seçiniz (Genel Sınav için boş bırakın)"}
                        </option>
                        {videos.map((v) => (
                            <option key={v.id} value={v.id}>{v.title}</option>
                        ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                        Eğer bir video seçerseniz, kullanıcı o videoyu bitirdiğinde bu sınav karşısına çıkar.
                    </p>
                </div>
            </div>

            <div>
                <Label htmlFor="exam-title">Sınav Başlığı</Label>
                <Input
                    id="exam-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>

            <div>
                <Label htmlFor="exam-desc">Açıklama</Label>
                <Input
                    id="exam-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <Label htmlFor="passing-score">Geçme Notu</Label>
                    <Input
                        id="passing-score"
                        type="number"
                        value={passingScore}
                        onChange={(e) => setPassingScore(Number(e.target.value))}
                        min="0"
                        max="100"
                        required
                    />
                </div>
                <div className="flex-1">
                    <Label htmlFor="duration-min">Süre (Dakika)</Label>
                    <Input
                        id="duration-min"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        min="1"
                        required
                    />
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Oluşturuluyor...' : 'Sınav Oluştur'}
            </Button>
        </form>
    )
}
