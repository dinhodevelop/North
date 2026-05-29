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

  const quotes = [
    { text: 'A jornada de mil milhas começa com um único passo.', author: 'Lao Tzu' },
    { text: 'Disciplina é a ponte entre metas e realizações.', author: 'Jim Rohn' },
    { text: 'Não espere. O momento nunca será perfeito.', author: 'Napoleon Hill' },
    { text: 'Pequenas ações diárias constroem grandes resultados.', author: null },
    { text: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.', author: 'Robert Collier' },
    { text: 'Foco no processo. Os resultados são consequência.', author: null },
    { text: 'Você não precisa ser perfeito. Precisa ser consistente.', author: null },
    { text: 'Quem tem um porquê suporta qualquer como.', author: 'Nietzsche' },
    { text: 'O melhor momento para plantar uma árvore foi há 20 anos. O segundo melhor é agora.', author: 'Provérbio chinês' },
    { text: 'Faça o que puder, com o que tem, onde está.', author: 'Theodore Roosevelt' },
    { text: 'A riqueza não vem da sorte. Vem de decisões repetidas no tempo certo.', author: null },
    { text: 'Cada dia é uma nova chance de construir quem você quer ser.', author: null },
    { text: 'Não compare seu capítulo 1 com o capítulo 20 de outra pessoa.', author: null },
    { text: 'Consistência bate talento quando o talento não é consistente.', author: null },
    { text: 'O futuro pertence a quem acredita na beleza dos seus sonhos.', author: 'Eleanor Roosevelt' },
    { text: 'Construa despesas pequenas. Os grandes buracos raramente afundam navios.', author: 'Benjamin Franklin' },
    { text: 'Pague-se primeiro. O resto vem depois.', author: null },
    { text: 'Hábitos são juros compostos do crescimento pessoal.', author: 'James Clear' },
    { text: 'Você é a média dos seus últimos 90 dias.', author: null },
    { text: 'Feito é melhor que perfeito.', author: null },
    { text: 'A diferença entre onde você está e onde quer estar são as suas ações diárias.', author: null },
    { text: 'Quem controla o dinheiro, controla o tempo.', author: null },
    { text: 'Não é sobre ter tempo. É sobre fazer tempo.', author: null },
    { text: 'Um problema bem definido é um problema meio resolvido.', author: null },
    { text: 'A disciplina de hoje é a liberdade de amanhã.', author: null },
    { text: 'Reconstruir é mais corajoso que nunca ter quebrado.', author: null },
    { text: 'Comece simples. Escale devagar. Sustente sempre.', author: null },
    { text: 'O dinheiro não resolve tudo. Mas faz silêncio em muitos problemas.', author: null },
    { text: 'Não deixe que o urgente impeça o importante.', author: null },
    { text: 'Sua atenção é seu ativo mais escasso. Gaste bem.', author: null },
    { text: 'Cada real guardado é uma hora de liberdade comprada.', author: null },
    { text: 'Seja o arquiteto da sua própria vida.', author: null },
    { text: 'Grandes resultados exigem grandes consistências, não grandes talentos.', author: null },
    { text: 'Se você não controla seu dinheiro, alguém controla por você.', author: null },
    { text: 'O progresso, não a perfeição, é o que mantém você no jogo.', author: null },
    { text: 'Trabalhe enquanto eles dormem. Aprenda enquanto eles descansam.', author: null },
    { text: 'Cada meta alcançada começa com a decisão de tentar.', author: null },
    { text: 'Clareza sobre o que você quer é a metade do caminho.', author: null },
    { text: 'O que você tolera, você perpetua.', author: null },
    { text: 'Mude o que você pode. Aceite o que não pode. Saiba a diferença.', author: 'Epicteto' },
    { text: 'Produtividade é fazer as coisas certas, não fazer muitas coisas.', author: null },
    { text: 'Foque no que gera resultado. Elimine o resto.', author: null },
    { text: 'A vida muda quando você muda seus padrões diários.', author: null },
    { text: 'Patrimônio se constrói tijolo a tijolo, mês a mês.', author: null },
    { text: 'Não existe atalho para um lugar que vale a pena.', author: null },
    { text: 'Seja melhor que ontem. Pior que amanhã.', author: null },
    { text: 'Quem planeja, já saiu na frente de 80% das pessoas.', author: null },
    { text: 'O desconforto de hoje é o orgulho de amanhã.', author: null },
    { text: 'Viva abaixo dos seus meios. Invista a diferença.', author: null },
    { text: 'A calma é uma superpotência.', author: null },
    { text: 'Não é o que você ganha. É o que você guarda.', author: null },
    { text: 'Uma coisa de cada vez, feita bem, muda tudo.', author: null },
    { text: 'O silêncio e o foco são os aliados dos que constroem algo real.', author: null },
    { text: 'Suas finanças refletem suas escolhas, não sua sorte.', author: null },
    { text: 'Invista em você antes de qualquer ativo.', author: null },
    { text: 'Toda grande obra começa com um dia comum.', author: null },
    { text: 'A disciplina financeira hoje é a paz de amanhã.', author: null },
    { text: 'Você não pode voltar e mudar o começo. Mas pode começar agora.', author: 'C.S. Lewis' },
    { text: 'Pequenas vitórias diárias constroem grandes transformações.', author: null },
    { text: 'A persistência realiza o impossível.', author: null },
  ]

  const existingCount = await prisma.quote.count()
  if (existingCount === 0) {
    await prisma.quote.createMany({ data: quotes })
    console.log(`${quotes.length} frases criadas.`)
  }

  console.log('Seed completed.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
