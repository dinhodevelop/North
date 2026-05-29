import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function dashboardRoutes(app: FastifyInstance) {
  const auth = { preHandler: [(app as any).authenticate] }

  app.get('/summary', auth, async (request) => {
    const user = request.user as { id: string }
    const userId = user.id

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 86400000)

    const [
      financeSummary,
      goals,
      projects,
      todayTasks,
      habits,
      debts,
    ] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['type'],
        where: { userId },
        _sum: { amount: true },
      }),
      prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.project.findMany({
        where: { userId, status: { not: 'DONE' } },
        orderBy: [{ priority: 'desc' }],
        take: 5,
      }),
      prisma.task.findMany({
        where: { userId, status: { in: ['TODAY', 'DOING'] } },
        orderBy: [{ priority: 'desc' }],
        take: 5,
      }),
      prisma.habit.findMany({
        where: { userId },
        orderBy: { order: 'asc' },
        include: {
          logs: { where: { date: { gte: todayStart, lt: todayEnd } } },
        },
      }),
      prisma.debt.findMany({ where: { userId } }),
    ])

    const income = financeSummary.find((r) => r.type === 'INCOME')?._sum.amount || 0
    const expenses = financeSummary.find((r) => r.type === 'EXPENSE')?._sum.amount || 0
    const totalDebt = debts.reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0)

    return {
      finance: { income, expenses, balance: income - expenses, totalDebt },
      goals: goals.map((g) => ({
        ...g,
        percentage: g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0,
      })),
      projects,
      todayTasks,
      habits: habits.map((h) => ({ ...h, completedToday: h.logs.length > 0 })),
    }
  })
}
