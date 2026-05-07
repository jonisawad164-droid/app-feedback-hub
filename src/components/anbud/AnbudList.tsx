import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, FileText, ChevronRight } from "lucide-react";
import type { Anbud, AnbudStatus } from "@/features/anbud/types";
import { calcTotals } from "@/features/anbud/pdf";

const fmt = (n: number) => new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(n);
const STATUS_LABEL: Record<AnbudStatus, string> = { draft: "Utkast", sent: "Skickat", won: "Vunnet", lost: "Förlorat" };
const STATUS_CLASS: Record<AnbudStatus, string> = { draft: "bg-muted text-muted-foreground", sent: "bg-info/15 text-info", won: "bg-success/15 text-success", lost: "bg-destructive/15 text-destructive" };

interface Props {
  anbuds: Anbud[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onStatus: (id: string, status: AnbudStatus) => void;
}

export function AnbudList({ anbuds, onOpen, onDelete, onDuplicate, onStatus }: Props) {
  if (anbuds.length === 0) {
    return (
      <Card className="p-10 text-center border-dashed">
        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Inga anbud ännu — välj en mall ovan för att börja.</p>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {anbuds.map((a) => {
        const t = calcTotals(a);
        return (
          <Card key={a.id} className="p-4 hover:shadow-[var(--shadow-md)] transition cursor-pointer group" onClick={() => onOpen(a.id)}>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">{a.number}</span>
                  <Badge className={STATUS_CLASS[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  <span className="font-semibold truncate">{a.projectName}</span>
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {a.customer.company || "Ingen kund"} · {a.items.length} poster · {new Date(a.updatedAt).toLocaleDateString("sv-SE")}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-primary">{fmt(t.total)}</div>
                <div className="text-[10px] text-muted-foreground">inkl. moms</div>
              </div>
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <select value={a.status} onChange={(e) => onStatus(a.id, e.target.value as AnbudStatus)} className="text-xs border border-border rounded px-2 py-1 bg-background">
                  <option value="draft">Utkast</option>
                  <option value="sent">Skickat</option>
                  <option value="won">Vunnet</option>
                  <option value="lost">Förlorat</option>
                </select>
                <Button variant="ghost" size="icon" onClick={() => onDuplicate(a.id)}><Copy className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
