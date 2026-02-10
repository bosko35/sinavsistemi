'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createModule } from '@/app/(dashboard)/admin/actions'

export function CreateModuleForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [order, setOrder] = useState(1)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData()
            formData.append('title', title)
            formData.append('description', description)
            formData.append('order', order.toString())

            const res = await createModule(formData)

            if (res.error) throw new Error(res.error)

            alert('Modül oluşturuldu!')
            setTitle('')
            setDescription('')
            router.refresh()

        } catch (error: any) {
            alert('Hata: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border p-6 rounded shadow-sm bg-white mb-6">
            <h3 className="font-semibold text-lg border-b pb-2">Yeni Modül Oluştur</h3>
            <div>
                <Label htmlFor="mod-title">Modül Adı</Label>
                <Input
                    id="mod-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Örn: İSG Temel Eğitimi"
                />
            </div>

            <div>
                <Label htmlFor="mod-desc">Açıklama</Label>
                <Input
                    id="mod-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Kısa açıklama..."
                />
            </div>

            <div>
                <Label htmlFor="mod-order">Sıra No</Label>
                <Input
                    id="mod-order"
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    min="1"
                    required
                />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Ekleniyor...' : 'Modülü Kaydet'}
            </Button>
        </form>
    )
}
