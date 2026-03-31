'use client'

import { useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook to refetch data when:
 * 1. User navigates back using browser back button (bfcache)
 * 2. Window/tab regains focus
 * 3. Page becomes visible again
 * 
 * This solves the issue where useEffect doesn't re-run when navigating
 * back via browser back/forward buttons.
 * 
 * @param refetchFn - The function to call when refetching is needed
 * @param enabled - Whether the hook should be active (default: true)
 */
export function useRefetchOnFocus(refetchFn: () => void | Promise<void>, enabled = true) {
  const refetchRef = useRef(refetchFn)
  
  // Keep the latest refetch function
  useEffect(() => {
    refetchRef.current = refetchFn
  }, [refetchFn])

  useEffect(() => {
    if (!enabled) return

    const handleRefetch = () => {
      refetchRef.current()
    }

    // Handle back/forward navigation (bfcache)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        handleRefetch()
      }
    }

    // Handle window/tab focus
    const handleFocus = () => {
      handleRefetch()
    }

    // Handle visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRefetch()
      }
    }

    // Handle navigation (popstate for back/forward buttons)
    const handlePopState = () => {
      handleRefetch()
    }

    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [enabled])
}
