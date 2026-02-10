'use client'

import { useState } from 'react'
import { deleteQuestion } from '@/app/(dashboard)/admin/actions'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuestionListProps {
    questions: any[]
    examId: string
}

export function QuestionList({ questions, examId }: QuestionListProps) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    const handleDelete = async (questionId: string) => {
        if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return

        setIsDeleting(questionId)
        try {
            const res = await deleteQuestion(questionId, examId)
            if (res.error) {
                alert('Silme işlemi başarısız: ' + res.error)
            }
        } catch (error) {
            console.error(error)
            alert('Bir hata oluştu.')
        } finally {
            setIsDeleting(null)
        }
    }

    if (questions.length === 0) {
        return (
            <div className="p-4 bg-gray-50 rounded text-center text-gray-500">
                Henüz soru eklenmemiş.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {questions.map((q) => (
                <div key={q.id} className="bg-white p-4 border rounded shadow-sm relative group">
                    <div className="flex justify-between items-start pr-12">
                        <span className="font-bold text-gray-900">{q.question_text}</span>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600 whitespace-nowrap ml-2">
                            {q.points} Puan
                        </span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(q.id)}
                        disabled={isDeleting === q.id}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>

                    <ul className="mt-3 text-sm space-y-1 ml-4 list-[upper-alpha] text-gray-700">
                        {q.question_options?.sort((a: any, b: any) => a.order - b.order).map((opt: any) => (
                            <li key={opt.id} className={`${opt.is_correct ? 'font-bold text-green-600' : ''}`}>
                                {opt.option_text} {opt.is_correct && '(Doğru Cevap)'}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    )
}
