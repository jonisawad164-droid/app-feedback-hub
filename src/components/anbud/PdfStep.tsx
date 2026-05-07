import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, RefreshCw } from "lucide-react";
import type { Anbud } from "@/features/anbud/types";
import { generatePdf, previewPdfDataUri } from "@/features/anbud/pdf";

export function PdfStep({ anbud }: { anbud: Anbud }) {
  const [uri, setUri] = useState<string>("");
  const refresh = () => setUri(previewPdfDataUri(anbud));
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [anbud.id]);
  return (
    <div className="space-y-4">
      <Card className="p-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1"><FileText className="h-5 w-5 text-primary" /><h3 className="font-semibold">Förhandsvisning av PDF</h3></div>
          <p className="text-sm text-muted-foreground">Granska anbudet nedan och ladda ner när du är klar.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh}><RefreshCw className="h-4 w-4 mr-1" /> Uppdatera</Button>
          <Button onClick={() => generatePdf(anbud)}><Download className="h-4 w-4 mr-1" /> Ladda ner PDF</Button>
        </div>
      </Card>
      <Card className="p-2 overflow-hidden">
        {uri && <iframe title="PDF preview" src={uri} className="w-full rounded-md" style={{ height: "80vh", border: "none" }} />}
      </Card>
    </div>
  );
}