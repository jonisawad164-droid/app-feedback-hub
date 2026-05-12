import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Building2, Calculator, FileText, Gauge,
  Leaf, Plus, Save, Sparkles, Trash2, Wand2, X, Download, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ProptechCase, PriceItem } from "@/features/proptech/types";
import {
  buildScenarios, effectiveSavingsPct, fmtKg, fmtPct, fmtSek, fmtYears, investmentTotal,
  irr, npv, payoffYears, sensitivity,
} from "@/features/proptech/calc";
import { PACKAGES, PRESETS, uid } from "@/features/proptech/storage";
import { generateProptechPdf, previewProptechPdf } from "@/features/proptech/pdf";

const STEPS = [
  { id: 1, label: "Kund", icon: Building2 },
  { id: 2, label: "Teknik", icon: Gauge },
  { id: 3, label: "Paket", icon: Sparkles },
  { id: 4, label: "Ekonomi", icon: Calculator },
  { id: 5, label: "Dokument", icon: FileText },
] as const;

interface Props {
  value: ProptechCase;
  onChange: (c: ProptechCase) => void;
  onClose: () => void;
}

export function ProptechWizard({ value, onChange, onClose }: Props) {
  const [step, setStep] = useState(1);
  const c = value;
  const set = <K extends keyof ProptechCase>(k: K, v: ProptechCase[K]) =>
    onChange({ ...c, [k]: v, updatedAt: new Date().toISOString() });

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        toast.success("Sparat lokalt");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        generateProptechPdf(c);
      }
      if (e.altKey && e.key === "ArrowRight") setStep((s) => Math.min(5, s + 1));
      if (e.altKey && e.key === "ArrowLeft") setStep((s) => Math.max(1, s - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [c]);

  return (
    <div className="space-y-5 pb-28">
      <Card className="p-4 flex items-center justify-between gap-3 bg-[var(--gradient-subtle)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-3xl shrink-0">📦</div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Proptech BOX · {c.number}</div>
            <h2 className="font-bold text-lg truncate">
              {c.propertyName || c.customerCompany || "Nytt ärende"}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:inline-flex">Steg {step} av 5</Badge>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Stäng">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        <Progress value={(step / 5) * 100} className="h-2" />
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-xs font-medium transition",
                  active && "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]",
                  !active && done && "text-foreground hover:bg-accent",
                  !active && !done && "text-muted-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {step === 1 && <CustomerStep c={c} set={set} />}
      {step === 2 && <TechStep c={c} set={set} />}
      {step === 3 && <PackageStep c={c} set={set} onChange={onChange} />}
      {step === 4 && <EconomyStep c={c} set={set} />}
      {step === 5 && <DocumentStep c={c} />}

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Tillbaka
        </Button>
        {step < 5 ? (
          <Button onClick={() => setStep((s) => Math.min(5, s + 1))}>
            Nästa <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => generateProptechPdf(c)}>
            <Download className="h-4 w-4 mr-1" /> Ladda ner PDF
          </Button>
        )}
      </div>

      <StickyPayoffBar c={c} />
    </div>
  );
}

/* ============ Sticky payoff bar ============ */
function StickyPayoffBar({ c }: { c: ProptechCase }) {
  const target = 22;
  const pct = effectiveSavingsPct(c, target);
  const yearlyKwh = c.currentEnergyKwh * pct;
  const yearlySek = yearlyKwh * c.energyPrice;
  const co2 = yearlyKwh * c.emissionFactor;
  const invest = investmentTotal(c);
  const net = yearlySek - c.bboYearlyCost;
  const po = payoffYears(invest, net);
  const warn = pct > 0.25 || (isFinite(po) && po < 1);
  return (
    <div className="fixed bottom-0 inset-x-0 z-20 border-t border-border bg-background/95 backdrop-blur shadow-[var(--shadow-lg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
        <Kpi label="Besparing" value={fmtSek(yearlySek)} accent />
        <Kpi label="Payoff" value={fmtYears(po)} />
        <Kpi label="CO₂/år" value={fmtKg(co2)} />
        <Kpi label="Investering" value={fmtSek(invest)} />
        <Kpi label="Besparing %" value={fmtPct(pct)} />
        {warn && (
          <Badge variant="destructive" className="ml-auto text-[10px]">
            Granska antaganden – orealistiska värden
          </Badge>
        )}
      </div>
    </div>
  );
}
function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn("font-semibold", accent && "text-primary")}>{value}</span>
    </div>
  );
}

/* ============ Steg 1: Kund ============ */
function CustomerStep({ c, set }: { c: ProptechCase; set: <K extends keyof ProptechCase>(k: K, v: ProptechCase[K]) => void }) {
  const loadPreset = () => {
    const p = PRESETS.brfTallen;
    Object.entries(p).forEach(([k, v]) => set(k as keyof ProptechCase, v as never));
    toast.success("Preset BRF Tallen laddad");
  };
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Kund & fastighet</h3>
        <Button variant="outline" size="sm" onClick={loadPreset}>
          <Wand2 className="h-3.5 w-3.5 mr-1" /> Ladda BRF Tallen
        </Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Kundföretag / förening">
          <Input value={c.customerCompany} onChange={(e) => set("customerCompany", e.target.value)} placeholder="BRF Exempel" />
        </Field>
        <Field label="Kontaktperson">
          <Input value={c.customerContact} onChange={(e) => set("customerContact", e.target.value)} />
        </Field>
        <Field label="E-post">
          <Input type="email" value={c.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} />
        </Field>
        <Field label="Telefon">
          <Input value={c.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} />
        </Field>
        <Field label="Fastighetens namn">
          <Input value={c.propertyName} onChange={(e) => set("propertyName", e.target.value)} />
        </Field>
        <Field label="Adress">
          <Input value={c.propertyAddress} onChange={(e) => set("propertyAddress", e.target.value)} />
        </Field>
      </div>
    </Card>
  );
}

/* ============ Steg 2: Teknik ============ */
function TechStep({ c, set }: { c: ProptechCase; set: <K extends keyof ProptechCase>(k: K, v: ProptechCase[K]) => void }) {
  const scenarios = useMemo(() => buildScenarios(c), [c]);
  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> Teknisk bakgrund</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Byggnadstyp">
            <Input value={c.buildingType} onChange={(e) => set("buildingType", e.target.value)} placeholder="Flerbostadshus" />
          </Field>
          <Field label="Antal lägenheter">
            <Input type="number" value={c.apartments || ""} onChange={(e) => set("apartments", Number(e.target.value))} />
          </Field>
          <Field label="Atemp (m²)">
            <Input type="number" value={c.area || ""} onChange={(e) => set("area", Number(e.target.value))} />
          </Field>
          <Field label="Nuvarande inomhustemperatur (°C)">
            <Input type="number" step="0.1" value={c.currentTempIndoor || ""} onChange={(e) => set("currentTempIndoor", Number(e.target.value))} />
          </Field>
          <Field label="Energi värme (kWh/år)">
            <Input type="number" value={c.currentEnergyKwh || ""} onChange={(e) => set("currentEnergyKwh", Number(e.target.value))} />
          </Field>
          <Field label="Energipris (kr/kWh)">
            <Input type="number" step="0.01" value={c.energyPrice || ""} onChange={(e) => set("energyPrice", Number(e.target.value))} />
          </Field>
          <Field label="CO₂-faktor (kg/kWh)">
            <Input type="number" step="0.001" value={c.emissionFactor || ""} onChange={(e) => set("emissionFactor", Number(e.target.value))} />
          </Field>
          <Field label="Beräkningsmetod">
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={c.calcMethod === "auto" ? "default" : "outline"} onClick={() => set("calcMethod", "auto")}>Auto (5 %/°C)</Button>
              <Button type="button" size="sm" variant={c.calcMethod === "manual" ? "default" : "outline"} onClick={() => set("calcMethod", "manual")}>Manuell</Button>
            </div>
          </Field>
          {c.calcMethod === "manual" && (
            <Field label="Manuell besparing (%)">
              <Input type="number" value={c.manualSavingsPct || ""} onChange={(e) => set("manualSavingsPct", Number(e.target.value))} />
            </Field>
          )}
        </div>
        {(c.currentTempIndoor > 24 || c.currentTempIndoor < 18) && c.currentTempIndoor > 0 && (
          <p className="text-xs text-amber-600">Inomhustemperaturen ligger utanför normalt intervall (18–24 °C). Kontrollera värdet.</p>
        )}
      </Card>
      <Card className="p-6 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Leaf className="h-4 w-4 text-primary" /> Scenarier</h3>
        <div className="grid grid-cols-3 gap-3">
          {scenarios.map((s) => (
            <div key={s.label} className="rounded-lg border border-border p-3 bg-[var(--gradient-subtle)]">
              <div className="text-xs text-muted-foreground">Måltemperatur</div>
              <div className="text-lg font-bold">{s.label}</div>
              <div className="mt-2 text-xs space-y-0.5">
                <div>{fmtSek(s.savingsSek)} / år</div>
                <div className="text-muted-foreground">{Math.round(s.savingsKwh).toLocaleString("sv-SE")} kWh</div>
                <div className="text-muted-foreground">{Math.round(s.co2).toLocaleString("sv-SE")} kg CO₂</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============ Steg 3: Paket ============ */
function PackageStep({ c, set, onChange }: {
  c: ProptechCase;
  set: <K extends keyof ProptechCase>(k: K, v: ProptechCase[K]) => void;
  onChange: (c: ProptechCase) => void;
}) {
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const total = investmentTotal(c);
  const applyPackage = (id: string) => {
    const p = PACKAGES.find((x) => x.id === id);
    if (!p) return;
    onChange({
      ...c,
      packageId: id,
      items: p.items.map((i) => ({ ...i, id: uid("pi") })),
      updatedAt: new Date().toISOString(),
    });
    toast.success(`Paket valt: ${p.name}`);
  };
  const updateItem = (id: string, patch: Partial<PriceItem>) => {
    set("items", c.items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };
  const addItem = () => {
    set("items", [...c.items, { id: uid("pi"), name: "", qty: 1, unit: "st", unitPrice: 0 }]);
  };
  const removeItem = (id: string) => {
    set("items", c.items.filter((i) => i.id !== id));
    setConfirmDel(null);
  };
  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Välj paket</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {PACKAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPackage(p.id)}
              className={cn(
                "text-left rounded-xl border p-4 transition hover:shadow-[var(--shadow-md)]",
                c.packageId === p.id ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <div className="font-semibold text-sm">{p.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {p.items.length} poster · {fmtSek(p.items.reduce((s, i) => s + i.qty * i.unitPrice, 0))}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Poster</h3>
          <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" /> Lägg till</Button>
        </div>
        <div className="space-y-2">
          {c.items.map((i) => (
            <div key={i.id} className="grid grid-cols-12 gap-2 items-center">
              <Input className="col-span-5" value={i.name} placeholder="Beskrivning" onChange={(e) => updateItem(i.id, { name: e.target.value })} />
              <Input className="col-span-2" type="number" value={i.qty} onChange={(e) => updateItem(i.id, { qty: Number(e.target.value) })} />
              <Input className="col-span-1" value={i.unit} onChange={(e) => updateItem(i.id, { unit: e.target.value })} />
              <Input className="col-span-3" type="number" value={i.unitPrice} onChange={(e) => updateItem(i.id, { unitPrice: Number(e.target.value) })} />
              <Button variant="ghost" size="icon" className="col-span-1" onClick={() => setConfirmDel(i.id)} aria-label="Ta bort">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {c.items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Välj ett paket eller lägg till poster manuellt.</p>
          )}
        </div>
        <div className="flex justify-end pt-2 border-t border-border">
          <div className="text-sm">
            <span className="text-muted-foreground mr-2">Investering:</span>
            <span className="font-bold text-lg">{fmtSek(total)}</span>
          </div>
        </div>
      </Card>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort posten?</AlertDialogTitle>
            <AlertDialogDescription>Du kan inte ångra detta direkt. Vill du fortsätta?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDel && removeItem(confirmDel)}>Ta bort</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ============ Steg 4: Ekonomi ============ */
function EconomyStep({ c, set }: { c: ProptechCase; set: <K extends keyof ProptechCase>(k: K, v: ProptechCase[K]) => void }) {
  const target = 22;
  const pct = effectiveSavingsPct(c, target);
  const yearlySek = c.currentEnergyKwh * pct * c.energyPrice;
  const invest = investmentTotal(c);
  const net = yearlySek - c.bboYearlyCost;
  const po = payoffYears(invest, net);
  const npvVal = npv(invest, yearlySek, c.bboYearlyCost, c.contractYears, c.discountRate, c.energyIndexPct);
  const irrVal = irr(invest, yearlySek, c.bboYearlyCost, c.contractYears, c.energyIndexPct);
  const sens = sensitivity(yearlySek);
  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" /> Antaganden</h3>
        <div className="grid sm:grid-cols-4 gap-4">
          <Field label="BBO årskostnad (SEK)"><Input type="number" value={c.bboYearlyCost || ""} onChange={(e) => set("bboYearlyCost", Number(e.target.value))} /></Field>
          <Field label="Avtalslängd (år)"><Input type="number" value={c.contractYears || ""} onChange={(e) => set("contractYears", Number(e.target.value))} /></Field>
          <Field label="Diskonteringsränta (%)"><Input type="number" step="0.1" value={c.discountRate || ""} onChange={(e) => set("discountRate", Number(e.target.value))} /></Field>
          <Field label="Energiprisindex (%/år)"><Input type="number" step="0.1" value={c.energyIndexPct || ""} onChange={(e) => set("energyIndexPct", Number(e.target.value))} /></Field>
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Ekonomisk analys</h3>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Row label="Investering" value={fmtSek(invest)} />
          <Row label="Årlig bruttobesparing" value={fmtSek(yearlySek)} />
          <Row label="BBO årskostnad" value={fmtSek(c.bboYearlyCost)} />
          <Row label="Årlig nettobesparing" value={fmtSek(net)} accent />
          <Row label="Payoff (enkel)" value={fmtYears(po)} />
          <Row label={`NPV (${c.contractYears} år)`} value={fmtSek(npvVal)} />
          <Row label="IRR" value={irrVal == null ? "—" : `${(irrVal * 100).toFixed(1)} %`} />
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Känslighetsanalys ±10 %</h3>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            ["Pessimistiskt", sens.low],
            ["Förväntat", sens.base],
            ["Optimistiskt", sens.high],
          ].map(([label, v]) => (
            <div key={label as string} className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="font-semibold">{fmtSek(v as number)}</div>
              <div className="text-xs text-muted-foreground">Payoff {fmtYears(payoffYears(invest, (v as number) - c.bboYearlyCost))}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between border-b border-border/60 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", accent && "text-primary font-bold")}>{value}</span>
    </div>
  );
}

/* ============ Steg 5: Dokument ============ */
function DocumentStep({ c }: { c: ProptechCase }) {
  const [uri, setUri] = useState("");
  const refresh = () => setUri(previewProptechPdf(c));
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [c.id]);
  return (
    <div className="space-y-4">
      <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1"><FileText className="h-5 w-5 text-primary" /><h3 className="font-semibold">Förhandsvisning</h3></div>
          <p className="text-sm text-muted-foreground">5-sidigt anbud: försättsblad, teknik, lösning, ekonomi, signering.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh}><RefreshCw className="h-4 w-4 mr-1" /> Uppdatera</Button>
          <Button onClick={() => generateProptechPdf(c)}><Download className="h-4 w-4 mr-1" /> Ladda ner PDF</Button>
        </div>
      </Card>
      <Card className="p-2 overflow-hidden">
        {uri && <iframe title="PDF" src={uri} className="w-full rounded-md" style={{ height: "80vh", border: "none" }} />}
      </Card>
      <p className="text-xs text-muted-foreground text-center">
        Genvägar: <kbd className="px-1.5 py-0.5 rounded border bg-muted">Ctrl/Cmd+P</kbd> Ladda PDF · <kbd className="px-1.5 py-0.5 rounded border bg-muted">Ctrl/Cmd+S</kbd> Spara · <kbd className="px-1.5 py-0.5 rounded border bg-muted">Alt+←/→</kbd> Steg
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

// silence unused (kept for future use)
void Save;
void FileText;