import { ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <span className="text-sm font-semibold tracking-tight">
        Auth Console
      </span>
    </div>
  )
}
