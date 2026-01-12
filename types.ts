
export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  name: string;
  photo?: string;
  phone?: string;
  address?: string;
  email?: string;
}

export interface AppSettings {
  primaryTitle: string;
  secondaryTitle: string;
}

export interface InventoryEntry {
  id: string;
  userId: string;
  invoiceNumber: string;
  weight: number;
  description: string;
  createdAt: number;
  isDeleted: boolean;
  category?: string;
  quantity?: number;
  date?: string;
  photo?: string;
}

export interface Note {
  id: string;
  content: string;
  timestamp: number;
}
