'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const subscribe = () => () => {}

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative"
    >
      <div className="relative">
        <Sun
          className={cn(
            "h-5 w-5 transition-all duration-300",
            "icon-hover-rotate",
            mounted && resolvedTheme === 'dark' ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-300",
            "icon-hover-rotate",
            mounted && resolvedTheme === 'dark' ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
          )}
        />
      </div>
    </Button>
  )
}
