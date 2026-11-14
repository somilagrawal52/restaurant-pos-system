import React, { useState } from 'react';
import { mockMenuItems, mockCategories } from '@/data/posMockData';
import { MenuItem, KitchenStation, DietaryType } from '@/types/pos';
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
  UtensilsCrossed,
  Plus,
  Search,
  Power,
  Edit2,
  DollarSign,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>(mockMenuItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New Item Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCat, setNewItemCat] = useState('cat-appetizers');
  const [newItemDiet, setNewItemDiet] = useState<DietaryType>('veg');
  const [newItemStation, setNewItemStation] = useState<KitchenStation>('kitchen');

  const filteredItems = items.filter((item) => {
    const matchCat =
      selectedCategory === 'cat-all' || item.categoryId === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleToggle86 = (id: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const newStatus = !i.isAvailable;
          toast.info(`${i.name} is now ${newStatus ? 'AVAILABLE' : '86ed (OUT OF STOCK)'}`);
          return { ...i, isAvailable: newStatus };
        }
        return i;
      })
    );
  };

  const handleAddItem = () => {
    const price = parseFloat(newItemPrice);
    if (!newItemName || isNaN(price) || price <= 0) {
      toast.error('Please enter valid name and base price');
      return;
    }

    const catObj = mockCategories.find((c) => c.id === newItemCat);

    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      name: newItemName,
      description: newItemDesc,
      categoryId: newItemCat,
      categoryName: catObj?.name || 'Mains',
      basePrice: price,
      dietary: newItemDiet,
      station: newItemStation,
      isAvailable: true,
      preparationTimeMinutes: 12,
    };

    setItems((prev) => [newItem, ...prev]);
    toast.success(`Created menu item: ${newItem.name}`);
    setIsAddOpen(false);
    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu & Catalog Manager</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure dishes, prices, modifier groups, and toggle real-time 86 (out-of-stock) status
          </p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Menu Item
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items, ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {mockCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border whitespace-nowrap ${
                selectedCategory === c.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Item Name & Details</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Kitchen Station</th>
                <th className="p-3.5">Dietary</th>
                <th className="p-3.5">Base Price</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">86 / Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3.5">
                    <p className="font-semibold text-foreground text-sm">{item.name}</p>
                    <p className="text-muted-foreground line-clamp-1 text-[11px] mt-0.5">
                      {item.description}
                    </p>
                  </td>
                  <td className="p-3.5 text-muted-foreground">{item.categoryName}</td>
                  <td className="p-3.5">
                    <Badge variant="outline" className="uppercase text-[9px] font-mono">
                      {item.station}
                    </Badge>
                  </td>
                  <td className="p-3.5">
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {item.dietary.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-foreground">
                    ${item.basePrice.toFixed(2)}
                  </td>
                  <td className="p-3.5">
                    <Badge
                      variant={item.isAvailable ? 'default' : 'destructive'}
                      className={`text-[10px] ${
                        item.isAvailable ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      {item.isAvailable ? 'In Stock' : '86ed (Out of Stock)'}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    <Button
                      variant={item.isAvailable ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => handleToggle86(item.id)}
                      className="h-7 text-xs font-semibold gap-1.5"
                    >
                      <Power className="w-3.5 h-3.5" />
                      {item.isAvailable ? '86 Item' : 'Restore'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Create Menu Item
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Item Title</label>
              <input
                type="text"
                placeholder="e.g. Classic Beef Tartare"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Description</label>
              <textarea
                placeholder="Item culinary description..."
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Base Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="14.50"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Category</label>
                <select
                  value={newItemCat}
                  onChange={(e) => setNewItemCat(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
                >
                  {mockCategories
                    .filter((c) => c.id !== 'cat-all')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Dietary Tag</label>
                <select
                  value={newItemDiet}
                  onChange={(e) => setNewItemDiet(e.target.value as DietaryType)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non_veg">Non-Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="gluten_free">Gluten-Free</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Kitchen Station</label>
                <select
                  value={newItemStation}
                  onChange={(e) => setNewItemStation(e.target.value as KitchenStation)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
                >
                  <option value="kitchen">Hot Line / Kitchen</option>
                  <option value="grill">Grill & Pizza</option>
                  <option value="bar">Bar & Drinks</option>
                  <option value="dessert">Dessert & Cold</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} className="bg-primary text-primary-foreground font-semibold">
              Save Menu Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
