export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'bar_tab';

export type OrderStatus =
  | 'draft'
  | 'sent_to_kitchen'
  | 'in_prep'
  | 'ready'
  | 'served'
  | 'billed'
  | 'paid'
  | 'cancelled';

export type KitchenStation = 'kitchen' | 'bar' | 'grill' | 'pantry' | 'dessert';

export type DietaryType = 'veg' | 'non_veg' | 'vegan' | 'gluten_free';

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelect?: number;
  maxSelect?: number;
  required?: boolean;
  options: ModifierOption[];
}

export interface MenuItemVariant {
  id: string;
  name: string; // e.g. "Regular", "Large"
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  basePrice: number;
  image?: string;
  dietary: DietaryType;
  station: KitchenStation;
  variants?: MenuItemVariant[];
  modifierGroups?: ModifierGroup[];
  isAvailable: boolean; // 86 status
  preparationTimeMinutes: number;
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  selectedVariant?: MenuItemVariant;
  selectedModifiers: SelectedModifier[];
  itemPrice: number; // base/variant + modifiers
  quantity: number;
  totalPrice: number;
  notes?: string;
  station: KitchenStation;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'voided';
  firedAt?: string;
}

export interface KOT {
  id: string;
  orderId: string;
  kotNumber: number;
  tableNumber?: number;
  orderType: OrderType;
  station: KitchenStation;
  items: OrderItem[];
  createdAt: string;
  status: 'active' | 'in_prep' | 'completed';
  serverName: string;
}

export type PaymentMethod = 'cash' | 'card' | 'upi_qr' | 'loyalty' | 'split';

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  tendered?: number;
  change?: number;
  referenceNumber?: string;
  transactionTime: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  tableId?: string;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  serverName: string;
  serverId?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discountType?: 'percent' | 'fixed';
  discountValue?: number;
  discountAmount: number;
  serviceCharge: number; // e.g. 5%
  taxAmount: number; // e.g. CGST + SGST (5%) or VAT
  cgstAmount?: number;
  sgstAmount?: number;
  tipAmount: number;
  totalAmount: number;
  paidAmount: number;
  payments: PaymentDetails[];
  kots: KOT[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'produce' | 'dairy' | 'meat' | 'beverage' | 'bakery' | 'spices';
  currentStock: number;
  unit: 'kg' | 'g' | 'liters' | 'ml' | 'pieces' | 'packs';
  reorderLevel: number;
  costPerUnit: number;
  supplier: string;
  lastUpdated: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

export interface RecipeBOM {
  menuItemId: string;
  menuItemName: string;
  ingredients: RecipeIngredient[];
}

export interface CashShift {
  id: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  expectedCash: number;
  actualCash?: number;
  variance?: number;
  payIns: { amount: number; reason: string; time: string }[];
  payOuts: { amount: number; reason: string; time: string }[];
  totalCard: number;
  totalUpi: number;
  totalCash: number;
  status: 'open' | 'closed';
}

export interface DeliveryOrder {
  id: string;
  platform: 'Zomato' | 'Swiggy' | 'UberEats' | 'Direct';
  platformOrderId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  driverName?: string;
  driverPhone?: string;
  driverStatus?: 'assigned' | 'at_restaurant' | 'picked_up' | 'delivered';
  status: 'pending' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  placedAt: string;
  estimatedDeliveryTime: string;
}
