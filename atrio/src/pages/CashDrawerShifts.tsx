import React, { useState } from 'react';
import { mockCurrentShift } from '@/data/posMockData';
import { CashShift } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Banknote,
  CreditCard,
  QrCode,
  DollarSign,
  PlusCircle,
  MinusCircle,
  FileText,
  Printer,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

export default function CashDrawerShifts() {
  const [shift, setShift] = useState<CashShift>(mockCurrentShift);
  const [isPayInOpen, setIsPayInOpen] = useState(false);
  const [isPayOutOpen, setIsPayOutOpen] = useState(false);
  const [isZReportOpen, setIsZReportOpen] = useState(false);

  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionReason, setTransactionReason] = useState('');
  const [countedCash, setCountedCash] = useState('');

  // Calculations
  const totalPayIns = shift.payIns.reduce((acc, p) => acc + p.amount, 0);
  const totalPayOuts = shift.payOuts.reduce((acc, p) => acc + p.amount, 0);
  const expectedCashInDrawer =
    shift.openingFloat + shift.totalCash + totalPayIns - totalPayOuts;

  const totalGrossSales = shift.totalCash + shift.totalCard + shift.totalUpi;

  const handleAddPayIn = () => {
    const amt = parseFloat(transactionAmount);
    if (!amt || amt <= 0 || !transactionReason) {
      toast.error('Please enter valid amount and reason');
      return;
    }

    setShift((prev) => ({
      ...prev,
      payIns: [
        ...prev.payIns,
        {
          amount: amt,
          reason: transactionReason,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    }));

    toast.success(`Pay-in of $${amt.toFixed(2)} recorded`);
    setTransactionAmount('');
    setTransactionReason('');
    setIsPayInOpen(false);
  };

  const handleAddPayOut = () => {
    const amt = parseFloat(transactionAmount);
    if (!amt || amt <= 0 || !transactionReason) {
      toast.error('Please enter valid amount and reason');
      return;
    }

    setShift((prev) => ({
      ...prev,
      payOuts: [
        ...prev.payOuts,
        {
          amount: amt,
          reason: transactionReason,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    }));

    toast.warning(`Pay-out of $${amt.toFixed(2)} deducted from drawer`);
    setTransactionAmount('');
    setTransactionReason('');
    setIsPayOutOpen(false);
  };

  const handleCloseShift = () => {
    const counted = parseFloat(countedCash);
    if (isNaN(counted)) {
      toast.error('Please enter actual cash counted in drawer');
      return;
    }

    const variance = counted - expectedCashInDrawer;

    setShift((prev) => ({
      ...prev,
      status: 'closed',
      closedAt: new Date().toISOString(),
      actualCash: counted,
      variance,
    }));

    toast.success('Shift closed & Z-Report generated!');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Register Shifts & Cash Drawer</h1>
            <Badge
              variant={shift.status === 'open' ? 'default' : 'secondary'}
              className={shift.status === 'open' ? 'bg-emerald-600' : ''}
            >
              {shift.status === 'open' ? '● Register Open' : 'Closed'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Active Drawer: {shift.cashierName} • Opened at {new Date(shift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {shift.status === 'open' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPayInOpen(true)}
                className="gap-1.5 text-xs font-semibold"
              >
                <PlusCircle className="w-4 h-4 text-emerald-500" />
                Pay-In (Add Cash)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPayOutOpen(true)}
                className="gap-1.5 text-xs font-semibold"
              >
                <MinusCircle className="w-4 h-4 text-rose-500" />
                Pay-Out (Drop)
              </Button>

              <Button
                size="sm"
                onClick={() => setIsZReportOpen(true)}
                className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground"
              >
                <Lock className="w-4 h-4" />
                Close Shift (Z-Report)
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsZReportOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              View / Reprint Z-Report
            </Button>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Opening Float</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold font-mono">${shift.openingFloat.toFixed(2)}</p>
          <span className="text-xs text-muted-foreground">Base change placed in drawer</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Expected Cash In Drawer</span>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600">
            ${expectedCashInDrawer.toFixed(2)}
          </p>
          <span className="text-xs text-muted-foreground">Float + Cash Sales + PayIns - Drops</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Card Processed</span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-blue-600">${shift.totalCard.toFixed(2)}</p>
          <span className="text-xs text-muted-foreground">Settled via EFTPOS / Stripe</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Shift Revenue</span>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold font-mono text-primary">${totalGrossSales.toFixed(2)}</p>
          <span className="text-xs text-muted-foreground">All payment tenders combined</span>
        </div>
      </div>

      {/* Pay In / Out Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pay-Ins Table */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-500" />
              Cash Pay-Ins (Replenishments)
            </h3>
            <Badge variant="outline" className="text-xs font-mono font-bold text-emerald-600">
              +${totalPayIns.toFixed(2)}
            </Badge>
          </div>

          <div className="space-y-2">
            {shift.payIns.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No pay-ins logged</p>
            ) : (
              shift.payIns.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/40 border border-border/50"
                >
                  <div>
                    <p className="font-medium">{p.reason}</p>
                    <span className="text-[10px] text-muted-foreground">{p.time}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">+${p.amount.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pay-Outs Table */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MinusCircle className="w-4 h-4 text-rose-500" />
              Cash Drops & Petty Payouts
            </h3>
            <Badge variant="outline" className="text-xs font-mono font-bold text-rose-600">
              -${totalPayOuts.toFixed(2)}
            </Badge>
          </div>

          <div className="space-y-2">
            {shift.payOuts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No cash drops logged</p>
            ) : (
              shift.payOuts.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/40 border border-border/50"
                >
                  <div>
                    <p className="font-medium">{p.reason}</p>
                    <span className="text-[10px] text-muted-foreground">{p.time}</span>
                  </div>
                  <span className="font-mono font-bold text-rose-600">-${p.amount.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pay-In Modal */}
      <Dialog open={isPayInOpen} onOpenChange={setIsPayInOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-500" /> Record Drawer Pay-In
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Amount ($)</label>
              <input
                type="number"
                placeholder="0.00"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Reason / Description</label>
              <input
                type="text"
                placeholder="e.g. Replenish $5 and $1 bills from manager safe"
                value={transactionReason}
                onChange={(e) => setTransactionReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPayInOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPayIn} className="bg-emerald-600 text-white">
              Confirm Pay-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay-Out Modal */}
      <Dialog open={isPayOutOpen} onOpenChange={setIsPayOutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <MinusCircle className="w-5 h-5 text-rose-500" /> Record Drawer Cash Drop / Pay-Out
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Amount ($)</label>
              <input
                type="number"
                placeholder="0.00"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Reason / Purpose</label>
              <input
                type="text"
                placeholder="e.g. Safe drop for excess cash, petty cash purchase"
                value={transactionReason}
                onChange={(e) => setTransactionReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPayOutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPayOut} className="bg-rose-600 text-white">
              Confirm Drop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End-of-Day Shift Close & Z-Report Dialog */}
      <Dialog open={isZReportOpen} onOpenChange={setIsZReportOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-5 border-b">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Register Close & Z-Report Audit
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 overflow-y-auto space-y-4">
            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-zinc-900 font-mono text-xs space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-border font-sans">
                <h4 className="font-black text-sm uppercase">AURAPOS REGISTER AUDIT (Z-REPORT)</h4>
                <p className="text-[10px] text-muted-foreground">
                  Terminal 01 • Shift #{shift.id}
                </p>
              </div>

              <div className="flex justify-between">
                <span>Opening Float:</span>
                <span>${shift.openingFloat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gross Cash Sales:</span>
                <span>+${shift.totalCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Total Pay-Ins:</span>
                <span>+${totalPayIns.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Total Drops / Pay-Outs:</span>
                <span>-${totalPayOuts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-dashed">
                <span>EXPECTED DRAWER CASH:</span>
                <span>${expectedCashInDrawer.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t space-y-1">
                <div className="flex justify-between">
                  <span>Card / EFTPOS Settlement:</span>
                  <span>${shift.totalCard.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>QR / Mobile Pay Settlement:</span>
                  <span>${shift.totalUpi.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-primary pt-1 border-t">
                  <span>TOTAL GROSS REVENUE:</span>
                  <span>${totalGrossSales.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {shift.status === 'open' && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Actual Physical Cash Counted in Drawer ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Count all bills and coins..."
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  className="w-full px-3 py-2 text-lg font-mono font-bold rounded-lg border border-border bg-background"
                />
                {countedCash && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Drawer Variance (Over / Short):</span>
                    <span
                      className={
                        parseFloat(countedCash) - expectedCashInDrawer >= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }
                    >
                      ${(parseFloat(countedCash) - expectedCashInDrawer).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t flex sm:justify-between items-center gap-2">
            <Button variant="outline" onClick={() => setIsZReportOpen(false)}>
              Close
            </Button>
            {shift.status === 'open' ? (
              <Button onClick={handleCloseShift} className="bg-primary text-primary-foreground">
                Reconcile & Close Register
              </Button>
            ) : (
              <Button onClick={() => window.print()} className="gap-2">
                <Printer className="w-4 h-4" /> Print Z-Report
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
