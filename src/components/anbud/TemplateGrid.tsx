import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TEMPLATES, CATEGORIES } from "@/features/anbud/templates";
import type { ProjectTemplate } from "@/features/anbud/types";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<ProjectTemplate["category"], string> = {
  varme: "bg-[oklch(0.95_0.05_30)] text-[oklch(0.4_0.15_30)]",
  ventilation: "bg-[oklch(0.95_0.05_220)] text-[oklch(0.4_0.15_220)]",
  budget: "bg-[oklch(0.95_0.05_75)] text-[oklch(0.4_0.15_75)]",
  energi: "bg-accent text-accent-foreground",
  ovrigt: "bg-muted text-muted-foreground",
};

interface Props {
  onPick: (templateId: string) => void;
}

export function TemplateGrid({ onPick }: Props) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<ProjectTemplate["category"] | "all">("all");

  const filtered = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const matchCat = cat === "all" || t.category === cat;
      const matchQ =
        !query.trim() ||
        (t.name + " " + t.description).toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [query, cat]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök mall..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCat("all")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full transition",
              cat === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-secondary"
            )}
          >
            Alla
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full transition",
                cat === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((t) => (
          <Card
            key={t.id}
            onClick={() => onPick(t.id)}
            className="group cursor-pointer p-4 hover:shadow-[var(--shadow-md)] hover:border-primary/40 hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl shrink-0 p-2 rounded-lg bg-accent/40 group-hover:scale-110 transition">
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm leading-tight truncate">{t.name}</h3>
                </div>
                <Badge
                  variant="secondary"
                  className={cn("text-[10px] mb-1.5 font-medium", CATEGORY_COLORS[t.category])}
                >
                  {CATEGORIES.find((c) => c.id === t.category)?.label}
                </Badge>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">Inga mallar matchade.</p>
      )}
    </div>
  );
}