const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const TOKEN_KEY = "aurapos_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

async function request<T>(
  path: string,
  options: RequestInit & { body?: object } = {}
): Promise<ApiResponse<T>> {
  const { body, ...rest } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  });

  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok) {
    return {
      success: false,
      message: json.message || `Request failed (${res.status})`,
    };
  }
  return json;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface SetupAdminBody {
  name: string;
  email: string;
  phone?: string;
}

export function setupAdmin(body: SetupAdminBody) {
  return request<{ user: { id: string; email: string; name: string; role: string } }>(
    "/api/setup/admin",
    { method: "POST", body }
  );
}


export function sendOtp(email: string) {
  return request("/api/auth/send-otp", { method: "POST", body: { email } });
}

export function verifyOtp(email: string, otp: string) {
  return request<{ user: User; token: string }>("/api/auth/verify-otp", {
    method: "POST",
    body: { email, otp },
  });
}

export function loginWithPassword(email: string, password: string) {
  return request<{ user: User; token: string }>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string | null;
  role?: string;
  restaurantId?: string | null;
}

export function getMe() {
  return request<{ user: User }>("/api/auth/me", { method: "GET" });
}

export function updateMe(body: { name?: string; phone?: string }) {
  return request<{ user: User }>("/api/auth/me", { method: "PATCH", body });
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  role: string;
  restaurantId?: string | null;
}

export function getStaff() {
  return request<{ staff: StaffMember[] }>("/api/staff", { method: "GET" });
}

export interface CreateStaffBody {
  name: string;
  email: string;
  phone?: string;
  role: string;
  restaurantName?: string;
  /** Assign to existing restaurant (waiter or manager). */
  restaurantId?: string;
  password: string;
}

export function createStaff(body: CreateStaffBody) {
  return request<{ user: StaffMember }>("/api/staff", { method: "POST", body });
}

export function updateStaff(id: string, body: { name?: string; email?: string; phone?: string }) {
  return request<{ user: StaffMember }>(`/api/staff/${id}`, { method: "PATCH", body });
}

export function deleteStaff(id: string) {
  return request(`/api/staff/${id}`, { method: "DELETE" });
}

// ─── Restaurants ─────────────────────────────────────────────────────────────

export interface RestaurantOption {
  id: string;
  name: string;
  address?: string | null;
  seatingCapacity?: number | null;
  noShowGraceMinutes?: number;
}

export interface CreateRestaurantBody {
  name: string;
  address?: string;
  seatingCapacity?: number;
}

export function getRestaurants() {
  return request<{ restaurants: RestaurantOption[] }>("/api/restaurants", { method: "GET" });
}

export function createRestaurant(body: CreateRestaurantBody) {
  return request<{ restaurant: RestaurantOption }>("/api/restaurants", { method: "POST", body });
}

export function getRestaurant(id: string) {
  return request<{ restaurant: RestaurantOption }>(`/api/restaurants/${id}`, { method: "GET" });
}

export function updateRestaurant(
  id: string,
  body: { noShowGraceMinutes?: number; name?: string; address?: string; seatingCapacity?: number | null }
) {
  return request<{ restaurant: RestaurantOption }>(`/api/restaurants/${id}`, { method: "PATCH", body });
}

export function deleteRestaurant(id: string) {
  return request(`/api/restaurants/${id}`, { method: "DELETE" });
}

// ─── Reservations ─────────────────────────────────────────────────────────────

export interface ReservationDto {
  id: string;
  restaurantId?: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  date: string;
  time: string;
  duration: number;
  tableId: string | null;
  status: string;
  notes: string;
  source: string;
  bookingSource: string | null;
  floor?: string | null;
  subsection?: string | null;
  tableNumber?: string | null;
  specialOccasion?: string | null;
  smokingPreference?: string | null;
  confirmedAt: string | null;
  seatedAt: string | null; 
  createdAt: string;
}

export function listReservations(restaurantId?: string) {
  const q = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : "";
  return request<{ reservations: ReservationDto[] }>(`/api/reservations${q}`, { method: "GET" });
}

export function createReservation(
  body: {
    guestName: string;
    guestEmail?: string;
    guestPhone?: string;
    partySize: number;
    date: string;
    time: string;
    duration?: number;
    tableId?: string;
    status?: string;
    notes?: string;
    source?: string;
    bookingSource?: string;
    specialOccasion?: string;
    smokingPreference?: string;
  },
  restaurantId?: string
) {
  const b = restaurantId ? { ...body, restaurantId } : body;
  return request<{ reservation: ReservationDto }>("/api/reservations", { method: "POST", body: b });
}

export function updateReservationApi(
  id: string,
  body: Partial<{
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    partySize: number;
    date: string;
    time: string;
    duration: number;
    tableId: string | null;
    status: string;
    notes: string;
    source: string;
    bookingSource: string;
    smokingPreference: string;
     floor: string;           
    subsection: string;      
    tableNumber: string;     
    specialOccasion: string;
    seatedAt: string;
  }>,
  restaurantId?: string
) {
  const q = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : "";
  return request<{ reservation: ReservationDto }>(`/api/reservations/${id}${q}`, {
    method: "PATCH",
    body,
  });
}

export function cancelReservationApi(id: string, restaurantId?: string) {
  const q = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : "";
  return request(`/api/reservations/${id}${q}`, { method: "DELETE" });
}

// ─── Customers (Customer 360) ───────────────────────────────────────────────────

export interface CustomerSummaryDto {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  totalReservations: number;
  completed: number;
  cancelled: number;
  noShow: number;
  confirmed: number;
  seated: number;
  lastVisit: { date: string; time: string } | null;
}

export interface CustomerHistoryReservationDto {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  date: string;
  time: string;
  duration: number;
  status: string;
  source: string;
  bookingSource: string | null;
  notes: string;
  confirmedAt: string | null;
  createdAt: string;
}

export function searchCustomers(q?: string, restaurantId?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (restaurantId) params.set("restaurantId", restaurantId);
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<{ customers: CustomerSummaryDto[] }>(`/api/customers${query}`, { method: "GET" });
}

export function getCustomerHistory(customerId: string, restaurantId?: string) {
  const q = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : "";
  return request<{
    profile: { guestName: string; guestEmail: string; guestPhone: string } | null;
    reservations: CustomerHistoryReservationDto[];
  }>(`/api/customers/${encodeURIComponent(customerId)}/history${q}`, { method: "GET" });
}

// ─── Floor Categories ─────────────────────────────────────────────────────────

export interface FloorCategoryDto {
  id: string;
  name: string;
  order: number;
  isDefault: boolean;
}

export function listFloorCategories(restaurantId?: string) {
  const q = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : "";
  return request<{ categories: FloorCategoryDto[] }>(`/api/floor-categories${q}`, { method: "GET" });
}

export function createFloorCategory(body: { name: string }, restaurantId?: string) {
  const b = restaurantId ? { ...body, restaurantId } : body;
  return request<{ category: FloorCategoryDto }>("/api/floor-categories", { method: "POST", body: b });
}

export function updateFloorCategory(
  id: string,
  body: { name?: string; order?: number },
  restaurantId?: string
) {
  const q = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : "";
  return request<{ category: FloorCategoryDto }>(`/api/floor-categories/${id}${q}`, {
    method: "PATCH",
    body,
  });
}

export function deleteFloorCategory(id: string, restaurantId?: string) {
  const q = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : "";
  return request(`/api/floor-categories/${id}${q}`, { method: "DELETE" });
}

// ─── Custom Floors ────────────────────────────────────────────────────────────

export interface FloorSectionDto {
  _id: string;
  name: string;
  from: number;
  to: number;
  seats: number;
  smokingPreference?: "smoking" | "non-smoking";
  tableSeats?: Record<number, number>;
  tableWeights?: Record<number, number>;
}

export interface FloorDto {
  id: string;
  floorNumber: number;
  name: string;
  sections: FloorSectionDto[];
}

export function listFloors(restaurantId?: string) {
  const q = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : "";
  return request<{ floors: FloorDto[] }>(`/api/floors${q}`, { method: "GET" });
}

export function createFloor(
  body: { floorNumber: number; name: string; sections: Omit<FloorSectionDto, "_id">[] },
  restaurantId?: string
) {
  const b = restaurantId ? { ...body, restaurantId } : body;
  return request<{ floor: FloorDto }>("/api/floors", { method: "POST", body: b });
}

export function deleteFloor(id: string, restaurantId?: string) {
  const q = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : "";
  return request(`/api/floors/${id}${q}`, { method: "DELETE" });
}

/** POST /api/floors/:id/sections/:restaurantId — add a new section to an existing floor */
export function addSection(
  floorId: string,
  section: Omit<FloorSectionDto, "_id">,
) {
  // const q = restaurantId ? `?${encodeURIComponent(restaurantId)}` : "";
  return request<{ floor: FloorDto }>(`/api/floors/${floorId}/sections`, {
    method: "POST",
    body: { section },
  });
}

/** DELETE /api/floors/:id/sections/:sectionId */
export function deleteSection(floorId: string, sectionId: string, restaurantId?: string) {
  const q = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : "";
  return request<{ floor: FloorDto }>(
    `/api/floors/${floorId}/sections/${sectionId}${q}`,
    { method: "DELETE" }
  );
}

export function updateSection(
  floorId: string,
  sectionId: string,
  data: {
    name: string;
    from: number;
    to: number;
    seats: number;
    tableSeats?: Record<number, number>;
    tableWeights?: Record<number, number>;
  },
  restaurantId?: string,
) {
  return request<{ floor: FloorDto }>(`/api/floors/${floorId}/sections/${sectionId}`, {
    method: "PUT",
    body: restaurantId ? { ...data, restaurantId } : data,
  });
}

// ─── Table Statuses ───────────────────────────────────────────────────────────

export interface TableStatusEntryDto {
  tableNumber: number;
  status: string;
}

/** GET /api/floors/:floorId/sections/:sectionId/statuses */
export function listTableStatuses(floorId: string, sectionId: string) {
  return request<{ statuses: TableStatusEntryDto[] }>(
    `/api/floors/${floorId}/sections/${sectionId}/statuses`,
    { method: "GET" }
  );
}

/** PUT /api/floors/:floorId/sections/:sectionId/statuses */
export function updateTableStatuses(
  floorId: string,
  sectionId: string,
  statuses: TableStatusEntryDto[]
) {
  return request<{ statuses: TableStatusEntryDto[] }>(
    `/api/floors/${floorId}/sections/${sectionId}/statuses`,
    { method: "PUT", body: { statuses } }
  );
}