import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const bodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['IDEA', 'WAITING', 'IN_PROGRESS', 'DONE', 'PAID']).default('IDEA'),
  expectedValue: z.number().optional(),
  receivedValue: z.number().min(0).default(0),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  deadline: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  nextAction: z.string().optional(),
})

export async function projectRoutes(app: FastifyInstance) {
  const auth = { preHandler: [(app as any).authenticate] }

  app.get('/', auth, async (request) => {
    const user = request.user as { id: string }
    const { status } = request.query as { status?: string }

    return prisma.project.findMany({
      where: { userId: user.id, ...(status ? { status: status as any } : {}) },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    })
  })

  app.post('/', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const body = bodySchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    return prisma.project.create({ data: { ...body.data, userId: user.id } })
  })

  app.put('/:id', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const { id } = request.params as { id: string }
    const body = bodySchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const existing = await prisma.project.findFirst({ where: { id, userId: user.id } })
    if (!existing) return reply.code(404).send({ error: 'Not found' })

    return prisma.project.update({ where: { id }, data: body.data })
  })

  app.delete('/:id', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const { id } = request.params as { id: string }

    const existing = await prisma.project.findFirst({ where: { id, userId: user.id } })
    if (!existing) return reply.code(404).send({ error: 'Not found' })

    await prisma.project.delete({ where: { id } })
    return { success: true }
  })
}
