export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface Table {
  id: string;
  number: number;
  seats: number;
  status: TableStatus;
  section: string;
  x: number;
  y: number;
  shape: 'round' | 'square' | 'rectangular';
  currentReservation?: string;
}

export type BookingSource = 'Dine In' | 'Zomato District' | 'Website';

export const FLOOR_SECTIONS = ['AC', 'NON AC', 'TERRACE', 'PRIVATE'] as const;
export type FloorSection = typeof FLOOR_SECTIONS[number];

export const TABLES_PER_SECTION = 15;

export interface Reservation {
  id: string;
  restaurantId?: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  date: string;
  time: string;
  duration: number; // minutes
  tableId?: string;
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  notes: string;
  createdAt: string;
  source: 'walk-in' | 'phone' | 'online' | 'widget';
  bookingSource?: BookingSource;
  specialOccasion?: string;
  smokingPreference?: "smoking" | "non-smoking";
  /** Set by backend when status is set to confirmed */
  confirmedAt?: string | null;
  seatedAt?: string | Date; 
}

export interface DailyStats {
  date: string;
  totalCovers: number;
  reservations: number;
  walkIns: number;
  noShows: number;
  avgPartySize: number;
  tableUtilization: number; // percentage
}
