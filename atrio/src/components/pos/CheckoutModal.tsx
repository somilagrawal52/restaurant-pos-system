import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Order, PaymentMethod, PaymentDetails } from '@/types/pos';
import {
  CreditCard,
  Banknote,
  QrCode,
  Sparkles,
  Split,
  CheckCircle2,
  Receipt,
  UserCheck,
} from 'lucide-react';

interface Props {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (settledOrder: Order) => void;
}

export const CheckoutModal: React.FC<Props> = ({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  if (!order) return null;

  const [splitMode, setSplitMode] = useState<'single' | 'equal' | 'item'>('single');
  const [splitWays, setSplitWays] = useState(2);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [customTip, setCustomTip] = useState<number>(0);
  const [qrScanned, setQrScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Tip calculation
  const calculatedTip = tipPercent > 0 ? (order.subtotal * tipPercent) / 100 : customTip;
  const grandTotal = order.totalAmount + calculatedTip;

  // Split equal amount per person
  const perPersonAmount = grandTotal / splitWays;

  // Cash change calculation
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - grandTotal);
  const isCashSufficient = tenderedNum >= grandTotal;

  const handleQuickCash = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleProcessPayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const paymentRecord: PaymentDetails = {
        method: selectedMethod,
        amount: grandTotal,
        tendered: selectedMethod === 'cash' ? tenderedNum : grandTotal,
        change: selectedMethod === 'cash' ? changeDue : 0,
        referenceNumber: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        transactionTime: new Date().toISOString(),
      };

      const settledOrder: Order = {
        ...order,
        status: 'paid',
        tipAmount: calculatedTip,
        totalAmount: grandTotal,
        paidAmount: grandTotal,
        payments: [...order.payments, paymentRecord],
        updatedAt: new Date().toISOString(),
      };

      setIsProcessing(false);
      onPaymentSuccess(settledOrder);
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b bg-card">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Checkout & Settle • {order.orderNumber}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.type === 'dine_in' ? `Table #${order.tableNumber}` : order.type.toUpperCase()}{' '}
                • Server: {order.serverName}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Total Bill</span>
              <p className="text-2xl font-bold font-mono text-primary">${grandTotal.toFixed(2)}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Split Bill Controls */}
          <div className="bg-muted/40 p-3.5 rounded-xl border border-border/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Split className="w-3.5 h-3.5" /> Split Bill
              </span>
              <div className="flex bg-muted rounded-lg p-0.5 border">
                <button
                  type="button"
                  onClick={() => setSplitMode('single')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    splitMode === 'single'
                      ? 'bg-background shadow text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Single Pay
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('equal')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    splitMode === 'equal'
                      ? 'bg-background shadow text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Split Equally
                </button>
              </div>
            </div>

            {splitMode === 'equal' && (
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Number of Guests:</span>
                  <div className="flex items-center gap-1">
                    {[2, 3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSplitWays(n)}
                        className={`w-7 h-7 text-xs font-semibold rounded-md border ${
                          splitWays === n
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Each Person Pays</span>
                  <span className="text-sm font-bold font-mono text-primary">
                    ${perPersonAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Gratuity / Tip Selection */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add Staff Gratuity / Tip
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[0, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    setTipPercent(pct);
                    setCustomTip(0);
                  }}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    tipPercent === pct
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  {pct === 0 ? 'No Tip' : `${pct}% ($${((order.subtotal * pct) / 100).toFixed(2)})`}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Payment Method
            </span>
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'cash', label: 'Cash Tender', icon: Banknote },
                { id: 'card', label: 'Credit / Debit', icon: CreditCard },
                { id: 'upi_qr', label: 'QR Pay / UPI', icon: QrCode },
                { id: 'loyalty', label: 'Loyalty Points', icon: Sparkles },
              ].map((m) => {
                const isSelected = selectedMethod === m.id;
                const IconComponent = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id as PaymentMethod)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-sm'
                        : 'border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <IconComponent className="w-6 h-6 mb-1.5" />
                    <span className="text-xs font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Method Details: CASH */}
          {selectedMethod === 'cash' && (
            <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Amount Tendered</span>
                <span className="text-xs text-muted-foreground">
                  Exact: ${grandTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full px-3 py-2 text-lg font-mono font-bold rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  variant="outline"
                  onClick={() => setCashTendered(grandTotal.toFixed(2))}
                  className="text-xs font-medium shrink-0"
                >
                  Exact Cash
                </Button>
              </div>

              {/* Quick Cash Chips */}
              <div className="flex gap-2">
                {[10, 20, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickCash(val)}
                    className="flex-1 py-1.5 rounded-lg border text-xs font-mono font-semibold hover:bg-muted"
                  >
                    ${val}
                  </button>
                ))}
              </div>

              {/* Change calculation */}
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="text-xs font-semibold">Change to Return:</span>
                <span
                  className={`font-mono text-base font-bold ${
                    isCashSufficient ? 'text-emerald-600' : 'text-destructive'
                  }`}
                >
                  ${changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Method Details: CARD */}
          {selectedMethod === 'card' && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3 text-center">
              <CreditCard className="w-10 h-10 mx-auto text-primary animate-pulse" />
              <div>
                <p className="text-sm font-semibold">Ready for Card Tap / Chip / Swipe</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Terminal ID: POS-TERM-01 (Integrated Stripe / Square / Verifone Reader)
                </p>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Connected & Ready
              </Badge>
            </div>
          )}

          {/* Method Details: QR / UPI */}
          {selectedMethod === 'upi_qr' && (
            <div className="p-4 rounded-xl border border-border bg-card flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-white rounded-xl shadow-sm border">
                {/* Simulated QR Code */}
                <div className="w-36 h-36 bg-zinc-950 flex flex-col items-center justify-center p-2 rounded-lg">
                  <QrCode className="w-24 h-24 text-white" />
                  <span className="text-[9px] text-zinc-300 font-mono mt-1">AURAPOS-SCAN</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">Scan to Pay via UPI / Apple Pay</p>
                <p className="text-xs text-muted-foreground">
                  Dynamic payment link: ${grandTotal.toFixed(2)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrScanned(true)}
                className="text-xs"
              >
                {qrScanned ? '✓ QR Verified' : 'Simulate Customer Scan'}
              </Button>
            </div>
          )}

          {/* Method Details: LOYALTY */}
          {selectedMethod === 'loyalty' && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-primary" /> Customer Profile
                </span>
                <Badge variant="secondary">Gold Tier Member</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Available Reward Points: <strong className="text-foreground">2,450 pts</strong> ($24.50 credit value)
              </p>
              <p className="text-xs text-emerald-600 font-medium">
                Points will be applied to this bill balance.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex sm:justify-between items-center gap-4">
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>

          <Button
            onClick={handleProcessPayment}
            disabled={isProcessing || (selectedMethod === 'cash' && !isCashSufficient)}
            className="px-6 font-semibold gap-2 shadow-sm"
          >
            {isProcessing ? (
              'Authorizing Payment...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Complete Payment (${grandTotal.toFixed(2)})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
