'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  open: boolean
  task?: any
  onClose: () => void
  onSuccess: () => void
}

export function TaskDialog({ open, task, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ title: '', notes: '', status: 'TODAY', priority: 'MEDIUM', deadline: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        notes: task.notes || '',
        status: task.status,
        priority: task.priority,
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
      })
    } else {
      setForm({ title: '', notes: '', status: 'TODAY', priority: 'MEDIUM', deadline: '' })
    }
  }, [task, open])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = { ...form, deadline: form.deadline || undefined, notes: form.notes || undefined }
      if (task) {
        await api.put(`/tasks/${task.id}`, data)
      } else {
        await api.post('/tasks', data)
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
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="O que precisa ser feito?" required />
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Detalhes opcionais..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAY">Hoje</SelectItem>
                  <SelectItem value="DOING">Fazendo</SelectItem>
                  <SelectItem value="DONE">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                </SelectContent>
              </Select>
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
