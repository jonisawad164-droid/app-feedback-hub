import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, FileText, Plus, Trash2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProptechWizard } from "@/components/proptech/ProptechWizard";
import type { ProptechCase } from "@/features/proptech/types";
import { loadCases, saveCases, uid, nextNumber } from "@/features/proptech/storage";
import { fmtSek, fmtYears, investmentTotal, payoffYears, effectiveSavingsPct } from "@/features/proptech/calc";

export const Route = createFileRoute("/proptech")({
  component: ProptechPage,
  head: () => ({
    meta: [
      { title: "Proptech BOX Anbudsmotor" },
      { name: "description", content: "Skapa professionella anbud för Proptech BOX – med besparing, payoff, NPV och CO₂." },
    ],
  }),
});

function emptyCase(list: ProptechCase[]): ProptechCase {
  const now = new Date().toISOString();
  return {
    id: uid("pt"),
    number: nextNumber(list),
    customerCompany: "",
    customerContact: "",
    customerEmail: "",
    customerPhone: "",
    propertyName: "",
    propertyAddress: "",
    buildingType: "Flerbostadshus",
    apartments: 0,
    area: 0,
    currentTempIndoor: 22,
    currentEnergyKwh: 0,
    energyPrice: 0.95,
    emissionFactor: 0.06,
    calcMethod: "auto",
    manualSavingsPct: 8,
    packageId: "smart",
    items: [
      { id: uid("pi"), name: "Proptech BOX Heat + Smart paket", qty: 1, unit: "st", unitPrice: 42500 },
      { id: uid("pi"), name: "Trådlösa rumsgivare", qty: 12, unit: "st", unitPrice: 1250 },
      { id: uid("pi"), name: "Installation & konfiguration", qty: 14, unit: "tim", unitPrice: 895 },
    ],
    bboYearlyCost: 18000,
    contractYears: 10,
    discountRate: 5,
    energyIndexPct: 3,
    scope:
      "Installation av Proptech BOX för smart styrning av värmesystem. Inkluderar driftsättning, inkoppling mot befintlig värmecentral, konfiguration och funktionsprov.",
    assumptions:
      "Antaganden bygger på normal användning. Ca 5 % värmebesparing per °C sänkt inomhustemperatur. Energipris och förbrukning enligt uppgifter från beställaren.",
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

function ProptechPage() {
  const [cases, setCases] = useState<ProptechCase[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setCases(loadCases()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) saveCases(cases); }, [cases, hydrated]);

  const active = useMemo(() => cases.find((c) => c.id === activeId) ?? null, [activeId, cases]);

  const upsert = (c: ProptechCase) => setCases((prev) => {
    const idx = prev.findIndex((p) => p.id === c.id);
    if (idx >= 0) { const cp = [...prev]; cp[idx] = c; return cp; }
    return [c, ...prev];
  });

  const create = () => {
    const c = emptyCase(cases);
    upsert(c);
    setActiveId(c.id);
    toast.success("Nytt ärende", { description: c.number });
  };

  const remove = (id: string) => { setCases((p) => p.filter((c) => c.id !== id)); toast("Raderat"); };
  const duplicate = (id: string) => {
    setCases((prev) => {
      const src = prev.find((p) => p.id === id);
      if (!src) return prev;
      const cp: ProptechCase = { ...src, id: uid("pt"), number: nextNumber(prev), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      return [cp, ...prev];
    });
    toast.success("Duplicerat");
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-subtle)]">
      <Toaster position="top-right" richColors />
      <header className="border-b border-border bg-background/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
            <div className="h-9 w-9 rounded-xl bg-[var(--gradient-primary)] grid place-items-center shadow-[var(--shadow-glow)]">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Proptech BOX Anbudsmotor</h1>
              <p className="text-[11px] text-muted-foreground">Smart värmestyrning · 5-sidigt anbud · auto-besparing</p>
            </div>
          </div>
          {!active && <Button onClick={create}><Plus className="h-4 w-4 mr-1" /> Nytt ärende</Button>}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {!active && (
          <div className="space-y-6">
            <Card className="p-6 bg-[var(--gradient-subtle)]">
              <h2 className="text-2xl font-bold mb-1">Välkommen</h2>
              <p className="text-sm text-muted-foreground">
                Snabba anbud för Proptech BOX med automatisk besparingsberäkning, payoff, NPV/IRR, CO₂-utsläpp och känslighetsanalys. Allt sparas lokalt i webbläsaren.
              </p>
              <Button className="mt-4" onClick={create}><Plus className="h-4 w-4 mr-1" /> Skapa nytt ärende</Button>
            </Card>

            <section className="space-y-3">
              <h2 className="text-xl font-bold">Mina ärenden</h2>
              {cases.length === 0 && (
                <Card className="p-8 text-center text-sm text-muted-foreground">
                  Inga ärenden ännu. Skapa ditt första anbud ovan.
                </Card>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cases.map((c) => {
                  const invest = investmentTotal(c);
                  const yearly = c.currentEnergyKwh * effectiveSavingsPct(c, 22) * c.energyPrice;
                  const po = payoffYears(invest, yearly - c.bboYearlyCost);
                  return (
                    <Card key={c.id} className="p-4 hover:shadow-[var(--shadow-md)] transition cursor-pointer" onClick={() => setActiveId(c.id)}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-[10px]">{c.number}</Badge>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicate(c.id)}><Copy className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      </div>
                      <div className="font-semibold truncate">{c.propertyName || c.customerCompany || "Utan namn"}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.customerCompany}</div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                        <Stat label="Invest" value={fmtSek(invest)} />
                        <Stat label="Bespar/år" value={fmtSek(yearly)} />
                        <Stat label="Payoff" value={fmtYears(po)} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {active && <ProptechWizard value={active} onChange={upsert} onClose={() => setActiveId(null)} />}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border p-1.5">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}