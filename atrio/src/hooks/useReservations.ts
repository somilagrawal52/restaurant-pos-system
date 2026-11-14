import { useState, useCallback, useEffect } from 'react';
import { Reservation, Table } from '@/types/restaurant';
import {
  listReservations,
  createReservation,
  updateReservationApi,
  cancelReservationApi,
  type ReservationDto,
} from '@/lib/api';
import { mockTables } from '@/data/mockData';

function mapDtoToReservation(r: ReservationDto): Reservation {
  return {
    id: r.id,
    restaurantId: r.restaurantId ?? undefined,
    guestName: r.guestName,
    guestEmail: r.guestEmail,
    guestPhone: r.guestPhone,
    partySize: r.partySize,
    date: r.date,
    time: r.time,
    duration: r.duration,
    tableId: r.tableId ?? undefined,
    status: r.status as Reservation['status'],
    notes: r.notes,
    createdAt: r.createdAt,
    source: r.source as Reservation['source'],
    bookingSource: r.bookingSource as Reservation['bookingSource'],
    specialOccasion: r.specialOccasion ?? undefined,
    smokingPreference: (r.smokingPreference as "smoking" | "non-smoking") ?? "non-smoking",
    floor: r.floor ?? undefined,           
    subsection: r.subsection ?? undefined, 
    tableNumber: r.tableNumber ?? undefined, 
    confirmedAt: r.confirmedAt ?? undefined,
    seatedAt: r.seatedAt ?? undefined,
  };
}

export function useReservations(restaurantId?: string | null) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<Table[]>(mockTables);

  const fetchReservations = useCallback(async () => {
    if (restaurantId === null) {
      setReservations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await listReservations(restaurantId ?? undefined);
    if (res.success && res.data?.reservations) {
      setReservations(res.data.reservations.map(mapDtoToReservation));
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const addReservation = useCallback(
    async (data: Omit<Reservation, 'id' | 'createdAt'>) => {
      const res = await createReservation(
        {
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone,
          partySize: data.partySize,
          date: data.date,
          time: data.time,
          duration: data.duration,
          tableId: data.tableId,
          status: data.status,
          notes: data.notes,
          source: data.source,
          bookingSource: data.bookingSource,
          specialOccasion: data.specialOccasion,
          smokingPreference: data.smokingPreference,
        },
        restaurantId ?? undefined
      );
      if (!res.success) throw new Error(res.message);
      if (res.data?.reservation) {
        setReservations((prev) => [mapDtoToReservation(res.data!.reservation!), ...prev]);
        return mapDtoToReservation(res.data.reservation);
      }
    },
    [restaurantId]
  );

  const updateReservation = useCallback(
    async (id: string, updates: Partial<Reservation>, requestRestaurantId?: string) => {
      const rid = requestRestaurantId ?? restaurantId ?? undefined;
      const res = await updateReservationApi(
        id,
        {
          guestName: updates.guestName,
          guestEmail: updates.guestEmail,
          guestPhone: updates.guestPhone,
          partySize: updates.partySize,
          date: updates.date,
          time: updates.time,
          duration: updates.duration,
          tableId: updates.tableId ?? null,
          status: updates.status,
          notes: updates.notes,
          source: updates.source,
          bookingSource: updates.bookingSource,
          specialOccasion: updates.specialOccasion,
           floor: updates.floor,           
    subsection: updates.subsection, 
    tableNumber: updates.tableNumber,
    seatedAt: updates.seatedAt as string | undefined,
    smokingPreference: updates.smokingPreference,
        },
        rid
      );
      if (!res.success) throw new Error(res.message);
      if (res.data?.reservation) {
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? mapDtoToReservation(res.data!.reservation!) : r))
        );
      }
    },
    [restaurantId]
  );

  const updateStatus = useCallback(
    async (id: string, status: Reservation['status'], requestRestaurantId?: string) => {
      return updateReservation(id, { status }, requestRestaurantId);
    },
    [updateReservation]
  );

  const cancelReservation = useCallback(
    async (id: string, requestRestaurantId?: string) => {
      const rid = requestRestaurantId ?? restaurantId ?? undefined;
      const res = await cancelReservationApi(id, rid);
      if (!res.success) throw new Error(res.message);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' as const } : r))
      );
    },
    [restaurantId]
  );

  const updateTableStatus = useCallback((id: string, status: Table['status']) => {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }, []);

  const todayReservations = reservations.filter((r) => r.date === new Date().toISOString().split('T')[0]);
  const activeReservations = todayReservations.filter((r) => r.status !== 'cancelled');
  const upcomingReservations = activeReservations
    .filter((r) => r.status === 'confirmed')
    .sort((a, b) => a.time.localeCompare(b.time));
  const seatedReservations = activeReservations.filter((r) => r.status === 'seated');
  const totalCoversToday = activeReservations.reduce((sum, r) => sum + r.partySize, 0);

  return {
    reservations,
    loading,
    tables,
    addReservation,
    updateReservation,
    updateStatus,
    cancelReservation,
    updateTableStatus,
    refetchReservations: fetchReservations,
    todayReservations,
    activeReservations,
    upcomingReservations,
    seatedReservations,
    totalCoversToday,
  };
}
