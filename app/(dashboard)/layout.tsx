import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserCircle } from "lucide-react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()

    let fullName = "Misafir Kullanıcı"

    // MOCK MODE CHECK
    const isMockMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')

    if (isMockMode) {
        fullName = "Ahmet Yılmaz (Demo)"
    } else {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single()

                if (profile?.full_name) {
                    fullName = profile.full_name
                } else {
                    fullName = user.email ? user.email.split('@')[0] : "Çalışan"
                }
            }
        } catch (e) {
            console.error("Layout auth fetch error", e)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="font-bold text-xl flex items-center gap-2">
                        <span>🏭 Fabrika Eğitim</span>
                    </Link>
                    <Link href="/admin" className="text-sm font-medium hover:text-blue-600 transition-colors">
                        Yönetim Paneli
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                        <span>{fullName}</span>
                    </div>
                    {/* Logout button form/action could go here */}
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/">Çıkış</Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1">
                {children}
            </main>
        </div>
    )
}
