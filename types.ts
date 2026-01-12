
export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  name: string;
  photo?: string;
  phone?: string;
  address?: string;
  email?: string;
  isDeleted?: boolean;
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

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
}

export interface DaiImage {
  id: string;
  url: string;
  title: string;
  timestamp: number;
}

export type DaiEntryStatus = 'waiting' | 'out' | 'in' | 'trash';

export interface DaiEntry {
  id: string;
  diNumber: string;
  date: string;
  details: string;
  photo?: string;
  createdAt: number;
  status: DaiEntryStatus;
}
