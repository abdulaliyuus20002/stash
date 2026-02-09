export interface User {
  id: string;
  email: string;
  name?: string;
  plan_type: string;
  is_pro?: boolean;
  created_at: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  url: string;
  title: string;
  thumbnail_url?: string | null;
  platform: string;
  content_type: string;
  notes: string;
  tags: string[];
  collections: string[];
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  item_count: number;
  created_at: string;
}

export interface MetadataResponse {
  title: string;
  thumbnail_url?: string | null;
  platform: string;
  content_type: string;
  suggested_tags: string[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
