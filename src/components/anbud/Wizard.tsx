import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StepNav } from "./StepNav";
import { CustomerStep } from "./CustomerStep";
import { ScopeStep } from "./ScopeStep";
import { ItemsStep } from "./ItemsStep";
import { CompanyStep } from "./CompanyStep";
import { CheckStep } from "./CheckStep";
import { PdfStep } from "./PdfStep";
import type { Anbud, CompanyInfo, Customer } from "@/features/anbud/types";
import { TEMPLATES } from "@/features/anbud/templates";

interface Props {
  anbud: Anbud;
  customers: Customer[];
  company: CompanyInfo;
  setCompany: (c: CompanyInfo) => void;
  onChange: (a: Anbud) => void;
  onClose: () => void;
  onSaveCustomer: (c: Customer) => void;
}

export function Wizard({ anbud, customers, company, setCompany, onChange, onClose, onSaveCustomer }: Props) {
  const [step, setStep] = useState(2);
  const [maxReached, setMaxReached] = useState(2);
  const tpl = useMemo(() => TEMPLATES.find((t) => t.id === anbud.templateId), [anbud.templateId]);
  const goto = (n: number) => { setStep(n); setMaxReached((m) => Math.max(m, n)); };
  const next = () => { if (step === 2) onSaveCustomer(anbud.customer); goto(Math.min(7, step + 1)); };
  const back = () => goto(Math.max(1, step - 1));
  return (
    <div className="space-y-5">
      <Card className="p-4 flex items-center justify-between gap-3 bg-[var(--gradient-subtle)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-3xl shrink-0">{tpl?.icon ?? "📄"}</div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Anbud {anbud.number}</div>
            <h2 className="font-bold text-lg truncate">{anbud.projectName || "Nytt anbud"}</h2>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Stäng"><X className="h-5 w-5" /></Button>
      </Card>
      <StepNav current={step} maxReached={maxReached} onStep={goto} />
      <div>
        {step === 1 && (<Card className="p-6"><p className="text-sm text-muted-foreground">Mall vald. Stäng och välj en annan om du vill byta.</p></Card>)}
        {step === 2 && <CustomerStep anbud={anbud} onChange={onChange} customers={customers} />}
        {step === 3 && <ScopeStep anbud={anbud} onChange={onChange} />}
        {step === 4 && <ItemsStep anbud={anbud} onChange={onChange} />}
        {step === 5 && <CompanyStep anbud={anbud} onChange={onChange} company={company} setCompany={setCompany} />}
        {step === 6 && <CheckStep anbud={anbud} />}
        {step === 7 && <PdfStep anbud={anbud} />}
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={back} disabled={step === 1}><ArrowLeft className="h-4 w-4 mr-1" /> Tillbaka</Button>
        {step < 7 ? (
          <Button onClick={next}>Nästa <ArrowRight className="h-4 w-4 ml-1" /></Button>
        ) : (
          <Button onClick={onClose} variant="outline">Klar</Button>
        )}
      </div>
    </div>
  );
}
