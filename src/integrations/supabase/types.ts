export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      bio_posts: {
        Row: {
          author_id: string;
          created_at: string;
          id: string;
          media_kind: string | null;
          media_url: string | null;
          place_id: string | null;
          text: string;
        };
        Insert: {
          author_id: string;
          created_at?: string;
          id?: string;
          media_kind?: string | null;
          media_url?: string | null;
          place_id?: string | null;
          text: string;
        };
        Update: {
          author_id?: string;
          created_at?: string;
          id?: string;
          media_kind?: string | null;
          media_url?: string | null;
          place_id?: string | null;
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bio_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bio_posts_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
        ];
      };
      places: {
        Row: {
          category: string | null;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          id: string;
          lat: number | null;
          lng: number | null;
          name: string;
          owner_id: string | null;
          slug: string | null;
        };
        Insert: {
          category?: string | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          name: string;
          owner_id?: string | null;
          slug?: string | null;
        };
        Update: {
          category?: string | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          name?: string;
          owner_id?: string | null;
          slug?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          age: number | null;
          bio: string | null;
          created_at: string;
          handle: string | null;
          headline: string | null;
          id: string;
          interests: string[];
          looks_for: string[];
          mood_emoji: string | null;
          mood_text: string | null;
          name: string | null;
          now_playing_kind: string | null;
          now_playing_subtitle: string | null;
          now_playing_title: string | null;
          photo_url: string | null;
          updated_at: string;
          vibe_tags: string[];
        };
        Insert: {
          age?: number | null;
          bio?: string | null;
          created_at?: string;
          handle?: string | null;
          headline?: string | null;
          id: string;
          interests?: string[];
          looks_for?: string[];
          mood_emoji?: string | null;
          mood_text?: string | null;
          name?: string | null;
          now_playing_kind?: string | null;
          now_playing_subtitle?: string | null;
          now_playing_title?: string | null;
          photo_url?: string | null;
          updated_at?: string;
          vibe_tags?: string[];
        };
        Update: {
          age?: number | null;
          bio?: string | null;
          created_at?: string;
          handle?: string | null;
          headline?: string | null;
          id?: string;
          interests?: string[];
          looks_for?: string[];
          mood_emoji?: string | null;
          mood_text?: string | null;
          name?: string | null;
          now_playing_kind?: string | null;
          now_playing_subtitle?: string | null;
          now_playing_title?: string | null;
          photo_url?: string | null;
          updated_at?: string;
          vibe_tags?: string[];
        };
        Relationships: [];
      };
      reel_comments: {
        Row: {
          author_id: string;
          created_at: string;
          id: string;
          reel_id: string;
          text: string;
        };
        Insert: {
          author_id: string;
          created_at?: string;
          id?: string;
          reel_id: string;
          text: string;
        };
        Update: {
          author_id?: string;
          created_at?: string;
          id?: string;
          reel_id?: string;
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reel_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reel_comments_reel_id_fkey";
            columns: ["reel_id"];
            isOneToOne: false;
            referencedRelation: "reels";
            referencedColumns: ["id"];
          },
        ];
      };
      reel_likes: {
        Row: {
          created_at: string;
          reel_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          reel_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          reel_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reel_likes_reel_id_fkey";
            columns: ["reel_id"];
            isOneToOne: false;
            referencedRelation: "reels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reel_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reels: {
        Row: {
          audio_label: string | null;
          author_id: string;
          caption: string | null;
          created_at: string;
          duration_s: number | null;
          id: string;
          place_id: string | null;
          poster_url: string | null;
          tagged_user_ids: string[];
          video_url: string;
        };
        Insert: {
          audio_label?: string | null;
          author_id: string;
          caption?: string | null;
          created_at?: string;
          duration_s?: number | null;
          id?: string;
          place_id?: string | null;
          poster_url?: string | null;
          tagged_user_ids?: string[];
          video_url: string;
        };
        Update: {
          audio_label?: string | null;
          author_id?: string;
          caption?: string | null;
          created_at?: string;
          duration_s?: number | null;
          id?: string;
          place_id?: string | null;
          poster_url?: string | null;
          tagged_user_ids?: string[];
          video_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reels_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reels_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          created_at: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          joined_at: string;
          user_id: string;
        };
        Insert: {
          conversation_id: string;
          joined_at?: string;
          user_id: string;
        };
        Update: {
          conversation_id?: string;
          joined_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          read_at: string | null;
          sender_id: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          data: Json | null;
          id: string;
          read: boolean;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          read?: boolean;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          read?: boolean;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rides: {
        Row: {
          created_at: string;
          driver_id: string | null;
          destination_address: string;
          destination_lat: number;
          destination_lng: number;
          id: string;
          origin_address: string;
          origin_lat: number;
          origin_lng: number;
          passenger_id: string;
          rating: number | null;
          rating_comment: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          driver_id?: string | null;
          destination_address: string;
          destination_lat: number;
          destination_lng: number;
          id?: string;
          origin_address: string;
          origin_lat: number;
          origin_lng: number;
          passenger_id: string;
          rating?: number | null;
          rating_comment?: string | null;
          status: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          driver_id?: string | null;
          destination_address?: string;
          destination_lat?: number;
          destination_lng?: number;
          id?: string;
          origin_address?: string;
          origin_lat?: number;
          origin_lng?: number;
          passenger_id?: string;
          rating?: number | null;
          rating_comment?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rides_passenger_id_fkey";
            columns: ["passenger_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      likes: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "bio_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      moments: {
        Row: {
          created_at: string;
          id: string;
          media_kind: string | null;
          media_url: string | null;
          text: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          media_kind?: string | null;
          media_url?: string | null;
          text: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          media_kind?: string | null;
          media_url?: string | null;
          text?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      compatibility: {
        Row: {
          created_at: string;
          score: number;
          user_id_1: string;
          user_id_2: string;
        };
        Insert: {
          created_at?: string;
          score: number;
          user_id_1: string;
          user_id_2: string;
        };
        Update: {
          created_at?: string;
          score?: number;
          user_id_1?: string;
          user_id_2?: string;
        };
        Relationships: [];
      };
      connection_requests: {
        Row: {
          created_at: string;
          from_user_id: string;
          id: string;
          status: string;
          to_user_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          from_user_id: string;
          id?: string;
          status: string;
          to_user_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          from_user_id?: string;
          id?: string;
          status?: string;
          to_user_id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          category: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          latitude: number | null;
          longitude: number | null;
          name: string;
          owner_id: string;
          phone: string | null;
          photo_url: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          owner_id: string;
          phone?: string | null;
          photo_url?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          owner_id?: string;
          phone?: string | null;
          photo_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          category: string | null;
          created_at: string;
          description: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          organizer_id: string;
          starts_at: string;
          title: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          organizer_id: string;
          starts_at: string;
          title: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          organizer_id?: string;
          starts_at?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey";
            columns: ["organizer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_users: {
        Row: {
          event_id: string;
          joined_at: string;
          user_id: string;
        };
        Insert: {
          event_id: string;
          joined_at?: string;
          user_id: string;
        };
        Update: {
          event_id?: string;
          joined_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_users_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_users_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      offers: {
        Row: {
          business_id: string;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          title: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          title: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offers_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      coupons: {
        Row: {
          created_at: string;
          id: string;
          offer_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          offer_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          offer_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coupons_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupons_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          rating: number;
          text: string | null;
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          rating: number;
          text?: string | null;
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          rating?: number;
          text?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_nearby_profiles: {
        Args: {
          p_lat: number;
          p_lng: number;
          p_radius_km: number;
        };
        Returns: {
          age: number | null;
          bio: string | null;
          created_at: string;
          handle: string | null;
          headline: string | null;
          id: string;
          interests: string[];
          looks_for: string[];
          mood_emoji: string | null;
          mood_text: string | null;
          name: string | null;
          now_playing_kind: string | null;
          now_playing_subtitle: string | null;
          now_playing_title: string | null;
          photo_url: string | null;
          updated_at: string;
          vibe_tags: string[];
        }[];
      };
      get_nearby_businesses: {
        Args: {
          p_latitude: number;
          p_longitude: number;
          p_radius_km: number;
        };
        Returns: {
          category: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          latitude: number | null;
          longitude: number | null;
          name: string;
          owner_id: string;
          phone: string | null;
          photo_url: string | null;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
