'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TransactionDialog } from '@/components/finances/transaction-dialog'
import { DebtDialog } from '@/components/finances/debt-dialog'
import { MonthlyChart } from '@/components/finances/monthly-chart'
import { formatCurrency } from '@/lib/utils'
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, Home, Trash2, Info } from 'lucide-react'

const DISTRIBUTION = [
  { label: 'Dívidas', pct: 0.5, color: 'text-red-400' },
  { label: 'Reserva', pct: 0.3, color: 'text-blue-400' },
  { label: 'Lote', pct: 0.2, color: 'text-amber-400' },
]

export default function FinancesPage() {
  const qc = useQueryClient()
  const [txOpen, setTxOpen] = useState(false)
  const [debtOpen, setDebtOpen] = useState(false)

  const { data: finance } = useQuery({
    queryKey: ['finances'],
    queryFn: async () => {
      const [summaryRes, transactionsRes, debtsRes, chartRes] = await Promise.all([
        api.get('/transactions/summary'),
        api.get('/transactions'),
        api.get('/debts'),
        api.get('/transactions/monthly-chart'),
      ])
      return {
        summary: summaryRes.data,
        transactions: transactionsRes.data,
        debts: debtsRes.data,
        chart: chartRes.data,
      }
    },
  })

  const summary = finance?.summary || {}
  const transactions = finance?.transactions || []
  const debts = finance?.debts || []
  const chart = finance?.chart || {}

  const deleteTransaction = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finances'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const deleteDebt = useMutation({
    mutationFn: (id: string) => api.delete(`/debts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finances'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Finanças</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Controle seu dinheiro</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setDebtOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Dívida
          </Button>
          <Button size="sm" onClick={() => setTxOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Transação
          </Button>
        </div>
      </div>

      {(summary?.totalIncome || 0) > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-2">Distribuição da renda — cada entrada deve seguir esta regra:</p>
              <div className="grid grid-cols-3 gap-2">
                {DISTRIBUTION.map(({ label, pct, color }) => (
                  <div key={label} className="text-center">
                    <p className={`text-sm font-semibold ${color}`}>{formatCurrency(summary.totalIncome * pct)}</p>
                    <p className="text-xs text-muted-foreground">{label} · {pct * 100}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Saldo Total"
          value={summary?.balance || 0}
          icon={<Wallet className="w-4 h-4" />}
          positive={summary?.balance >= 0}
        />
        <SummaryCard
          label="Entradas"
          value={summary?.totalIncome || 0}
          icon={<TrendingUp className="w-4 h-4" />}
          positive
        />
        <SummaryCard
          label="Saídas"
          value={summary?.totalExpenses || 0}
          icon={<TrendingDown className="w-4 h-4" />}
          positive={false}
        />
        <SummaryCard
          label="Reserva"
          value={summary?.accounts?.RESERVE || 0}
          icon={<PiggyBank className="w-4 h-4" />}
          positive={summary?.accounts?.RESERVE >= 0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SummaryCard
          label="Fundo Casa/Lote"
          value={summary?.accounts?.HOUSE_FUND || 0}
          icon={<Home className="w-4 h-4" />}
          positive={summary?.accounts?.HOUSE_FUND >= 0}
        />
      </div>

      <MonthlyChart data={chart || []} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Movimentações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {(!transactions || transactions.length === 0) && (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma movimentação ainda</p>
            )}
            {transactions?.slice(0, 20).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{t.category} · {new Date(t.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className={`text-sm font-semibold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                  <button
                    onClick={() => deleteTransaction.mutate(t.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dívidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(!debts || debts.length === 0) && (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma dívida registrada</p>
            )}
            {debts?.map((d: any) => {
              const remaining = d.totalAmount - d.paidAmount
              const pct = Math.min(100, (d.paidAmount / d.totalAmount) * 100)
              return (
                <div key={d.id} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Pago: {formatCurrency(d.paidAmount)} / {formatCurrency(d.totalAmount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge variant={remaining > 0 ? 'destructive' : 'secondary'} className="text-xs">
                        {remaining > 0 ? formatCurrency(remaining) : 'Quitado'}
                      </Badge>
                      <button
                        onClick={() => deleteDebt.mutate(d.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1">
                    <div
                      className="bg-primary h-1 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <TransactionDialog
        open={txOpen}
        onClose={() => setTxOpen(false)}
        onSuccess={() => {
          setTxOpen(false)
          qc.invalidateQueries({ queryKey: ['transactions'] })
          qc.invalidateQueries({ queryKey: ['finance-summary'] })
          qc.invalidateQueries({ queryKey: ['monthly-chart'] })
          qc.invalidateQueries({ queryKey: ['dashboard'] })
        }}
      />

      <DebtDialog
        open={debtOpen}
        onClose={() => setDebtOpen(false)}
        onSuccess={() => {
          setDebtOpen(false)
          qc.invalidateQueries({ queryKey: ['debts'] })
        }}
      />
    </div>
  )
}

function SummaryCard({ label, value, icon, positive }: {
  label: string
  value: number
  icon: React.ReactNode
  positive: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={`${positive ? 'text-emerald-400' : 'text-red-400'}`}>{icon}</span>
        </div>
        <p className={`text-xl font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatCurrency(value)}
        </p>
      </CardContent>
    </Card>
  )
}
