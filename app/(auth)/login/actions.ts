'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const tc_no = formData.get('tc_no') as string
    const password = formData.get('password') as string

    // We are using a fake email format for TC logins since Supabase Auth requires email
    const email = `${tc_no}@sinavsistemi.local`

    // MOCK MODE: Bypass auth if using placeholder keys
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
        if (tc_no === '11111111111' && password === '123456') {
            // Simulate successful login
            revalidatePath('/', 'layout')
            redirect('/dashboard')
        } else {
            return { error: 'Mock Mode: TC: 11111111111, Şifre: 123456 kullanın.' }
        }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: 'Giriş başarısız. TC veya şifre hatalı.' }
    }

    // Check user role to redirect appropriately - fetching profile
    // For now, default redirect to dashboard, can be enhanced with role check later
    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
