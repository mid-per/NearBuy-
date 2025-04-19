// src/types/transaction.d.ts
export interface Transaction {
    id: number;
    listing_id: number;
    buyer_id: number;
    seller_id: number;
    completed: boolean;
    completed_at?: string;
    rating?: number;
    listing?: {
      id: number;
      title: string;
      price: number;
      image_url?: string;
      status?: string;
    };
    seller?: {
      id: number;
      name?: string;
      avatar?: string;
    };
  }