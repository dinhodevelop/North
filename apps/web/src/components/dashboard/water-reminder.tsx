'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Droplets, X, Bell, BellOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'

const DAILY_GOAL = 8

const INTERVALS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hora', value: 60 },
  { label: '2 horas', value: 120 },
]

function playWaterSound() {
  try {
    const ctx = new AudioContext()

    const play = (freq: number, startTime: number, duration: number, gain: number) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, startTime + duration)
      gainNode.gain.setValueAtTime(gain, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      osc.start(startTime)
      osc.stop(startTime + duration)
    }

    const t = ctx.currentTime
    play(1046, t, 0.25, 0.25)       // C6
    play(1318, t + 0.15, 0.25, 0.2) // E6
    play(1568, t + 0.3, 0.4, 0.15)  // G6
  } catch {
    // Web Audio API pode não estar disponível em todos os contextos
  }
}

function getTodayKey() {
  return `water-glasses-${new Date().toDateString()}`
}

export function WaterReminder() {
  const [glasses, setGlasses] = useState(0)
  const [intervalMin, setIntervalMin] = useState(30)
  const [enabled, setEnabled] = useState(true)
  const [showAlert, setShowAlert] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(getTodayKey())
    if (stored) setGlasses(parseInt(stored, 10))

    const savedInterval = localStorage.getItem('water-interval')
    if (savedInterval) setIntervalMin(parseInt(savedInterval, 10))

    const savedEnabled = localStorage.getItem('water-enabled')
    if (savedEnabled !== null) setEnabled(savedEnabled === 'true')
  }, [])

  const triggerReminder = useCallback(() => {
    setShowAlert(true)
    playWaterSound()
  }, [])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!enabled) return
    timerRef.current = setInterval(triggerReminder, intervalMin * 60 * 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [intervalMin, enabled, triggerReminder])

  function addGlass() {
    const next = glasses + 1
    setGlasses(next)
    localStorage.setItem(getTodayKey(), String(next))
    setShowAlert(false)
  }

  function removeGlass() {
    const next = Math.max(0, glasses - 1)
    setGlasses(next)
    localStorage.setItem(getTodayKey(), String(next))
  }

  function toggleEnabled() {
    const next = !enabled
    setEnabled(next)
    localStorage.setItem('water-enabled', String(next))
    if (!next) setShowAlert(false)
  }

  function handleIntervalChange(value: string) {
    const next = parseInt(value, 10)
    setIntervalMin(next)
    localStorage.setItem('water-interval', String(next))
  }

  const progress = Math.min((glasses / DAILY_GOAL) * 100, 100)
  const done = glasses >= DAILY_GOAL

  return (
    <>
      {showAlert && (
        <div className="fixed bottom-6 right-6 z-50 w-72 rounded-xl border border-sky-500/40 bg-card shadow-xl shadow-sky-900/20 p-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <button
            onClick={() => setShowAlert(false)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Hora de beber água!</p>
              <p className="text-xs text-muted-foreground">{glasses}/{DAILY_GOAL} copos hoje</p>
            </div>
          </div>
          <Button onClick={addGlass} className="w-full bg-sky-600 hover:bg-sky-500 text-white" size="sm">
            Bebi! +1 copo
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Droplets className="h-4 w-4 text-sky-400" />
              Hidratação
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={String(intervalMin)} onValueChange={handleIntervalChange}>
                <SelectTrigger className="h-7 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVALS.map((i) => (
                    <SelectItem key={i.value} value={String(i.value)} className="text-xs">
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={toggleEnabled}
                className={`text-muted-foreground hover:text-foreground transition-colors ${enabled ? 'text-sky-400 hover:text-sky-300' : ''}`}
                title={enabled ? 'Desativar lembretes' : 'Ativar lembretes'}
              >
                {enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-bold text-foreground">{glasses}</span>
              <span className="text-sm text-muted-foreground ml-1">/ {DAILY_GOAL} copos</span>
            </div>
            {done && (
              <span className="text-xs text-sky-400 font-medium">Meta atingida!</span>
            )}
          </div>

          <Progress value={progress} className="h-2 bg-muted" />

          <div className="flex gap-2">
            <Button
              onClick={addGlass}
              size="sm"
              className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-xs"
              disabled={done}
            >
              + Bebi um copo
            </Button>
            <Button
              onClick={removeGlass}
              size="sm"
              variant="outline"
              className="text-xs px-3"
              disabled={glasses === 0}
            >
              −
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
