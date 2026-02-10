import Link from 'next/link';

export default function AdminDashboard() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Yönetim Paneli</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/admin/videos" className="block p-6 bg-white border rounded-lg hover:shadow-md transition">
                    <h2 className="text-xl font-semibold mb-2">Video Yönetimi</h2>
                    <p className="text-gray-600">Yeni eğitim videoları yükle, mevcut videoları düzenle.</p>
                </Link>

                <Link href="/admin/exams" className="block p-6 bg-white border rounded-lg hover:shadow-md transition">
                    <h2 className="text-xl font-semibold mb-2">Sınav Yönetimi</h2>
                    <p className="text-gray-600">Yeni sınavlar oluştur, soru ekle ve düzenle.</p>
                </Link>

                <Link href="/admin/stats" className="block p-6 bg-white border rounded-lg hover:shadow-md transition">
                    <h2 className="text-xl font-semibold mb-2">İstatistikler</h2>
                    <p className="text-gray-600">Kullanıcı ilerlemelerini ve sınav sonuçlarını görüntüle.</p>
                </Link>
            </div>
        </div>
    );
}
