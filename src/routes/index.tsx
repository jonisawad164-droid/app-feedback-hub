import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Sparkles, Plus, Package } from "lucide-react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TemplateGrid } from "@/components/anbud/TemplateGrid";
import { AnbudList } from "@/components/anbud/AnbudList";
import { StatsBar } from "@/components/anbud/StatsBar";
import { Wizard } from "@/components/anbud/Wizard";
import { useAnbudStore, createAnbudFromTemplate } from "@/features/anbud/useAnbudStore";
import type { Anbud, AnbudStatus } from "@/features/anbud/types";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const store = useAnbudStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = useMemo(
    () => store.anbuds.find((a) => a.id === activeId) ?? null,
    [activeId, store.anbuds]
  );

  const startFromTemplate = (templateId: string) => {
    const a = createAnbudFromTemplate(templateId, store.anbuds, store.company);
    store.upsert(a);
    setActiveId(a.id);
    toast.success("Nytt anbud skapat", { description: a.number });
  };

  const updateActive = (a: Anbud) => store.upsert(a);

  const setStatus = (id: string, status: AnbudStatus) => {
    const found = store.anbuds.find((a) => a.id === id);
    if (found) store.upsert({ ...found, status });
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-subtle)]">
      <Toaster position="top-right" richColors />
      <header className="border-b border-border bg-background/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[var(--gradient-primary)] grid place-items-center shadow-[var(--shadow-glow)]">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Anbud-Generator</h1>
              <p className="text-[11px] text-muted-foreground">v4 · Demo · sparas lokalt</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-medium">
              <Sparkles className="h-3 w-3 inline mr-1" />
              {store.company.region}
            </span>
            <Link
              to="/proptech"
              className="text-xs px-2.5 py-1 rounded-full bg-primary text-primary-foreground font-medium inline-flex items-center gap-1 hover:opacity-90"
            >
              <Package className="h-3 w-3" />
              Proptech BOX motor
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {!active && (
          <>
            <section className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Översikt</h2>
                  <p className="text-sm text-muted-foreground">
                    Statistik baserad på dina sparade anbud (lokalt i webbläsaren).
                  </p>
                </div>
              </div>
              <StatsBar anbuds={store.anbuds} />
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">Skapa nytt anbud</h2>
                <p className="text-sm text-muted-foreground">
                  Välj en mall — komponenter, omfattning och priser fylls i automatiskt.
                </p>
              </div>
              <TemplateGrid onPick={startFromTemplate} />
            </section>

            <section className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Mina anbud</h2>
                  <p className="text-sm text-muted-foreground">
                    {store.anbuds.length} anbud · klicka för att fortsätta redigera.
                  </p>
                </div>
                <Button variant="outline" onClick={() => startFromTemplate("tom")}>
                  <Plus className="h-4 w-4 mr-1" /> Tom mall
                </Button>
              </div>
              <AnbudList
                anbuds={store.anbuds}
                onOpen={setActiveId}
                onDelete={(id) => {
                  store.remove(id);
                  toast("Anbud raderat");
                }}
                onDuplicate={(id) => {
                  store.duplicate(id);
                  toast.success("Anbud duplicerat");
                }}
                onStatus={setStatus}
              />
            </section>
          </>
        )}

        {active && (
          <Wizard
            anbud={active}
            customers={store.customers}
            company={store.company}
            setCompany={store.setCompany}
            onChange={updateActive}
            onClose={() => setActiveId(null)}
            onSaveCustomer={store.saveCustomer}
          />
        )}

        <Card className="p-4 text-xs text-muted-foreground text-center">
          Demo-version · ingen molnsynk · all data sparas i din webbläsares localStorage
        </Card>
      </main>
    </div>
  );
}
