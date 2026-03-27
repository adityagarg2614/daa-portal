'use client'

import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'

export function KeyboardShortcutsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Save code</span>
            <div className="flex items-center gap-1">
              <Kbd>Ctrl</Kbd>
              <span className="text-muted-foreground">+</span>
              <Kbd>S</Kbd>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Reset code</span>
            <div className="flex items-center gap-1">
              <Kbd>Ctrl</Kbd>
              <span className="text-muted-foreground">+</span>
              <Kbd>R</Kbd>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
