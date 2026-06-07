'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Pencil, Trash2, Target } from 'lucide-react'

interface Goal {
  id: string
  description: string
  metric?: string | null
  target?: number | null
  deadline?: string | null
  status: string
}
interface Area {
  id: string
  title: string
  summary?: string | null
  goals: Goal[]
}

export default function CoachAdminPage() {
  const qc = useQueryClient()
  const [areaDialog, setAreaDialog] = useState<{ open: boolean; area: Area | null }>({ open: false, area: null })
  const [goalDialog, setGoalDialog] = useState<{ open: boolean; areaId: string; goal: Goal | null }>({
    open: false,
    areaId: '',
    goal: null,
  })

  const { data: areas } = useQuery<Area[]>({
    queryKey: ['coach-areas'],
    queryFn: () => api.get('/coach/areas').then((r) => r.data),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['coach-areas'] })

  const deleteArea = async (id: string) => {
    if (!confirm('Apagar esta área e todas as metas dela?')) return
    await api.delete(`/coach/areas/${id}`)
    refresh()
  }
  const deleteGoal = async (id: string) => {
    await api.delete(`/coach/goals/${id}`)
    refresh()
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coach" className="text-muted-foreground hover:text-foreground p-1 rounded">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Contrato & Metas</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              O que o coach usa pra te apoiar. Fica só no seu banco — nunca vai pro GitHub.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setAreaDialog({ open: true, area: null })}>
          <Plus className="w-4 h-4 mr-1" /> Área
        </Button>
      </div>

      {(!areas || areas.length === 0) && (
        <div className="text-center py-16">
          <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma área cadastrada.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Crie áreas (ex.: Estudos, Saúde, Finanças) e adicione as metas de cada uma.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {areas?.map((area) => (
          <Card key={area.id} className="group">
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">{area.title}</CardTitle>
                  {area.summary && <p className="text-xs text-muted-foreground mt-0.5">{area.summary}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setAreaDialog({ open: true, area })} className="text-muted-foreground hover:text-foreground p-1 rounded">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteArea(area.id)} className="text-muted-foreground hover:text-destructive p-1 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-1.5">
              {area.goals.map((g) => (
                <div key={g.id} className="flex items-center justify-between text-sm group/goal rounded-md px-2 py-1 hover:bg-muted/40">
                  <div className="flex-1">
                    <span>{g.description}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {g.target != null && `${g.target}${g.metric ? ` ${g.metric}` : ''}`}
                      {g.deadline && ` · até ${new Date(g.deadline).toLocaleDateString('pt-BR')}`}
                      {g.status !== 'active' && ` · ${g.status}`}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover/goal:opacity-100 transition-opacity">
                    <button onClick={() => setGoalDialog({ open: true, areaId: area.id, goal: g })} className="text-muted-foreground hover:text-foreground p-1">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => deleteGoal(g.id)} className="text-muted-foreground hover:text-destructive p-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-muted-foreground"
                onClick={() => setGoalDialog({ open: true, areaId: area.id, goal: null })}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Meta
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {areaDialog.open && (
        <AreaDialog
          area={areaDialog.area}
          onClose={() => setAreaDialog({ open: false, area: null })}
          onSuccess={() => {
            setAreaDialog({ open: false, area: null })
            refresh()
          }}
        />
      )}
      {goalDialog.open && (
        <GoalDialog
          areaId={goalDialog.areaId}
          goal={goalDialog.goal}
          onClose={() => setGoalDialog({ open: false, areaId: '', goal: null })}
          onSuccess={() => {
            setGoalDialog({ open: false, areaId: '', goal: null })
            refresh()
          }}
        />
      )}
    </div>
  )
}

function AreaDialog({ area, onClose, onSuccess }: { area: Area | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ title: area?.title || '', summary: area?.summary || '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { title: form.title, summary: form.summary || undefined }
      if (area) await api.put(`/coach/areas/${area.id}`, payload)
      else await api.post('/coach/areas', payload)
      onSuccess()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{area ? 'Editar área' : 'Nova área'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Estudos, Saúde física, Finanças..." required />
          </div>
          <div className="space-y-1.5">
            <Label>Resumo (opcional)</Label>
            <Input value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} placeholder="Uma frase sobre o compromisso dessa área" />
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

function GoalDialog({ areaId, goal, onClose, onSuccess }: { areaId: string; goal: Goal | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    description: goal?.description || '',
    metric: goal?.metric || '',
    target: goal?.target != null ? String(goal.target) : '',
    deadline: goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
    status: goal?.status || 'active',
  })
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: any = {
        description: form.description,
        metric: form.metric || undefined,
        target: form.target ? parseFloat(form.target) : undefined,
        deadline: form.deadline || undefined,
        status: form.status,
      }
      if (goal) await api.put(`/coach/goals/${goal.id}`, payload)
      else await api.post('/coach/goals', { ...payload, areaId })
      onSuccess()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? 'Editar meta' : 'Nova meta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Ex: Estudar no mínimo 15h por semana" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Alvo (opcional)</Label>
              <Input type="number" step="any" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} placeholder="15" />
            </div>
            <div className="space-y-1.5">
              <Label>Unidade (opcional)</Label>
              <Input value={form.metric} onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value }))} placeholder="h/semana, treinos, R$..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prazo (opcional)</Label>
              <Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="at_risk">Em risco</SelectItem>
                  <SelectItem value="done">Concluída</SelectItem>
                </SelectContent>
              </Select>
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
