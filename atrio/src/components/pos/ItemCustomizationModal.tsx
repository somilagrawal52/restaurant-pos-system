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
import { MenuItem, MenuItemVariant, SelectedModifier } from '@/types/pos';
import { Plus, Minus, Check } from 'lucide-react';

interface Props {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    item: MenuItem,
    variant: MenuItemVariant | undefined,
    modifiers: SelectedModifier[],
    quantity: number,
    notes: string,
    totalPrice: number
  ) => void;
}

export const ItemCustomizationModal: React.FC<Props> = ({
  item,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!item) return null;

  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | undefined>(
    item.variants && item.variants.length > 0 ? item.variants[0] : undefined
  );
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Reset when item opens
  React.useEffect(() => {
    if (item) {
      setSelectedVariant(item.variants && item.variants.length > 0 ? item.variants[0] : undefined);
      setSelectedModifiers([]);
      setQuantity(1);
      setNotes('');
    }
  }, [item]);

  const basePrice = selectedVariant ? selectedVariant.price : item.basePrice;
  const modifiersPrice = selectedModifiers.reduce((acc, m) => acc + m.price, 0);
  const unitPrice = basePrice + modifiersPrice;
  const totalPrice = unitPrice * quantity;

  const handleToggleModifier = (
    groupId: string,
    groupName: string,
    optionId: string,
    optionName: string,
    price: number,
    isRadio: boolean
  ) => {
    setSelectedModifiers((prev) => {
      if (isRadio) {
        const withoutGroup = prev.filter((m) => m.groupId !== groupId);
        return [...withoutGroup, { groupId, groupName, optionId, optionName, price }];
      } else {
        const exists = prev.some((m) => m.groupId === groupId && m.optionId === optionId);
        if (exists) {
          return prev.filter((m) => !(m.groupId === groupId && m.optionId === optionId));
        } else {
          return [...prev, { groupId, groupName, optionId, optionName, price }];
        }
      }
    });
  };

  const isOptionSelected = (groupId: string, optionId: string) => {
    return selectedModifiers.some((m) => m.groupId === groupId && m.optionId === optionId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">{item.name}</DialogTitle>
            <Badge variant="outline" className="text-xs uppercase tracking-wider">
              {item.station}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        </DialogHeader>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Variants (e.g. Size) */}
          {item.variants && item.variants.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Select Size / Portion <span className="text-destructive">*</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {item.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20'
                          : 'border-border hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className="font-mono">${v.price.toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modifier Groups */}
          {item.modifierGroups && item.modifierGroups.length > 0 && (
            <div className="space-y-6">
              {item.modifierGroups.map((group) => {
                const isSingleSelect = group.required || group.maxSelect === 1;
                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                        {group.name} {group.required && <span className="text-destructive">*</span>}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {isSingleSelect ? 'Choose 1' : 'Multi-select'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {group.options.map((opt) => {
                        const selected = isOptionSelected(group.id, opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              handleToggleModifier(
                                group.id,
                                group.name,
                                opt.id,
                                opt.name,
                                opt.price,
                                isSingleSelect
                              )
                            }
                            className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${
                              selected
                                ? 'border-primary bg-primary/10 text-primary font-medium'
                                : 'border-border hover:bg-muted/40 text-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] ${
                                  selected
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-muted-foreground/40'
                                }`}
                              >
                                {selected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span>{opt.name}</span>
                            </div>
                            <span className="font-mono text-xs">
                              {opt.price > 0 ? `+$${opt.price.toFixed(2)}` : 'Free'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Kitchen / Server Notes */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Special Kitchen Instructions
            </h4>
            <input
              type="text"
              placeholder="e.g. Extra hot, sauce on the side, no cilantro"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-semibold">Quantity</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="font-mono font-bold text-base w-6 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex sm:justify-between items-center gap-4">
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Calculated Item Total</p>
            <p className="text-lg font-bold font-mono text-primary">${totalPrice.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onConfirm(
                  item,
                  selectedVariant,
                  selectedModifiers,
                  quantity,
                  notes,
                  totalPrice
                );
                onClose();
              }}
              className="px-6 font-semibold shadow-sm"
            >
              Add to Order
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
