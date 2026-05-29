.PHONY: help up down dev db install migrate seed dev-api dev-web logs reset

help:
	@echo ""
	@echo "  North — Comandos disponíveis"
	@echo ""
	@echo "  make up       Sobe tudo em Docker (banco + api + web)"
	@echo "  make down     Para todos os containers"
	@echo "  make dev      Modo local: banco no Docker, API e Web na máquina"
	@echo "  make logs     Logs de todos os containers"
	@echo "  make reset    Para tudo e apaga os volumes"
	@echo ""
	@echo "  Comandos manuais:"
	@echo "  make install  Instala dependências"
	@echo "  make migrate  Roda as migrations"
	@echo "  make seed     Roda o seed"
	@echo ""

# ── Docker completo ──────────────────────────────────────────────────────────

up:
	docker compose up -d --build
	@echo "  Aguardando API..."
	@until curl -sf http://localhost:3001/health > /dev/null 2>&1; do sleep 2; done
	@echo "  ✓ API pronta"
	@echo ""
	@echo "  → http://localhost:3000"
	@echo "  → http://localhost:3001"
	@echo ""

down:
	docker compose down
	@echo "  ✓ Containers parados"

logs:
	docker compose logs -f

reset:
	@echo "  Resetando tudo..."
	docker compose down -v
	@echo "  ✓ Feito. Rode 'make up' para recomeçar."

# ── Desenvolvimento local (banco Docker + API/Web na máquina) ─────────────────

dev: install db migrate seed
	@echo ""
	@echo "  ✓ Banco pronto. Iniciando API e Web..."
	@echo ""
	@$(MAKE) _servers

_servers:
	@if command -v tmux > /dev/null 2>&1; then \
		tmux new-session -d -s north -x 220 -y 50 2>/dev/null || true; \
		tmux send-keys -t north "cd $(PWD)/apps/api && npm run dev" Enter; \
		tmux split-window -h -t north; \
		tmux send-keys -t north "cd $(PWD)/apps/web && npm run dev" Enter; \
		tmux attach -t north; \
	else \
		$(MAKE) dev-api & $(MAKE) dev-web; \
	fi

install:
	npm install --legacy-peer-deps

db:
	docker compose -f docker-compose.dev.yml up -d postgres
	@echo "  Aguardando postgres..."
	@until docker exec north_postgres pg_isready -U north -p 5433 -q 2>/dev/null; do sleep 1; done
	@echo "  ✓ Postgres pronto na porta 5433"

migrate:
	npm run db:migrate:deploy --workspace=apps/api

seed:
	npm run db:seed --workspace=apps/api

dev-api:
	cd apps/api && npm run dev

dev-web:
	cd apps/web && npm run dev
