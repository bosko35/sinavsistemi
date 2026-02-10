import { getModules } from '@/app/(dashboard)/admin/actions'
import { VideoUploadForm } from '@/components/admin/video-upload-form'
import { CreateModuleForm } from '@/components/admin/CreateModuleForm'

export default async function VideosAdminPage() {
    const modules = await getModules()

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Video ve Modül Yönetimi</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Sol Kolon: Video Yükleme */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-blue-800">1. Video Yükle</h2>
                    {modules.length === 0 ? (
                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 mb-4">
                            Önce sağ taraftan bir modül oluşturmalısın!
                        </div>
                    ) : null}
                    <VideoUploadForm modules={modules} />
                </div>

                {/* Sağ Kolon: Modül Oluşturma ve Listeleme */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-green-800">2. Yeni Modül Oluştur</h2>
                    <CreateModuleForm />

                    <h3 className="font-semibold text-lg mt-8 mb-4">Mevcut Modüller</h3>
                    <ul className="space-y-2 max-h-[400px] overflow-y-auto">
                        {modules.length === 0 ? (
                            <li className="text-gray-500 italic">Henüz modül yok.</li>
                        ) : (
                            modules.map((module) => (
                                <li key={module.id} className="p-3 border rounded shadow-sm bg-white flex justify-between items-center">
                                    <div>
                                        <span className="font-medium block">{module.title}</span>
                                        <span className="text-gray-500 text-xs">{module.description || '-'}</span>
                                    </div>
                                    <span className="bg-gray-100 text-xs px-2 py-1 rounded">Sıra: {module.order}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}
