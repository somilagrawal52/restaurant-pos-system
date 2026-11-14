import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Loader2, ChevronDown, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReservations } from "@/hooks/useReservations";
import { useAuth } from "@/hooks/useAuth";
import {
  getRestaurants,
  createReservation,
  listFloors,
  listTableStatuses,
  updateTableStatuses,
} from "@/lib/api";
import type { FloorDto, TableStatusEntryDto } from "@/lib/api";
import type { RestaurantOption } from "@/lib/api";
import ReservationModal from "@/components/reservations/ReservationModal";
import VoiceReservationModal from "@/components/reservations/VoiceReservationModal";
import { Reservation } from "@/types/restaurant";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const STATUSES: Reservation["status"][] = [
  "confirmed",
  "seated",
  "completed",
  "cancelled",
  "no-show",
];

const statusBadge: Record<string, string> = {
  confirmed: "bg-status-reserved/10 text-status-reserved",
  seated: "bg-status-available/10 text-status-available",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-status-occupied/10 text-status-occupied",
  "no-show": "bg-status-occupied/10 text-status-occupied",
};

function formatTimestamp(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

export default function Reservations() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [detailRes, setDetailRes] = useState<Reservation | null>(null);
  const [seatTarget, setSeatTarget] = useState<Reservation | null>(null); // manual seating
  const [seatChoiceTarget, setSeatChoiceTarget] = useState<Reservation | null>(null); // choose auto vs manual
  const [autoSeatTarget, setAutoSeatTarget] = useState<Reservation | null>(null); // auto seating
  const [autoSeatDirection, setAutoSeatDirection] = useState<"top-down" | "bottom-up">(
    "bottom-up",
  );
  const [autoSeating, setAutoSeating] = useState(false);
  const [seatForm, setSeatForm] = useState({
    floor: "",
    subsection: "",
    tableNumber: "",
  });
  const [seatFloors, setSeatFloors] = useState<FloorDto[]>([]);
  const [seatStatuses, setSeatStatuses] = useState<
    Record<string, TableStatusEntryDto[]>
  >({});
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] =
    useState<string>("all");
  const restaurantId = !isAdmin
    ? undefined
    : selectedRestaurantId === "all"
      ? undefined
      : selectedRestaurantId || undefined;

  const {
    reservations,
    loading,
    addReservation,
    updateReservation,
    updateStatus,
    cancelReservation,
    refetchReservations,
  } = useReservations(restaurantId);

  useEffect(() => {
    if (isAdmin) {
      getRestaurants().then((res) => {
        if (res.success && res.data?.restaurants) {
          setRestaurants(res.data.restaurants);
        }
      });
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedFloorId || !selectedSectionId) return;
    listTableStatuses(selectedFloorId, selectedSectionId).then((r) => {
      if (r.success && r.data?.statuses) {
        setSeatStatuses((prev) => ({
          ...prev,
          [selectedSectionId]: r.data!.statuses,
        }));
      }
    });
  }, [selectedFloorId, selectedSectionId]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);

  useEffect(() => {
    if ((location.state as { openCreate?: boolean })?.openCreate) {
      setModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = reservations
    .filter((r) => statusFilter === "all" || r.status === statusFilter)
    .filter(
      (r) =>
        r.guestName.toLowerCase().includes(search.toLowerCase()) ||
        (r.guestPhone && r.guestPhone.includes(search)),
    )
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

  const handleSave = async (
    data: Omit<Reservation, "id" | "createdAt">,
    options?: { restaurantId?: string },
  ) => {
    try {
      if (editingRes) {
        await updateReservation(
          editingRes.id,
          data,
          editingRes.restaurantId ?? undefined,
        );
        toast.success("Reservation updated");
      } else {
        if (isAdmin && options?.restaurantId) {
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
            options.restaurantId,
          );
          if (!res.success) throw new Error(res.message);
          await refetchReservations();
          toast.success("Reservation created");
        } else {
          await addReservation(data);
          toast.success("Reservation created");
        }
      }
      setEditingRes(null);
      setModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const openManualSeating = (res: Reservation) => {
    setSeatTarget(res);
    setSeatForm({ floor: "", subsection: "", tableNumber: "" });
    setSelectedFloorId("");
    setSelectedSectionId("");
    setSeatStatuses({});
    const restaurantIdForFloors = res.restaurantId ?? restaurantId ?? undefined;
    listFloors(restaurantIdForFloors).then((r) => {
      if (r.success && r.data?.floors) setSeatFloors(r.data.floors);
    });
  };

  const handleStatusChange = async (
    res: Reservation,
    newStatus: Reservation["status"],
  ) => {
    if (res.status === newStatus) return;
    setUpdatingId(res.id);
    try {
      if (newStatus === "cancelled") {
        setCancelTarget(res);
        setUpdatingId(null);
        return;
      }
      if (newStatus === "seated") {
        // Let the manager choose between auto and manual seating
        setSeatChoiceTarget(res);
        setUpdatingId(null);
        return;
      }
      await updateStatus(res.id, newStatus, res.restaurantId ?? undefined);
      // If completing or marking no-show, free up the table on floor plan
      if (
        (newStatus === "completed" || newStatus === "no-show") &&
        res.tableNumber &&
        res.floor &&
        res.subsection
      ) {
        // Find the floor and section IDs from names
        const floorsRes = await listFloors(
          res.restaurantId ?? restaurantId ?? undefined,
        );
        if (floorsRes.success && floorsRes.data?.floors) {
          const floor = floorsRes.data.floors.find((f) => f.name === res.floor);
          if (floor) {
            const section = floor.sections.find(
              (s) => s.name === res.subsection,
            );
            if (section) {
              const statusesRes = await listTableStatuses(
                floor.id,
                section._id,
              );
              const currentStatuses = statusesRes.data?.statuses ?? [];
              const tableNum = Number(res.tableNumber);
              const updated = currentStatuses.filter(
                (s) => s.tableNumber !== tableNum,
              );
              updated.push({ tableNumber: tableNum, status: "available" });
              await updateTableStatuses(floor.id, section._id, updated);
            }
          }
        }
      }

      toast.success(`Status set to ${newStatus}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmSeat = async () => {
    if (!seatTarget) return;
    const target = seatTarget;
    setSeatTarget(null);
    setUpdatingId(target.id);
    try {
      await updateReservation(
        target.id,
        {
          status: "seated",
          floor: seatForm.floor,
          subsection: seatForm.subsection,
          tableNumber: seatForm.tableNumber,
          seatedAt: new Date().toISOString(),
        },
        target.restaurantId ?? undefined,
      );
      // Update floor plan table status to occupied
      if (selectedFloorId && selectedSectionId && seatForm.tableNumber) {
        const currentStatuses = seatStatuses[selectedSectionId] ?? [];
        const tableNum = Number(seatForm.tableNumber);
        const updated = currentStatuses.filter(
          (s) => s.tableNumber !== tableNum,
        );
        updated.push({ tableNumber: tableNum, status: "occupied" });
        await updateTableStatuses(selectedFloorId, selectedSectionId, updated);
      }
      toast.success(
        `${target.guestName} seated at Table ${seatForm.tableNumber}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to seat guest");
    } finally {
      setUpdatingId(null);
    }
  };

  const runAutoSeating = async () => {
    if (!autoSeatTarget) return;
    const target = autoSeatTarget;
    setAutoSeating(true);
    try {
      const restaurantIdForFloors = target.restaurantId ?? restaurantId ?? undefined;
      const floorsRes = await listFloors(restaurantIdForFloors);
      if (!floorsRes.success || !floorsRes.data?.floors?.length) {
        toast.error("No floors available for auto seating.");
        return;
      }

      const floors = [...floorsRes.data.floors];
      floors.sort((a, b) => {
        const fa = a.floorNumber ?? 0;
        const fb = b.floorNumber ?? 0;
        return autoSeatDirection === "top-down" ? fb - fa : fa - fb;
      });

      const guestPref = target.smokingPreference ?? "non-smoking";
      const statusCache: Record<string, TableStatusEntryDto[]> = {};

      const getStatuses = async (floorId: string, sectionId: string) => {
        if (!statusCache[sectionId]) {
          const res = await listTableStatuses(floorId, sectionId);
          statusCache[sectionId] = res.success && res.data?.statuses
            ? res.data.statuses
            : [];
        }
        return statusCache[sectionId];
      };

      type Candidate = {
        floor: FloorDto;
        section: FloorSectionDto;
        tables: number[];
        totalWeight: number;
        extraCapacity: number;
      };

      const findBestOnFloor = async (
        floor: FloorDto,
        sections: FloorSectionDto[],
      ): Promise<Candidate | null> => {
        let best: Candidate | null = null;

        for (const section of sections) {
          const statuses = await getStatuses(floor.id, section._id);
          const statusByTable = new Map(
            statuses.map((s) => [s.tableNumber, s.status]),
          );

          const availableTables: number[] = [];
          for (let t = section.from; t <= section.to; t++) {
            const st = statusByTable.get(t);
            const isAvailable = !st || st === "available";
            if (isAvailable) availableTables.push(t);
          }

          if (availableTables.length === 0) continue;

          // Build runs of consecutive table numbers
          const runs: number[][] = [];
          let currentRun: number[] = [availableTables[0]];
          for (let i = 1; i < availableTables.length; i++) {
            const t = availableTables[i];
            if (t === currentRun[currentRun.length - 1] + 1) {
              currentRun.push(t);
            } else {
              runs.push(currentRun);
              currentRun = [t];
            }
          }
          runs.push(currentRun);

          const tableSeats = section.tableSeats ?? {};
          const tableWeights = section.tableWeights ?? {};

          const capacityOf = (tableNumber: number) =>
            tableSeats[tableNumber] ?? section.seats;

          const weightOf = (tableNumber: number) =>
            tableWeights[tableNumber] ??
            (section.smokingPreference === "smoking" ? 0.3 : 0.5);

          for (const run of runs) {
            const n = run.length;
            for (let i = 0; i < n; i++) {
              let capSum = 0;
              let weightSum = 0;
              for (let j = i; j < n; j++) {
                const t = run[j];
                capSum += capacityOf(t);
                weightSum += weightOf(t);
                if (capSum >= target.partySize) {
                  const tables = run.slice(i, j + 1);
                  const extraCapacity = capSum - target.partySize;
                  const candidate: Candidate = {
                    floor,
                    section,
                    tables,
                    totalWeight: weightSum,
                    extraCapacity,
                  };

                  if (!best) {
                    best = candidate;
                  } else if (candidate.tables.length < best.tables.length) {
                    // Prefer fewer tables (keep the party together if possible)
                    best = candidate;
                  } else if (
                    candidate.tables.length === best.tables.length &&
                    candidate.totalWeight > best.totalWeight
                  ) {
                    best = candidate;
                  } else if (
                    candidate.tables.length === best.tables.length &&
                    candidate.totalWeight === best.totalWeight &&
                    candidate.extraCapacity < best.extraCapacity
                  ) {
                    best = candidate;
                  } else if (
                    candidate.tables.length === best.tables.length &&
                    candidate.totalWeight === best.totalWeight &&
                    candidate.extraCapacity === best.extraCapacity &&
                    candidate.tables[0] < best.tables[0]
                  ) {
                    best = candidate;
                  }
                  break; // longer subsequence only increases cap/weight; continue with next start
                }
              }
            }
          }
        }

        return best;
      };

      let chosen: Candidate | null = null;

      for (const floor of floors) {
        const primarySections = floor.sections.filter(
          (s) => s.smokingPreference === guestPref,
        );
        const secondarySections = floor.sections.filter(
          (s) => s.smokingPreference !== guestPref,
        );

        if (primarySections.length) {
          const bestPrimary = await findBestOnFloor(floor, primarySections);
          if (bestPrimary) {
            chosen = bestPrimary;
            break;
          }
        }

        if (secondarySections.length) {
          const bestSecondary = await findBestOnFloor(floor, secondarySections);
          if (bestSecondary) {
            chosen = bestSecondary;
            break;
          }
        }
      }

      if (!chosen) {
        toast.error(
          "Adjacent seats are not available for this party. Please seat manually.",
        );
        return;
      }

      const { floor, section, tables } = chosen;
      const mainTable = String(tables[0]);

      await updateReservation(
        target.id,
        {
          status: "seated",
          floor: floor.name,
          subsection: section.name,
          tableNumber: mainTable,
          seatedAt: new Date().toISOString(),
        },
        target.restaurantId ?? undefined,
      );

      // Update table statuses for all chosen tables
      const existingStatuses = await getStatuses(floor.id, section._id);
      let updatedStatuses = existingStatuses.filter(
        (s) => !tables.includes(s.tableNumber),
      );
      for (const t of tables) {
        updatedStatuses.push({ tableNumber: t, status: "occupied" });
      }
      await updateTableStatuses(floor.id, section._id, updatedStatuses);

      toast.success(
        `Seated at ${floor.name} – ${section.name} – tables ${tables.join(", ")}`,
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to auto-assign tables.",
      );
    } finally {
      setAutoSeating(false);
      setAutoSeatTarget(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const id = cancelTarget.id;
    const resRestaurantId = cancelTarget.restaurantId;
    const targetRes = cancelTarget; // save reference before clearing
    setCancelTarget(null);
    try {
      await cancelReservation(id, resRestaurantId ?? undefined);

      // Free up table on floor plan if was seated
      if (
        targetRes.status === "seated" &&
        targetRes.tableNumber &&
        targetRes.floor &&
        targetRes.subsection
      ) {
        const floorsRes = await listFloors(
          resRestaurantId ?? restaurantId ?? undefined,
        );
        if (floorsRes.success && floorsRes.data?.floors) {
          const floor = floorsRes.data.floors.find(
            (f) => f.name === targetRes.floor,
          );
          if (floor) {
            const section = floor.sections.find(
              (s) => s.name === targetRes.subsection,
            );
            if (section) {
              const statusesRes = await listTableStatuses(
                floor.id,
                section._id,
              );
              const currentStatuses = statusesRes.data?.statuses ?? [];
              const tableNum = Number(targetRes.tableNumber);
              const updated = currentStatuses.filter(
                (s) => s.tableNumber !== tableNum,
              );
              updated.push({ tableNumber: tableNum, status: "available" });
              await updateTableStatuses(floor.id, section._id, updated);
            }
          }
        }
      }

      toast.success("Reservation cancelled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="font-serif text-3xl text-foreground">
              Reservations
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} total
            </p>
          </div>
          {isAdmin && (
            <Select
              value={selectedRestaurantId}
              onValueChange={setSelectedRestaurantId}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="All restaurants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All restaurants</SelectItem>
                {restaurants.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingRes(null);
              setModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New
          </Button>
          <Button
            onClick={() => setVoiceModalOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <Mic className="w-4 h-4" />
            Voice
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests..."
            className="pl-9 bg-background/60"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "confirmed", "seated", "completed", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Guest
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Date & Time
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Party
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Source
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((res, i) => (
                  <motion.tr
                    key={res.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <p
                        className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                        onClick={() =>
                          setDetailRes(
                            reservations.find((r) => r.id === res.id) ?? res,
                          )
                        }
                      >
                        {res.guestName}
                      </p>
                      {res.guestPhone && (
                        <p className="text-xs text-muted-foreground">
                          {res.guestPhone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-foreground">
                        {res.date} · {res.time}
                      </span>
                      {res.confirmedAt && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Confirmed at {formatTimestamp(res.confirmedAt)}
                        </p>
                      )}
                      {res.seatedAt && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Seated {formatTimestamp(res.seatedAt)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-foreground">
                      {res.partySize}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-muted-foreground capitalize">
                        {res.source}
                      </span>
                      {res.bookingSource && (
                        <span className="text-xs text-foreground/70 block">
                          {res.bookingSource}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            disabled={updatingId === res.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize transition-all hover:opacity-90 ${statusBadge[res.status]}`}
                          >
                            {updatingId === res.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                {res.status}
                                <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {STATUSES.map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => handleStatusChange(res, s)}
                              className={
                                s === "cancelled"
                                  ? "text-destructive focus:text-destructive"
                                  : ""
                              }
                            >
                              {s}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setEditingRes(res);
                            setModalOpen(true);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          Edit
                        </button>
                        {res.status !== "cancelled" && (
                          <button
                            onClick={() => setCancelTarget(res)}
                            className="text-xs text-destructive hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReservationModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRes(null);
        }}
        onSave={handleSave}
        reservation={editingRes}
        isAdmin={isAdmin}
        restaurants={restaurants}
      />

      <VoiceReservationModal
        open={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onReservationCreated={() => refetchReservations()}
      />

      {/* Danger confirmation for cancel */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent className="border-destructive/50 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Cancel reservation?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p className="text-muted-foreground">
                  This will cancel the reservation for{" "}
                  <strong className="text-foreground">
                    {cancelTarget?.guestName}
                  </strong>
                  . This action cannot be undone.
                </p>
                <p className="text-destructive font-medium">
                  Are you sure you want to cancel?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep reservation</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, cancel reservation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!detailRes}
        onOpenChange={(open) => !open && setDetailRes(null)}
      >
        <AlertDialogContent className="bg-card max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl">
              {detailRes?.guestName}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-1">
                {/* Guest Info */}
                <div className="space-y-1">
                  {detailRes?.guestPhone && (
                    <p className="text-sm text-muted-foreground">
                      {detailRes.guestPhone}
                    </p>
                  )}
                  {detailRes?.guestEmail && (
                    <p className="text-sm text-muted-foreground">
                      {detailRes.guestEmail}
                    </p>
                  )}
                </div>

                <div className="h-px bg-border" />

                {/* Reservation Info */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Date & Time
                    </p>
                    <p className="text-foreground font-medium">
                      {detailRes?.date} · {detailRes?.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Party Size
                    </p>
                    <p className="text-foreground font-medium">
                      {detailRes?.partySize} guests
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Booking Source
                    </p>
                    <p className="text-foreground font-medium">
                      {detailRes?.bookingSource || detailRes?.source || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Status
                    </p>
                    <p
                      className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full inline-block ${statusBadge[detailRes?.status ?? ""]}`}
                    >
                      {detailRes?.status}
                    </p>
                  </div>
                  {/* Seating Preference — add this block */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Seating Preference
                    </p>
                    <p className="text-foreground font-medium">
                      {detailRes?.smokingPreference === "smoking"
                        ? "🚬 Smoking"
                        : "🚭 Non-Smoking"}
                    </p>
                  </div>
                </div>

                {/* Special Occasion */}
                {detailRes?.specialOccasion && (
                  <>
                    <div className="h-px bg-border" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Special Occasion
                      </p>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        🎉 {detailRes.specialOccasion}
                      </span>
                    </div>
                  </>
                )}

                {/* Seating Info */}
                {(detailRes?.floor || detailRes?.tableNumber) && (
                  <>
                    <div className="h-px bg-border" />
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {detailRes?.floor && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Floor
                          </p>
                          <p className="text-foreground font-medium">
                            {detailRes.floor}
                          </p>
                        </div>
                      )}
                      {detailRes?.subsection && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Section
                          </p>
                          <p className="text-foreground font-medium">
                            {detailRes.subsection}
                          </p>
                        </div>
                      )}
                      {detailRes?.tableNumber && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Table
                          </p>
                          <p className="text-foreground font-medium">
                            #{detailRes.tableNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Notes */}
                {detailRes?.notes && (
                  <>
                    <div className="h-px bg-border" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Notes
                      </p>
                      <p className="text-sm text-foreground">
                        {detailRes.notes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDetailRes(null);
                setEditingRes(detailRes);
                setModalOpen(true);
              }}
            >
              Edit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!seatTarget}
        onOpenChange={(open) => !open && setSeatTarget(null)}
      >
        <AlertDialogContent className="bg-card max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl">
              Seat Guest
            </AlertDialogTitle>
            <AlertDialogDescription>
              Assign a table for{" "}
              <strong className="text-foreground">
                {seatTarget?.guestName}
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2">
            {/* Floor dropdown */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Floor
              </p>
              <Select
                value={selectedFloorId}
                onValueChange={(val) => {
                  setSelectedFloorId(val);
                  setSelectedSectionId("");
                  const floor = seatFloors.find((f) => f.id === val);
                  setSeatForm((f) => ({
                    ...f,
                    floor: floor?.name ?? "",
                    subsection: "",
                    tableNumber: "",
                  }));
                }}
              >
                <SelectTrigger className="mt-1.5 bg-background/60">
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {seatFloors.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No floors available
                    </SelectItem>
                  ) : (
                    seatFloors.map((floor) => (
                      <SelectItem key={floor.id} value={floor.id}>
                        {floor.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Section dropdown — only shows after floor is selected */}
            {selectedFloorId && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Section
                </p>
                <Select
                  value={selectedSectionId}
                  onValueChange={(val) => {
                    setSelectedSectionId(val);
                    const floor = seatFloors.find(
                      (f) => f.id === selectedFloorId,
                    );
                    const section = floor?.sections.find((s) => s._id === val);
                    setSeatForm((f) => ({
                      ...f,
                      subsection: section?.name ?? "",
                      tableNumber: "",
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1.5 bg-background/60">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {seatFloors
                      .find((f) => f.id === selectedFloorId)
                      ?.sections.map((section) => (
                        <SelectItem key={section._id} value={section._id}>
                          {section.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Table dropdown — only shows after section is selected, only available tables */}
            {selectedSectionId && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Table Number
                </p>
                <Select
                  value={seatForm.tableNumber}
                  onValueChange={(val) =>
                    setSeatForm((f) => ({ ...f, tableNumber: val }))
                  }
                >
                  <SelectTrigger className="mt-1.5 bg-background/60">
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const floor = seatFloors.find(
                        (f) => f.id === selectedFloorId,
                      );
                      const section = floor?.sections.find(
                        (s) => s._id === selectedSectionId,
                      );
                      if (!section) return null;
                      const statuses = seatStatuses[selectedSectionId] ?? [];
                      const availableTables = [];
                      for (let t = section.from; t <= section.to; t++) {
                        const statusEntry = statuses.find(
                          (s) => s.tableNumber === t,
                        );
                        const isAvailable =
                          !statusEntry || statusEntry.status === "available";
                        if (isAvailable) {
                          availableTables.push(
                            <SelectItem key={t} value={String(t)}>
                              Table {t}
                            </SelectItem>,
                          );
                        }
                      }
                      return availableTables.length > 0 ? (
                        availableTables
                      ) : (
                        <SelectItem value="none" disabled>
                          No available tables
                        </SelectItem>
                      );
                    })()}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSeat}
              disabled={!seatForm.floor || !seatForm.tableNumber}
            >
              Confirm Seating
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Seat mode choice: automatic vs manual */}
      <AlertDialog
        open={!!seatChoiceTarget}
        onOpenChange={(open) => !open && setSeatChoiceTarget(null)}
      >
        <AlertDialogContent className="bg-card w-full max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl">
              Seat Guest
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  How would you like to seat{" "}
                  <strong className="text-foreground">
                    {seatChoiceTarget?.guestName}
                  </strong>
                  ?
                </p>
                {seatChoiceTarget && (
                  <p className="text-xs text-muted-foreground">
                    Party of {seatChoiceTarget.partySize} · Preference:{" "}
                    {seatChoiceTarget.smokingPreference === "smoking"
                      ? "Smoking"
                      : "Non-smoking"}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                if (!seatChoiceTarget) return;
                const res = seatChoiceTarget;
                setSeatChoiceTarget(null);
                openManualSeating(res);
              }}
            >
              Seat Manually
            </Button>
            <AlertDialogAction
              className="w-full sm:w-auto"
              onClick={() => {
                if (!seatChoiceTarget) return;
                setAutoSeatTarget(seatChoiceTarget);
                setAutoSeatDirection("bottom-up");
                setSeatChoiceTarget(null);
              }}
            >
              Seat Automatically
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Auto seating configuration (direction) */}
      <AlertDialog
        open={!!autoSeatTarget}
        onOpenChange={(open) => !open && !autoSeating && setAutoSeatTarget(null)}
      >
        <AlertDialogContent className="bg-card max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl">
              Auto-seat guest
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Choose how floors should be scanned to find the best adjacent
                  tables.
                </p>
                {autoSeatTarget && (
                  <p className="text-xs text-muted-foreground">
                    Party of {autoSeatTarget.partySize} · Preference:{" "}
                    {autoSeatTarget.smokingPreference === "smoking"
                      ? "Smoking"
                      : "Non-smoking"}
                  </p>
                )}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Floor priority
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setAutoSeatDirection("bottom-up")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left border transition-colors ${
                        autoSeatDirection === "bottom-up"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      Bottom to top (1 → highest)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoSeatDirection("top-down")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left border transition-colors ${
                        autoSeatDirection === "top-down"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      Top to bottom (highest → 1)
                    </button>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={autoSeating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={runAutoSeating}
              disabled={autoSeating}
            >
              {autoSeating ? "Assigning…" : "Seat Automatically"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
