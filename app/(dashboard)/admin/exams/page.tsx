import Link from 'next/link';
import { getExams, getModules } from '@/app/(dashboard)/admin/actions';
import { CreateExamForm } from '@/components/admin/CreateExamForm';

export default async function ExamsPage() {
    const exams = await getExams();
    const modules = await getModules();

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Sınav Yönetimi</h1>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Create Exam Form */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Yeni Sınav Oluştur</h2>
                    <CreateExamForm modules={modules} />
                </div>

                {/* List Exams */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Mevcut Sınavlar</h2>
                    <div className="space-y-4">
                        {exams.length === 0 ? (
                            <p className="text-gray-500">Henüz sınav oluşturulmamış.</p>
                        ) : (
                            exams.map((exam: any) => (
                                <div key={exam.id} className="bg-white p-4 border rounded shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg">{exam.title}</h3>
                                            <p className="text-sm text-gray-600 mb-1">{exam.description || 'Açıklama yok'}</p>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                Modül: {exam.modules?.title || 'Bilinmiyor'}
                                            </span>
                                        </div>
                                        <Link
                                            href={`/admin/exams/${exam.id}`}
                                            className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800"
                                        >
                                            Soru Ekle
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
