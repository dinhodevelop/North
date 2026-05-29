import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface Project {
  id: string
  name: string
  status: string
  priority: string
  expectedValue: number | null
  nextAction: string | null
}

const STATUS_BADGE: Record<string, string> = {
  IDEA: 'text-muted-foreground border-muted',
  WAITING: 'text-amber-400 border-amber-400/30',
  IN_PROGRESS: 'text-blue-400 border-blue-400/30',
  DONE: 'text-emerald-400 border-emerald-400/30',
  PAID: 'text-violet-400 border-violet-400/30',
}

const STATUS_LABELS: Record<string, string> = {
  IDEA: 'Ideia', WAITING: 'Aguardando', IN_PROGRESS: 'Andamento', DONE: 'Feito', PAID: 'Pago',
}

export function ProjectsWidget({ projects }: { projects: Project[] }) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" /> Projetos Ativos
          </CardTitle>
          <Link href="/dashboard/projects" className="text-xs text-primary hover:underline">
            Ver todos
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">Nenhum projeto ativo.</p>
        )}
        <div className="space-y-2">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-sm font-medium truncate">{p.name}</p>
                {p.nextAction && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">→ {p.nextAction}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {p.expectedValue && (
                  <span className="text-xs text-emerald-400">{formatCurrency(p.expectedValue)}</span>
                )}
                <span className={`text-xs border rounded px-1.5 py-0.5 ${STATUS_BADGE[p.status] || ''}`}>
                  {STATUS_LABELS[p.status] || p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
