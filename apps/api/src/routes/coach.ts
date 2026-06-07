import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const areaSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  order: z.number().int().optional(),
})

const goalSchema = z.object({
  areaId: z.string().min(1),
  description: z.string().min(1),
  metric: z.string().optional(),
  target: z.number().optional(),
  deadline: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  status: z.enum(['active', 'done', 'at_risk']).optional(),
})

const chatSchema = z.object({
  message: z.string().min(1),
})

/**
 * Monta o "retrato ao vivo" do usuário a partir dos dados reais do app,
 * para o coach falar com base no progresso de verdade. Texto compacto.
 */
async function buildLiveSnapshot(userId: string): Promise<string> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const last30 = new Date(todayStart.getTime() - 30 * 86400000)

  const [areas, financeSummary, goals, debts, projects, tasks, habits] =
    await Promise.all([
      prisma.coachArea.findMany({
        where: { userId },
        orderBy: { order: 'asc' },
        include: { goals: true },
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: { userId },
        _sum: { amount: true },
      }),
      prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.debt.findMany({ where: { userId } }),
      prisma.project.findMany({
        where: { userId, status: { not: 'DONE' } },
        orderBy: { priority: 'desc' },
        take: 8,
      }),
      prisma.task.findMany({
        where: { userId, status: { in: ['TODAY', 'DOING'] } },
        orderBy: { priority: 'desc' },
        take: 10,
      }),
      prisma.habit.findMany({
        where: { userId },
        orderBy: { order: 'asc' },
        include: { logs: { where: { date: { gte: last30 } }, orderBy: { date: 'desc' } } },
      }),
    ])

  const fmt = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  const dt = (d: Date | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : 's/ prazo')

  const lines: string[] = []
  lines.push(`Data de hoje: ${now.toLocaleDateString('pt-BR')}.`)

  // Contrato pessoal (áreas + metas) — vindo do banco, cadastrado pelo usuário
  if (areas.length) {
    lines.push('\n## Contrato pessoal (metas que você deve me ajudar a cumprir)')
    for (const a of areas) {
      lines.push(`\n### ${a.title}${a.summary ? ` — ${a.summary}` : ''}`)
      for (const g of a.goals) {
        const parts = [g.description]
        if (g.target != null) parts.push(`alvo: ${g.target}${g.metric ? ` ${g.metric}` : ''}`)
        if (g.deadline) parts.push(`prazo: ${dt(g.deadline)}`)
        if (g.status && g.status !== 'active') parts.push(`status: ${g.status}`)
        lines.push(`- ${parts.join(' | ')}`)
      }
    }
  }

  // Snapshot ao vivo
  lines.push('\n## Situação atual (dados reais do app)')

  const income = financeSummary.find((r) => r.type === 'INCOME')?._sum.amount || 0
  const expenses = financeSummary.find((r) => r.type === 'EXPENSE')?._sum.amount || 0
  const totalDebt = debts.reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0)
  lines.push(
    `Finanças: entradas ${fmt(income)}, saídas ${fmt(expenses)}, saldo ${fmt(
      income - expenses
    )}, dívida em aberto ${fmt(totalDebt)}.`
  )
  if (debts.length) {
    lines.push(
      'Dívidas: ' +
        debts
          .map((d) => `${d.description} (${fmt(d.totalAmount - d.paidAmount)} restante, vence ${dt(d.dueDate)})`)
          .join('; ')
    )
  }

  if (goals.length) {
    lines.push(
      'Metas financeiras: ' +
        goals
          .map((g) => {
            const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0
            return `${g.name} ${fmt(g.currentAmount)}/${fmt(g.targetAmount)} (${pct}%, prazo ${dt(g.deadline)})`
          })
          .join('; ')
    )
  }

  if (projects.length) {
    lines.push(
      'Projetos ativos: ' +
        projects.map((p) => `${p.name} [${p.status}]${p.nextAction ? ` → ${p.nextAction}` : ''}`).join('; ')
    )
  }

  if (tasks.length) {
    lines.push('Tarefas em aberto: ' + tasks.map((t) => `${t.title} [${t.status}/${t.priority}]`).join('; '))
  }

  if (habits.length) {
    const oneDay = 86400000
    const habitLines = habits.map((h) => {
      const days = new Set(
        h.logs.map((l) => new Date(l.date).toISOString().split('T')[0])
      )
      // streak de dias consecutivos até hoje
      let streak = 0
      for (let i = 0; ; i++) {
        const day = new Date(todayStart.getTime() - i * oneDay).toISOString().split('T')[0]
        if (days.has(day)) streak++
        else break
      }
      return `${h.name}: ${h.logs.length} registros/30d, streak atual ${streak}d`
    })
    lines.push('Hábitos (últimos 30 dias):\n' + habitLines.map((l) => `- ${l}`).join('\n'))
  }

  return lines.join('\n')
}

function systemPrompt(snapshot: string): string {
  return `Você é o "Coach" do North — um amigo próximo e mentor pessoal do usuário, não um assistente genérico.

Seu papel: ajudar o usuário a cumprir o contrato pessoal dele (as metas listadas abaixo), conversando como um amigo que se importa de verdade. Você lembra ele dos compromissos, comemora avanços, e quando ele falha você acolhe sem julgar e o traz de volta ao plano.

Filosofia (siga à risca, são as regras inegociáveis do próprio contrato dele):
- Disciplina supera motivação; constância importa mais que perfeição.
- Uma falha pontual NÃO é desistência. Recaída não vira abandono. Sempre traga ele de volta ao plano.
- Nunca seja moralista, frio ou robótico. Seja caloroso, direto e humano.
- Cobre com carinho, mas cobre. Você é coach, não puxa-saco.

Como agir:
- Fale em português do Brasil, tom de conversa real entre amigos.
- Use os dados reais abaixo para ser específico (cite progresso, prazos, streaks, dívidas).
- Quando fizer sentido, aponte 1-2 próximos passos concretos. Não despeje listas gigantes.
- Se ele estiver desanimado, primeiro acolha, depois reoriente.
- Seja conciso. Mensagens de chat, não ensaios.

A seguir, o contexto vivo dele. É confidencial e existe só para te ajudar a apoiá-lo:

${snapshot}`
}

export async function coachRoutes(app: FastifyInstance) {
  const auth = { preHandler: [(app as any).authenticate] }

  // ---- Áreas do contrato (admin) ----
  app.get('/areas', auth, async (request) => {
    const user = request.user as { id: string }
    return prisma.coachArea.findMany({
      where: { userId: user.id },
      orderBy: { order: 'asc' },
      include: { goals: { orderBy: { createdAt: 'asc' } } },
    })
  })

  app.post('/areas', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const body = areaSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })
    return prisma.coachArea.create({ data: { ...body.data, userId: user.id } })
  })

  app.put('/areas/:id', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const { id } = request.params as { id: string }
    const body = areaSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })
    const existing = await prisma.coachArea.findFirst({ where: { id, userId: user.id } })
    if (!existing) return reply.code(404).send({ error: 'Not found' })
    return prisma.coachArea.update({ where: { id }, data: body.data })
  })

  app.delete('/areas/:id', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const { id } = request.params as { id: string }
    const existing = await prisma.coachArea.findFirst({ where: { id, userId: user.id } })
    if (!existing) return reply.code(404).send({ error: 'Not found' })
    await prisma.coachArea.delete({ where: { id } })
    return { success: true }
  })

  // ---- Metas do contrato (admin) ----
  app.post('/goals', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const body = goalSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })
    const area = await prisma.coachArea.findFirst({ where: { id: body.data.areaId, userId: user.id } })
    if (!area) return reply.code(404).send({ error: 'Area not found' })
    return prisma.coachGoal.create({ data: { ...body.data, userId: user.id } })
  })

  app.put('/goals/:id', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const { id } = request.params as { id: string }
    const body = goalSchema.partial({ areaId: true }).safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })
    const existing = await prisma.coachGoal.findFirst({ where: { id, userId: user.id } })
    if (!existing) return reply.code(404).send({ error: 'Not found' })
    const { areaId, ...rest } = body.data
    return prisma.coachGoal.update({ where: { id }, data: rest })
  })

  app.delete('/goals/:id', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const { id } = request.params as { id: string }
    const existing = await prisma.coachGoal.findFirst({ where: { id, userId: user.id } })
    if (!existing) return reply.code(404).send({ error: 'Not found' })
    await prisma.coachGoal.delete({ where: { id } })
    return { success: true }
  })

  // ---- Histórico de conversa ----
  app.get('/messages', auth, async (request) => {
    const user = request.user as { id: string }
    return prisma.coachMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
    })
  })

  app.delete('/messages', auth, async (request) => {
    const user = request.user as { id: string }
    await prisma.coachMessage.deleteMany({ where: { userId: user.id } })
    return { success: true }
  })

  // ---- Chat ----
  app.post('/chat', auth, async (request, reply) => {
    const user = request.user as { id: string }
    const body = chatSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return reply.code(503).send({
        error:
          'OpenRouter não configurado. Adicione OPENROUTER_API_KEY em apps/api/.env (chave gratuita em openrouter.ai/keys).',
      })
    }
    const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324:free'

    // histórico recente para memória da conversa
    const history = await prisma.coachMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    history.reverse()

    const snapshot = await buildLiveSnapshot(user.id)

    const messages = [
      { role: 'system', content: systemPrompt(snapshot) },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: body.data.message },
    ]

    let answer: string
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.WEB_URL || 'http://localhost:3000',
          'X-Title': 'North Coach',
        },
        body: JSON.stringify({ model, messages, temperature: 0.7 }),
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        app.log.error({ status: res.status, detail }, 'OpenRouter error')
        return reply
          .code(502)
          .send({ error: `Falha ao falar com o modelo (${res.status}). Tente de novo em instantes.` })
      }

      const data: any = await res.json()
      answer = data?.choices?.[0]?.message?.content?.trim()
      if (!answer) return reply.code(502).send({ error: 'O modelo retornou vazio. Tente de novo.' })
    } catch (err) {
      app.log.error(err, 'OpenRouter request failed')
      return reply.code(502).send({ error: 'Não consegui falar com o modelo agora.' })
    }

    // persiste a troca
    await prisma.coachMessage.create({ data: { role: 'user', content: body.data.message, userId: user.id } })
    const saved = await prisma.coachMessage.create({
      data: { role: 'assistant', content: answer, userId: user.id },
    })

    return { message: saved }
  })
}
