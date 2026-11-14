import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, X, User, Calendar, Phone, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchCustomers, getCustomerHistory } from '@/lib/api';
import type { CustomerSummaryDto, CustomerHistoryReservationDto } from '@/lib/api';

const statusBadge: Record<string, string> = {
  confirmed: 'bg-status-reserved/15 text-status-reserved',
  seated: 'bg-status-available/15 text-status-available',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-status-occupied/15 text-status-occupied',
  'no-show': 'bg-status-occupied/15 text-status-occupied',
};

function formatDate(dateStr: string, timeStr: string) {
  try {
    return new Date(`${dateStr}T${timeStr}`).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return `${dateStr} ${timeStr}`;
  }
}

export default function Customer360() {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerSummaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<CustomerHistoryReservationDto[]>([]);
  const [profile, setProfile] = useState<{ guestName: string; guestEmail: string; guestPhone: string } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const res = await searchCustomers(query || undefined);
    if (res.success && res.data?.customers) {
      setCustomers(res.data.customers);
    } else {
      setCustomers([]);
    }
    setLoading(false);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(), 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  const openDetail = async (customerId: string) => {
    setSelectedId(customerId);
    setHistoryLoading(true);
    setProfile(null);
    setHistory([]);
    const res = await getCustomerHistory(customerId);
    if (res.success && res.data) {
      setProfile(res.data.profile ?? null);
      setHistory(res.data.reservations ?? []);
    }
    setHistoryLoading(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-serif text-3xl text-foreground">Customer 360</h1>
        <p className="text-muted-foreground mt-1">
          Search by name, email or phone to view customer profile and visit history
        </p>
      </motion.div>

      <div className="relative max-w-xl mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="pl-9 bg-background/60"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : customers.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
          {query.trim() ? 'No customers found. Try a different search.' : 'Enter a name, email or phone to search.'}
        </div>
      ) : (
        <div className="grid gap-3">
          {customers.map((c) => (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => openDetail(c.id)}
              className="glass-card rounded-xl p-4 text-left w-full flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{c.guestName}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                    {c.guestEmail && <span className="truncate">{c.guestEmail}</span>}
                    {c.guestPhone && <span>{c.guestPhone}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-sm text-muted-foreground">
                  {c.totalReservations} visit{c.totalReservations !== 1 ? 's' : ''}
                </span>
                {c.lastVisit && (
                  <span className="text-xs text-muted-foreground">
                    Last: {c.lastVisit.date} · {c.lastVisit.time}
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setSelectedId(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
                <h2 className="font-serif text-lg text-foreground">Visit history</h2>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {historyLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {profile && (
                      <div className="mb-6 pb-4 border-b border-border">
                        <p className="font-medium text-foreground flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {profile.guestName}
                        </p>
                        {profile.guestEmail && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Mail className="w-3.5 h-3.5" />
                            {profile.guestEmail}
                          </p>
                        )}
                        {profile.guestPhone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                            <Phone className="w-3.5 h-3.5" />
                            {profile.guestPhone}
                          </p>
                        )}
                      </div>
                    )}
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Reservations
                    </h3>
                    {history.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No reservation history.</p>
                    ) : (
                      <ul className="space-y-2">
                        {history.map((r) => (
                          <li
                            key={r.id}
                            className="rounded-lg border border-border bg-background/60 p-3"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-medium text-foreground">
                                {formatDate(r.date, r.time)}
                              </span>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                                  statusBadge[r.status] ?? 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {r.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Party of {r.partySize}
                              {r.source && ` · ${r.source}`}
                            </p>
                            {r.notes && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.notes}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
