'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createQuestion } from '@/app/(dashboard)/admin/actions'

interface QuestionFormProps {
    examId: string
}

interface Option {
    text: string
    isCorrect: boolean
}

export function QuestionForm({ examId }: QuestionFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [questionText, setQuestionText] = useState('')
    const [points, setPoints] = useState(10)
    const [options, setOptions] = useState<Option[]>([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
    ])

    const handleOptionChange = (index: number, field: keyof Option, value: any) => {
        const newOptions = [...options]
        if (field === 'isCorrect') {
            // If marking as correct, unmark others? Or allow multiple? Assuming single correct for now.
            newOptions.forEach(opt => opt.isCorrect = false)
            newOptions[index].isCorrect = true
        } else {
            newOptions[index].text = value
        }
        setOptions(newOptions)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!questionText) return alert('Soru metni giriniz.')
        if (options.some(opt => !opt.text)) return alert('Tüm şıklar doldurulmalıdır.')
        if (!options.some(opt => opt.isCorrect)) return alert('Doğru cevabı işaretleyiniz.')

        setLoading(true)

        try {
            const res = await createQuestion({
                examId,
                questionText,
                questionType: 'multiple_choice',
                points,
                options
            })

            if (res.error) throw new Error(res.error)

            alert('Soru eklendi!')
            setQuestionText('')
            setOptions([
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
            ])
            router.refresh()

        } catch (error: any) {
            alert('Hata: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="border p-6 rounded bg-gray-50 shadow-sm space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Yeni Soru Ekle</h3>

            <div>
                <Label>Soru Metni</Label>
                <Input
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Örn: Aşağıdakilerden hangisi..."
                    required
                />
            </div>

            <div className="w-24">
                <Label>Puan</Label>
                <Input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    min="1"
                />
            </div>

            <div className="space-y-3">
                <Label>Şıklar (Doğru cevabı işaretleyin)</Label>
                {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                        <span className="font-bold w-4 text-center">{String.fromCharCode(65 + idx)}</span>
                        <input
                            type="radio"
                            name="correct-option"
                            checked={opt.isCorrect}
                            onChange={() => handleOptionChange(idx, 'isCorrect', true)}
                            className="w-4 h-4"
                        />
                        <Input
                            value={opt.text}
                            onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                            placeholder={`Seçenek ${String.fromCharCode(65 + idx)}`}
                            required
                        />
                    </div>
                ))}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Ekleniyor...' : 'Soruyu Kaydet'}
            </Button>
        </form>
    )
}
