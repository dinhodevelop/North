import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const bodySchema = z.object({
  description: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  account: z.enum(['CHECKING', 'RESERVE', 'HOUSE_FUND']).default('CHECKING'),
  date: z.string().transform((v) => new Date(v)),
})

export async function transactionRoutes(app: FastifyInstance) {
  const auth = { preHandler: [(app as any).authenticate] }

  app.get('/', auth, async (request) => {
    const user = request.user as { id: string }
    const { month, year, account } = request.query as {
      month?: string
      year?: string
      account?: string
    }

    const where: any = { userId: user.id }
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1)
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59)
      where.date = { gte: start, lte: end }
    }
    if (account) where.account = account

    return prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    })
  })

  app.get('/summary', auth, async (request) => {
    const user = request.user as { id: string }

    const [income, expenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: user.id, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: user.id, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ])

    const byAccount = await prisma.transaction.groupBy({
      by: ['account', 'type'],
      where: { userId: user.id },
      _sum: { amount: true },
    })

    const accounts: Record<string, number> = {
      CHECKING: 0,
      RESERVE: 0,
      HOUSE_FUND: 0,
    }

    for (const row of byAccount) {
      const sign = row.type === 'INCOME' ? 1 : -1
      accounts[row.account] = (accounts[row.account] || 0) + sign * (row._sum.amount || 0)
    }

    return {
      totalIncome: income._sum.amount || 0,
      totalExpenses: expenses._sum.amount || 0,
      balance: (income._sum.amount || 0) - (expenses._sum.amount || 0),
      accounts,
    }
  })

  app.get('/monthly-chart', auth, async (request) => {
    const user = request.user as { id: string }
    const { months = '6' } = request.query as { months?: string }

    const results = []
    const now = new Date()

    for (let i = Number(months) - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId: user.id, type: 'INCOME', date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId: user.id, type: 'EXPENSE', date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ])

      results.push({
        month: start.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
        income: inc._sum.amount || 0,
        expenses: exp._sum.amount || 0,
      })
    }

    return results
  })

  app.post('/', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const body = bodySchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    return prisma.transaction.create({
      data: { ...body.data, userId: user.id },
    })
  })

  app.put('/:id', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const { id } = request.params as { id: string }
    const body = bodySchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const existing = await prisma.transaction.findFirst({ where: { id, userId: user.id } })
    if (!existing) return reply.code(404).send({ error: 'Not found' })

    return prisma.transaction.update({ where: { id }, data: body.data })
  })

  app.delete('/:id', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const { id } = request.params as { id: string }

    const existing = await prisma.transaction.findFirst({ where: { id, userId: user.id } })
    if (!existing) return reply.code(404).send({ error: 'Not found' })

    await prisma.transaction.delete({ where: { id } })
    return { success: true }
  })
}
