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
          nome: string
          telefone: string
          endereco: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome: string
          telefone: string
          endereco?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          telefone?: string
          endereco?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pets: {
        Row: {
          id: string
          nome: string
          especie: string
          raca: string
          idade: number
          sexo: string
          cor: string
          foto_url: string | null
          informacoes: string | null
          localizacao: string
          qr_code_url: string
          profile_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          especie: string
          raca: string
          idade: number
          sexo: string
          cor: string
          foto_url?: string | null
          informacoes?: string | null
          localizacao: string
          qr_code_url?: string
          profile_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          especie?: string
          raca?: string
          idade?: number
          sexo?: string
          cor?: string
          foto_url?: string | null
          informacoes?: string | null
          localizacao?: string
          qr_code_url?: string
          profile_id?: string
          created_at?: string
          updated_at?: string
        }
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