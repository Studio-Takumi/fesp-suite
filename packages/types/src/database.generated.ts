export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: '14.5'
    }
    public: {
        Tables: {
            article_histories: {
                Row: {
                    article_id: string
                    content: Json
                    created_at: string
                    created_by: string | null
                    id: string
                    title: string
                    updated_at: string
                    version: number
                }
                Insert: {
                    article_id: string
                    content: Json
                    created_at?: string
                    created_by?: string | null
                    id?: string
                    title: string
                    updated_at?: string
                    version: number
                }
                Update: {
                    article_id?: string
                    content?: Json
                    created_at?: string
                    created_by?: string | null
                    id?: string
                    title?: string
                    updated_at?: string
                    version?: number
                }
                Relationships: [
                    {
                        foreignKeyName: 'article_histories_article_id_fkey'
                        columns: ['article_id']
                        isOneToOne: false
                        referencedRelation: 'articles'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'article_histories_created_by_fkey'
                        columns: ['created_by']
                        isOneToOne: false
                        referencedRelation: 'users'
                        referencedColumns: ['id']
                    },
                ]
            }
            article_schedules: {
                Row: {
                    article_id: string
                    created_at: string
                    created_by: string | null
                    publish_at: string
                    updated_at: string
                    version: number
                }
                Insert: {
                    article_id: string
                    created_at?: string
                    created_by?: string | null
                    publish_at: string
                    updated_at?: string
                    version: number
                }
                Update: {
                    article_id?: string
                    created_at?: string
                    created_by?: string | null
                    publish_at?: string
                    updated_at?: string
                    version?: number
                }
                Relationships: [
                    {
                        foreignKeyName: 'article_schedules_article_id_fkey'
                        columns: ['article_id']
                        isOneToOne: true
                        referencedRelation: 'articles'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'article_schedules_article_id_version_fkey'
                        columns: ['article_id', 'version']
                        isOneToOne: false
                        referencedRelation: 'article_histories'
                        referencedColumns: ['article_id', 'version']
                    },
                    {
                        foreignKeyName: 'article_schedules_created_by_fkey'
                        columns: ['created_by']
                        isOneToOne: false
                        referencedRelation: 'users'
                        referencedColumns: ['id']
                    },
                ]
            }
            article_tags: {
                Row: {
                    article_id: string
                    created_at: string
                    tag_id: string
                }
                Insert: {
                    article_id: string
                    created_at?: string
                    tag_id: string
                }
                Update: {
                    article_id?: string
                    created_at?: string
                    tag_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'article_tags_article_id_fkey'
                        columns: ['article_id']
                        isOneToOne: false
                        referencedRelation: 'articles'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'article_tags_tag_id_fkey'
                        columns: ['tag_id']
                        isOneToOne: false
                        referencedRelation: 'tags'
                        referencedColumns: ['id']
                    },
                ]
            }
            articles: {
                Row: {
                    created_at: string
                    created_by: string
                    event_id: string
                    id: string
                    latest_version: number
                    published_at: string | null
                    published_version: number | null
                    slug: string | null
                    status: Database['public']['Enums']['article_status']
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    created_by: string
                    event_id: string
                    id?: string
                    latest_version: number
                    published_at?: string | null
                    published_version?: number | null
                    slug?: string | null
                    status?: Database['public']['Enums']['article_status']
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    created_by?: string
                    event_id?: string
                    id?: string
                    latest_version?: number
                    published_at?: string | null
                    published_version?: number | null
                    slug?: string | null
                    status?: Database['public']['Enums']['article_status']
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'articles_created_by_fkey'
                        columns: ['created_by']
                        isOneToOne: false
                        referencedRelation: 'users'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'articles_event_id_fkey'
                        columns: ['event_id']
                        isOneToOne: false
                        referencedRelation: 'events'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'articles_latest_version_fkey'
                        columns: ['id', 'latest_version']
                        isOneToOne: false
                        referencedRelation: 'article_histories'
                        referencedColumns: ['article_id', 'version']
                    },
                    {
                        foreignKeyName: 'articles_published_version_fkey'
                        columns: ['id', 'published_version']
                        isOneToOne: false
                        referencedRelation: 'article_histories'
                        referencedColumns: ['article_id', 'version']
                    },
                ]
            }
            event_days: {
                Row: {
                    created_at: string
                    date: string
                    day: number
                    event_id: string
                    id: string
                    name: string | null
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    date: string
                    day: number
                    event_id: string
                    id?: string
                    name?: string | null
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    date?: string
                    day?: number
                    event_id?: string
                    id?: string
                    name?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'event_days_event_id_fkey'
                        columns: ['event_id']
                        isOneToOne: false
                        referencedRelation: 'events'
                        referencedColumns: ['id']
                    },
                ]
            }
            event_members: {
                Row: {
                    created_at: string
                    event_id: string
                    role: Database['public']['Enums']['event_member_role']
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    event_id: string
                    role: Database['public']['Enums']['event_member_role']
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    event_id?: string
                    role?: Database['public']['Enums']['event_member_role']
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'event_members_event_id_fkey'
                        columns: ['event_id']
                        isOneToOne: false
                        referencedRelation: 'events'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'event_members_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'users'
                        referencedColumns: ['id']
                    },
                ]
            }
            events: {
                Row: {
                    created_at: string
                    id: string
                    name: string
                    slug: string
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name: string
                    slug: string
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    name?: string
                    slug?: string
                    updated_at?: string
                }
                Relationships: []
            }
            places: {
                Row: {
                    building: string | null
                    created_at: string
                    event_id: string
                    floor: string | null
                    id: string
                    name: string
                    sort_order: number
                    updated_at: string
                }
                Insert: {
                    building?: string | null
                    created_at?: string
                    event_id: string
                    floor?: string | null
                    id?: string
                    name: string
                    sort_order?: number
                    updated_at?: string
                }
                Update: {
                    building?: string | null
                    created_at?: string
                    event_id?: string
                    floor?: string | null
                    id?: string
                    name?: string
                    sort_order?: number
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'places_event_id_fkey'
                        columns: ['event_id']
                        isOneToOne: false
                        referencedRelation: 'events'
                        referencedColumns: ['id']
                    },
                ]
            }
            tags: {
                Row: {
                    created_at: string
                    event_id: string
                    id: string
                    name: string
                    sort_order: number
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    event_id: string
                    id?: string
                    name: string
                    sort_order?: number
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    event_id?: string
                    id?: string
                    name?: string
                    sort_order?: number
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'tags_event_id_fkey'
                        columns: ['event_id']
                        isOneToOne: false
                        referencedRelation: 'events'
                        referencedColumns: ['id']
                    },
                ]
            }
            users: {
                Row: {
                    created_at: string
                    deleted_at: string | null
                    display_name: string | null
                    id: string
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    deleted_at?: string | null
                    display_name?: string | null
                    id: string
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    deleted_at?: string | null
                    display_name?: string | null
                    id?: string
                    updated_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            cancel_article_schedule: {
                Args: { target_article_id: string }
                Returns: boolean
            }
            create_article: {
                Args: { new_content: Json; new_title: string; target_event_id: string }
                Returns: string
            }
            publish_scheduled_articles: { Args: never; Returns: undefined }
            save_article: {
                Args: {
                    new_content: Json
                    new_status?: Database['public']['Enums']['article_status']
                    new_title: string
                    target_article_id: string
                }
                Returns: boolean
            }
            schedule_article: {
                Args: {
                    new_publish_at: string
                    target_article_id: string
                    target_version: number
                    version_updated_at: string
                }
                Returns: boolean
            }
        }
        Enums: {
            article_status: 'draft' | 'published'
            event_member_role: 'staff' | 'visitor'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
          ? R
          : never
      : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I
        }
          ? I
          : never
      : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U
        }
          ? U
          : never
      : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
    EnumName extends (DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never

export const Constants = {
    public: {
        Enums: {
            article_status: ['draft', 'published'],
            event_member_role: ['staff', 'visitor'],
        },
    },
} as const
