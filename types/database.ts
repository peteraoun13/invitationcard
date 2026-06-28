export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AdminUser = {
  user_id: string;
  created_at: string;
};

export type Wedding = {
  id: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  created_at: string;
};

export type Family = {
  id: string;
  wedding_id: string;
  family_name: string;
  invite_token: string;
  created_at: string;
};

export type Guest = {
  id: string;
  family_id: string;
  guest_name: string;
  attending: boolean | null;
  created_at: string;
  updated_at: string;
};

export type RsvpSubmission = {
  id: string;
  family_id: string;
  submitted_at: string;
  notes: string | null;
};

export type GuestResponse = {
  id: string;
  submission_id: string;
  guest_id: string;
  attending: boolean;
};

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: AdminUser;
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      weddings: {
        Row: Wedding;
        Insert: {
          id?: string;
          bride_name: string;
          groom_name: string;
          wedding_date: string;
          created_at?: string;
        };
        Update: Partial<Omit<Wedding, "id" | "created_at">>;
        Relationships: [];
      };
      families: {
        Row: Family;
        Insert: {
          id?: string;
          wedding_id: string;
          family_name: string;
          invite_token: string;
          created_at?: string;
        };
        Update: Partial<Omit<Family, "id" | "wedding_id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "families_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      guests: {
        Row: Guest;
        Insert: {
          id?: string;
          family_id: string;
          guest_name: string;
          attending?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Guest, "id" | "family_id" | "created_at" | "updated_at">>;
        Relationships: [
          {
            foreignKeyName: "guests_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
        ];
      };
      rsvp_submissions: {
        Row: RsvpSubmission;
        Insert: {
          id?: string;
          family_id: string;
          submitted_at?: string;
          notes?: string | null;
        };
        Update: Partial<Omit<RsvpSubmission, "id" | "family_id" | "submitted_at">>;
        Relationships: [
          {
            foreignKeyName: "rsvp_submissions_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
        ];
      };
      guest_responses: {
        Row: GuestResponse;
        Insert: {
          id?: string;
          submission_id: string;
          guest_id: string;
          attending: boolean;
        };
        Update: Partial<Omit<GuestResponse, "id" | "submission_id" | "guest_id">>;
        Relationships: [
          {
            foreignKeyName: "guest_responses_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "rsvp_submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guest_responses_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      submit_family_rsvp: {
        Args: {
          p_invite_token: string;
          p_attending_guest_ids: string[];
          p_notes?: string | null;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
