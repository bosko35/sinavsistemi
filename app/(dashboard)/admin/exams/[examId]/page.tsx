import Link from 'next/link';
import { getExam, getQuestions } from '@/app/(dashboard)/admin/actions';
import { QuestionForm } from '@/components/admin/QuestionForm';
import { QuestionUploadForm } from '@/components/admin/QuestionUploadForm';
import { QuestionList } from '@/components/admin/QuestionList';

export default async function ExamDetailsPage({ params }: { params: Promise<{ examId: string }> }) {
    const { examId } = await params;
    const exam: any = await getExam(examId);
    const questions: any[] = await getQuestions(examId);

    if (!exam) return <div className="p-8">Sınav bulunamadı.</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{exam.title}</h1>
                <Link href="/admin/exams" className="text-blue-600 hover:underline">
                    &larr; Sınav Listesine Dön
                </Link>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Question Form */}
                {/* Question Form */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-semibold mb-4 text-blue-800">1. Toplu Soru Yükle (Excel)</h2>
                        <QuestionUploadForm examId={examId} />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-semibold mb-4 text-green-800">2. Tekli Soru Ekle</h2>
                        <QuestionForm examId={examId} />
                    </div>
                </div>

                {/* Existing Questions */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-purple-800">Mevcut Sorular ({questions.length})</h2>
                    <QuestionList questions={questions} examId={examId} />
                </div>
            </div>
        </div>
    );
}
