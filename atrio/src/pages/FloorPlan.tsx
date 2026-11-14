import { useState, useEffect, useMemo, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReservations } from "@/hooks/useReservations";
import { Table, TableStatus, FLOOR_SECTIONS } from "@/types/restaurant";
import {
  listFloorCategories,
  listFloors,
  createFloor,
  deleteFloor,
  addSection,
  deleteSection,
  listTableStatuses,
  updateTableStatuses,
  updateSection,
  getMe,
  listReservations,
  type ReservationDto,
  type FloorCategoryDto,
  type FloorDto,
  type FloorSectionDto,
} from "@/lib/api";
import FloorCategoriesModal from "@/components/floor/FloorCategoriesModal";
import { Button } from "@/components/ui/button";
import { Plus, Trash, Pencil } from "lucide-react";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionRange {
  _id: string;
  name: string;
  from: number;
  to: number;
  seats: number;
  smokingPreference?: "smoking" | "non-smoking";
  tableSeats?: Record<number, number>; // per-table seat overrides
  tableWeights?: Record<number, number>; // per-table weight overrides (0..1); default is 0.5
  isNew?: boolean;
}

interface Floor {
  id: string;
  floorNumber: number;
  name: string;
  sections: SectionRange[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const statusStyles: Record<
  TableStatus,
  { bg: string; ring: string; label: string }
> = {
  available: {
    bg: "bg-status-available/10",
    ring: "ring-status-available/40",
    label: "Available",
  },
  occupied: {
    bg: "bg-status-occupied/10",
    ring: "ring-status-occupied/40",
    label: "Occupied",
  },
  reserved: {
    bg: "bg-status-reserved/10",
    ring: "ring-status-reserved/40",
    label: "Reserved",
  },
  cleaning: {
    bg: "bg-status-cleaning/10",
    ring: "ring-status-cleaning/40",
    label: "Cleaning",
  },
};

// ─── Add Floor Modal ──────────────────────────────────────────────────────────

function AddFloorModal({
  onClose,
  onAdd,
  sectionNames,
}: {
  onClose: () => void;
  onAdd: (floor: Omit<Floor, "id">) => Promise<void>;
  sectionNames: string[];
}) {
  const [floorNumber, setFloorNumber] = useState<number>(1);
  const [floorName, setFloorName] = useState("");
  const [sections, setSections] = useState<Omit<SectionRange, "_id">[]>([
    {
      name: sectionNames[0] ?? "AC",
      from: 1,
      to: 10,
      seats: 4,
      smokingPreference: "non-smoking",
    },
  ]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);

  const addSectionRow = () => {
    setSections((prev) => [
      ...prev,
      {
        name: sectionNames[0] ?? "AC",
        from: 1,
        to: 10,
        seats: 4,
        smokingPreference: "non-smoking",
      },
    ]);
    setExpandedIdx(sections.length);
  };

  const removeSection = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIdx(null);
  };

  const updateSectionField = (
    idx: number,
    field: keyof Omit<SectionRange, "_id">,
    value: string | number,
  ) => {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    );
  };

  const handleSubmit = async () => {
    if (!floorName.trim() || sections.length === 0) return;
    setSaving(true);
    await onAdd({
      floorNumber,
      name: floorName.trim(),
      sections: sections as SectionRange[],
    });
    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 glass-card-elevated rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[90vh] flex flex-col"
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 16 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-foreground">Add New Floor</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto flex-1 pr-1">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">
              Floor Number
            </label>
            <input
              type="number"
              min={1}
              value={floorNumber}
              onChange={(e) => setFloorNumber(parseInt(e.target.value) || 1)}
              placeholder="e.g. 1, 2, 3…"
              className="w-full bg-muted/60 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">
              Floor Name
            </label>
            <input
              type="text"
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
              placeholder="e.g. Ground Floor, First Floor…"
              className="w-full bg-muted/60 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Sections
              </label>
              <button
                onClick={addSectionRow}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
              >
                <span className="text-base leading-none">+</span> Add Section
              </button>
            </div>

            <div className="space-y-2">
              {sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="bg-muted/40 rounded-xl overflow-hidden border border-border"
                >
                  <button
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-left"
                    onClick={() =>
                      setExpandedIdx(expandedIdx === idx ? null : idx)
                    }
                  >
                    <span className="text-sm font-medium text-foreground">
                      {sec.name} &nbsp;
                      <span className="text-xs text-muted-foreground font-normal">
                        (Tables {sec.from}–{sec.to}, {sec.seats}s)
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                        {Math.max(0, sec.to - sec.from + 1)} tables
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {expandedIdx === idx ? "▲" : "▼"}
                      </span>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedIdx === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3.5 pb-3.5 pt-1 border-t border-border space-y-3">
                          <div>
                            <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                              Section Type
                            </label>
                            <select
                              value={sec.name}
                              onChange={(e) =>
                                updateSectionField(idx, "name", e.target.value)
                              }
                              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            >
                              {sectionNames.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                                Start Table #
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={sec.from}
                                onChange={(e) =>
                                  updateSectionField(
                                    idx,
                                    "from",
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                                End Table #
                              </label>
                              <input
                                type="number"
                                min={sec.from}
                                value={sec.to}
                                onChange={(e) =>
                                  updateSectionField(
                                    idx,
                                    "to",
                                    parseInt(e.target.value) || sec.from,
                                  )
                                }
                                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                              Seats per Table (default)
                            </label>
                            <select
                              value={sec.seats}
                              onChange={(e) =>
                                updateSectionField(
                                  idx,
                                  "seats",
                                  parseInt(e.target.value),
                                )
                              }
                              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            >
                              {[2, 4, 6, 8, 10, 12].map((n) => (
                                <option key={n} value={n}>
                                  {n} seats
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                              Section preference
                            </label>
                            <div className="flex items-center gap-4 rounded-lg border border-border bg-background px-3 py-2">
                              <label className="flex items-center gap-2 text-sm text-foreground">
                                <input
                                  type="radio"
                                  name={`section-pref-${idx}`}
                                  value="smoking"
                                  checked={
                                    (sec.smokingPreference ?? "non-smoking") ===
                                    "smoking"
                                  }
                                  onChange={() =>
                                    updateSectionField(
                                      idx,
                                      "smokingPreference",
                                      "smoking",
                                    )
                                  }
                                  className="accent-primary"
                                />
                                Smoking
                              </label>
                              <label className="flex items-center gap-2 text-sm text-foreground">
                                <input
                                  type="radio"
                                  name={`section-pref-${idx}`}
                                  value="non-smoking"
                                  checked={
                                    (sec.smokingPreference ?? "non-smoking") ===
                                    "non-smoking"
                                  }
                                  onChange={() =>
                                    updateSectionField(
                                      idx,
                                      "smokingPreference",
                                      "non-smoking",
                                    )
                                  }
                                  className="accent-primary"
                                />
                                Non-smoking
                              </label>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {Array.from(
                              {
                                length: Math.min(
                                  Math.max(0, sec.to - sec.from + 1),
                                  20,
                                ),
                              },
                              (_, i) => sec.from + i,
                            ).map((n) => (
                              <span
                                key={n}
                                className="text-[10px] bg-status-available/10 ring-1 ring-status-available/40 text-foreground rounded px-1.5 py-0.5"
                              >
                                {n}
                              </span>
                            ))}
                            {sec.to - sec.from + 1 > 20 && (
                              <span className="text-[10px] text-muted-foreground px-1 py-0.5">
                                +{sec.to - sec.from + 1 - 20} more
                              </span>
                            )}
                          </div>

                          {sections.length > 1 && (
                            <button
                              onClick={() => removeSection(idx)}
                              className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                            >
                              Remove section
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-muted text-muted-foreground rounded-xl py-2.5 text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!floorName.trim() || saving}
            className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Creating…" : "Create Floor"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Add Section Modal ────────────────────────────────────────────────────────

function AddSectionModal({
  onClose,
  onAdd,
  sectionNames,
}: {
  onClose: () => void;
  onAdd: (section: Omit<SectionRange, "_id">) => Promise<void>;
  sectionNames: string[];
}) {
  const [section, setSection] = useState<Omit<SectionRange, "_id">>({
    name: sectionNames[0] ?? "AC",
    from: 1,
    to: 10,
    seats: 4,
    smokingPreference: "non-smoking",
  });
  const [saving, setSaving] = useState(false);

  const update = (
    field: keyof Omit<SectionRange, "_id">,
    value: string | number,
  ) => {
    setSection((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (section.to < section.from) return;
    setSaving(true);
    await onAdd(section);
    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 glass-card-elevated rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 16 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-foreground">Add Section</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
              Section Type
            </label>
            <select
              value={section.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {sectionNames.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                Start Table #
              </label>
              <input
                type="number"
                min={1}
                value={section.from}
                onChange={(e) => update("from", parseInt(e.target.value) || 1)}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                End Table #
              </label>
              <input
                type="number"
                min={section.from}
                value={section.to}
                onChange={(e) =>
                  update("to", parseInt(e.target.value) || section.from)
                }
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
              Seats per Table
            </label>
            <select
              value={section.seats}
              onChange={(e) => update("seats", parseInt(e.target.value))}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {[2, 4, 6, 8, 10, 12].map((n) => (
                <option key={n} value={n}>
                  {n} seats
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
              Section preference
            </label>
            <div className="flex items-center gap-4 rounded-lg border border-border bg-background px-3 py-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="add-section-pref"
                  value="smoking"
                  checked={(section.smokingPreference ?? "non-smoking") === "smoking"}
                  onChange={() => update("smokingPreference", "smoking")}
                  className="accent-primary"
                />
                Smoking
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="add-section-pref"
                  value="non-smoking"
                  checked={
                    (section.smokingPreference ?? "non-smoking") === "non-smoking"
                  }
                  onChange={() => update("smokingPreference", "non-smoking")}
                  className="accent-primary"
                />
                Non-smoking
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {Array.from(
              {
                length: Math.min(
                  Math.max(0, section.to - section.from + 1),
                  20,
                ),
              },
              (_, i) => section.from + i,
            ).map((n) => (
              <span
                key={n}
                className="text-[10px] bg-status-available/10 ring-1 ring-status-available/40 text-foreground rounded px-1.5 py-0.5"
              >
                {n}
              </span>
            ))}
            {section.to - section.from + 1 > 20 && (
              <span className="text-[10px] text-muted-foreground px-1 py-0.5">
                +{section.to - section.from + 1 - 20} more
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-muted text-muted-foreground rounded-xl py-2.5 text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || section.to < section.from}
            className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Adding…" : "Add Section"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Edit Section Modal ───────────────────────────────────────────────────────

function EditSectionModal({
  section,
  onClose,
  onSave,
  sectionNames,
}: {
  section: SectionRange;
  onClose: () => void;
  onSave: (updated: Omit<SectionRange, "_id">) => Promise<void>;
  sectionNames: string[];
}) {
  const [form, setForm] = useState<Omit<SectionRange, "_id">>({
    name: section.name,
    from: section.from,
    to: section.to,
    seats: section.seats,
    smokingPreference: section.smokingPreference ?? "non-smoking",
    tableSeats: section.tableSeats ?? {},
    tableWeights: section.tableWeights ?? {},
  });
  const [saving, setSaving] = useState(false);
  const [showPerTable, setShowPerTable] = useState(false);

  const update = (
    field: keyof Omit<SectionRange, "_id" | "tableSeats">,
    value: string | number,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateTableSeat = (tableNum: number, seats: number) => {
    setForm((prev) => ({
      ...prev,
      tableSeats: { ...prev.tableSeats, [tableNum]: seats },
    }));
  };

  const updateTableWeight = (tableNum: number, weight: number) => {
    const clamped = Math.min(1, Math.max(0, weight));
    setForm((prev) => ({
      ...prev,
      tableWeights: { ...(prev.tableWeights ?? {}), [tableNum]: clamped },
    }));
  };

  const handleSubmit = async () => {
    if (form.to < form.from) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  const tableCount = Math.max(0, form.to - form.from + 1);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 glass-card-elevated rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl max-h-[90vh] flex flex-col"
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 16 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-foreground">Edit Section</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Section Type */}
          <div>
            <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
              Section Type
            </label>
            <select
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {sectionNames.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Table Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                Start Table #
              </label>
              <input
                type="number"
                min={1}
                value={form.from}
                onChange={(e) => update("from", parseInt(e.target.value) || 1)}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                End Table #
              </label>
              <input
                type="number"
                min={form.from}
                value={form.to}
                onChange={(e) =>
                  update("to", parseInt(e.target.value) || form.from)
                }
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Default Seats */}
          <div>
            <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
              Default Seats per Table
            </label>
            <select
              value={form.seats}
              onChange={(e) => update("seats", parseInt(e.target.value))}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {[2, 4, 6, 8, 10, 12].map((n) => (
                <option key={n} value={n}>
                  {n} seats
                </option>
              ))}
            </select>
          </div>

          {/* Smoking preference */}
          <div>
            <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
              Section preference
            </label>
            <div className="flex items-center gap-4 rounded-lg border border-border bg-background px-3 py-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name={`edit-section-pref-${section._id}`}
                  value="smoking"
                  checked={(form.smokingPreference ?? "non-smoking") === "smoking"}
                  onChange={() => update("smokingPreference", "smoking")}
                  className="accent-primary"
                />
                Smoking
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name={`edit-section-pref-${section._id}`}
                  value="non-smoking"
                  checked={
                    (form.smokingPreference ?? "non-smoking") === "non-smoking"
                  }
                  onChange={() => update("smokingPreference", "non-smoking")}
                  className="accent-primary"
                />
                Non-smoking
              </label>
            </div>
          </div>

          {/* Per-Table Seats Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowPerTable((v) => !v)}
              className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <span className="text-base leading-none">
                {showPerTable ? "▲" : "▼"}
              </span>
              Customize seats per table
            </button>

            <AnimatePresence initial={false}>
              {showPerTable && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1 bg-muted/30 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">
                      Seats per table (overrides default)
                    </p>
                    {Array.from({ length: tableCount }, (_, i) => {
                      const tableNum = form.from + i;
                      const currentSeats =
                        form.tableSeats?.[tableNum] ?? form.seats;
                      const currentWeight =
                        form.tableWeights?.[tableNum] ??
                        (form.smokingPreference === "smoking" ? 0.3 : 0.5);
                      return (
                        <div key={tableNum} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-16 shrink-0">
                            Table {tableNum}
                          </span>
                          <select
                            value={currentSeats}
                            onChange={(e) =>
                              updateTableSeat(
                                tableNum,
                                parseInt(e.target.value),
                              )
                            }
                            className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                          >
                            {[2, 4, 6, 8, 10, 12].map((n) => (
                              <option key={n} value={n}>
                                {n} seats
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-2 w-44 shrink-0">
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.01}
                              value={currentWeight}
                              onChange={(e) =>
                                updateTableWeight(
                                  tableNum,
                                  parseFloat(e.target.value),
                                )
                              }
                              className="flex-1 accent-primary"
                            />
                            <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">
                              {currentWeight.toFixed(2)}
                            </span>
                          </div>
                          {form.tableSeats?.[tableNum] !== undefined &&
                            form.tableSeats[tableNum] !== form.seats && (
                              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">
                                custom
                              </span>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex gap-2 mt-5 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-muted text-muted-foreground rounded-xl py-2.5 text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || form.to < form.from}
            className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const DUMMY_FOOD = [
  { name: "Butter Chicken", qty: 2, price: 320 },
  { name: "Garlic Naan", qty: 4, price: 60 },
  { name: "Dal Makhani", qty: 1, price: 220 },
  { name: "Lassi", qty: 2, price: 80 },
];
const DUMMY_TOTAL = DUMMY_FOOD.reduce((sum, o) => sum + o.price * o.qty, 0);

function OrderCard({
  r,
  statusBadge,
}: {
  r: ReservationDto;
  statusBadge: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border border-border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm font-medium text-foreground">
          {r.guestName}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusBadge[r.status] ?? "bg-muted text-muted-foreground"}`}
        >
          {r.status}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {r.date} · {r.time} · Party of {r.partySize}
      </p>
      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
      >
        <span>{open ? "▲" : "▼"}</span>
        {open ? "Hide" : "View"} details
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">
                  Customer
                </p>
                <p className="text-xs text-foreground font-medium">
                  {r.guestName}
                </p>
                {r.guestEmail && (
                  <p className="text-xs text-muted-foreground">
                    {r.guestEmail}
                  </p>
                )}
                {r.guestPhone && (
                  <p className="text-xs text-muted-foreground">
                    {r.guestPhone}
                  </p>
                )}
                {r.notes && (
                  <p className="text-xs text-muted-foreground italic mt-1">
                    "{r.notes}"
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-muted/30 border border-border divide-y divide-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium px-3 pt-2.5 pb-1.5">
                  Order
                </p>
                {DUMMY_FOOD.map((o, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                        ×{o.qty}
                      </span>
                      <span className="text-xs text-foreground">{o.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ₹{(o.price * o.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-medium text-foreground">
                    Total
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    ₹{DUMMY_TOTAL.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function TableHistoryDrawer({
  tableNumber,
  sectionName,
  floorName,
  restaurantId,
  onClose,
}: {
  tableNumber: number;
  sectionName: string;
  floorName: string;
  restaurantId?: string;
  onClose: () => void;
}) {
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    listReservations(restaurantId).then((res) => {
      if (res.success && res.data?.reservations) {
        const filtered = res.data.reservations.filter(
          (r) =>
            `${r.subsection ?? ""}_${r.tableNumber ?? ""}` ===
            `${sectionName}_${tableNumber}`,
        );
        setReservations(filtered);
      }
      setLoading(false);
    });
  }, [tableNumber, restaurantId]);

  const statusBadge: Record<string, string> = {
    confirmed: "bg-status-reserved/15 text-status-reserved",
    seated: "bg-status-available/15 text-status-available",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-status-occupied/15 text-status-occupied",
    "no-show": "bg-status-occupied/15 text-status-occupied",
  };

  const filtered = reservations.filter((r) =>
    [r.guestName, r.guestEmail, r.guestPhone, r.date]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-xl flex flex-col"
      >
        <div className="px-4 py-4 border-b border-border shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg text-foreground">
                Table {tableNumber}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {floorName} · {sectionName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              ✕
            </button>
          </div>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, date…"
              className="w-full bg-muted/60 border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              {search
                ? "No results match your search."
                : "No reservation history for this table."}
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((r) => (
                <OrderCard key={r.id} r={r} statusBadge={statusBadge} />
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── Virtual Table Grid ───────────────────────────────────────────────────────
const VirtualTableGrid = memo(function VirtualTableGrid({
  section,
  floorId,
  onSectionDeleted,
  onSectionEdited,
  sectionNames,
  restaurantId,
  floorName,
}: {
  section: SectionRange;
  floorId: string;
  floorName: string;
  onSectionDeleted: (sectionId: string) => void;
  onSectionEdited: (updated: SectionRange) => void;
  sectionNames: string[];
  restaurantId?: string;
}) {
  const count = Math.max(0, section.to - section.from + 1);
  const normalizedTableSeats = useMemo(() => {
    if (!section.tableSeats) return {};
    return Object.fromEntries(
      Object.entries(section.tableSeats).map(([k, v]) => [Number(k), v]),
    );
  }, [section.tableSeats]);
  const defaultStatuses = useMemo(
    () =>
      Object.fromEntries(
        Array.from({ length: count }, (_, i) => [
          section.from + i,
          "available" as TableStatus,
        ]),
      ),
    [count, section.from],
  );

  const [statuses, setStatuses] =
    useState<Record<number, TableStatus>>(defaultStatuses);
  const statusesRef = useRef(statuses);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  useEffect(() => {
    statusesRef.current = statuses;
  }, [statuses]);

  // Re-fetch only when section identity changes
  useEffect(() => {
    if (section.isNew) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    listTableStatuses(floorId, section._id)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data?.statuses.length) {
          const map: Record<number, TableStatus> = { ...defaultStatuses };
          res.data.statuses.forEach((s) => {
            map[s.tableNumber] = s.status as TableStatus;
          });
          setStatuses(map);
        } else {
          setStatuses(defaultStatuses);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load statuses");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [floorId, section._id]);

  // When range changes, preserve existing statuses for overlapping tables
  useEffect(() => {
    setStatuses((prev) => {
      const next: Record<number, TableStatus> = {};
      for (let i = section.from; i <= section.to; i++) {
        next[i] = prev[i] ?? "available";
      }
      return next;
    });
  }, [section.from, section.to]);

  useEffect(() => {
    statusesRef.current = statuses;
  }, [statuses]);

  const handleDeleteSection = async () => {
    setDeleting(true);
    const res = await deleteSection(floorId, section._id, restaurantId);
    if (res.success) {
      onSectionDeleted(section._id);
    } else {
      console.error("Failed to delete section:", res.message);
      setDeleting(false);
    }
  };

  const handleEditSave = async (updated: Omit<SectionRange, "_id">) => {
    const res = await updateSection(
      floorId,
      section._id,
      updated,
      restaurantId,
    );
    if (res.success) {
      onSectionEdited({ ...updated, _id: section._id });
    } else {
      console.error("Failed to update section:", res.message);
    }
  };

  const tables = Array.from({ length: count }, (_, i) => section.from + i);
  const availableCount = Object.values(statuses).filter(
    (s) => s === "available",
  ).length;
  const occupiedCount = Object.values(statuses).filter(
    (s) => s === "occupied",
  ).length;
  const reservedCount = Object.values(statuses).filter(
    (s) => s === "reserved",
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-serif text-lg text-foreground">{section.name}</h2>
          {loading ? (
            <p className="text-xs text-muted-foreground mt-0.5">Loading…</p>
          ) : error ? (
            <p className="text-xs text-destructive mt-0.5">{error}</p>
          ) : (
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-xs text-muted-foreground">
                {availableCount} of {count} available
              </p>
              {reservedCount > 0 && (
                <span className="text-[10px] bg-status-reserved/10 ring-1 ring-status-reserved/40 text-foreground px-1.5 py-0.5 rounded-full">
                  {reservedCount} reserved
                </span>
              )}
              {occupiedCount > 0 && (
                <span className="text-[10px] bg-status-occupied/10 ring-1 ring-status-occupied/40 text-foreground px-1.5 py-0.5 rounded-full">
                  {occupiedCount} occupied
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {section.smokingPreference && (
            <span
              className={`text-[9px] font-medium uppercase tracking-widest px-2 py-1 rounded-full border ${
                section.smokingPreference === "smoking"
                  ? "border-red-500/50 text-red-600 bg-red-500/10"
                  : "border-emerald-500/50 text-emerald-700 bg-emerald-500/10"
              }`}
            >
              {section.smokingPreference === "smoking"
                ? "Smoking"
                : "Non-smoking"}
            </span>
          )}
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded-full">
            {section.name}
          </span>
          <Pencil
            size={16}
            className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowEdit(true)}
          />
          <Trash
            size={18}
            color="red"
            onClick={deleting ? undefined : handleDeleteSection}
            className={`cursor-pointer ${deleting ? "opacity-40 pointer-events-none" : ""}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {tables.map((n) => {
          const status = statuses[n];
          const style = statusStyles[status ?? "available"];
          const hasReservation = status === "reserved" || status === "occupied";
          // Per-table seats
          const tableSeatsCount = normalizedTableSeats[n] ?? section.seats;
          const shapeClass =
            tableSeatsCount === 2
              ? "rounded-full"
              : tableSeatsCount >= 6
                ? "rounded-xl"
                : "rounded-lg";
          return (
            <motion.div
              key={n}
              onClick={() => setSelectedTable(n)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className={`${style.bg} ring-1 ${style.ring} backdrop-blur-sm flex flex-col items-center justify-center transition-all cursor-pointer aspect-square ${shapeClass} disabled:opacity-50`}
            >
              <span className="text-sm font-serif text-foreground">{n}</span>
              <span className="text-[9px] text-muted-foreground">
                {tableSeatsCount}s
              </span>
              {hasReservation && (
                <span className="text-[8px] font-medium text-foreground mt-0.5 capitalize">
                  {status}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {!loading && (
        <div className="mt-3 pt-3 border-t border-border">
          {availableCount === count ? (
            <p className="text-xs text-muted-foreground">
              No reservations — all tables available
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {count - availableCount} of {count} tables have reservations or
              are occupied
            </p>
          )}
        </div>
      )}

      {showEdit &&
        createPortal(
          <AnimatePresence>
            <EditSectionModal
              section={section}
              onClose={() => setShowEdit(false)}
              onSave={handleEditSave}
              sectionNames={sectionNames}
            />
          </AnimatePresence>,
          document.body,
        )}
      {selectedTable !== null &&
        createPortal(
          <AnimatePresence>
            <TableHistoryDrawer
              tableNumber={selectedTable}
              sectionName={section.name}
              floorName={floorName}
              restaurantId={restaurantId}
              onClose={() => setSelectedTable(null)}
            />
          </AnimatePresence>,
          document.body,
        )}
    </motion.div>
  );
});

// ─── Floor Accordion ──────────────────────────────────────────────────────────

function FloorAccordion({
  floor,
  sectionFilter,
  onDelete,
  onSectionDeleted,
  onSectionAdded,
  onSectionEdited,
  sectionNames,
  restaurantId,
}: {
  floor: Floor;
  sectionFilter: string;
  onDelete: () => void;
  onSectionDeleted: (floorId: string, sectionId: string) => void;
  onSectionAdded: (floorId: string, section: SectionRange) => void;
  onSectionEdited: (floorId: string, updated: SectionRange) => void;
  sectionNames: string[];
  restaurantId?: string;
}) {
  const visibleSections =
    sectionFilter === "all"
      ? floor.sections
      : floor.sections.filter(
          (s) => s.name.toLowerCase() === sectionFilter.toLowerCase(),
        );

  const [open, setOpen] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);

  const handleDelete = () => {
    setDeleting(true);
    onDelete();
  };

  const handleAddSection = async (section: Omit<SectionRange, "_id">) => {
    const res = await addSection(floor.id, section);
    if (res.success && res.data?.floor) {
      const newSecs = res.data.floor.sections;
      const newSection = newSecs[newSecs.length - 1] as unknown as SectionRange;
      onSectionAdded(floor.id, { ...newSection, isNew: true });
    } else {
      console.error("Failed to add section:", res.message);
    }
  };

  const handleSectionEdited = (updated: SectionRange) => {
    onSectionEdited(floor.id, updated);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <button
          className="flex items-center gap-3 group"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            {floor.name}
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
            {floor.sections.reduce(
              (acc, s) => acc + Math.max(0, s.to - s.from + 1),
              0,
            )}{" "}
            tables
          </span>
          <span className="text-muted-foreground text-[10px]">
            {open ? "▲" : "▼"}
          </span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddSection(true)}
            className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
          >
            <span className="text-base leading-none">+</span> Add Section
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-destructive/50 hover:text-destructive transition-colors disabled:opacity-40"
          >
            {deleting ? "Removing…" : "Remove floor"}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {visibleSections.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No sections match the selected filter
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {visibleSections.map((sec, idx) => (
                  <VirtualTableGrid
                    key={sec._id ?? idx}
                    section={sec}
                    floorId={floor.id}
                    floorName={floor.name}
                    onSectionDeleted={(sectionId) =>
                      onSectionDeleted(floor.id, sectionId)
                    }
                    onSectionEdited={handleSectionEdited}
                    sectionNames={sectionNames}
                    restaurantId={restaurantId}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddSection && (
          <AddSectionModal
            onClose={() => setShowAddSection(false)}
            onAdd={handleAddSection}
            sectionNames={sectionNames}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FloorPlan() {
  const { tables, updateTableStatus, reservations } = useReservations();

  const [categories, setCategories] = useState<FloorCategoryDto[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);

  const [restaurantId, setRestaurantId] = useState<string | undefined>(
    undefined,
  );
  const [customFloors, setCustomFloors] = useState<Floor[]>([]);
  const [floorsLoading, setFloorsLoading] = useState(true);
  const [floorsError, setFloorsError] = useState<string | null>(null);

  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);

  const fetchCategories = async (rid?: string) => {
    setCategoriesLoading(true);
    const res = await listFloorCategories(rid ?? restaurantId);
    if (res.success && res.data?.categories) setCategories(res.data.categories);
    setCategoriesLoading(false);
  };

  const fetchFloors = async (rid?: string) => {
    setFloorsLoading(true);
    setFloorsError(null);
    const res = await listFloors(rid ?? restaurantId);
    if (res.success && res.data?.floors) {
      setCustomFloors(res.data.floors as unknown as Floor[]);
    } else if (!res.success) {
      setFloorsError(res.message ?? "Failed to load floors");
    }
    setFloorsLoading(false);
  };

  useEffect(() => {
    getMe().then((res) => {
      const rid = res.data?.user?.restaurantId ?? undefined;
      setRestaurantId(rid);
      fetchCategories(rid);
      fetchFloors(rid);
    });
  }, []);

  const addFloor = async (floor: Omit<Floor, "id">) => {
    const res = await createFloor(
      {
        floorNumber: floor.floorNumber,
        name: floor.name,
        sections: floor.sections,
      },
      restaurantId,
    );
    if (res.success && res.data?.floor) {
      const newFloor = res.data!.floor as unknown as Floor;
      const floorWithNewSections: Floor = {
        ...newFloor,
        sections: newFloor.sections.map((s) => ({ ...s, isNew: true })),
      };
      setCustomFloors((prev) => [...prev, floorWithNewSections]);
    } else {
      console.error("Failed to create floor:", res.message);
    }
  };

  const removeFloor = async (id: string) => {
    setCustomFloors((prev) => prev.filter((f) => f.id !== id));
    const res = await deleteFloor(id, restaurantId);
    if (!res.success) {
      console.error("Failed to delete floor:", res.message);
      fetchFloors();
    }
  };

  const handleSectionDeleted = (floorId: string, sectionId: string) => {
    setCustomFloors((prev) =>
      prev.map((f) =>
        f.id === floorId
          ? { ...f, sections: f.sections.filter((s) => s._id !== sectionId) }
          : f,
      ),
    );
  };

  const handleSectionAdded = (floorId: string, section: SectionRange) => {
    setCustomFloors((prev) =>
      prev.map((f) =>
        f.id === floorId ? { ...f, sections: [...f.sections, section] } : f,
      ),
    );
  };

  const handleSectionEdited = (floorId: string, updated: SectionRange) => {
    setCustomFloors((prev) =>
      prev.map((f) =>
        f.id === floorId
          ? {
              ...f,
              sections: f.sections.map((s) =>
                s._id === updated._id ? updated : s,
              ),
            }
          : f,
      ),
    );
  };

  const sectionNames =
    categories.length > 0 ? categories.map((c) => c.name) : [...FLOOR_SECTIONS];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Floor Plan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tap a table to view reservation history
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex gap-4">
            {Object.entries(statusStyles).map(([status, style]) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-md ${style.bg} ring-1 ${style.ring}`}
                />
                <span className="text-xs text-muted-foreground capitalize">
                  {style.label}
                </span>
              </div>
            ))}
          </div>

          <motion.button
            onClick={() => setShowModal(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add Floor
          </motion.button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSectionFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              sectionFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All Sections
          </button>
          {sectionNames.map((name) => (
            <button
              key={name}
              onClick={() => setSectionFilter(name)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                sectionFilter === name
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-1.5 shrink-0"
          onClick={() => setCategoriesModalOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Add category
        </Button>
      </div>

      <div className="mt-6">
        {floorsLoading && (
          <p className="text-sm text-muted-foreground">Loading floors…</p>
        )}
        {floorsError && !floorsLoading && (
          <p className="text-sm text-destructive">{floorsError}</p>
        )}
        {!floorsLoading &&
          [...customFloors]
            .sort((a, b) => (a.floorNumber ?? 0) - (b.floorNumber ?? 0))
            .map((floor) => (
            <FloorAccordion
              key={floor.id}
              floor={floor}
              sectionFilter={sectionFilter}
              onDelete={() => removeFloor(floor.id)}
              onSectionDeleted={handleSectionDeleted}
              onSectionAdded={handleSectionAdded}
              onSectionEdited={handleSectionEdited}
              sectionNames={sectionNames}
              restaurantId={restaurantId}
            />
          ))}
      </div>

      <FloorCategoriesModal
        open={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        onSaved={fetchCategories}
      />

      <AnimatePresence>
        {showModal && (
          <AddFloorModal
            onClose={() => setShowModal(false)}
            onAdd={addFloor}
            sectionNames={sectionNames}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
