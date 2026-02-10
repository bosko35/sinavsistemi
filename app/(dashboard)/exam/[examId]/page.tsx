import { createClient } from '@/lib/supabase/server'
import { getExamWithQuestions } from '@/lib/actions/exam'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExamForm } from '@/components/dashboard/exam-form'

interface ExamPageProps {
    params: {
        examId: string
    }
}

export default async function ExamPage({ params }: ExamPageProps) {
    const supabase = await createClient()
    const { examId } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch exam data
    const examData: any = await getExamWithQuestions(examId)

    if (!examData || !examData.exam) {
        return <div className="p-8">Sınav bulunamadı.</div>
    }

    const { exam, questions } = examData

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{exam.title}</CardTitle>
                    <CardDescription>{exam.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-6">
                        <div>Süre: {exam.duration_minutes} Dakika</div>
                        <div>Geçme Notu: {exam.passing_score}</div>
                        <div>Soru Sayısı: {questions?.length || 0}</div>
                    </div>

                    <ExamForm
                        examId={exam.id}
                        questions={questions || []}
                        userId={user.id}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
