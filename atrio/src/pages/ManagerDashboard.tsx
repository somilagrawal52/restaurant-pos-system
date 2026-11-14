import { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Grid3X3,
  UtensilsCrossed,
  TrendingUp,
  Clock,
  ArrowUpRight,
  PenSquare,
  Mic,
  UserCheck,
  UserPlus,
  ScanLine,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useReservations } from "@/hooks/useReservations";
import { Loader2 } from "lucide-react";
import ReservationModal from "@/components/reservations/ReservationModal";
import type { Reservation } from "@/types/restaurant";

// Dummy data for dashboard (non-reservation stats)
const DUMMY_STATS = {
  reservationsChange: 12,
  totalCovers: 68,
  coversChange: 8,
  tableOccupancy: 72,
  occupancyChange: 5,
  revenueToday: 12450,
  revenueChange: 18,
};

const DUMMY_ACTIVITY = [
  { label: "Table 4 seated", time: "2 min ago", type: "seated" },
  {
    label: "New reservation · David Kim",
    time: "8 min ago",
    type: "reservation",
  },
  { label: "Table 12 completed", time: "12 min ago", type: "completed" },
  { label: "Walk-in party of 3", time: "18 min ago", type: "walkin" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  href,
  delay = 0,
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  href?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={item}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="mt-1 font-serif text-2xl font-semibold text-foreground">
            {value}
          </p>
          {change !== undefined && (
            <p
              className={`mt-0.5 text-xs font-medium ${change >= 0 ? "text-emerald-600" : "text-destructive"}`}
            >
              {change >= 0 ? "+" : ""}
              {change}% vs yesterday
            </p>
          )}
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary/20">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {href && (
        <Link
          to={href}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
        >
          View <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </motion.div>
  );
}

export default function ManagerDashboard() {
  const { profile } = useAuth();
  const {
    activeReservations,
    loading: reservationsLoading,
    addReservation,
    updateStatus,
  } = useReservations();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInSaving, setWalkInSaving] = useState(false);
  const [markSeatedOpen, setMarkSeatedOpen] = useState(false);
  const [markSeatedSearch, setMarkSeatedSearch] = useState("");
  const [markSeatedLoadingId, setMarkSeatedLoadingId] = useState<string | null>(
    null,
  );
  // OCR state
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<Record<string, unknown> | null>(
    null,
  );
  const [ocrError, setOcrError] = useState<string | null>(null);
  const ocrFileRef = useRef<HTMLInputElement>(null);

  const handleOcrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setOcrFile(selected);
    setOcrPreview(URL.createObjectURL(selected));
    setOcrResult(null);
    setOcrError(null);
  };

  const handleOcrScan = async () => {
    if (!ocrFile) return;
    setOcrLoading(true);
    setOcrError(null);
    try {
      const formData = new FormData();
      formData.append("image", ocrFile); // ← make sure it's 'image' not 'file'

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ocr/scan`, {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      console.log("RAW RESPONSE:", text); // ← check browser console for this

      if (!text || text.trim() === "") {
        throw new Error("Empty response from server");
      }

      const data = JSON.parse(text);

      // OCR service returns either 'message' or 'error' field
      if (!data.success)
        throw new Error(data.message || data.error || "OCR failed");

      const result = data.data;
      if (!result || Object.keys(result).length === 0) {
        throw new Error("No data extracted from receipt");
      }
      setOcrResult(result);
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : "OCR failed");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleOcrClose = () => {
    setOcrOpen(false);
    setOcrFile(null);
    setOcrPreview(null);
    setOcrResult(null);
    setOcrError(null);
  };

  // Today's reservations sorted by time (soonest first = client to be reached at top)
  const todaySorted = [...activeReservations].sort((a, b) =>
    a.time.localeCompare(b.time),
  );

  const markSeatedCandidates = useMemo(
    () =>
      activeReservations
        .filter((r) => r.status !== "seated")
        .filter((r) => {
          if (!markSeatedSearch.trim()) return true;
          const q = markSeatedSearch.toLowerCase();
          return (
            r.guestName.toLowerCase().includes(q) ||
            (r.guestPhone && r.guestPhone.includes(q)) ||
            (r.guestEmail && r.guestEmail.toLowerCase().includes(q))
          );
        }),
    [activeReservations, markSeatedSearch],
  );

  const handleWalkInSave = async (
    data: Omit<Reservation, "id" | "createdAt">,
  ) => {
    try {
      setWalkInSaving(true);
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().slice(0, 5);
      await addReservation({
        ...data,
        date,
        time,
        status: "confirmed",
        source: "walk-in",
      });
      toast.success("Walk-in party added");
      setWalkInOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add walk-in");
    } finally {
      setWalkInSaving(false);
    }
  };

  const handleMarkAsSeated = async (res: Reservation) => {
    if (res.status === "seated") return;
    try {
      setMarkSeatedLoadingId(res.id);
      await updateStatus(res.id, "seated", res.restaurantId ?? undefined);
      toast.success(`Marked ${res.guestName} as seated`);
      setMarkSeatedOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to mark as seated");
    } finally {
      setMarkSeatedLoadingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-serif text-3xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {today} · Welcome back, {profile?.name || "Manager"}
        </p>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          title="Reservations today"
          value={reservationsLoading ? "—" : activeReservations.length}
          change={DUMMY_STATS.reservationsChange}
          icon={CalendarDays}
          href="/reservations"
        />
        <StatCard
          title="Total covers"
          value={DUMMY_STATS.totalCovers}
          change={DUMMY_STATS.coversChange}
          icon={UtensilsCrossed}
        />
        <StatCard
          title="Table occupancy"
          value={`${DUMMY_STATS.tableOccupancy}%`}
          change={DUMMY_STATS.occupancyChange}
          icon={Grid3X3}
          href="/floor"
        />
        <StatCard
          title="Revenue (today)"
          value={`₹${(DUMMY_STATS.revenueToday / 1000).toFixed(1)}k`}
          change={DUMMY_STATS.revenueChange}
          icon={TrendingUp}
        />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's reservations */}
        <motion.div
          variants={item}
          className="lg:col-span-2 rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-foreground">
              Today&apos;s reservations
            </h2>
            <Link
              to="/reservations"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {reservationsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : todaySorted.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground text-center">
              No reservations for today.
            </p>
          ) : (
            <ul className="space-y-0 divide-y divide-border">
              {todaySorted.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between py-3 first:pt-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {r.guestName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.time} · Party of {r.partySize}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                      r.status === "seated"
                        ? "bg-status-available/15 text-status-available"
                        : "bg-status-reserved/15 text-status-reserved"
                    }`}
                  >
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Quick links + Activity */}
        <motion.div variants={item} className="space-y-6">
          <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm">
            <h2 className="font-serif text-lg text-foreground mb-4">
              Quick actions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/reservations"
                state={{ openCreate: true }}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 transition-colors hover:bg-muted/60"
              >
                <PenSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Reservation</span>
              </Link>
              <button
                type="button"
                onClick={() => setMarkSeatedOpen(true)}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 transition-colors hover:bg-muted/60 text-left w-full"
              >
                <Mic className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Reservation (ASR)</span>
              </button>
              <button
                type="button"
                onClick={() => setMarkSeatedOpen(true)}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 transition-colors hover:bg-muted/60 text-left w-full"
              >
                <UserCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Mark as seated</span>
              </button>
              <button
                type="button"
                onClick={() => setWalkInOpen(true)}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 transition-colors hover:bg-muted/60 text-left w-full"
              >
                <UserPlus className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Walk-in party</span>
              </button>
              <button
                type="button"
                onClick={() => setOcrOpen(true)}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 transition-colors hover:bg-muted/60 text-left w-full"
              >
                <ScanLine className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Scan Receipt</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm">
            <h2 className="font-serif text-lg text-foreground mb-4">
              Recent activity
            </h2>
            <ul className="space-y-3">
              {DUMMY_ACTIVITY.map((a, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-foreground">{a.label}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {a.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
      <ReservationModal
        open={walkInOpen}
        onClose={() => !walkInSaving && setWalkInOpen(false)}
        onSave={handleWalkInSave}
        variant="walkin"
      />
      {markSeatedOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="glass-card-elevated rounded-2xl max-w-lg w-full mx-4 overflow-hidden border border-border bg-card">
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-border/60">
              <h2 className="font-serif text-lg text-foreground">
                Mark as seated
              </h2>
              <button
                type="button"
                onClick={() => setMarkSeatedOpen(false)}
                className="text-xs text-muted-foreground hover:underline"
              >
                Close
              </button>
            </div>
            <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <input
                value={markSeatedSearch}
                onChange={(e) => setMarkSeatedSearch(e.target.value)}
                placeholder="Search by name, phone, or email..."
                className="w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {markSeatedCandidates.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">
                  {markSeatedSearch
                    ? "No matching reservations found."
                    : "No active reservations available to mark as seated."}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {markSeatedCandidates.map((r) => (
                    <li
                      key={r.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {r.guestName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.time} · Party of {r.partySize}
                          {r.guestPhone && ` · ${r.guestPhone}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={markSeatedLoadingId === r.id}
                        onClick={() => handleMarkAsSeated(r)}
                        className="text-xs font-medium px-3 py-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {markSeatedLoadingId === r.id
                          ? "Marking..."
                          : "Mark seated"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      {ocrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="rounded-2xl max-w-lg w-full mx-4 overflow-hidden border border-border bg-card shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-primary" />
                <h2 className="font-serif text-lg text-foreground">
                  Scan Payment Receipt
                </h2>
              </div>
              <button
                type="button"
                onClick={handleOcrClose}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Upload area */}
              {!ocrResult && (
                <div
                  onClick={() => ocrFileRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
              ${ocrFile ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"}`}
                >
                  <input
                    ref={ocrFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleOcrFileChange}
                  />
                  {ocrPreview ? (
                    <img
                      src={ocrPreview}
                      alt="Receipt preview"
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ScanLine className="h-10 w-10 opacity-40" />
                      <p className="text-sm font-medium">
                        Click to upload receipt
                      </p>
                      <p className="text-xs opacity-60">
                        UPI screenshots, bank transfer receipts
                      </p>
                    </div>
                  )}
                  {ocrFile && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {ocrFile.name}
                    </p>
                  )}
                </div>
              )}

              {/* Error */}
              {ocrError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{ocrError}</p>
                </div>
              )}

              {/* Results */}
              {ocrResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-sm font-medium">
                      Receipt scanned successfully
                    </p>
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(ocrResult)
                          .filter(
                            ([, v]) =>
                              v !== null && v !== undefined && v !== "",
                          )
                          .map(([key, value]) => (
                            <tr
                              key={key}
                              className="border-b border-border/50 last:border-0"
                            >
                              <td className="px-4 py-2.5 font-medium text-muted-foreground capitalize align-top w-2/5">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </td>
                              <td className="px-4 py-2.5 text-foreground align-top">
                                {Array.isArray(value) ? (
                                  value.length === 0 ? (
                                    <span className="text-muted-foreground text-xs">
                                      —
                                    </span>
                                  ) : (
                                    <ul className="space-y-1">
                                      {(value as unknown[]).map((entry, i) => (
                                        <li
                                          key={i}
                                          className="text-xs bg-muted/40 rounded px-2 py-1.5"
                                        >
                                          {typeof entry === "object" &&
                                          entry !== null
                                            ? Object.entries(
                                                entry as Record<
                                                  string,
                                                  unknown
                                                >,
                                              )
                                                .map(
                                                  ([k, v]) =>
                                                    `${k}: ${String(v ?? "—")}`,
                                                )
                                                .join(" · ")
                                            : String(entry)}
                                        </li>
                                      ))}
                                    </ul>
                                  )
                                ) : typeof value === "object" &&
                                  value !== null ? (
                                  <span className="text-xs">
                                    {Object.entries(
                                      value as Record<string, unknown>,
                                    )
                                      .map(
                                        ([k, v]) => `${k}: ${String(v ?? "—")}`,
                                      )
                                      .join(" · ")}
                                  </span>
                                ) : (
                                  <span>{String(value)}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOcrFile(null);
                      setOcrPreview(null);
                      setOcrResult(null);
                      setOcrError(null);
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    ← Scan another receipt
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {!ocrResult && (
              <div className="px-5 py-4 border-t border-border/60 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleOcrClose}
                  className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleOcrScan}
                  disabled={!ocrFile || ocrLoading}
                  className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {ocrLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <ScanLine className="h-3.5 w-3.5" />
                      Scan Receipt
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
