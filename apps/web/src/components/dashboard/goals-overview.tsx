import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { Target } from 'lucide-react'

interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  percentage: number
}

export function GoalsOverview({ goals }: { goals: Goal[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <Target className="w-4 h-4" /> Metas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {goals.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">Nenhuma meta criada.</p>
        )}
        {goals.map((g) => (
          <div key={g.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium">{g.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}
              </span>
            </div>
            <Progress value={g.percentage} className="h-1.5" />
            <p className="text-xs text-primary mt-0.5 text-right">{g.percentage.toFixed(1)}%</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
