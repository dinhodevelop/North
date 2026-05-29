import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const bodySchema = z.object({
  title: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum(['TODAY', 'DOING', 'DONE']).default('TODAY'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  deadline: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
})

export async function taskRoutes(app: FastifyInstance) {
  const auth = { preHandler: [(app as any).authenticate] }

  app.get('/', auth, async (request) => {
    const user = request.user as { id: string }
    return prisma.task.findMany({
      where: { userId: user.id },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })
  })

  app.post('/', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const body = bodySchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    return prisma.task.create({ data: { ...body.data, userId: user.id } })
  })

  app.put('/:id', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const { id } = request.params as { id: string }
    const body = bodySchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const existing = await prisma.task.findFirst({ where: { id, userId: user.id } })
    if (!existing) return reply.code(404).send({ error: 'Not found' })

    return prisma.task.update({ where: { id }, data: body.data })
  })

  app.delete('/:id', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const { id } = request.params as { id: string }

    const existing = await prisma.task.findFirst({ where: { id, userId: user.id } })
    if (!existing) return reply.code(404).send({ error: 'Not found' })

    await prisma.task.delete({ where: { id } })
    return { success: true }
  })
}
