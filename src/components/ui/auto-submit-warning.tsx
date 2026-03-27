'use client'

import { AlertTriangle, Clock } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AutoSubmitWarningProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  timeRemaining: string
}

export function AutoSubmitWarning({
  open,
  onOpenChange,
  onConfirm,
  timeRemaining,
}: AutoSubmitWarningProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500 icon-pulse" />
            Assignment Deadline Reached
          </AlertDialogTitle>
          <AlertDialogDescription>
            The deadline for this assignment has passed. Your current code will be 
            automatically submitted. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>I want to review my code</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            <Clock className="mr-2 h-4 w-4" />
            Submit Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
