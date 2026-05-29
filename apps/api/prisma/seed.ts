import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('north2024', 10)

  const user = await prisma.user.upsert({
    where: { email: 'admin@north.app' },
    update: {},
    create: {
      email: 'admin@north.app',
      name: 'Bernardo',
      password: hash,
    },
  })

  console.log('User created:', user.email)

  await prisma.goal.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: user.id,
        name: 'Comprar Lote',
        description: 'Terreno para construção da casa própria',
        targetAmount: 80000,
        currentAmount: 0,
      },
      {
        userId: user.id,
        name: 'Reserva de Emergência',
        description: '6 meses de despesas cobertas',
        targetAmount: 30000,
        currentAmount: 0,
      },
      {
        userId: user.id,
        name: 'Fundo Construção',
        description: 'Poupança para construir a casa',
        targetAmount: 150000,
        currentAmount: 0,
      },
    ],
  })

  await prisma.habit.createMany({
    skipDuplicates: true,
    data: [
      { userId: user.id, name: 'Água (2L)', icon: '💧', order: 0 },
      { userId: user.id, name: 'Estudar', icon: '📚', order: 1 },
      { userId: user.id, name: 'Código', icon: '💻', order: 2 },
      { userId: user.id, name: 'Exercício', icon: '🏃', order: 3 },
      { userId: user.id, name: 'Dormir cedo', icon: '🌙', order: 4 },
    ],
  })

  console.log('Seed completed.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
