'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskDialog } from '@/components/tasks/task-dialog'
import { Plus, CheckSquare, Trash2, Pencil, GripVertical } from 'lucide-react'

const COLUMNS = [
  { status: 'TODAY', label: 'Hoje', color: 'text-amber-400' },
  { status: 'DOING', label: 'Fazendo', color: 'text-blue-400' },
  { status: 'DONE', label: 'Finalizado', color: 'text-emerald-400' },
]

const PRIORITY_DOT: Record<string, string> = {
  LOW: 'bg-muted-foreground',
  MEDIUM: 'bg-amber-400',
  HIGH: 'bg-red-400',
}

export default function TasksPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks').then((r) => r.data),
  })

  const updateTask = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/tasks/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const handleEdit = (t: any) => {
    setEditing(t)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditing(null)
  }

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.status] = tasks?.filter((t: any) => t.status === col.status) || []
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tarefas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Foco e clareza no que importa</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nova Tarefa
        </Button>
      </div>

      {(!tasks || tasks.length === 0) ? (
        <div className="text-center py-16">
          <CheckSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma tarefa criada ainda.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
            Criar primeira tarefa
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <Card key={col.status}>
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm font-semibold ${col.color}`}>{col.label}</CardTitle>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    {tasksByStatus[col.status].length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasksByStatus[col.status].length === 0 && (
                  <p className="text-xs text-muted-foreground py-2 text-center">Vazio</p>
                )}
                {tasksByStatus[col.status].map((t: any) => (
                  <div
                    key={t.id}
                    className="group flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[t.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${t.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>
                        {t.title}
                      </p>
                      {t.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.notes}</p>
                      )}
                      {t.deadline && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(t.deadline).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      <div className="flex gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {COLUMNS.filter(c => c.status !== col.status).map(c => (
                          <button
                            key={c.status}
                            onClick={() => updateTask.mutate({ ...t, status: c.status })}
                            className={`text-xs ${c.color} hover:underline`}
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => handleEdit(t)} className="text-muted-foreground hover:text-foreground p-0.5">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => deleteTask.mutate(t.id)} className="text-muted-foreground hover:text-destructive p-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TaskDialog
        open={open}
        task={editing}
        onClose={handleClose}
        onSuccess={() => {
          handleClose()
          qc.invalidateQueries({ queryKey: ['tasks'] })
          qc.invalidateQueries({ queryKey: ['dashboard'] })
        }}
      />
    </div>
  )
}
