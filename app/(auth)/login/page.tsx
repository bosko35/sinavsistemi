'use client'

import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useActionState } from 'react'

// Initial state for useActionState since we need to handle server errors
const initialState = {
    error: '' as string | null
}

export default function LoginPage() {
    // using a wrapper to match the signature expected by useActionState 
    // since 'login' action redirects on success and returns object on failure
    const [state, formAction, isPending] = useActionState(async (_prevState: any, formData: FormData) => {
        const result = await login(formData)
        if (result?.error) {
            return { error: result.error }
        }
        return { error: null }
    }, initialState)

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Giriş Yap</CardTitle>
                    <CardDescription className="text-center">
                        Devam etmek için TC Kimlik Numaranızı ve şifrenizi giriniz.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="tc_no">TC Kimlik No</Label>
                            <Input
                                id="tc_no"
                                name="tc_no"
                                placeholder="11122233344"
                                required
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Şifre</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                            />
                        </div>

                        {state?.error && (
                            <div className="text-sm text-red-500 font-medium text-center">
                                {state.error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
