import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { Anbud } from "@/features/anbud/types";
import { calcTotals } from "@/features/anbud/pdf";

const fmt = (n: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(n);

export function CheckStep({ anbud }: { anbud: Anbud }) {
  const checks = [
    { ok: !!anbud.projectName, label: "Projektnamn ifyllt" },
    { ok: !!anbud.customer.company, label: "Kund / företag ifyllt" },
    { ok: anbud.items.length > 0, label: "Minst en post tillagd" },
    { ok: anbud.items.every((i) => i.description.trim().length > 0), label: "Alla poster har beskrivning" },
    { ok: !!anbud.company.name, label: "Leverantörsuppgifter ifyllda" },
    { ok: !!anbud.validUntil, label: "Giltigt t.o.m. satt" },
  ];
  const t = calcTotals(anbud);
  const allOk = checks.every((c) => c.ok);
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Kontrollista</h3>
          <span className={allOk ? "text-success text-sm font-medium" : "text-warning text-sm font-medium"}>
            {allOk ? "Allt klart för PDF" : "Åtgärda innan utskrift"}
          </span>
        </div>
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              {c.ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertCircle className="h-4 w-4 text-warning" />}
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Sammanfattning</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <S l="Anbudsnr" v={anbud.number} />
          <S l="Projekt" v={anbud.projectName || "—"} />
          <S l="Kund" v={anbud.customer.company || "—"} />
          <S l="Poster" v={String(anbud.items.length)} />
          <S l="Delsumma" v={fmt(t.subtotal)} />
          <S l="Moms" v={fmt(t.vat)} />
          <S l="Totalt" v={fmt(t.total)} hi />
          <S l="Giltigt t.o.m." v={anbud.validUntil || "—"} />
        </div>
      </Card>
    </div>
  );
}
function S({ l, v, hi }: { l: string; v: string; hi?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</div>
      <div className={`font-semibold ${hi ? "text-primary text-lg" : ""}`}>{v}</div>
    </div>
  );
}