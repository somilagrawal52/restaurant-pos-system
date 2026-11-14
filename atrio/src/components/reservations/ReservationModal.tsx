import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Reservation, BookingSource } from "@/types/restaurant";
import type { RestaurantOption } from "@/lib/api";

const BOOKING_SOURCES: BookingSource[] = [
  "Walk-In",
  "Zomato District",
  "Website",
  "Call",
];
const SPECIAL_OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Date Night",
  "Business Meal",
  "Graduation",
  "Engagement",
  "Other",
];

interface ReservationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<Reservation, "id" | "createdAt">,
    options?: { restaurantId?: string },
  ) => void;
  reservation?: Reservation | null;
  isAdmin?: boolean;
  restaurants?: RestaurantOption[];
  variant?: "default" | "walkin";
}

export default function ReservationModal({
  open,
  onClose,
  onSave,
  reservation,
  isAdmin,
  restaurants = [],
  variant = "default",
}: ReservationModalProps) {
  const [createRestaurantId, setCreateRestaurantId] = useState("");
  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    partySize: 2,
    date: new Date().toISOString().split("T")[0],
    time: "19:00",
    duration: 90,
    notes: "",
    source: "phone" as Reservation["source"],
    status: "confirmed" as Reservation["status"],
    bookingSource: "Walk-In" as BookingSource,
    specialOccasion: "" as string,
    smokingPreference: "non-smoking" as "smoking" | "non-smoking",
  });

  useEffect(() => {
    if (reservation) {
      setForm({
        guestName: reservation.guestName,
        guestEmail: reservation.guestEmail,
        guestPhone: reservation.guestPhone,
        partySize: reservation.partySize,
        date: reservation.date,
        time: reservation.time,
        duration: reservation.duration,
        notes: reservation.notes,
        source: reservation.source,
        status: reservation.status,
        bookingSource: reservation.bookingSource || "Walk-In",
        specialOccasion: reservation.specialOccasion || "",
        smokingPreference: reservation.smokingPreference || "non-smoking",
      });
      setCreateRestaurantId("");
    } else {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().slice(0, 5);
      setForm({
        guestName: "",
        guestEmail: "",
        guestPhone: "",
        partySize: 2,
        date:
          variant === "walkin"
            ? currentDate
            : new Date().toISOString().split("T")[0],
        time: variant === "walkin" ? currentTime : "19:00",
        duration: 90,
        notes: "",
        source: variant === "walkin" ? "walk-in" : "phone",
        status: "confirmed",
        bookingSource: "Walk-In",
        specialOccasion: "",
        smokingPreference: "non-smoking",
      });
      setCreateRestaurantId("");
    }
  }, [reservation, open, variant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin && !reservation && !createRestaurantId) return;
    onSave(
      form,
      isAdmin && !reservation && createRestaurantId
        ? { restaurantId: createRestaurantId }
        : undefined,
    );
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed inset-4 z-50 flex flex-col mx-auto w-full max-w-lg glass-card-elevated rounded-2xl overflow-hidden max-h-[85vh] sm:left-1/2 sm:right-auto sm:top-[5vh] sm:bottom-auto sm:-translate-x-1/2 sm:inset-[auto] sm:max-h-[90vh] sm:w-full"
          >
            <div className="flex items-center justify-between shrink-0 px-4 py-4 sm:p-6 border-b border-border/60">
              <h2 className="font-serif text-xl text-foreground">
                {reservation
                  ? "Edit Reservation"
                  : variant === "walkin"
                    ? "Walk-in party"
                    : "New Reservation"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4 sm:px-6 sm:py-5">
                {isAdmin && !reservation && restaurants.length > 0 && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Restaurant *
                    </Label>
                    <Select
                      value={createRestaurantId}
                      onValueChange={setCreateRestaurantId}
                      required
                    >
                      <SelectTrigger className="mt-1.5 bg-background/60">
                        <SelectValue placeholder="Select restaurant" />
                      </SelectTrigger>
                      <SelectContent>
                        {restaurants.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Guest Name
                  </Label>
                  <Input
                    value={form.guestName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guestName: e.target.value }))
                    }
                    required
                    className="mt-1.5 bg-background/60"
                    placeholder="Full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Email{" "}
                      <span className="normal-case font-normal text-muted-foreground/60">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      type="email"
                      value={form.guestEmail}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, guestEmail: e.target.value }))
                      }
                      className="mt-1.5 bg-background/60"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Phone
                    </Label>
                    <Input
                      value={form.guestPhone}
                      maxLength={10}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, guestPhone: e.target.value }))
                      }
                      className="mt-1.5 bg-background/60"
                      placeholder="+91 11555-01001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Party
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.partySize}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          partySize: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="mt-1.5 bg-background/60"
                    />
                  </div>
                  {variant !== "walkin" && (
                    <>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Date
                        </Label>
                        <Input
                          type="date"
                          value={form.date}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, date: e.target.value }))
                          }
                          className="mt-1.5 bg-background/60"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Time
                        </Label>
                        <Input
                          type="time"
                          value={form.time}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, time: e.target.value }))
                          }
                          className="mt-1.5 bg-background/60"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Booking Source
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {BOOKING_SOURCES.map((src) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, bookingSource: src }))
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          form.bookingSource === src
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {src}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seating Preference */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Seating Preference
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    {(["non-smoking", "smoking"] as const).map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, smokingPreference: pref }))
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          form.smokingPreference === pref
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {pref === "non-smoking"
                          ? "🚭 Non-Smoking"
                          : "🚬 Smoking"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Special Occasion
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {SPECIAL_OCCASIONS.map((occasion) => (
                      <button
                        key={occasion}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            specialOccasion:
                              f.specialOccasion === occasion ? "" : occasion,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          form.specialOccasion === occasion
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {occasion}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Notes
                  </Label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    rows={2}
                    className="mt-1.5 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Special requests, allergies, occasion..."
                  />
                </div>
              </div>

              <div className="shrink-0 flex gap-3 px-4 py-4 border-t border-border/60 sm:px-6 sm:py-5 bg-card/80">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    isAdmin &&
                    !reservation &&
                    (restaurants.length === 0 || !createRestaurantId)
                  }
                >
                  {reservation ? "Update" : "Create"} Reservation
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}