'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { FinanceSummaryCard } from '@/components/dashboard/finance-summary'
import { GoalsOverview } from '@/components/dashboard/goals-overview'
import { TasksWidget } from '@/components/dashboard/tasks-widget'
import { HabitsWidget } from '@/components/dashboard/habits-widget'
import { ProjectsWidget } from '@/components/dashboard/projects-widget'
import { Clock } from '@/components/dashboard/clock'
import { QuoteCard } from '@/components/dashboard/quote-card'
import { useAuthStore } from '@/store/auth'

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/summary').then((r) => r.data),
    refetchInterval: 60000,
  })

  const { data: quote } = useQuery({
    queryKey: ['quote-today'],
    queryFn: () => api.get('/quotes/today').then((r) => r.data),
    staleTime: 1000 * 60 * 60,
  })

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Aqui está o resumo do seu dia
          </p>
          <div className="mt-3">
            <QuoteCard quote={quote} />
          </div>
        </div>
        <Clock />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FinanceSummaryCard data={data?.finance} />
        <div className="md:col-span-2">
          <GoalsOverview goals={data?.goals || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TasksWidget tasks={data?.todayTasks || []} />
        <HabitsWidget habits={data?.habits || []} />
      </div>

      <ProjectsWidget projects={data?.projects || []} />
    </div>
  )
}
