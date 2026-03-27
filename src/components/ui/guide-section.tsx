import { cn } from "@/lib/utils"

interface GuideStepProps {
    stepNumber: number
    title: string
    description: string
    className?: string
}

/**
 * GuideStep - A component for displaying numbered guide steps
 * Used in getting started sections
 */
export function GuideStep({
    stepNumber,
    title,
    description,
    className,
}: GuideStepProps) {
    return (
        <div className={cn("flex items-start gap-3", className)}>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                {stepNumber}
            </div>
            <div>
                <p>
                    <strong className="text-foreground">{title}:</strong>{" "}
                    <span className="text-muted-foreground">{description}</span>
                </p>
            </div>
        </div>
    )
}

interface GuideSectionProps {
    title: string
    steps: Array<{
        stepNumber: number
        title: string
        description: string
    }>
    className?: string
}

/**
 * GuideSection - A component for displaying a complete guide section
 * Used for onboarding and getting started sections
 */
export function GuideSection({ title, steps, className }: GuideSectionProps) {
    return (
        <div
            className={cn(
                "rounded-2xl border bg-background p-6 shadow-sm",
                className
            )}
            role="region"
            aria-labelledby={title.toLowerCase().replace(/\s+/g, "-")}
        >
            <h2
                id={title.toLowerCase().replace(/\s+/g, "-")}
                className="mb-4 text-lg font-semibold"
            >
                {title}
            </h2>
            <div className="space-y-3 text-sm">
                {steps.map((step, index) => (
                    <GuideStep
                        key={index}
                        stepNumber={step.stepNumber}
                        title={step.title}
                        description={step.description}
                    />
                ))}
            </div>
        </div>
    )
}
