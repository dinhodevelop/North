'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProjectDialog } from '@/components/projects/project-dialog'
import { formatCurrency } from '@/lib/utils'
import { Plus, Briefcase, Pencil, Trash2, ChevronRight } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  IDEA: 'Ideia',
  WAITING: 'Aguardando',
  IN_PROGRESS: 'Em andamento',
  DONE: 'Finalizado',
  PAID: 'Pago',
}

const STATUS_COLORS: Record<string, string> = {
  IDEA: 'text-muted-foreground border-muted',
  WAITING: 'text-amber-400 border-amber-400/30',
  IN_PROGRESS: 'text-blue-400 border-blue-400/30',
  DONE: 'text-emerald-400 border-emerald-400/30',
  PAID: 'text-violet-400 border-violet-400/30',
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-muted/50 text-muted-foreground',
  MEDIUM: 'bg-amber-500/10 text-amber-400',
  HIGH: 'bg-red-500/10 text-red-400',
}

const COLUMNS: Array<{ status: string; label: string }> = [
  { status: 'IDEA', label: 'Ideias' },
  { status: 'WAITING', label: 'Aguardando' },
  { status: 'IN_PROGRESS', label: 'Em andamento' },
  { status: 'DONE', label: 'Finalizado' },
  { status: 'PAID', label: 'Pago' },
]

export default function ProjectsPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then((r) => r.data),
  })

  const deleteProject = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/projects/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  const handleEdit = (p: any) => {
    setEditing(p)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditing(null)
  }

  const projectsByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.status] = projects?.filter((p: any) => p.status === col.status) || []
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projetos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Pipeline de freelas e oportunidades</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Novo Projeto
        </Button>
      </div>

      {(!projects || projects.length === 0) ? (
        <div className="text-center py-16">
          <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum projeto criado ainda.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
            Criar primeiro projeto
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {COLUMNS.map((col) => (
              <div key={col.status} className="w-72 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">{col.label}</span>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    {projectsByStatus[col.status].length}
                  </span>
                </div>
                <div className="space-y-2">
                  {projectsByStatus[col.status].map((p: any) => (
                    <Card key={p.id} className="group cursor-pointer hover:border-border/80 transition-colors">
                      <CardContent className="pt-3 pb-3 px-3">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium flex-1 pr-2">{p.name}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => handleEdit(p)} className="text-muted-foreground hover:text-foreground p-0.5">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button onClick={() => deleteProject.mutate(p.id)} className="text-muted-foreground hover:text-destructive p-0.5">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {p.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{p.description}</p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[p.priority]}`}>
                            {PRIORITY_LABELS[p.priority]}
                          </span>
                          {p.expectedValue && (
                            <span className="text-xs text-emerald-400">
                              {formatCurrency(p.expectedValue)}
                            </span>
                          )}
                        </div>

                        {p.nextAction && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <ChevronRight className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{p.nextAction}</span>
                          </div>
                        )}

                        {col.status !== 'PAID' && (
                          <div className="mt-2 flex gap-1">
                            {COLUMNS.filter(c => c.status !== col.status).map(c => (
                              <button
                                key={c.status}
                                onClick={() => updateStatus.mutate({ ...p, status: c.status })}
                                className="text-xs text-muted-foreground hover:text-foreground px-1 py-0.5 rounded hover:bg-muted/50 transition-colors"
                                title={`Mover para ${c.label}`}
                              >
                                →{c.label.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ProjectDialog
        open={open}
        project={editing}
        onClose={handleClose}
        onSuccess={() => {
          handleClose()
          qc.invalidateQueries({ queryKey: ['projects'] })
          qc.invalidateQueries({ queryKey: ['dashboard'] })
        }}
      />
    </div>
  )
}
