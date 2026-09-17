import { BriefcaseBusiness } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-brass">
        <span className="absolute inset-1 rounded-sm border border-primary-foreground/30" />
        <BriefcaseBusiness className={cn("relative size-4", iconClassName)} strokeWidth={2.25} />
      </span>
      <span className="font-display text-xl font-bold tracking-tight">Panelly</span>
    </span>
  );
}
