import React, { useState } from 'react';
import { mockInventory, mockRecipeBOMs } from '@/data/posMockData';
import { InventoryItem } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Package,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  Scale,
  DollarSign,
  TrendingDown,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'stock' | 'recipes'>('stock');

  const filteredItems = inventory.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const lowStockCount = inventory.filter((i) => i.currentStock <= i.reorderLevel).length;
  const totalStockValue = inventory.reduce((acc, i) => acc + i.currentStock * i.costPerUnit, 0);

  const handleRestock = (id: string, amount: number) => {
    setInventory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, currentStock: i.currentStock + amount } : i))
    );
    toast.success('Stock replenished successfully');
  };

  const handleLogWastage = (id: string, amount: number) => {
    setInventory((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, currentStock: Math.max(0, i.currentStock - amount) } : i
      )
    );
    toast.warning(`Wastage logged (-${amount} units)`);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory & Recipe Costing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automated stock depletion, ingredient-level Bill of Materials (BOM), and supplier logs
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-xl border">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'stock'
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Raw Ingredients ({inventory.length})
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'recipes'
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Recipe BOMs ({mockRecipeBOMs.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Raw Inventory Value</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold font-mono">${totalStockValue.toFixed(2)}</p>
          <span className="text-xs text-muted-foreground">Across {inventory.length} tracked items</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {lowStockCount} Items
          </p>
          <span className="text-xs text-muted-foreground">Below minimum reorder threshold</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Recipe Cost Depletion</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600">Real-Time</p>
          <span className="text-xs text-muted-foreground">Linked to POS Kitchen firing</span>
        </div>
      </div>

      {activeTab === 'stock' ? (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ingredient or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              {['all', 'produce', 'dairy', 'meat', 'beverage', 'spices'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border capitalize whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Ingredient Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Stock Level</th>
                    <th className="p-3.5">Reorder Level</th>
                    <th className="p-3.5">Cost / Unit</th>
                    <th className="p-3.5">Primary Supplier</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredItems.map((item) => {
                    const isLow = item.currentStock <= item.reorderLevel;
                    return (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-semibold text-foreground flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground/70" />
                          <span>{item.name}</span>
                          {isLow && (
                            <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                              Low Stock
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5 capitalize text-muted-foreground">{item.category}</td>
                        <td className="p-3.5">
                          <span
                            className={`font-mono font-bold ${
                              isLow ? 'text-destructive' : 'text-foreground'
                            }`}
                          >
                            {item.currentStock} {item.unit}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">
                          {item.reorderLevel} {item.unit}
                        </td>
                        <td className="p-3.5 font-mono font-medium">
                          ${item.costPerUnit.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-muted-foreground">{item.supplier}</td>
                        <td className="p-3.5 text-right space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-2 font-medium"
                            onClick={() => handleRestock(item.id, 10)}
                          >
                            + Restock
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                            onClick={() => handleLogWastage(item.id, 1)}
                          >
                            Log Waste
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Recipe Bill of Materials (BOM) View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockRecipeBOMs.map((bom, idx) => (
            <div key={idx} className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                  <h3 className="font-bold text-base text-foreground">{bom.menuItemName}</h3>
                  <span className="text-xs text-muted-foreground">
                    Automated POS depletion recipe
                  </span>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {bom.ingredients.length} Ingredients
                </Badge>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ingredients Deducted per Portion:
                </span>
                <div className="space-y-1.5">
                  {bom.ingredients.map((ing, iIdx) => (
                    <div
                      key={iIdx}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40 border border-border/50"
                    >
                      <span className="font-medium">{ing.ingredientName}</span>
                      <span className="font-mono font-bold text-primary">
                        {ing.quantity} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
