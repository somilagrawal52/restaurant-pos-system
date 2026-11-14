import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Clock, CalendarDays, TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReservations } from '@/hooks/useReservations';
import ReservationModal from '@/components/reservations/ReservationModal';
import { Reservation } from '@/types/restaurant';

const statusColors: Record<string, string> = {
  confirmed: 'bg-status-reserved',
  seated: 'bg-status-available',
  completed: 'bg-muted',
  cancelled: 'bg-status-occupied',
  'no-show': 'bg-status-occupied',
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Dashboard() {
  const {
    tables,
    activeReservations,
    upcomingReservations,
    seatedReservations,
    totalCoversToday,
    addReservation,
    updateReservation,
  } = useReservations();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);

  const availableTables = tables.filter(t => t.status === 'available').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;

  const stats = [
    { label: 'Total Covers', value: totalCoversToday, icon: Users, color: 'text-primary' },
    { label: 'Reservations', value: activeReservations.length, icon: CalendarDays, color: 'text-status-reserved' },
    { label: 'Tables Available', value: `${availableTables}/${tables.length}`, icon: TrendingUp, color: 'text-status-available' },
    { label: 'Currently Seated', value: seatedReservations.length, icon: Clock, color: 'text-status-cleaning' },
  ];

  const handleSave = (data: Omit<Reservation, 'id' | 'createdAt'>) => {
    if (editingRes) {
      updateReservation(editingRes.id, data);
    } else {
      addReservation(data);
    }
    setEditingRes(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Today's service overview</p>
        </div>
        <Button onClick={() => { setEditingRes(null); setModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          New Reservation
        </Button>
      </div>

      {/* Stats */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={fadeUp} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</span>
            </div>
            <p className="text-3xl font-serif text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Upcoming */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-foreground">Upcoming</h2>
            <span className="text-xs text-muted-foreground">{upcomingReservations.length} reservations</span>
          </div>
          <div className="space-y-2">
            {upcomingReservations.map((res) => (
              <motion.button
                key={res.id}
                onClick={() => { setEditingRes(res); setModalOpen(true); }}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                className="w-full glass-card rounded-xl p-4 flex items-center gap-4 text-left transition-shadow hover:shadow-md cursor-pointer"
              >
                <div className="flex-shrink-0 w-14 text-center">
                  <p className="text-lg font-semibold text-foreground">{res.time}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{res.guestName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {res.partySize} guests · {res.tableId ? `Table ${tables.find(t => t.id === res.tableId)?.number}` : 'No table'} · {res.source}
                  </p>
                  {res.notes && (
                    <p className="text-xs text-primary/80 mt-1 truncate">{res.notes}</p>
                  )}
                </div>
                <div className={`w-2 h-2 rounded-full ${statusColors[res.status]}`} />
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              </motion.button>
            ))}
            {upcomingReservations.length === 0 && (
              <div className="glass-card rounded-xl p-8 text-center">
                <p className="text-sm text-muted-foreground">No upcoming reservations</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Table Status */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-2">
          <h2 className="font-serif text-xl text-foreground mb-4">Table Status</h2>
          <div className="glass-card rounded-xl p-4 space-y-3">
            {(['available', 'occupied', 'reserved', 'cleaning'] as const).map(status => {
              const count = tables.filter(t => t.status === status).length;
              const percent = Math.round((count / tables.length) * 100);
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full status-${status}`} />
                  <span className="text-sm capitalize text-foreground flex-1">{status}</span>
                  <span className="text-sm font-medium text-foreground">{count}</span>
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full status-${status}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Currently Seated */}
          <h2 className="font-serif text-xl text-foreground mt-6 mb-4">Seated Now</h2>
          <div className="space-y-2">
            {seatedReservations.map((res) => (
              <div key={res.id} className="glass-card rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-status-available/10 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-status-available" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{res.guestName}</p>
                  <p className="text-xs text-muted-foreground">{res.partySize} guests · T{tables.find(t => t.id === res.tableId)?.number}</p>
                </div>
                <span className="text-xs text-muted-foreground">{res.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <ReservationModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRes(null); }}
        onSave={handleSave}
        reservation={editingRes}
      />
    </div>
  );
}
