import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function habitRoutes(app: FastifyInstance) {
  const auth = { preHandler: [(app as any).authenticate] }

  app.get('/', auth, async (request) => {
    const user = request.user as { id: string }
    const { date } = request.query as { date?: string }
    const targetDate = date ? new Date(date) : new Date()
    const day = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    const nextDay = new Date(day.getTime() + 86400000)

    const habits = await prisma.habit.findMany({
      where: { userId: user.id },
      orderBy: { order: 'asc' },
      include: {
        logs: {
          where: { date: { gte: day, lt: nextDay } },
        },
      },
    })

    return habits.map((h) => ({ ...h, completedToday: h.logs.length > 0 }))
  })

  app.get('/streaks', auth, async (request) => {
    const user = request.user as { id: string }
    const habits = await prisma.habit.findMany({
      where: { userId: user.id },
      include: { logs: { orderBy: { date: 'desc' }, take: 90 } },
    })

    return habits.map((h) => {
      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i < 90; i++) {
        const d = new Date(today.getTime() - i * 86400000)
        const found = h.logs.some((l) => {
          const ld = new Date(l.date)
          ld.setHours(0, 0, 0, 0)
          return ld.getTime() === d.getTime()
        })
        if (found) streak++
        else if (i > 0) break
      }

      return { habitId: h.id, name: h.name, icon: h.icon, streak }
    })
  })

  app.post('/toggle', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const body = z
      .object({ habitId: z.string(), date: z.string().optional() })
      .safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'Invalid' })

    const habit = await prisma.habit.findFirst({
      where: { id: body.data.habitId, userId: user.id },
    })
    if (!habit) return reply.code(404).send({ error: 'Not found' })

    const d = body.data.date ? new Date(body.data.date) : new Date()
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const nextDay = new Date(day.getTime() + 86400000)

    const existing = await prisma.habitLog.findFirst({
      where: { habitId: body.data.habitId, userId: user.id, date: { gte: day, lt: nextDay } },
    })

    if (existing) {
      await prisma.habitLog.delete({ where: { id: existing.id } })
      return { completed: false }
    } else {
      await prisma.habitLog.create({
        data: { habitId: body.data.habitId, userId: user.id, date: day },
      })
      return { completed: true }
    }
  })

  app.post('/', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const body = z
      .object({ name: z.string().min(1), icon: z.string().optional() })
      .safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'Invalid' })

    const count = await prisma.habit.count({ where: { userId: user.id } })
    return prisma.habit.create({
      data: { ...body.data, userId: user.id, order: count },
    })
  })

  app.delete('/:id', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const { id } = request.params as { id: string }

    const existing = await prisma.habit.findFirst({ where: { id, userId: user.id } })
    if (!existing) return reply.code(404).send({ error: 'Not found' })

    await prisma.habit.delete({ where: { id } })
    return { success: true }
  })
}
