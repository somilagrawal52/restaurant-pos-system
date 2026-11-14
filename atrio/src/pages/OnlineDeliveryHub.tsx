import React, { useState } from 'react';
import { mockDeliveryOrders } from '@/data/posMockData';
import { DeliveryOrder } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Truck,
  ShoppingBag,
  Clock,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChefHat,
} from 'lucide-react';

export default function OnlineDeliveryHub() {
  const [orders, setOrders] = useState<DeliveryOrder[]>(mockDeliveryOrders);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  const filteredOrders = orders.filter((o) => {
    if (filterPlatform === 'all') return true;
    return o.platform.toLowerCase() === filterPlatform.toLowerCase();
  });

  const handleAdvanceStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status === 'preparing') {
          toast.success(`Order ${o.platformOrderId} is Ready for Courier Pickup!`);
          return { ...o, status: 'ready_for_pickup' };
        }
        if (o.status === 'ready_for_pickup') {
          toast.success(`Order ${o.platformOrderId} handed to driver!`);
          return { ...o, status: 'out_for_delivery' };
        }
        if (o.status === 'out_for_delivery') {
          toast.success(`Order ${o.platformOrderId} marked Delivered!`);
          return { ...o, status: 'completed' };
        }
        return o;
      })
    );
  };

  const platformBadgeColor: Record<string, string> = {
    UberEats: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    Zomato: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
    Swiggy: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    Direct: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            Online Delivery & Aggregator Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Unified live feed for UberEats, Zomato, Swiggy, and Direct Web Orders
          </p>
        </div>

        {/* Platform Filter */}
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl border">
          {['all', 'UberEats', 'Direct', 'Zomato', 'Swiggy'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPlatform(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
                filterPlatform === p
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((ord) => (
          <div
            key={ord.id}
            className="flex flex-col justify-between p-5 rounded-xl border border-border bg-card shadow-2xs space-y-4"
          >
            <div>
              {/* Header: Platform & Order ID */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={platformBadgeColor[ord.platform]}>
                    {ord.platform}
                  </Badge>
                  <span className="font-mono font-bold text-xs">{ord.platformOrderId}</span>
                </div>
                <Badge
                  variant="secondary"
                  className="capitalize font-semibold text-[10px] tracking-wide"
                >
                  {ord.status.replace(/_/g, ' ')}
                </Badge>
              </div>

              {/* Customer Details */}
              <div className="py-2.5 space-y-1 text-xs">
                <p className="font-bold text-foreground">{ord.customerName}</p>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span>{ord.customerPhone}</span>
                </div>
                <div className="flex items-start gap-1 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{ord.deliveryAddress}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="pt-2 border-t border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Order Items:
                </span>
                {ord.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-0.5">
                    <span className="font-medium">
                      {i.quantity}x {i.name}
                    </span>
                    <span className="font-mono text-muted-foreground">${i.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Courier Status */}
              {ord.driverName && (
                <div className="mt-3 p-2 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-0.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Assigned Driver:
                  </p>
                  <p className="font-bold">{ord.driverName}</p>
                  <p className="text-muted-foreground">{ord.driverPhone}</p>
                </div>
              )}
            </div>

            {/* Total & Action Footer */}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block">Order Total</span>
                <span className="font-mono font-bold text-base text-primary">
                  ${ord.totalAmount.toFixed(2)}
                </span>
              </div>

              {ord.status !== 'completed' && (
                <Button
                  size="sm"
                  onClick={() => handleAdvanceStatus(ord.id)}
                  className="text-xs font-semibold"
                >
                  {ord.status === 'preparing' && 'Mark Ready'}
                  {ord.status === 'ready_for_pickup' && 'Hand to Courier'}
                  {ord.status === 'out_for_delivery' && 'Mark Delivered'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
