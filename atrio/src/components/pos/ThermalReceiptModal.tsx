import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Order } from '@/types/pos';
import { Printer, CheckCircle2 } from 'lucide-react';

interface Props {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<Props> = ({ order, isOpen, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptDate = new Date(order.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Tax Invoice & Receipt
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* 80mm Thermal Receipt Container */}
        <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-zinc-900 flex justify-center">
          <div
            id="printable-thermal-receipt"
            className="w-[320px] bg-white text-zinc-900 p-6 shadow-sm border border-zinc-200 rounded-sm font-mono text-xs leading-relaxed"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-zinc-300">
              <h2 className="text-base font-black tracking-wider uppercase">AURAPOS BISTRO</h2>
              <p className="text-[11px] text-zinc-600 mt-0.5">742 Grand Boulevard, Suite 100</p>
              <p className="text-[11px] text-zinc-600">Tel: +1 (555) 749-3800</p>
              <p className="text-[10px] text-zinc-500 mt-1">GSTIN / TAX ID: 27AABCA1234F1Z8</p>
            </div>

            {/* Order Meta */}
            <div className="py-2.5 border-b border-dashed border-zinc-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{receiptDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-semibold uppercase">
                  {order.type === 'dine_in' ? `Dine-In (Table ${order.tableNumber})` : order.type}
                </span>
              </div>
              {order.customerName && (
                <div className="flex justify-between">
                  <span>Guest:</span>
                  <span>{order.customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Server / Cashier:</span>
                <span>{order.serverName}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-3 border-b border-dashed border-zinc-300">
              <div className="flex justify-between font-bold text-[10px] uppercase text-zinc-600 mb-1.5 pb-1 border-b border-zinc-200">
                <span>Item</span>
                <span className="text-right">Qty x Price = Amt</span>
              </div>

              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-semibold">
                      <span className="truncate pr-2">{item.name}</span>
                      <span className="shrink-0 font-bold">
                        ${item.totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>
                        {item.quantity} @ ${item.itemPrice.toFixed(2)}
                      </span>
                    </div>
                    {item.selectedModifiers.length > 0 && (
                      <div className="pl-2 text-[10px] text-zinc-500 italic">
                        {item.selectedModifiers.map((m, mIdx) => (
                          <div key={mIdx}>+ {m.optionName}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-zinc-300">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}

              {order.serviceCharge > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Service Charge (5%):</span>
                  <span>${order.serviceCharge.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-600">
                <span>Tax (CGST 2.5% + SGST 2.5%):</span>
                <span>${order.taxAmount.toFixed(2)}</span>
              </div>

              {order.tipAmount > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Staff Gratuity / Tip:</span>
                  <span>${order.tipAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black pt-1.5 border-t border-zinc-400">
                <span>NET TOTAL DUE:</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 text-[11px] border-b border-dashed border-zinc-300">
              <div className="flex justify-between font-bold">
                <span>Paid via:</span>
                <span className="uppercase">
                  {order.payments.length > 0
                    ? order.payments.map((p) => p.method).join(', ')
                    : 'Settled'}
                </span>
              </div>
              {order.payments.map((p, pIdx) => (
                <div key={pIdx} className="flex justify-between text-[10px] text-zinc-600">
                  <span>Amount Tendered:</span>
                  <span>${p.tendered ? p.tendered.toFixed(2) : p.amount.toFixed(2)}</span>
                </div>
              ))}
              {order.payments[0]?.change ? (
                <div className="flex justify-between text-[10px] font-semibold text-zinc-700">
                  <span>Change Given:</span>
                  <span>${order.payments[0].change.toFixed(2)}</span>
                </div>
              ) : null}
            </div>

            {/* Barcode & Footer Greeting */}
            <div className="pt-4 text-center space-y-2">
              <div className="inline-block tracking-widest font-mono text-zinc-400 text-xs">
                ||||| | |||| |||| ||| ||||||| |
              </div>
              <p className="text-[10px] text-zinc-600">
                Thank you for dining with us!
                <br />
                Please scan QR on table to leave feedback.
              </p>
              <p className="text-[9px] text-zinc-400">Powered by AuraPOS • Next-Gen Restaurant OS</p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t flex sm:justify-between items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print Receipt (80mm)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
