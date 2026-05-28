import type { Captions } from "@/lib/slides";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          template_id: string;
          captions: Captions;
          image_urls: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          template_id?: string;
          captions?: Captions;
          image_urls?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          template_id?: string;
          captions?: Captions;
          image_urls?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      slides: {
        Row: {
          id: string;
          project_id: string;
          slide_key: string;
          caption: string;
          image_url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          slide_key: string;
          caption?: string;
          image_url?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          caption?: string;
          image_url?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      exports: {
        Row: {
          id: string;
          project_id: string | null;
          user_id: string;
          format: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          user_id: string;
          format?: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string;
          event_name: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_name: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
