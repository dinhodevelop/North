.PHONY: help up down logs reset install migrate seed

help:
	@echo ""
	@echo "  North — Comandos disponíveis"
	@echo ""
	@echo "  make up      Sobe tudo com hot reload (banco + api + web em Docker)"
	@echo "  make down    Para todos os containers"
	@echo "  make logs    Acompanha os logs em tempo real"
	@echo "  make reset   Para tudo e apaga os volumes (começa do zero)"
	@echo ""
	@echo "  Produção (sem hot reload):"
	@echo "  docker compose up -d --build"
	@echo ""

up:
	docker compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "  Aguardando serviços..."
	@until curl -sf http://localhost:3001/health > /dev/null 2>&1; do sleep 2; done
	@echo "  ✓ API pronta   → http://localhost:3001"
	@until curl -sf http://localhost:3000 > /dev/null 2>&1; do sleep 2; done
	@echo "  ✓ Web pronta   → http://localhost:3000"
	@echo ""

down:
	docker compose -f docker-compose.dev.yml down
	@echo "  ✓ Containers parados"

logs:
	docker compose -f docker-compose.dev.yml logs -f

reset:
	@echo "  Resetando tudo..."
	docker compose -f docker-compose.dev.yml down -v
	@echo "  ✓ Feito. Rode 'make up' para recomeçar."

# ── Comandos manuais (fora do Docker) ────────────────────────────────────────

install:
	npm install --legacy-peer-deps

migrate:
	npm run db:migrate:deploy --workspace=apps/api

seed:
	npm run db:seed --workspace=apps/api
