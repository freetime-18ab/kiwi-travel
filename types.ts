export interface Trip {
  id: string;
  name: string;
  startDate: string; // ISO Date
  endDate: string;
  coverImage?: string;
}

export type CategoryType = 'sightseeing' | 'food' | 'transport' | 'stay' | 'other';

export interface ScheduleEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  title: string;
  location?: string;
  category: CategoryType;
  notes?: string;
  completed: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  currency: 'TWD' | 'JPY' | 'USD' | 'NZD';
  category: string;
  payerId: string;
  date: string;
  description: string;
}

export interface Booking {
  id: string;
  type: 'flight' | 'hotel' | 'car' | 'ticket';
  title: string;
  date: string; // Check-in or Flight date
  details: string; // e.g., "TPE -> NRT", "Room 302"
  image?: string;
  fileUrl?: string;
  isLocked: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  images: string[];
  authorId: string;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  pin?: string; // Simple 4-digit PIN
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string; // memberId
}