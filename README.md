# North

North é um sistema pessoal para organizar minha vida, finanças, projetos, hábitos e metas.

A ideia do projeto é simples:
ter um lugar central para acompanhar progresso, manter foco e construir uma vida mais organizada ao longo do tempo.

---

## Objetivos

* Organizar finanças
* Acompanhar metas
* Controlar projetos
* Melhorar consistência
* Reduzir ansiedade mental
* Criar direção e clareza

---

## Funcionalidades

### Dashboard

* Resumo financeiro
* Metas
* Projetos
* Tarefas do dia
* Hábitos

### Finanças

* Entradas e saídas
* Reserva
* Dívidas
* Fundo da casa/lote

### Projetos

* Pipeline de freelas
* SaaS
* Ideias
* Projetos em andamento

### Tarefas

* Prioridades do dia
* Organização simples

### Hábitos

* Checklist diário
* Histórico
* Streaks

---

## Stack

### Frontend

* Next.js
* TypeScript
* TailwindCSS
* shadcn/ui

### Backend

* Node.js
* Fastify
* Prisma ORM

### Banco de dados

* PostgreSQL

### Infra

* Docker
* Docker Compose

---

## Rodando localmente

### Dev (recomendado)

```bash
# 1. Subir o banco
docker compose up -d postgres

# 2. Migrations + seed
cd apps/api && npx prisma migrate deploy && npx tsx prisma/seed.ts

# 3. API (terminal 1)
cd apps/api && npm run dev

# 4. Web (terminal 2)
cd apps/web && npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001
- Login: admin@north.app / north2024

### Docker completo

```bash
cp .env.example .env
docker compose up -d
```

---

## Filosofia do projeto

North não é um sistema corporativo.

É um painel pessoal focado em:

* clareza
* progresso
* consistência
* reconstrução
* organização

Um sistema simples para ajudar a transformar planos em execução.
