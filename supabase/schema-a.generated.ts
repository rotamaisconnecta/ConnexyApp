export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bio_posts: {
        Row: {
          author_id: string
          created_at: string
          id: string
          media_kind: string | null
          media_url: string | null
          place_id: string | null
          text: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          media_kind?: string | null
          media_url?: string | null
          place_id?: string | null
          text: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          media_kind?: string | null
          media_url?: string | null
          place_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bio_posts_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string
          category: string
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          address: string
          category: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          address?: string
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carona_offers: {
        Row: {
          available_seats: number
          created_at: string
          destination: string
          id: string
          meetup: string
          origin: string
          owner_id: string
          ride_date: string
          ride_time: string
          status: string
          updated_at: string
        }
        Insert: {
          available_seats: number
          created_at?: string
          destination: string
          id?: string
          meetup: string
          origin: string
          owner_id: string
          ride_date: string
          ride_time: string
          status: string
          updated_at?: string
        }
        Update: {
          available_seats?: number
          created_at?: string
          destination?: string
          id?: string
          meetup?: string
          origin?: string
          owner_id?: string
          ride_date?: string
          ride_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carona_offers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carona_requests: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          requester_id: string
          ride_offer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          requester_id: string
          ride_offer_id: string
          status: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          requester_id?: string
          ride_offer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carona_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carona_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carona_requests_ride_offer_id_fkey"
            columns: ["ride_offer_id"]
            isOneToOne: false
            referencedRelation: "carona_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          responded_at: string | null
          status: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          responded_at?: string | null
          status?: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          responded_at?: string | null
          status?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          connected_at: string
          conversation_id: string | null
          id: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          connected_at?: string
          conversation_id?: string | null
          id?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          connected_at?: string
          conversation_id?: string | null
          id?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          gesture_handled_at: string | null
          id: string
          invited_at: string
          joined_at: string
          last_read_at: string | null
          pinned: boolean
          responded_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          gesture_handled_at?: string | null
          id?: string
          invited_at?: string
          joined_at?: string
          last_read_at?: string | null
          pinned?: boolean
          responded_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          gesture_handled_at?: string | null
          id?: string
          invited_at?: string
          joined_at?: string
          last_read_at?: string | null
          pinned?: boolean
          responded_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          kind: string
          last_message_at: string | null
          last_message_kind: string | null
          last_message_text: string | null
          name: string | null
          source_conversation_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          kind?: string
          last_message_at?: string | null
          last_message_kind?: string | null
          last_message_text?: string | null
          name?: string | null
          source_conversation_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          last_message_at?: string | null
          last_message_kind?: string | null
          last_message_text?: string | null
          name?: string | null
          source_conversation_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          business_id: string | null
          capacity: number | null
          created_at: string
          description: string | null
          end_at: string | null
          id: string
          location: string
          owner_id: string
          photo_url: string | null
          price: number | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          end_at?: string | null
          id?: string
          location: string
          owner_id: string
          photo_url?: string | null
          price?: number | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string
          owner_id?: string
          photo_url?: string | null
          price?: number | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          kind: string
          media_bucket: string | null
          media_duration_ms: number | null
          media_mime: string | null
          media_path: string | null
          payload: Json | null
          sender_id: string
          shared_entity_id: string | null
          shared_entity_type: string | null
          text: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          kind?: string
          media_bucket?: string | null
          media_duration_ms?: number | null
          media_mime?: string | null
          media_path?: string | null
          payload?: Json | null
          sender_id: string
          shared_entity_id?: string | null
          shared_entity_type?: string | null
          text?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          kind?: string
          media_bucket?: string | null
          media_duration_ms?: number | null
          media_mime?: string | null
          media_path?: string | null
          payload?: Json | null
          sender_id?: string
          shared_entity_id?: string | null
          shared_entity_type?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          discount_value: number
          id: string
          owner_id: string
          title: string
          updated_at: string
          valid_until: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          discount_value: number
          id?: string
          owner_id: string
          title: string
          updated_at?: string
          valid_until: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          discount_value?: number
          id?: string
          owner_id?: string
          title?: string
          updated_at?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          hours: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          owner_id: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          address?: string
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          hours?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          owner_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          hours?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          owner_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "places_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          category: string | null
          created_at: string
          hashtags: string[]
          id: string
          location_label: string | null
          media: Json
          privacy: string
          text: string | null
        }
        Insert: {
          author_id: string
          category?: string | null
          created_at?: string
          hashtags?: string[]
          id?: string
          location_label?: string | null
          media?: Json
          privacy: string
          text?: string | null
        }
        Update: {
          author_id?: string
          category?: string | null
          created_at?: string
          hashtags?: string[]
          id?: string
          location_label?: string | null
          media?: Json
          privacy?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_private: {
        Row: {
          birth_date: string | null
          home_address: string | null
          updated_at: string
          user_id: string
          work_address: string | null
        }
        Insert: {
          birth_date?: string | null
          home_address?: string | null
          updated_at?: string
          user_id: string
          work_address?: string | null
        }
        Update: {
          birth_date?: string | null
          home_address?: string | null
          updated_at?: string
          user_id?: string
          work_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          bio: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          handle: string
          headline: string | null
          id: string
          interests: string[]
          locale: string | null
          looks_for: string[]
          mood_emoji: string | null
          mood_text: string | null
          name: string
          now_playing_kind: string | null
          now_playing_subtitle: string | null
          now_playing_title: string | null
          photo_url: string | null
          updated_at: string
          vibe_tags: string[]
          visibility: Json
        }
        Insert: {
          age?: number | null
          bio?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          handle: string
          headline?: string | null
          id: string
          interests?: string[]
          locale?: string | null
          looks_for?: string[]
          mood_emoji?: string | null
          mood_text?: string | null
          name: string
          now_playing_kind?: string | null
          now_playing_subtitle?: string | null
          now_playing_title?: string | null
          photo_url?: string | null
          updated_at?: string
          vibe_tags?: string[]
          visibility?: Json
        }
        Update: {
          age?: number | null
          bio?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          handle?: string
          headline?: string | null
          id?: string
          interests?: string[]
          locale?: string | null
          looks_for?: string[]
          mood_emoji?: string | null
          mood_text?: string | null
          name?: string
          now_playing_kind?: string | null
          now_playing_subtitle?: string | null
          now_playing_title?: string | null
          photo_url?: string | null
          updated_at?: string
          vibe_tags?: string[]
          visibility?: Json
        }
        Relationships: []
      }
      reel_comments: {
        Row: {
          author_id: string
          created_at: string
          id: string
          parent_id: string | null
          reel_id: string
          sibling_order: number | null
          text: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          parent_id?: string | null
          reel_id: string
          sibling_order?: number | null
          text: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          reel_id?: string
          sibling_order?: number | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "reel_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comments_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_likes: {
        Row: {
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_likes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          audio_label: string | null
          author_id: string
          caption: string
          category: string
          context_id: string | null
          context_title: string | null
          context_type: string | null
          created_at: string
          duration_s: number
          id: string
          place_id: string | null
          poster_url: string | null
          tagged_user_ids: string[]
          video_url: string
        }
        Insert: {
          audio_label?: string | null
          author_id: string
          caption?: string
          category?: string
          context_id?: string | null
          context_title?: string | null
          context_type?: string | null
          created_at?: string
          duration_s?: number
          id?: string
          place_id?: string | null
          poster_url?: string | null
          tagged_user_ids?: string[]
          video_url: string
        }
        Update: {
          audio_label?: string | null
          author_id?: string
          caption?: string
          category?: string
          context_id?: string | null
          context_title?: string | null
          context_type?: string | null
          created_at?: string
          duration_s?: number
          id?: string
          place_id?: string | null
          poster_url?: string | null
          tagged_user_ids?: string[]
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "reels_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reels_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          party_size: number
          place_id: string | null
          resource_name: string
          resource_type: string
          slot_date: string
          slot_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          party_size: number
          place_id?: string | null
          resource_name: string
          resource_type: string
          slot_date: string
          slot_time: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          party_size?: number
          place_id?: string | null
          resource_name?: string
          resource_type?: string
          slot_date?: string
          slot_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saves: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_locations: {
        Row: {
          accuracy_m: number | null
          discoverable: boolean
          latitude: number
          longitude: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_m?: number | null
          discoverable?: boolean
          latitude: number
          longitude: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_m?: number | null
          discoverable?: boolean
          latitude?: number
          longitude?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          last_seen_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          last_seen_at?: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          last_seen_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_connected: {
        Args: { p_user_a: string; p_user_b: string }
        Returns: boolean
      }
      block_user: { Args: { blocked_id: string }; Returns: undefined }
      cancel_connection_request: {
        Args: { request_id: string }
        Returns: {
          created_at: string
          from_user_id: string
          id: string
          responded_at: string | null
          status: string
          to_user_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "connection_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      find_pending_request_for_receiver: {
        Args: { p_sender_id: string }
        Returns: string
      }
      get_direct_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      get_nearby_profiles: {
        Args: { p_limit?: number; p_radius_km?: number }
        Returns: {
          age: number
          common_interests: string[]
          common_looks_for: string[]
          common_vibe_tags: string[]
          compatibility_score: number
          distance_km: number
          handle: string
          headline: string
          id: string
          name: string
          photo_url: string
          proximity_tier: string
        }[]
      }
      is_blocked_between: {
        Args: { p_user_a: string; p_user_b: string }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { p_conversation_id: string; p_user_id?: string }
        Returns: boolean
      }
      remove_connection: { Args: { connection_id: string }; Returns: undefined }
      respond_to_connection_request: {
        Args: { decision: string; request_id: string }
        Returns: {
          created_at: string
          from_user_id: string
          id: string
          responded_at: string | null
          status: string
          to_user_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "connection_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      send_connection_request: {
        Args: { receiver_id: string }
        Returns: {
          created_at: string
          from_user_id: string
          id: string
          responded_at: string | null
          status: string
          to_user_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "connection_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      unblock_user: { Args: { blocked_id: string }; Returns: undefined }
    }
    Enums: {
      connection_request_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "canceled"
      conversation_kind: "direct"
      message_kind: "text" | "share" | "audio" | "system"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      connection_request_status: [
        "pending",
        "accepted",
        "rejected",
        "canceled",
      ],
      conversation_kind: ["direct"],
      message_kind: ["text", "share", "audio", "system"],
    },
  },
} as const

