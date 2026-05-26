export type DesignView = "front" | "back" | "left" | "right";

export type ProductType = "oversize-tshirt" | "hoodie";

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
}

export interface DesignProject {
  id: string;
  user_id: string;
  title: string;
  product_type: ProductType;
  thumbnail_url?: string;
  canvas_data?: Record<DesignView, unknown>;
  created_at: string;
  updated_at: string;
}
