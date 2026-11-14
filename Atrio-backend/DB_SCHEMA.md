# AuraPOS Enterprise Database Schema

Comprehensive multi-tenant restaurant database schema for Point of Sale (POS), Kitchen Display Systems (KDS), Table Management (TMS), Inventory & Recipe Costing (BOM), and Cash Shifts.

---

## 🏨 `restaurants`
Multi-unit restaurant property profiles.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `name` | String | Restaurant property name |
| `currency` | String | e.g. "USD", "EUR", "INR" |
| `taxRates` | Array | Configurable CGST, SGST, VAT rates |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

---

## 👤 `users`
Role-based staff and manager accounts (`admin`, `manager`, `waiter`, `cashier`, `kitchen`).

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `email` | String | Unique login email |
| `password` | String | Bcrypt hash |
| `name` | String | Full name |
| `phone` | String | Contact number |
| `role` | String | `admin` / `manager` / `waiter` / `cashier` |
| `status` | String | `active` / `inactive` |
| `restaurantId` | ObjectId | Reference to `restaurants` |

---

## 🍽️ `orders` (POS & Ticketing Engine)
Active and historical guest checks, dine-in, takeaway, bar tabs, and delivery orders.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `restaurantId` | ObjectId | FK → `restaurants` |
| `orderNumber` | String | Unique Human-readable ID (e.g. `ORD-2026-081`) |
| `type` | String | `dine_in` / `takeaway` / `delivery` / `bar_tab` |
| `tableId` | String | Table reference |
| `tableNumber` | Number | Visual table number |
| `customerName` | String | Guest name |
| `customerPhone` | String | Contact phone |
| `serverName` | String | Server / Cashier who opened order |
| `serverId` | ObjectId | FK → `users` |
| `status` | String | `draft` / `sent_to_kitchen` / `in_prep` / `ready` / `served` / `billed` / `paid` / `cancelled` |
| `items[]` | Array | Line items with selected modifiers, notes, station routing |
| `subtotal` | Number | Gross items total |
| `discountType` | String | `percent` / `fixed` |
| `discountAmount` | Number | Net discounted amount |
| `serviceCharge` | Number | Hospitality service fee (e.g. 5%) |
| `taxAmount` | Number | Total tax (CGST + SGST or VAT) |
| `cgstAmount` | Number | Central GST |
| `sgstAmount` | Number | State GST |
| `tipAmount` | Number | Staff gratuity |
| `totalAmount` | Number | Net total due |
| `paidAmount` | Number | Total amount collected |
| `payments[]` | Array | Payment tenders (Cash, Card, UPI, Split) |

---

## 🍳 `menuitems` (Culinary Catalog)

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `name` | String | Item name |
| `description` | String | Item culinary profile |
| `categoryId` | String | Category slug |
| `categoryName` | String | e.g. "Artisan Pizzas", "Starters" |
| `basePrice` | Number | Standard price |
| `dietary` | String | `veg` / `non_veg` / `vegan` / `gluten_free` |
| `station` | String | `kitchen` / `bar` / `grill` / `pantry` / `dessert` |
| `variants[]` | Array | Sizes / Portions (e.g. 10" Medium, 14" Large) |
| `modifierGroups[]` | Array | Extra toppings, dressings, spice levels |
| `isAvailable` | Boolean | Real-time 86 status toggle |
| `preparationTimeMinutes` | Number | Kitchen target prep time |

---

## 📦 `inventoryitems` (Raw Materials & Stock Depletion)

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `name` | String | Ingredient name (e.g. "Mozzarella Fior di Latte") |
| `category` | String | `produce` / `dairy` / `meat` / `beverage` / `bakery` / `spices` |
| `currentStock` | Number | Quantity on hand |
| `unit` | String | `kg` / `g` / `liters` / `ml` / `pieces` / `packs` |
| `reorderLevel` | Number | Warning threshold |
| `costPerUnit` | Number | Wholesale cost price |
| `supplier` | String | Primary vendor |

---

## 📋 `recipeboms` (Bill of Materials)

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `menuItemId` | ObjectId | FK → `menuitems` |
| `menuItemName` | String | Item name |
| `ingredients[]` | Array | Ingredients deducted per portion sold |

---

## 💵 `cashshifts` (Cash Drawer & Z-Reports)

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `cashierName` | String | Active cashier |
| `openedAt` | Date | Shift start time |
| `closedAt` | Date | Shift end time |
| `openingFloat` | Number | Starting cash float |
| `expectedCash` | Number | System calculated expected cash |
| `actualCash` | Number | Actual physical cash counted by manager |
| `variance` | Number | Over / Short reconciliation |
| `payIns[]` | Array | Cash replenishment entries |
| `payOuts[]` | Array | Petty cash drops and payouts |
| `totalCash` | Number | Total cash collected |
| `totalCard` | Number | Total card transactions settled |
| `totalUpi` | Number | Total QR / UPI collected |
| `status` | String | `open` / `closed` |
