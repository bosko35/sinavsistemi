'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getModules() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('order', { ascending: true })

    if (error) {
        console.error('Error fetching modules:', error)
        return []
    }

    return data
}

export async function createModule(formData: FormData) {
    const supabase = await createClient()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const order = parseInt(formData.get('order') as string)

    const { error } = await supabase
        .from('modules')
        .insert({ title, description, order })

    if (error) {
        console.error('Error creating module:', error)
        return { error: error.message }
    }

    revalidatePath('/admin/videos')
    return { success: true }
}

export async function createVideo(data: {
    moduleId: string
    title: string
    description: string
    videoUrl: string
    duration: number
    order: number
}) {
    const supabase = await createClient()

    const { error } = await supabase.from('videos').insert({
        module_id: data.moduleId,
        title: data.title,
        description: data.description,
        video_url: data.videoUrl,
        duration: data.duration,
        order: data.order,
    })

    if (error) {
        console.error('Error creating video:', error)
        return { error: error.message }
    }

    revalidatePath('/admin/videos')
    return { success: true }
}

export async function getExams() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('exams')
        .select(`
      *,
      modules (title)
    `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching exams:', error)
        return []
    }

    return data
}

export async function createExam(data: {
    moduleId: string
    videoId?: string
    title: string
    description: string
    passingScore: number
    duration: number
}) {
    const supabase = await createClient()

    const { error } = await supabase.from('exams').insert({
        module_id: data.moduleId,
        video_id: data.videoId || null,
        title: data.title,
        description: data.description,
        passing_score: data.passingScore,
        duration_minutes: data.duration,
    })

    if (error) {
        console.error('Error creating exam:', error)
        return { error: error.message }
    }

    revalidatePath('/admin/exams')
    return { success: true }
}

export async function getVideosByModule(moduleId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('videos')
        .select('id, title')
        .eq('module_id', moduleId)
        .order('order', { ascending: true })

    if (error) {
        console.error('Error fetching videos:', error)
        return []
    }
    return data
}

export async function getExam(examId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

    if (error) {
        console.error('Error fetching exam:', error)
        return null
    }

    return data
}

export async function createQuestion(data: {
    examId: string
    questionText: string
    questionType: 'multiple_choice' | 'true_false'
    points: number
    options: { text: string; isCorrect: boolean }[]
}) {
    const supabase = await createClient()

    // 1. Create Question
    const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .insert({
            exam_id: data.examId,
            question_text: data.questionText,
            question_type: data.questionType,
            points: data.points,
        })
        .select()
        .single()

    if (questionError) {
        return { error: questionError.message }
    }

    // 2. Create Options
    const optionsToInsert = data.options.map((opt, index) => ({
        question_id: questionData.id,
        option_text: opt.text,
        is_correct: opt.isCorrect,
        order: index,
    }))

    const { error: optionsError } = await supabase
        .from('question_options')
        .insert(optionsToInsert)

    if (optionsError) {
        return { error: optionsError.message }
    }

    revalidatePath(`/admin/exams/${data.examId}`)
    return { success: true }
}

export async function getQuestions(examId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('questions')
        .select(`
      *,
      question_options (*)
    `)
        .eq('exam_id', examId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching questions:', error)
        return []
    }

    return data
}

export async function deleteQuestion(questionId: string, examId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

    if (error) {
        console.error('Error deleting question:', error)
        return { error: error.message }
    }

    revalidatePath(`/admin/exams/${examId}`)
    return { success: true }
}

export async function uploadQuestionsFromExcel(examId: string, data: any[]) {
    const supabase = await createClient()
    let successCount = 0
    let errors = []

    // Beklenen format:
    // Soru Metni | A Şıkkı | B Şıkkı | C Şıkkı | D Şıkkı | Doğru Şık (A,B,C,D) | Puan

    // Yardımcı fonksiyon: Case-insensitive key lookup
    const getValue = (row: any, candidates: string[]) => {
        const rowKeys = Object.keys(row);
        for (const candidate of candidates) {
            // Direkt eşleşme
            if (row[candidate] !== undefined) return row[candidate];

            // Case-insensitive eşleşme
            const foundKey = rowKeys.find(k => k.trim().toLowerCase() === candidate.trim().toLowerCase());
            if (foundKey && row[foundKey] !== undefined) return row[foundKey];
        }
        return undefined;
    };

    for (const row of data) {
        try {
            // Excel başlıklarını kontrol et (Esnek eşleşme)
            const questionText = getValue(row, ['Soru Metni', 'Question', 'Soru', 'soru metni', 'Soru metni']);
            const optA = getValue(row, ['A Şıkkı', 'Option A', 'A', 'a şıkkı']);
            const optB = getValue(row, ['B Şıkkı', 'Option B', 'B', 'b şıkkı']);
            const optC = getValue(row, ['C Şıkkı', 'Option C', 'C', 'c şıkkı']);
            const optD = getValue(row, ['D Şıkkı', 'Option D', 'D', 'd şıkkı']);
            const correctOpt = getValue(row, ['Doğru Şık', 'Doğru Şık (A,B,C,D)', 'Correct Answer', 'Cevap', 'Doğru', 'doğru şık']);
            const points = getValue(row, ['Puan', 'Points', 'puan']) || 10;

            if (!questionText || !optA || !optB || !correctOpt) {
                console.warn("Eksik veri, satır atlanıyor:", JSON.stringify(row));
                errors.push(`Satır eksik veri içeriyor veya format hatalı: ${JSON.stringify(row).substring(0, 50)}...`);
                continue
            }

            // 1. Soruyu Ekle
            const { data: qData, error: qError } = await supabase
                .from('questions')
                .insert({
                    exam_id: examId,
                    question_text: questionText,
                    question_type: 'multiple_choice',
                    points: parseInt(points) || 10
                })
                .select()
                .single()

            if (qError) throw new Error(qError.message)

            // 2. Seçenekleri Hazırla
            const options = [
                { text: optA, key: 'A' },
                { text: optB, key: 'B' },
                { text: optC, key: 'C' },
                { text: optD, key: 'D' },
            ].filter(o => o.text) // Boş olmayanları al

            // Doğru şıkkı temizle (boşlukları sil, büyük harfe çevir)
            const correctKey = String(correctOpt).trim().toUpperCase().charAt(0) // Sadece ilk harfi al (A, B...)

            const optionsToInsert = options.map((opt, idx) => ({
                question_id: qData.id,
                option_text: opt.text,
                is_correct: opt.key === correctKey,
                order: idx
            }))

            const { error: oError } = await supabase
                .from('question_options')
                .insert(optionsToInsert)

            if (oError) throw new Error(oError.message)

            successCount++

        } catch (err: any) {
            console.error("Satır hatası:", err)
            errors.push(err.message)
        }
    }

    revalidatePath(`/admin/exams/${examId}`)
    return { success: true, count: successCount, errors: errors.length > 0 ? errors : undefined }
}
