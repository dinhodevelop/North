import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

interface Props {
  data?: {
    income: number
    expenses: number
    balance: number
    totalDebt: number
  }
}

export function FinanceSummaryCard({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <Wallet className="w-4 h-4" /> Finanças
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <div>
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className={`text-2xl font-semibold ${(data?.balance || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(data?.balance || 0)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/10">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Entradas</span>
            </div>
            <p className="text-sm font-semibold text-emerald-400">{formatCurrency(data?.income || 0)}</p>
          </div>
          <div className="bg-red-500/5 rounded-lg p-2 border border-red-500/10">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingDown className="w-3 h-3 text-red-400" />
              <span className="text-xs text-muted-foreground">Saídas</span>
            </div>
            <p className="text-sm font-semibold text-red-400">{formatCurrency(data?.expenses || 0)}</p>
          </div>
        </div>
        {(data?.totalDebt || 0) > 0 && (
          <div className="pt-1 border-t border-border">
            <p className="text-xs text-muted-foreground">Dívidas em aberto</p>
            <p className="text-sm font-semibold text-amber-400">{formatCurrency(data?.totalDebt || 0)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
