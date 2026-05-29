'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Check } from 'lucide-react'
import Link from 'next/link'

interface Habit {
  id: string
  name: string
  icon: string | null
  completedToday: boolean
}

export function HabitsWidget({ habits }: { habits: Habit[] }) {
  const qc = useQueryClient()

  const toggle = useMutation({
    mutationFn: (habitId: string) => api.post('/habits/toggle', { habitId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard'] }),
  })

  const done = habits.filter((h) => h.completedToday).length

  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Zap className="w-4 h-4" /> Hábitos — {done}/{habits.length}
          </CardTitle>
          <Link href="/dashboard/habits" className="text-xs text-primary hover:underline">
            Ver todos
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {habits.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">Nenhum hábito configurado.</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {habits.map((h) => (
            <button
              key={h.id}
              onClick={() => toggle.mutate(h.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left
                ${h.completedToday
                  ? 'border-primary/30 bg-primary/5 text-foreground'
                  : 'border-border bg-muted/20 text-muted-foreground hover:border-border/80'
                }`}
            >
              <span>{h.icon || '✅'}</span>
              <span className="flex-1 text-xs truncate">{h.name}</span>
              {h.completedToday && <Check className="w-3 h-3 text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
