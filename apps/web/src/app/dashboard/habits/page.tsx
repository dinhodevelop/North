'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Flame, Trash2, Check } from 'lucide-react'

export default function HabitsPage() {
  const qc = useQueryClient()
  const [newHabit, setNewHabit] = useState('')
  const [newIcon, setNewIcon] = useState('✅')
  const [adding, setAdding] = useState(false)

  const { data: habits, isLoading: habitsLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const [habitsRes, streaksRes] = await Promise.all([
        api.get('/habits'),
        api.get('/habits/streaks'),
      ])
      return { habits: habitsRes.data, streaks: streaksRes.data }
    },
  })

  const habitsData = habits?.habits || []
  const streaksData = habits?.streaks || []

  const toggleHabit = useMutation({
    mutationFn: (habitId: string) => api.post('/habits/toggle', { habitId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const addHabit = useMutation({
    mutationFn: () => api.post('/habits', { name: newHabit, icon: newIcon }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      setNewHabit('')
      setAdding(false)
    },
  })

  const deleteHabit = useMutation({
    mutationFn: (id: string) => api.delete(`/habits/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      qc.invalidateQueries({ queryKey: ['habit-streaks'] })
    },
  })

  const completedCount = habitsData?.filter((h: any) => h.completedToday).length || 0
  const totalCount = habitsData?.length || 0

  const getStreak = (habitId: string) =>
    streaksData?.find((s: any) => s.habitId === habitId)?.streak || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hábitos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {completedCount}/{totalCount} completados hoje
          </p>
        </div>
        <Button size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="w-4 h-4 mr-1" /> Novo Hábito
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="pt-4 pb-4 flex gap-2 items-end">
            <div className="flex gap-2 flex-1">
              <input
                type="text"
                placeholder="Ícone"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className="w-12 bg-muted/50 border border-border rounded-md px-2 py-2 text-sm text-center"
              />
              <input
                type="text"
                placeholder="Nome do hábito"
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                className="flex-1 bg-muted/50 border border-border rounded-md px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && newHabit && addHabit.mutate()}
              />
            </div>
            <Button size="sm" onClick={() => newHabit && addHabit.mutate()} disabled={!newHabit}>
              Salvar
            </Button>
          </CardContent>
        </Card>
      )}

      {totalCount > 0 && (
        <div className="w-full bg-muted/30 rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {(!habitsData || habitsData.length === 0) && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhum hábito criado ainda.</p>
          </div>
        )}

        {habitsData?.map((h: any) => {
          const streak = getStreak(h.id)
          return (
            <Card
              key={h.id}
              className={`group cursor-pointer transition-all ${h.completedToday ? 'border-primary/30 bg-primary/5' : 'hover:border-border/80'}`}
              onClick={() => toggleHabit.mutate(h.id)}
            >
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all
                    ${h.completedToday ? 'bg-primary/20' : 'bg-muted/50'}`}>
                    {h.icon || '✅'}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${h.completedToday ? 'text-foreground' : 'text-foreground/70'}`}>
                      {h.name}
                    </p>
                    {streak > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Flame className="w-3 h-3 text-orange-400" />
                        <span className="text-xs text-orange-400">{streak} dias</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {h.completedToday && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteHabit.mutate(h.id) }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
