export type MessageType = "text" | "image" | "sticker";
export type MemberStatus = "pending" | "approved";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      room_members: {
        Row: {
          room_id: string;
          user_id: string;
          status: MemberStatus;
          joined_at: string;
        };
        Insert: {
          room_id: string;
          user_id: string;
          status?: MemberStatus;
          joined_at?: string;
        };
        Update: {
          room_id?: string;
          user_id?: string;
          status?: MemberStatus;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: number;
          room_id: string;
          sender_id: string;
          type: MessageType;
          content: string | null;
          image_url: string | null;
          sticker_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          room_id: string;
          sender_id: string;
          type: MessageType;
          content?: string | null;
          image_url?: string | null;
          sticker_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          room_id?: string;
          sender_id?: string;
          type?: MessageType;
          content?: string | null;
          image_url?: string | null;
          sticker_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type RoomMember = Database["public"]["Tables"]["room_members"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

/** Một phòng chat kèm preview cho sidebar (tin nhắn cuối + số thành viên). */
export interface RoomWithPreview extends Room {
  member_count: number;
  last_message: Message | null;
  /** Trạng thái CỦA NGƯỜI ĐANG XEM trong phòng này — 'pending' nếu còn chờ chủ phòng duyệt. */
  my_status: MemberStatus;
}
