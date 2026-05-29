'use client'

import { useState, useEffect } from 'react'

export function Clock() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      setDate(now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-right">
      <p className="text-2xl font-semibold tabular-nums">{time}</p>
      <p className="text-xs text-muted-foreground capitalize mt-0.5">{date}</p>
    </div>
  )
}
