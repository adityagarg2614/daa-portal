'use client'

import { useState } from 'react'
import { Copy, Check, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Example {
  input: string
  output: string
  explanation?: string
}

interface ExampleCardProps {
  example: Example
  exampleNumber: number
}

export function ExampleCard({ example, exampleNumber }: ExampleCardProps) {
  const [copiedField, setCopiedField] = useState<'input' | 'output' | null>(null)

  const handleCopy = async (text: string, field: 'input' | 'output') => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4 transition-all hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Example {exampleNumber}
        </span>
      </div>

      <div className="space-y-4">
        {/* Input */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Input</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(example.input, 'input')}
              className="h-7 gap-1"
              type="button"
            >
              {copiedField === 'input' ? (
                <Check className="h-3.5 w-3.5 text-green-500 icon-bounce" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-lg border bg-background p-3 text-sm font-mono">
            {example.input}
          </pre>
        </div>

        {/* Output */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Output</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(example.output, 'output')}
              className="h-7 gap-1"
              type="button"
            >
              {copiedField === 'output' ? (
                <Check className="h-3.5 w-3.5 text-green-500 icon-bounce" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-lg border bg-background p-3 text-sm font-mono">
            {example.output}
          </pre>
        </div>

        {/* Explanation */}
        {example.explanation && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-yellow-500 icon-pulse" />
              <label className="text-xs font-medium text-muted-foreground">Explanation</label>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {example.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
