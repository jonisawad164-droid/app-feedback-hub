import { Card } from "@/components/ui/card";
import { TrendingUp, FileText, CheckCircle2, Clock } from "lucide-react";
import type { Anbud } from "@/features/anbud/types";
import { calcTotals } from "@/features/anbud/pdf";

const fmt = (n: number) => new Intl.NumberFormat("sv-SE", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function StatsBar({ anbuds }: { anbuds: Anbud[] }) {
  const won = anbuds.filter((a) => a.status === "won");
  const sent = anbuds.filter((a) => a.status === "sent" || a.status === "won").length;
  const value = won.reduce((s, a) => s + calcTotals(a).total, 0);
  const hitRate = sent ? Math.round((won.length / sent) * 100) : 0;
  const stats = [
    { icon: FileText, label: "Anbud totalt", value: anbuds.length.toString(), color: "text-info" },
    { icon: Clock, label: "Skickade", value: sent.toString(), color: "text-warning" },
    { icon: CheckCircle2, label: "Vunna", value: won.length.toString(), color: "text-success" },
    { icon: TrendingUp, label: "Hit rate", value: hitRate + "%", color: "text-primary" },
    { icon: TrendingUp, label: "Värde vunnet", value: fmt(value) + " kr", color: "text-primary" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <s.icon className={"h-4 w-4 " + s.color} />
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</span>
          </div>
          <div className="text-2xl font-bold">{s.value}</div>
        </Card>
      ))}
    </div>
  );
}
