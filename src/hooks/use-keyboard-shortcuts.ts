'use client'

import { useEffect } from 'react'

interface KeyboardShortcutsOptions {
  onSave?: () => void
  onReset?: () => void
  enabled: boolean
}

export function useKeyboardShortcuts({
  onSave,
  onReset,
  enabled,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        onSave?.()
      }

      // Ctrl/Cmd + R to reset
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        onReset?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSave, onReset, enabled])
}
