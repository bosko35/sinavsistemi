export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    tc_no: string
                    full_name: string | null
                    role: 'admin' | 'worker'
                    is_first_login: boolean
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    tc_no: string
                    full_name?: string | null
                    role?: 'admin' | 'worker'
                    is_first_login?: boolean
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    tc_no?: string
                    full_name?: string | null
                    role?: 'admin' | 'worker'
                    is_first_login?: boolean
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            modules: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    order: number
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    order?: number
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    order?: number
                    created_at?: string | null
                }
                Relationships: []
            }
            videos: {
                Row: {
                    id: string
                    module_id: string
                    title: string
                    description: string | null
                    video_url: string
                    duration: number
                    order: number
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    module_id: string
                    title: string
                    description?: string | null
                    video_url: string
                    duration: number
                    order?: number
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    module_id?: string
                    title?: string
                    description?: string | null
                    video_url?: string
                    duration?: number
                    order?: number
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "videos_module_id_fkey"
                        columns: ["module_id"]
                        referencedRelation: "modules"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_progress: {
                Row: {
                    id: string
                    user_id: string
                    video_id: string
                    status: 'started' | 'completed'
                    last_watched_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    video_id: string
                    status?: 'started' | 'completed'
                    last_watched_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    video_id?: string
                    status?: 'started' | 'completed'
                    last_watched_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "user_progress_video_id_fkey"
                        columns: ["video_id"]
                        referencedRelation: "videos"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_progress_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
