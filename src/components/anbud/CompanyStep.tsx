import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Anbud, CompanyInfo } from "@/features/anbud/types";

interface Props {
  anbud: Anbud;
  onChange: (a: Anbud) => void;
  company: CompanyInfo;
  setCompany: (c: CompanyInfo) => void;
}

export function CompanyStep({ anbud, onChange, company, setCompany }: Props) {
  const update = (patch: Partial<CompanyInfo>) => {
    const next = { ...company, ...patch };
    setCompany(next);
    onChange({ ...anbud, company: next });
  };
  return (
    <Card className="p-6 space-y-4">
      <p className="text-xs text-muted-foreground">
        Sparas lokalt i webbläsaren och fylls i automatiskt vid nästa anbud.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Företagsnamn" value={company.name} onChange={(v) => update({ name: v })} />
        <Field label="Region / avdelning" value={company.region} onChange={(v) => update({ region: v })} />
        <Field label="Kontaktperson" value={company.contactPerson} onChange={(v) => update({ contactPerson: v })} />
        <Field label="Org.nr" value={company.orgnr} onChange={(v) => update({ orgnr: v })} />
        <Field label="E-post" value={company.email} onChange={(v) => update({ email: v })} />
        <Field label="Telefon" value={company.phone} onChange={(v) => update({ phone: v })} />
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Villkor & noteringar (skrivs på PDF)
        </Label>
        <Textarea
          rows={4}
          value={anbud.notes}
          onChange={(e) => onChange({ ...anbud, notes: e.target.value })}
        />
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}