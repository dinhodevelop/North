'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { GoalDialog } from '@/components/goals/goal-dialog'
import { formatCurrency } from '@/lib/utils'
import { Plus, Target, Pencil, Trash2 } from 'lucide-react'

export default function GoalsPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.get('/goals').then((r) => r.data),
  })

  const deleteGoal = useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const handleEdit = (goal: any) => {
    setEditing(goal)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditing(null)
  }

  const totalTarget = goals?.reduce((s: number, g: any) => s + g.targetAmount, 0) || 0
  const totalCurrent = goals?.reduce((s: number, g: any) => s + g.currentAmount, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Metas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Acompanhe seu progresso</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nova Meta
        </Button>
      </div>

      {goals && goals.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progresso Total</span>
              <span className="text-sm font-medium">
                {formatCurrency(totalCurrent)} / {formatCurrency(totalTarget)}
              </span>
            </div>
            <Progress value={totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {totalTarget > 0 ? ((totalCurrent / totalTarget) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(!goals || goals.length === 0) && (
          <div className="col-span-full text-center py-16">
            <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma meta criada ainda.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
              Criar primeira meta
            </Button>
          </div>
        )}

        {goals?.map((g: any) => {
          const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0
          const remaining = g.targetAmount - g.currentAmount
          let estimateText = ''
          if (g.deadline) {
            const days = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000)
            estimateText = days > 0 ? `${days} dias restantes` : 'Prazo vencido'
          }

          return (
            <Card key={g.id} className="group relative">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-semibold">{g.name}</CardTitle>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(g)}
                      className="text-muted-foreground hover:text-foreground p-1 rounded"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteGoal.mutate(g.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {g.description && (
                  <p className="text-xs text-muted-foreground">{g.description}</p>
                )}
              </CardHeader>
              <CardContent className="pb-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400 font-semibold">{formatCurrency(g.currentAmount)}</span>
                  <span className="text-muted-foreground">{formatCurrency(g.targetAmount)}</span>
                </div>
                <Progress value={pct} className="h-2" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Faltam {formatCurrency(remaining > 0 ? remaining : 0)}
                  </span>
                  <span className="text-xs font-semibold text-primary">{pct.toFixed(1)}%</span>
                </div>
                {estimateText && (
                  <p className="text-xs text-muted-foreground">{estimateText}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <GoalDialog
        open={open}
        goal={editing}
        onClose={handleClose}
        onSuccess={() => {
          handleClose()
          qc.invalidateQueries({ queryKey: ['goals'] })
          qc.invalidateQueries({ queryKey: ['dashboard'] })
        }}
      />
    </div>
  )
}
