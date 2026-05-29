'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  goal?: any
  onClose: () => void
  onSuccess: () => void
}

export function GoalDialog({ open, goal, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ name: '', description: '', targetAmount: '', currentAmount: '0', deadline: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (goal) {
      setForm({
        name: goal.name,
        description: goal.description || '',
        targetAmount: String(goal.targetAmount),
        currentAmount: String(goal.currentAmount),
        deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
      })
    } else {
      setForm({ name: '', description: '', targetAmount: '', currentAmount: '0', deadline: '' })
    }
  }, [goal, open])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = {
        name: form.name,
        description: form.description || undefined,
        targetAmount: parseFloat(form.targetAmount),
        currentAmount: parseFloat(form.currentAmount || '0'),
        deadline: form.deadline || undefined,
      }
      if (goal) {
        await api.put(`/goals/${goal.id}`, data)
      } else {
        await api.post('/goals', data)
      }
      onSuccess()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Comprar lote..." required />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Detalhes da meta..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor Alvo (R$)</Label>
              <Input type="number" step="0.01" value={form.targetAmount} onChange={(e) => set('targetAmount', e.target.value)} placeholder="80000" required min="0.01" />
            </div>
            <div className="space-y-1.5">
              <Label>Valor Atual (R$)</Label>
              <Input type="number" step="0.01" value={form.currentAmount} onChange={(e) => set('currentAmount', e.target.value)} placeholder="0" min="0" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Prazo (opcional)</Label>
            <Input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
