import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import type { Anbud, Customer } from "@/features/anbud/types";

interface Props {
  anbud: Anbud;
  onChange: (a: Anbud) => void;
  customers: Customer[];
}

export function CustomerStep({ anbud, onChange, customers }: Props) {
  const update = (patch: Partial<Customer>) =>
    onChange({ ...anbud, customer: { ...anbud.customer, ...patch } });

  return (
    <div className="space-y-5">
      {customers.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-sm">Sparade kunder</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {customers.slice(0, 8).map((c) => (
              <Button
                key={c.company}
                variant="outline"
                size="sm"
                onClick={() => onChange({ ...anbud, customer: c })}
              >
                {c.company}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Företag / BRF *" value={anbud.customer.company} onChange={(v) => update({ company: v })} />
        <Field label="Kontaktperson" value={anbud.customer.contact} onChange={(v) => update({ contact: v })} />
        <Field label="E-post" type="email" value={anbud.customer.email} onChange={(v) => update({ email: v })} />
        <Field label="Telefon" value={anbud.customer.phone} onChange={(v) => update({ phone: v })} />
        <Field label="Adress" value={anbud.customer.address} onChange={(v) => update({ address: v })} className="md:col-span-2" />
        <Field label="Postnummer" value={anbud.customer.postal} onChange={(v) => update({ postal: v })} />
        <Field label="Ort" value={anbud.customer.city} onChange={(v) => update({ city: v })} />
        <Field label="Er referens" value={anbud.customer.reference} onChange={(v) => update({ reference: v })} className="md:col-span-2" />
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}