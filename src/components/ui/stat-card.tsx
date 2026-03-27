import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { NumberTicker } from "@/components/ui/number-ticker"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  variant?: "default" | "primary" | "success"
  className?: string
}

export function StatCard({
  icon: Icon,
  label,
  value,
  variant = "default",
  className,
}: StatCardProps) {
  const variants = {
    default: "bg-background text-foreground",
    primary: "bg-primary/5 text-primary border-primary/20",
    success: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  }

  const isNumeric = typeof value === "number"

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:shadow-md",
        variants[variant],
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
          <Icon className="h-5 w-5 icon-hover-scale" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">
            {isNumeric ? <NumberTicker value={value} /> : value}
          </p>
        </div>
      </div>
      {/* Subtle gradient overlay */}
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-current to-transparent opacity-5" />
    </div>
  )
}
