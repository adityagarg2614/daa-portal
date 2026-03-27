import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "group/alert relative flex w-full items-start gap-3 rounded-xl border p-4 text-sm",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive:
          "border-destructive bg-destructive/10 text-destructive",
        success:
          "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400",
        warning:
          "border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
        info:
          "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface AlertProps extends React.ComponentProps<"div">, VariantProps<typeof alertVariants> {
  title?: string
  icon?: React.ReactNode
  variant?: "default" | "destructive" | "success" | "warning" | "info"
  onDismiss?: () => void
}

function Alert({
  className,
  variant,
  title,
  icon,
  onDismiss,
  children,
  ...props
}: AlertProps) {
  const defaultIcons = {
    default: null,
    destructive: <XCircle className="h-5 w-5 icon-shake" />,
    success: <CheckCircle2 className="h-5 w-5 icon-bounce" />,
    warning: <AlertCircle className="h-5 w-5 icon-pulse" />,
    info: <Info className="h-5 w-5 icon-pulse" />,
  }

  const iconToShow = icon || defaultIcons[variant as keyof typeof defaultIcons]

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {iconToShow}
      <div className="flex-1 space-y-1">
        {title && <p className="font-medium">{title}</p>}
        {children}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="rounded-md p-1 hover:bg-background/50 transition-colors"
          aria-label="Dismiss alert"
          type="button"
        >
          <XCircle className="h-4 w-4 icon-hover-scale" />
        </button>
      )}
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-heading font-medium [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-muted-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
