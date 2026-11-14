import React, { useState, useEffect } from 'react';
import { mockInitialKOTs } from '@/data/posMockData';
import { KOT, KitchenStation } from '@/types/pos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  ChefHat,
  Flame,
  Wine,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Volume2,
  RefreshCw,
  UtensilsCrossed,
} from 'lucide-react';

export default function KitchenDisplay() {
  const [kots, setKots] = useState<KOT[]>(mockInitialKOTs);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update clock every 10 seconds for aging calculation
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getAgingMinutes = (createdAt: string) => {
    const diffMs = currentTime - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const filteredKots = kots.filter((kot) => {
    if (selectedStation === 'all') return true;
    return kot.station === selectedStation;
  });

  const handleUpdateStatus = (kotId: string, newStatus: 'in_prep' | 'completed') => {
    if (newStatus === 'completed') {
      setKots((prev) => prev.filter((k) => k.id !== kotId));
      toast.success(`KOT #${kots.find((k) => k.id === kotId)?.kotNumber} Bumped! Order Ready.`);
    } else {
      setKots((prev) =>
        prev.map((k) => (k.id === kotId ? { ...k, status: newStatus } : k))
      );
      toast.info(`KOT in preparation.`);
    }
  };

  const handleToggleItemStrike = (kotId: string, itemIdx: number) => {
    setKots((prev) =>
      prev.map((k) => {
        if (k.id !== kotId) return k;
        const updatedItems = [...k.items];
        const currentItem = updatedItems[itemIdx];
        if (currentItem) {
          updatedItems[itemIdx] = {
            ...currentItem,
            status: currentItem.status === 'ready' ? 'preparing' : 'ready',
          };
        }
        return { ...k, items: updatedItems };
      })
    );
  };

  const handlePrintKOT = (kot: KOT) => {
    toast.info(`Printing Kitchen Ticket #${kot.kotNumber} to ${kot.station.toUpperCase()} ESC/POS printer...`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.2rem)] overflow-hidden bg-zinc-950 text-zinc-100">
      {/* KDS Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-amber-400" />
            <h1 className="text-lg font-black tracking-wide uppercase">
              AURAPOS Kitchen Display (KDS)
            </h1>
          </div>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
            {filteredKots.length} Active Tickets
          </Badge>
        </div>

        {/* Station Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-800 p-1 rounded-xl border border-zinc-700">
          {[
            { id: 'all', label: 'All Stations' },
            { id: 'grill', label: 'Grill & Pizza', icon: Flame },
            { id: 'kitchen', label: 'Hot Line & Mains' },
            { id: 'bar', label: 'Bar & Drinks', icon: Wine },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStation(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                selectedStation === st.id
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Sound & Refresh Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`text-xs gap-1.5 ${soundEnabled ? 'text-amber-400' : 'text-zinc-500'}`}
          >
            <Volume2 className="w-4 h-4" />
            {soundEnabled ? 'Chime ON' : 'Muted'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentTime(Date.now());
              toast.info('Refreshed KDS Queue');
            }}
            className="text-xs border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* KDS Active Tickets Grid */}
      <div className="flex-1 p-6 overflow-x-auto overflow-y-auto">
        {filteredKots.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500">
            <UtensilsCrossed className="w-16 h-16 stroke-[1] mb-3 text-zinc-600" />
            <h3 className="text-xl font-bold text-zinc-400">All Stations Clear!</h3>
            <p className="text-sm text-zinc-600 mt-1">No pending orders in the kitchen pipeline.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredKots.map((kot) => {
              const minutesElapsed = getAgingMinutes(kot.createdAt);

              // Aging color logic: Green (<10m), Amber (10-20m), Red (>20m)
              let ageColor = 'border-emerald-500/50 bg-zinc-900';
              let badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

              if (minutesElapsed >= 20) {
                ageColor = 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500/40';
                badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
              } else if (minutesElapsed >= 10) {
                ageColor = 'border-amber-500/60 bg-zinc-900';
                badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
              }

              return (
                <div
                  key={kot.id}
                  className={`flex flex-col justify-between rounded-xl border-2 shadow-lg overflow-hidden transition-all ${ageColor}`}
                >
                  {/* Ticket Header */}
                  <div className="p-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-amber-400">
                          #{kot.kotNumber}
                        </span>
                        <span className="font-bold text-sm text-zinc-200">
                          {kot.tableNumber ? `Table ${kot.tableNumber}` : kot.orderType.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Server: {kot.serverName} • <span className="uppercase font-semibold">{kot.station}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={`font-mono text-xs font-bold ${badgeColor}`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {minutesElapsed}m ago
                      </Badge>
                      <button
                        onClick={() => handlePrintKOT(kot)}
                        className="text-zinc-400 hover:text-zinc-100 text-[10px] flex items-center gap-1"
                        title="Reprint KOT Ticket"
                      >
                        <Printer className="w-3 h-3" /> ESC/POS
                      </button>
                    </div>
                  </div>

                  {/* Ticket Line Items */}
                  <div className="p-4 flex-1 space-y-2.5 overflow-y-auto max-h-[340px]">
                    {kot.items.map((item, idx) => {
                      const isReady = item.status === 'ready';
                      return (
                        <div
                          key={item.id || idx}
                          onClick={() => handleToggleItemStrike(kot.id, idx)}
                          className={`p-2 rounded-lg border cursor-pointer select-none transition-all ${
                            isReady
                              ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500 line-through'
                              : 'bg-zinc-800/60 border-zinc-700/80 hover:border-amber-400/50 text-zinc-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-xs font-black ${
                                  isReady
                                    ? 'bg-zinc-800 text-zinc-500'
                                    : 'bg-amber-400 text-zinc-950'
                                }`}
                              >
                                {item.quantity}
                              </span>
                              <span className="font-semibold text-xs leading-snug">
                                {item.name}
                              </span>
                            </div>

                            {isReady && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </div>

                          {/* Modifiers */}
                          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                            <div className="pl-7 mt-1 text-[11px] text-amber-300 font-mono space-y-0.5">
                              {item.selectedModifiers.map((m, mIdx) => (
                                <div key={mIdx}>• {m.optionName}</div>
                              ))}
                            </div>
                          )}

                          {/* Cook Notes */}
                          {item.notes && (
                            <div className="mt-1.5 ml-7 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                              ⚠️ {item.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bump / Action Footer */}
                  <div className="p-3 bg-zinc-900/90 border-t border-zinc-800 grid grid-cols-2 gap-2">
                    {kot.status === 'active' ? (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(kot.id, 'in_prep')}
                        className="col-span-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs"
                      >
                        Start Cooking
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintKOT(kot)}
                          className="border-zinc-700 hover:bg-zinc-800 text-xs"
                        >
                          Print KOT
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(kot.id, 'completed')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                        >
                          Bump (Ready)
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
