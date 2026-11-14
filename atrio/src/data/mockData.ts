import { Table, Reservation, DailyStats, FLOOR_SECTIONS, TABLES_PER_SECTION } from '@/types/restaurant';

// Generate tables for all 4 sections, 15 tables each
const shapes: Array<'round' | 'square' | 'rectangular'> = ['round', 'square', 'rectangular'];
const seatOptions = [2, 2, 4, 4, 4, 6, 6, 4, 2, 8, 4, 4, 2, 6, 10];

export const mockTables: Table[] = FLOOR_SECTIONS.flatMap((section, sIdx) =>
  Array.from({ length: TABLES_PER_SECTION }, (_, i) => {
    const globalIdx = sIdx * TABLES_PER_SECTION + i;
    return {
      id: `t${globalIdx + 1}`,
      number: i + 1,
      seats: seatOptions[i % seatOptions.length],
      status: (['available', 'available', 'occupied', 'reserved', 'available', 'cleaning', 'available', 'occupied', 'available', 'reserved', 'available', 'available', 'available', 'occupied', 'available'] as const)[i],
      section,
      x: (i % 5) * 20 + 5,
      y: Math.floor(i / 5) * 25 + 10,
      shape: shapes[i % 3],
    };
  })
);

const today = new Date().toISOString().split('T')[0];

export const mockReservations: Reservation[] = [
  { id: 'r1', guestName: 'Alexandra Chen', guestEmail: 'a.chen@email.com', guestPhone: '+1 555-0101', partySize: 4, date: today, time: '18:00', duration: 90, tableId: 't4', status: 'confirmed', notes: 'Anniversary dinner', createdAt: '2024-01-15T10:00:00Z', source: 'online', bookingSource: 'Website' },
  { id: 'r2', guestName: 'Marcus Rivera', guestEmail: 'm.rivera@email.com', guestPhone: '+1 555-0102', partySize: 2, date: today, time: '18:30', duration: 90, tableId: 't3', status: 'seated', notes: '', createdAt: '2024-01-15T11:00:00Z', source: 'phone', bookingSource: 'Dine In' },
  { id: 'r3', guestName: 'Sophie Laurent', guestEmail: 's.laurent@email.com', guestPhone: '+1 555-0103', partySize: 6, date: today, time: '19:00', duration: 120, tableId: 't18', status: 'seated', notes: 'Wine pairing requested', createdAt: '2024-01-15T12:00:00Z', source: 'online', bookingSource: 'Zomato District' },
  { id: 'r4', guestName: 'James Whitfield', guestEmail: 'j.whitfield@email.com', guestPhone: '+1 555-0104', partySize: 8, date: today, time: '19:30', duration: 120, tableId: 't46', status: 'confirmed', notes: 'Business dinner, quiet table', createdAt: '2024-01-15T13:00:00Z', source: 'phone', bookingSource: 'Dine In' },
  { id: 'r5', guestName: 'Elena Petrova', guestEmail: 'e.petrova@email.com', guestPhone: '+1 555-0105', partySize: 2, date: today, time: '20:00', duration: 90, status: 'confirmed', notes: '', createdAt: '2024-01-15T14:00:00Z', source: 'widget', bookingSource: 'Website' },
  { id: 'r6', guestName: 'David Kim', guestEmail: 'd.kim@email.com', guestPhone: '+1 555-0106', partySize: 10, date: today, time: '20:30', duration: 150, tableId: 't55', status: 'seated', notes: 'Birthday celebration', createdAt: '2024-01-15T15:00:00Z', source: 'online', bookingSource: 'Zomato District' },
  { id: 'r7', guestName: 'Isabelle Moreau', guestEmail: 'i.moreau@email.com', guestPhone: '+1 555-0107', partySize: 4, date: today, time: '21:00', duration: 90, status: 'confirmed', notes: 'Allergies: shellfish', createdAt: '2024-01-15T16:00:00Z', source: 'online', bookingSource: 'Website' },
  { id: 'r8', guestName: 'Walk-in Guest', guestEmail: '', guestPhone: '', partySize: 3, date: today, time: '17:30', duration: 90, tableId: 't31', status: 'completed', notes: '', createdAt: '2024-01-15T17:00:00Z', source: 'walk-in', bookingSource: 'Dine In' },
];

export const mockDailyStats: DailyStats[] = [
  { date: '2024-01-08', totalCovers: 78, reservations: 22, walkIns: 8, noShows: 2, avgPartySize: 3.2, tableUtilization: 72 },
  { date: '2024-01-09', totalCovers: 65, reservations: 18, walkIns: 6, noShows: 1, avgPartySize: 2.8, tableUtilization: 61 },
  { date: '2024-01-10', totalCovers: 92, reservations: 28, walkIns: 10, noShows: 3, avgPartySize: 3.5, tableUtilization: 85 },
  { date: '2024-01-11', totalCovers: 105, reservations: 32, walkIns: 12, noShows: 1, avgPartySize: 3.8, tableUtilization: 91 },
  { date: '2024-01-12', totalCovers: 118, reservations: 36, walkIns: 14, noShows: 2, avgPartySize: 3.6, tableUtilization: 95 },
  { date: '2024-01-13', totalCovers: 124, reservations: 38, walkIns: 16, noShows: 4, avgPartySize: 3.4, tableUtilization: 98 },
  { date: '2024-01-14', totalCovers: 88, reservations: 24, walkIns: 9, noShows: 2, avgPartySize: 3.1, tableUtilization: 78 },
];

/** Dummy revenue by restaurant for admin reports */
export const mockRevenueByRestaurant: { restaurantId: string; restaurantName: string; revenue: number; period: string }[] = [
  { restaurantId: '1', restaurantName: 'Grand Plaza', revenue: 284500, period: 'Last 7 days' },
  { restaurantId: '2', restaurantName: 'Riverside Inn', revenue: 192300, period: 'Last 7 days' },
  { restaurantId: '3', restaurantName: 'City Central', revenue: 156800, period: 'Last 7 days' },
];

/** Dummy daily revenue for admin (all properties) */
export const mockRevenueDaily: { date: string; revenue: number }[] = [
  { date: '2024-01-08', revenue: 42500 },
  { date: '2024-01-09', revenue: 38200 },
  { date: '2024-01-10', revenue: 51800 },
  { date: '2024-01-11', revenue: 61200 },
  { date: '2024-01-12', revenue: 68900 },
  { date: '2024-01-13', revenue: 72400 },
  { date: '2024-01-14', revenue: 49600 },
];
