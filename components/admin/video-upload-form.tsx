'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createVideo } from '@/app/(dashboard)/admin/actions'

interface Module {
    id: string
    title: string
}

interface VideoUploadFormProps {
    modules: Module[]
}

export function VideoUploadForm({ modules }: VideoUploadFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [moduleId, setModuleId] = useState<string>('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [duration, setDuration] = useState(0)
    const [order, setOrder] = useState(0)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !moduleId) {
            alert('Lütfen bir dosya ve modül seçin.')
            return
        }

        setLoading(true)

        try {
            // 1. Get Presigned URL
            const filename = encodeURIComponent(file.name)
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename, contentType: file.type }),
            })

            if (!res.ok) throw new Error('Yükleme URL\'i alınamadı.')

            const { url, key } = await res.json()

            // 2. Upload to S3
            const uploadRes = await fetch(url, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            })

            if (!uploadRes.ok) throw new Error('Dosya S3\'e yüklenemedi.')

            const videoUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || 'abantosgb'}.s3.eu-north-1.amazonaws.com/${key}`

            // 3. Save to Database
            const result = await createVideo({
                moduleId,
                title,
                description,
                videoUrl,
                duration,
                order
            })

            if (result.error) {
                throw new Error(result.error)
            }

            alert('Video başarıyla yüklendi!')
            setFile(null)
            setTitle('')
            setDescription('')
            setDuration(0)
            setOrder(0)
            router.refresh()

        } catch (error: any) {
            console.error(error)
            alert('Hata oluştu: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md border p-6 rounded-lg shadow-sm">
            <div>
                <Label htmlFor="module">Modül Seç</Label>
                <select
                    id="module"
                    value={moduleId}
                    onChange={(e) => setModuleId(e.target.value)}
                    className="w-full border rounded p-2"
                    required
                >
                    <option value="">Modül Seçiniz...</option>
                    {modules.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.title}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <Label htmlFor="title">Video Başlığı</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Örn: Ders 1 - Giriş"
                />
            </div>

            <div>
                <Label htmlFor="description">Açıklama</Label>
                <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Kısa açıklama..."
                />
            </div>

            <div>
                <Label htmlFor="file">Video Dosyası</Label>
                <Input
                    id="file"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    required
                />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <Label htmlFor="duration">Süre (Saniye)</Label>
                    <Input
                        id="duration"
                        type="number"
                        value={duration || ''}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        required
                        min="0"
                    />
                </div>
                <div className="flex-1">
                    <Label htmlFor="order">Sıra No</Label>
                    <Input
                        id="order"
                        type="number"
                        value={order || ''}
                        onChange={(e) => setOrder(Number(e.target.value))}
                        required
                        min="0"
                    />
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Yükleniyor...' : 'Videoyu Kaydet'}
            </Button>
        </form>
    )
}
