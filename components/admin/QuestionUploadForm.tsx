'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { uploadQuestionsFromExcel } from '@/app/(dashboard)/admin/actions'
import * as XLSX from 'xlsx'

export function QuestionUploadForm({ examId }: { examId: string }) {
    const [uploading, setUploading] = useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)

        try {
            const reader = new FileReader()
            reader.onload = async (evt) => {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws)

                // Veriyi işle ve sunucuya gönder
                const result = await uploadQuestionsFromExcel(examId, data)

                if (result.success) {
                    alert(`${result.count} soru başarıyla yüklendi!`)
                    window.location.reload()
                } else {
                    alert('Hata: ' + result.error)
                }
                setUploading(false)
            }
            reader.readAsBinaryString(file)

        } catch (error: any) {
            console.error(error)
            alert('Dosya okunurken hata oluştu.')
            setUploading(false)
        }
    }

    return (
        <div className="border border-dashed p-6 rounded-lg bg-slate-50 text-center space-y-4">
            <h3 className="font-semibold text-lg">Toplu Soru Yükle (Excel)</h3>
            <p className="text-sm text-muted-foreground">
                Excel dosyanız şu sütunlara sahip olmalıdır:<br />
                <code>Soru Metni</code>, <code>A Şıkkı</code>, <code>B Şıkkı</code>, <code>C Şıkkı</code>, <code>D Şıkkı</code>, <code>Doğru Şık (A,B,C,D)</code>, <code>Puan</code>
            </p>

            <div className="flex justify-center">
                <Input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="max-w-xs"
                />
            </div>

            {uploading && <p className="text-sm text-blue-600">Yükleniyor...</p>}
        </div>
    )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        />
    )
}
