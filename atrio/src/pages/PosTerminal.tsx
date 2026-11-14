import React, { useState, useMemo } from 'react';
import {
  mockMenuItems,
  mockCategories,
  mockInitialActiveOrders,
} from '@/data/posMockData';
import {
  MenuItem,
  MenuItemVariant,
  SelectedModifier,
  OrderItem,
  Order,
  OrderType,
  DietaryType,
  KOT,
} from '@/types/pos';
import { ItemCustomizationModal } from '@/components/pos/ItemCustomizationModal';
import { CheckoutModal } from '@/components/pos/CheckoutModal';
import { ThermalReceiptModal } from '@/components/pos/ThermalReceiptModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  CreditCard,
  Percent,
  Clock,
  Sparkles,
  ShoppingBag,
  Truck,
  Wine,
  Flame,
  CheckCircle,
} from 'lucide-react';

export default function PosTerminal() {
  const [menuItems] = useState<MenuItem[]>(mockMenuItems);
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiet, setSelectedDiet] = useState<string>('all');

  // Active Order State
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<number>(3);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [guestName, setGuestName] = useState<string>('Marcus Rivera');
  const [guestPhone, setGuestPhone] = useState<string>('+1 555-0102');

  // Cart / Order items
  const [cartItems, setCartItems] = useState<OrderItem[]>(
    mockInitialActiveOrders[0]?.items || []
  );
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(true);

  // Modals state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedOrderForReceipt, setCompletedOrderForReceipt] = useState<Order | null>(null);

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const serviceCharge = serviceChargeEnabled ? afterDiscount * 0.05 : 0;
  const taxAmount = afterDiscount * 0.05; // 5% total tax (CGST 2.5% + SGST 2.5%)
  const totalAmount = afterDiscount + serviceCharge + taxAmount;

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat =
        selectedCategory === 'cat-all' || item.categoryId === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDiet =
        selectedDiet === 'all' || item.dietary === selectedDiet;
      return matchCat && matchSearch && matchDiet;
    });
  }, [menuItems, selectedCategory, searchQuery, selectedDiet]);

  // Handle adding an item to the order
  const handleItemClick = (item: MenuItem) => {
    const hasOptions =
      (item.variants && item.variants.length > 0) ||
      (item.modifierGroups && item.modifierGroups.length > 0);

    if (hasOptions) {
      setCustomizingItem(item);
      setIsCustomizeOpen(true);
    } else {
      // Direct add
      const existingIdx = cartItems.findIndex(
        (ci) => ci.menuItemId === item.id && ci.selectedModifiers.length === 0
      );

      if (existingIdx > -1) {
        setCartItems((prev) =>
          prev.map((ci, idx) =>
            idx === existingIdx
              ? {
                  ...ci,
                  quantity: ci.quantity + 1,
                  totalPrice: (ci.quantity + 1) * ci.itemPrice,
                }
              : ci
          )
        );
      } else {
        const newItem: OrderItem = {
          id: `cart-${Date.now()}-${Math.random()}`,
          menuItemId: item.id,
          name: item.name,
          basePrice: item.basePrice,
          selectedModifiers: [],
          itemPrice: item.basePrice,
          quantity: 1,
          totalPrice: item.basePrice,
          station: item.station,
          status: 'pending',
        };
        setCartItems((prev) => [...prev, newItem]);
      }
      toast.success(`Added ${item.name}`);
    }
  };

  const handleCustomizationConfirm = (
    item: MenuItem,
    variant: MenuItemVariant | undefined,
    modifiers: SelectedModifier[],
    quantity: number,
    notes: string,
    totalPrice: number
  ) => {
    const newItem: OrderItem = {
      id: `cart-${Date.now()}-${Math.random()}`,
      menuItemId: item.id,
      name: variant ? `${item.name} (${variant.name})` : item.name,
      basePrice: item.basePrice,
      selectedVariant: variant,
      selectedModifiers: modifiers,
      itemPrice: totalPrice / quantity,
      quantity,
      totalPrice,
      notes: notes.trim() || undefined,
      station: item.station,
      status: 'pending',
    };
    setCartItems((prev) => [...prev, newItem]);
    toast.success(`Added ${newItem.name}`);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? {
                  ...item,
                  quantity: newQty,
                  totalPrice: newQty * item.itemPrice,
                }
              : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const removeItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
    toast.info('Item removed from order');
  };

  const handleSendKOT = () => {
    if (cartItems.length === 0) {
      toast.error('Cannot fire empty order to kitchen');
      return;
    }

    // Mark pending items as sent
    setCartItems((prev) =>
      prev.map((i) => ({
        ...i,
        status: 'preparing',
        firedAt: new Date().toISOString(),
      }))
    );

    const kotNumber = Math.floor(100 + Math.random() * 900);
    toast.success(`KOT #${kotNumber} Fired to Kitchen Stations!`, {
      description: `Dispatched to Grill & Kitchen Display Stations for Table #${selectedTable}`,
    });
  };

  const handleClearOrder = () => {
    setCartItems([]);
    setDiscountPercent(0);
    toast.info('Cleared active order');
  };

  const currentOrderSnapshot: Order = {
    id: `ord-${Date.now()}`,
    orderNumber: `ORD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    type: orderType,
    tableId: `t${selectedTable}`,
    tableNumber: selectedTable,
    customerName: guestName,
    customerPhone: guestPhone,
    serverName: 'Sarah Jenkins',
    status: 'billed',
    items: cartItems,
    subtotal,
    discountType: 'percent',
    discountValue: discountPercent,
    discountAmount,
    serviceCharge,
    taxAmount,
    cgstAmount: taxAmount / 2,
    sgstAmount: taxAmount / 2,
    tipAmount: 0,
    totalAmount,
    paidAmount: 0,
    payments: [],
    kots: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handlePaymentSuccess = (settledOrder: Order) => {
    setIsCheckoutOpen(false);
    setCompletedOrderForReceipt(settledOrder);
    setIsReceiptOpen(true);
    setCartItems([]);
    toast.success(`Order ${settledOrder.orderNumber} successfully paid!`, {
      description: `Settled via ${settledOrder.payments[0]?.method.toUpperCase()}`,
    });
  };

  const dietaryColors: Record<DietaryType, { label: string; badge: string }> = {
    veg: { label: 'Veg', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    non_veg: { label: 'Non-Veg', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
    vegan: { label: 'Vegan', badge: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
    gluten_free: { label: 'GF', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.2rem)] overflow-hidden bg-background">
      {/* Top POS Header Bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-card/80 shrink-0">
        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border">
          {[
            { id: 'dine_in', label: 'Dine-In', icon: UtensilsCrossed },
            { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
            { id: 'delivery', label: 'Delivery', icon: Truck },
            { id: 'bar_tab', label: 'Bar Tab', icon: Wine },
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = orderType === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setOrderType(mode.id as OrderType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* Dine-In Context: Table & Guest picker */}
        {orderType === 'dine_in' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-medium">Table:</span>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(Number(e.target.value))}
                className="bg-background border border-border rounded-md px-2 py-1 font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((t) => (
                  <option key={t} value={t}>
                    Table {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-medium">Covers:</span>
              <select
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="bg-background border border-border rounded-md px-2 py-1 font-semibold focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((g) => (
                  <option key={g} value={g}>
                    {g} Guests
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Server & Shift Status */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-medium">
            Register #1 • Sarah J.
          </Badge>
          <Badge variant="secondary" className="text-xs font-mono">
            {cartItems.length} Items in Ticket
          </Badge>
        </div>
      </div>

      {/* Main POS Split Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN: Menu Browser & Catalog */}
        <div className="flex-1 flex flex-col border-r border-border overflow-hidden bg-background">
          {/* Category Bar & Filters */}
          <div className="p-3 border-b border-border space-y-2 bg-card/40">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {mockCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Search and Dietary Badges */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Quick search dishes, ingredients, drinks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Dietary Filter */}
              <div className="flex gap-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'veg', label: 'Veg' },
                  { id: 'non_veg', label: 'Non-Veg' },
                  { id: 'vegan', label: 'Vegan' },
                  { id: 'gluten_free', label: 'GF' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDiet(d.id)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md border ${
                      selectedDiet === d.id
                        ? 'bg-foreground text-background border-foreground font-semibold'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredMenuItems.map((item) => {
              const dietInfo = dietaryColors[item.dietary];
              const hasVariants = item.variants && item.variants.length > 0;
              const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0;

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-md cursor-pointer transition-all duration-150 select-none"
                >
                  <div>
                    {/* Header: Dietary & Prep Time */}
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${dietInfo.badge}`}>
                        {dietInfo.label}
                      </Badge>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {item.preparationTimeMinutes}m
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-foreground">
                        ${item.basePrice.toFixed(2)}
                      </span>
                      {hasVariants && (
                        <span className="text-[10px] text-muted-foreground ml-1">options</span>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 px-2 text-xs font-semibold gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Order Ticket / Cart */}
        <div className="w-[380px] xl:w-[420px] flex flex-col bg-card border-l border-border shrink-0">
          {/* Order Ticket Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">
                  {orderType === 'dine_in'
                    ? `Table ${selectedTable} Order`
                    : `${orderType.replace('_', ' ').toUpperCase()}`}
                </h3>
                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                  {orderType}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Guest: {guestName} ({guestCount} covers)
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleClearOrder}
              title="Clear Ticket"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Ticket Line Items List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 stroke-[1.2] text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium">Ticket is Empty</p>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  Select items from the catalog on the left to start building the order.
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg border border-border bg-background space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-foreground">{item.name}</span>
                        {item.status === 'preparing' && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-600 border-amber-500/30">
                            Sent
                          </Badge>
                        )}
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">
                        ${item.itemPrice.toFixed(2)} each
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-xs">
                        ${item.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Modifiers List */}
                  {item.selectedModifiers.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {item.selectedModifiers.map((mod, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                        >
                          +{mod.optionName} (${mod.price.toFixed(2)})
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-[10px] text-amber-600 italic bg-amber-500/5 px-1.5 py-0.5 rounded">
                      Note: {item.notes}
                    </p>
                  )}

                  {/* Quantity Stepper & Delete */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-mono text-xs font-bold w-4 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bill Calculation Summary */}
          <div className="p-4 border-t border-border bg-card space-y-2">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono text-foreground">${subtotal.toFixed(2)}</span>
              </div>

              {/* Discount Selector */}
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3" /> Discount:
                </span>
                <div className="flex items-center gap-1">
                  {[0, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setDiscountPercent(pct)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        discountPercent === pct
                          ? 'bg-primary text-primary-foreground border-primary font-bold'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {pct === 0 ? '0%' : `${pct}%`}
                    </button>
                  ))}
                  {discountAmount > 0 && (
                    <span className="font-mono text-emerald-600 font-semibold ml-1">
                      -${discountAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Service Charge */}
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  Service Charge (5%)
                  <input
                    type="checkbox"
                    checked={serviceChargeEnabled}
                    onChange={(e) => setServiceChargeEnabled(e.target.checked)}
                    className="ml-1 rounded"
                  />
                </span>
                <span className="font-mono">${serviceCharge.toFixed(2)}</span>
              </div>

              {/* Taxes */}
              <div className="flex justify-between text-muted-foreground">
                <span>GST / VAT (5%)</span>
                <span className="font-mono">${taxAmount.toFixed(2)}</span>
              </div>

              {/* Grand Total */}
              <div className="pt-2 border-t border-border flex justify-between items-baseline font-bold text-foreground">
                <span className="text-sm">TOTAL DUE</span>
                <span className="text-xl font-mono text-primary">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* POS Primary Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleSendKOT}
                className="gap-1.5 text-xs font-semibold h-10 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
              >
                <ChefHat className="w-4 h-4" />
                Fire KOT (Kitchen)
              </Button>

              <Button
                onClick={() => {
                  if (cartItems.length === 0) {
                    toast.error('Add items before proceeding to checkout');
                    return;
                  }
                  setIsCheckoutOpen(true);
                }}
                className="gap-1.5 text-xs font-semibold h-10 bg-primary text-primary-foreground shadow-sm hover:opacity-90"
              >
                <CreditCard className="w-4 h-4" />
                Pay & Settle
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Item Customization Modal */}
      <ItemCustomizationModal
        item={customizingItem}
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        onConfirm={handleCustomizationConfirm}
      />

      {/* Checkout & Split Billing Modal */}
      <CheckoutModal
        order={currentOrderSnapshot}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* 80mm Thermal Receipt Preview Modal */}
      <ThermalReceiptModal
        order={completedOrderForReceipt}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
}
