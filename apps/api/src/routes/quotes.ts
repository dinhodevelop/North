import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function quoteRoutes(app: FastifyInstance) {
  app.get('/today', async () => {
    const total = await prisma.quote.count()
    if (total === 0) return null

    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000)
    const index = dayOfYear % total

    const quotes = await prisma.quote.findMany({ skip: index, take: 1 })
    return quotes[0] ?? null
  })
}
