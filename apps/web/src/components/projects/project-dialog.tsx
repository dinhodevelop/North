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
  project?: any
  onClose: () => void
  onSuccess: () => void
}

export function ProjectDialog({ open, project, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    name: '', description: '', status: 'IDEA', priority: 'MEDIUM',
    expectedValue: '', receivedValue: '0', deadline: '', nextAction: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        description: project.description || '',
        status: project.status,
        priority: project.priority,
        expectedValue: project.expectedValue ? String(project.expectedValue) : '',
        receivedValue: String(project.receivedValue),
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
        nextAction: project.nextAction || '',
      })
    } else {
      setForm({ name: '', description: '', status: 'IDEA', priority: 'MEDIUM', expectedValue: '', receivedValue: '0', deadline: '', nextAction: '' })
    }
  }, [project, open])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = {
        ...form,
        expectedValue: form.expectedValue ? parseFloat(form.expectedValue) : undefined,
        receivedValue: parseFloat(form.receivedValue || '0'),
        deadline: form.deadline || undefined,
        description: form.description || undefined,
        nextAction: form.nextAction || undefined,
      }
      if (project) {
        await api.put(`/projects/${project.id}`, data)
      } else {
        await api.post('/projects', data)
      }
      onSuccess()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nome do projeto..." required />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Detalhe o projeto..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDEA">Ideia</SelectItem>
                  <SelectItem value="WAITING">Aguardando</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                  <SelectItem value="DONE">Finalizado</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor Esperado (R$)</Label>
              <Input type="number" step="0.01" value={form.expectedValue} onChange={(e) => set('expectedValue', e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label>Recebido (R$)</Label>
              <Input type="number" step="0.01" value={form.receivedValue} onChange={(e) => set('receivedValue', e.target.value)} placeholder="0,00" min="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prazo</Label>
              <Input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Próxima Ação</Label>
              <Input value={form.nextAction} onChange={(e) => set('nextAction', e.target.value)} placeholder="Ex: Enviar proposta..." />
            </div>
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
