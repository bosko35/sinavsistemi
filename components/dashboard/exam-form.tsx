'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { startExamAttempt, submitExamAttempt } from '@/lib/actions/exam'

interface Question {
    id: string
    question_text: string
    points: number
    question_options: {
        id: string
        option_text: string
    }[]
}

interface ExamFormProps {
    examId: string
    questions: Question[]
    userId: string
}

export function ExamForm({ examId, questions, userId }: ExamFormProps) {
    const router = useRouter()
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [attemptId, setAttemptId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Sınav başladığında attempt oluştur (Opsiyonel: Kullanıcı "Başla" deyince)
    // Şimdilik sayfa açıldığında otomatik başlamasın, butonla başlasın.
    const [started, setStarted] = useState(false)

    const handleStart = async () => {
        try {
            const res = await startExamAttempt(examId)
            if (res.error) throw new Error(res.error)
            setAttemptId(res.attemptId)
            setStarted(true)
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleAnswerChange = (questionId: string, optionId: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }))
    }

    const handleSubmit = async () => {
        if (!attemptId) return

        // Check if all questions answered? Or allow partial?
        const answeredCount = Object.keys(answers).length
        if (answeredCount < questions.length) {
            if (!confirm(`Sadece ${answeredCount}/${questions.length} soruyu cevapladınız. Bitirmek istiyor musunuz?`)) {
                return
            }
        }

        setSubmitting(true)
        try {
            const finalAnswers = Object.entries(answers).map(([qid, oid]) => ({
                questionId: qid,
                optionId: oid
            }))

            const res = await submitExamAttempt(attemptId, finalAnswers)

            if (res.error) throw new Error(res.error)

            // Show result
            alert(`Sınav Bitti!\nPuanınız: ${res.score}/${res.total}\nDurum: ${res.passed ? "BAŞARILI" : "BAŞARISIZ"}`)
            router.push('/dashboard') // Or redirect to results page

        } catch (err: any) {
            setError(err.message)
            setSubmitting(false)
        }
    }

    if (!started) {
        return (
            <div className="text-center space-y-6">
                <p className="text-muted-foreground">Sınava başlamaya hazır mısınız?</p>
                {error && <p className="text-red-500">{error}</p>}
                <Button onClick={handleStart} size="lg">Sınavı Başlat</Button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {error && <div className="p-4 perform-alert-error bg-red-50 text-red-600 rounded">{error}</div>}

            {questions.map((q, index) => (
                <div key={q.id} className="border p-6 rounded-lg bg-card shadow-sm">
                    <h3 className="font-medium text-lg mb-4 flex gap-2">
                        <span className="text-muted-foreground">{index + 1}.</span>
                        {q.question_text}
                        <span className="ml-auto text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                            {q.points} Puan
                        </span>
                    </h3>

                    <div className="space-y-3">
                        {q.question_options.map((opt) => (
                            <div key={opt.id} className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id={opt.id}
                                    name={q.id}
                                    value={opt.id}
                                    checked={answers[q.id] === opt.id}
                                    onChange={() => handleAnswerChange(q.id, opt.id)}
                                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <Label htmlFor={opt.id} className="cursor-pointer flex-1 py-1">
                                    {opt.option_text}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="pt-6 border-t flex justify-end">
                <Button onClick={handleSubmit} disabled={submitting} size="lg">
                    {submitting ? 'Gönderiliyor...' : 'Sınavı Bitir'}
                </Button>
            </div>
        </div>
    )
}
