import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body)
    if (!body.success) {
      return reply.code(400).send({ error: 'Invalid input' })
    }

    const user = await prisma.user.findUnique({
      where: { email: body.data.email },
    })

    if (!user || !(await bcrypt.compare(body.data.password, user.password))) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const token = app.jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      { expiresIn: '7d' }
    )

    reply.setCookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return { user: { id: user.id, email: user.email, name: user.name }, token }
  })

  app.post('/logout', async (request, reply) => {
    reply.clearCookie('token', { path: '/' })
    return { success: true }
  })

  app.get(
    '/me',
    { preHandler: [(app as any).authenticate] },
    async (request) => {
      const user = request.user as { id: string; email: string; name: string }
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, name: true, createdAt: true },
      })
      return dbUser
    }
  )
}
