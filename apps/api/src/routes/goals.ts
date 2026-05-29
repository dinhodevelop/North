import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const bodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).default(0),
  deadline: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
})

export async function goalRoutes(app: FastifyInstance) {
  const auth = { preHandler: [(app as any).authenticate] }

  app.get('/', auth, async (request) => {
    const user = request.user as { id: string }
    return prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    })
  })

  app.post('/', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const body = bodySchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    return prisma.goal.create({ data: { ...body.data, userId: user.id } })
  })

  app.put('/:id', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const { id } = request.params as { id: string }
    const body = bodySchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const existing = await prisma.goal.findFirst({ where: { id, userId: user.id } })
    if (!existing) return reply.code(404).send({ error: 'Not found' })

    return prisma.goal.update({ where: { id }, data: body.data })
  })

  app.delete('/:id', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const { id } = request.params as { id: string }

    const existing = await prisma.goal.findFirst({ where: { id, userId: user.id } })
    if (!existing) return reply.code(404).send({ error: 'Not found' })

    await prisma.goal.delete({ where: { id } })
    return { success: true }
  })
}
