import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Anbud } from "@/features/anbud/types";
import { uid } from "@/features/anbud/storage";
import { calcTotals } from "@/features/anbud/pdf";

const fmt = (n: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(n);

interface Props {
  anbud: Anbud;
  onChange: (a: Anbud) => void;
}

export function ItemsStep({ anbud, onChange }: Props) {
  const add = () =>
    onChange({
      ...anbud,
      items: [
        ...anbud.items,
        { id: uid("item"), description: "", quantity: 1, unit: "st", unitPrice: 0 },
      ],
    });

  const update = (id: string, patch: Partial<Anbud["items"][number]>) =>
    onChange({
      ...anbud,
      items: anbud.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });

  const remove = (id: string) =>
    onChange({ ...anbud, items: anbud.items.filter((i) => i.id !== id) });

  const t = calcTotals(anbud);

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-6">
        <div className="space-y-2">
          {anbud.items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Inga poster tillagda än. Klicka "Lägg till post".
            </p>
          )}
          {anbud.items.map((item, idx) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-2 items-end p-2 rounded-lg hover:bg-muted/50 transition"
            >
              <div className="col-span-12 md:col-span-5">
                {idx === 0 && (
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">
                    Beskrivning
                  </Label>
                )}
                <Input
                  value={item.description}
                  onChange={(e) => update(item.id, { description: e.target.value })}
                  placeholder="Beskrivning..."
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                {idx === 0 && (
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">
                    Antal
                  </Label>
                )}
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => update(item.id, { quantity: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                {idx === 0 && (
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">
                    Enhet
                  </Label>
                )}
                <Input value={item.unit} onChange={(e) => update(item.id, { unit: e.target.value })} />
              </div>
              <div className="col-span-3 md:col-span-2">
                {idx === 0 && (
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">
                    À-pris
                  </Label>
                )}
                <Input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => update(item.id, { unitPrice: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-2 md:col-span-2 text-right text-sm font-semibold">
                {fmt(item.quantity * item.unitPrice)}
              </div>
              <div className="col-span-1 flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => remove(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={add} variant="outline" className="mt-4 w-full">
          <Plus className="h-4 w-4 mr-1" /> Lägg till post
        </Button>
      </Card>

      <Card className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Rabatt (%)
          </Label>
          <Input
            type="number"
            value={anbud.discount}
            onChange={(e) => onChange({ ...anbud, discount: Number(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Moms (%)
          </Label>
          <Input
            type="number"
            value={anbud.vatRate}
            onChange={(e) => onChange({ ...anbud, vatRate: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="md:col-span-1 space-y-1 text-sm">
          <Row k="Delsumma" v={fmt(t.subtotal)} />
          {t.discount > 0 && <Row k="Rabatt" v={`- ${fmt(t.discount)}`} />}
          <Row k="Netto" v={fmt(t.net)} />
          <Row k={`Moms ${anbud.vatRate}%`} v={fmt(t.vat)} />
          <div className="border-t border-border pt-1.5 mt-1.5">
            <Row k="Totalt inkl. moms" v={fmt(t.total)} bold />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold text-primary text-base" : ""}`}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}