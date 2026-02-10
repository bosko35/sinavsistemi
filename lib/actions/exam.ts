'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getExamForVideo(videoId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('exams')
        .select('id, title')
        .eq('video_id', videoId)
        .single()

    if (error) return null
    return data
}

export async function getExamWithQuestions(examId: string) {
    const supabase = await createClient()

    // 1. Get Exam Details
    const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

    if (examError || !exam) return null

    // 2. Get Questions
    const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select(`
            *,
            question_options (*)
        `)
        .eq('exam_id', examId)
        .order('order', { ascending: true })

    if (questionsError) return null

    // Sort options by order
    questions?.forEach(q => {
        if (q.question_options) {
            q.question_options.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        }
    })

    return { exam, questions }
}

export async function startExamAttempt(examId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Check if there is an active unfinished attempt? 
    // For now, let's just create a new attempt.

    const { data, error } = await supabase
        .from('user_exam_attempts')
        .insert({
            user_id: user.id,
            exam_id: examId,
            started_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) return { error: error.message }
    return { success: true, attemptId: data.id }
}

export async function submitExamAttempt(attemptId: string, answers: { questionId: string, optionId: string }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Fetch correct answers to calculate score
    // This should ideally be done in a secure way (e.g. Postgres function) but we can do it here for now.

    // 1. Get attempt to verify user
    const { data: attempt, error: attemptError } = await supabase
        .from('user_exam_attempts')
        .select('*, exams(passing_score)')
        .eq('id', attemptId)
        .single()

    if (attemptError || attempt.user_id !== user.id) return { error: 'Invalid attempt' }

    if (attempt.completed_at) return { error: 'Exam already submitted' }

    // 2. Get all correct options for the questions in this exam
    // We need to fetch questions for this exam first
    const { data: questions } = await supabase
        .from('questions')
        .select('id, points, question_options(id, is_correct)')
        .eq('exam_id', attempt.exam_id)

    if (!questions) return { error: 'Questions not found' }

    let totalScore = 0
    let maxScore = 0
    const answersToInsert: any[] = []

    // Map for quick lookup
    const questionMap = new Map(questions.map(q => [q.id, q]))

    for (const ans of answers) {
        const question = questionMap.get(ans.questionId)
        if (!question) continue

        const selectedOption = question.question_options.find((o: any) => o.id === ans.optionId)
        const isCorrect = selectedOption?.is_correct || false

        if (isCorrect) {
            totalScore += question.points || 0
        }

        answersToInsert.push({
            attempt_id: attemptId,
            question_id: ans.questionId,
            selected_option_id: ans.optionId,
            is_correct: isCorrect
        })
    }

    // Calculate max score
    questions.forEach(q => maxScore += q.points || 0)

    // Determine pass/fail
    // If maxScore is 0 (no questions?), pass.
    // passing_score is usually a percentage (e.g. 70)
    // Wait, typical passing_score in schemas is percentage (70) or points?
    // Schema says "integer default 70". Let's assume percentage for now.

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const passed = percentage >= (attempt.exams?.passing_score || 70)

    // 3. Save answers
    if (answersToInsert.length > 0) {
        const { error: ansError } = await supabase
            .from('user_exam_answers')
            .insert(answersToInsert)

        if (ansError) console.error("Error saving answers", ansError)
    }

    // 4. Update attempt
    const { error: updateError } = await supabase
        .from('user_exam_attempts')
        .update({
            score: totalScore, // Or percentage? Let's store raw score
            passed: passed,
            completed_at: new Date().toISOString()
        })
        .eq('id', attemptId)

    if (updateError) return { error: updateError.message }

    revalidatePath(`/exam/${attempt.exam_id}/result`)
    return { success: true, passed, score: totalScore, total: maxScore, percentage }
}
