import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const STEPS = [
  { id: 1, label: "Projekttyp" },
  { id: 2, label: "Kund" },
  { id: 3, label: "Omfattning" },
  { id: 4, label: "Poster & kalkyl" },
  { id: 5, label: "Företagsinfo" },
  { id: 6, label: "Kontroll" },
  { id: 7, label: "PDF" },
] as const;

interface Props {
  current: number;
  onStep: (n: number) => void;
  maxReached: number;
}

export function StepNav({ current, onStep, maxReached }: Props) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <ol className="flex items-center gap-1 min-w-max">
        {STEPS.map((s, i) => {
          const done = current > s.id;
          const active = current === s.id;
          const reachable = s.id <= maxReached;
          return (
            <li key={s.id} className="flex items-center">
              <button
                disabled={!reachable}
                onClick={() => reachable && onStep(s.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition",
                  active && "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]",
                  !active && done && "text-foreground hover:bg-accent",
                  !active && !done && reachable && "text-muted-foreground hover:bg-accent",
                  !reachable && "text-muted-foreground/50 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold",
                    active && "bg-primary-foreground/20 text-primary-foreground",
                    !active && done && "bg-success text-white",
                    !active && !done && "bg-muted text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : s.id}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "h-px w-4 mx-0.5 transition",
                    done ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}