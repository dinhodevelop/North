import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'

import { authRoutes } from './routes/auth'
import { transactionRoutes } from './routes/transactions'
import { debtRoutes } from './routes/debts'
import { goalRoutes } from './routes/goals'
import { projectRoutes } from './routes/projects'
import { taskRoutes } from './routes/tasks'
import { habitRoutes } from './routes/habits'
import { dashboardRoutes } from './routes/dashboard'

const app = Fastify({ logger: process.env.NODE_ENV === 'development' })

app.register(cors, {
  origin: [
    'http://localhost:3000',
    process.env.WEB_URL || 'http://localhost:3000',
  ],
  credentials: true,
})

app.register(cookie)

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'dev_secret_change_in_prod',
  cookie: { cookieName: 'token', signed: false },
})

app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ error: 'Unauthorized' })
  }
})

app.register(authRoutes, { prefix: '/auth' })
app.register(transactionRoutes, { prefix: '/transactions' })
app.register(debtRoutes, { prefix: '/debts' })
app.register(goalRoutes, { prefix: '/goals' })
app.register(projectRoutes, { prefix: '/projects' })
app.register(taskRoutes, { prefix: '/tasks' })
app.register(habitRoutes, { prefix: '/habits' })
app.register(dashboardRoutes, { prefix: '/dashboard' })

app.get('/health', async () => ({ status: 'ok' }))

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`API running on http://0.0.0.0:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
