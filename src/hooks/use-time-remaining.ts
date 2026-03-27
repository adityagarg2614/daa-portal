'use client'

import { useState, useEffect } from 'react'

export function useTimeRemaining(dueAt: string) {
  const [timeRemaining, setTimeRemaining] = useState('')
  const [isExpiringSoon, setIsExpiringSoon] = useState(false)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date()
      const due = new Date(dueAt)
      const diff = due.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('Expired')
        setIsExpiringSoon(false)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`)
        setIsExpiringSoon(days <= 2)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`)
        setIsExpiringSoon(true)
      } else {
        setTimeRemaining(`${minutes}m`)
        setIsExpiringSoon(true)
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [dueAt])

  return { timeRemaining, isExpiringSoon }
}
