import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Anbud } from "@/features/anbud/types";

interface Props {
  anbud: Anbud;
  onChange: (a: Anbud) => void;
}

export function ScopeStep({ anbud, onChange }: Props) {
  return (
    <Card className="p-6 space-y-4">
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Projektnamn *
        </Label>
        <Input
          value={anbud.projectName}
          onChange={(e) => onChange({ ...anbud, projectName: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Giltigt t.o.m.
          </Label>
          <Input
            type="date"
            value={anbud.validUntil}
            onChange={(e) => onChange({ ...anbud, validUntil: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Anbudsnummer
          </Label>
          <Input value={anbud.number} onChange={(e) => onChange({ ...anbud, number: e.target.value })} />
        </div>
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Omfattning / beskrivning
        </Label>
        <Textarea
          rows={6}
          value={anbud.scope}
          onChange={(e) => onChange({ ...anbud, scope: e.target.value })}
          placeholder="Beskriv arbetets omfattning, leveransgränser, avgränsningar..."
        />
      </div>
    </Card>
  );
}