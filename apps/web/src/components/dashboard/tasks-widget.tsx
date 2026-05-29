import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare } from 'lucide-react'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  status: string
  priority: string
}

const PRIORITY_DOT: Record<string, string> = {
  LOW: 'bg-muted-foreground',
  MEDIUM: 'bg-amber-400',
  HIGH: 'bg-red-400',
}

export function TasksWidget({ tasks }: { tasks: Task[] }) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4" /> Tarefas do Dia
          </CardTitle>
          <Link href="/dashboard/tasks" className="text-xs text-primary hover:underline">
            Ver todas
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pb-4">
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">Sem tarefas prioritárias.</p>
        )}
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 py-1.5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[t.priority] || 'bg-muted-foreground'}`} />
            <p className={`text-sm flex-1 ${t.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>
              {t.title}
            </p>
            <span className={`text-xs ${t.status === 'DOING' ? 'text-blue-400' : 'text-muted-foreground'}`}>
              {t.status === 'DOING' ? 'Fazendo' : 'Hoje'}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
