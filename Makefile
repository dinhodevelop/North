.PHONY: help up down db migrate seed dev dev-api dev-web logs reset

help:
	@echo ""
	@echo "  North — Comandos disponíveis"
	@echo ""
	@echo "  make up        Sobe o banco + migra + seed + inicia API e Web"
	@echo "  make down      Para todos os serviços"
	@echo "  make db        Sobe só o banco (postgres)"
	@echo "  make migrate   Roda as migrations"
	@echo "  make seed      Roda o seed inicial"
	@echo "  make dev       Inicia API e Web em paralelo (requer tmux)"
	@echo "  make dev-api   Inicia só a API"
	@echo "  make dev-web   Inicia só o Web"
	@echo "  make logs      Logs do banco"
	@echo "  make reset     Para tudo, apaga o volume e recomeça"
	@echo ""

up: db migrate seed
	@echo ""
	@echo "  ✓ Banco pronto. Iniciando API e Web..."
	@echo ""
	@$(MAKE) dev

db:
	docker compose up -d postgres
	@echo "  Aguardando postgres ficar saudável..."
	@until docker exec north_postgres pg_isready -U north -p 5433 -q; do sleep 1; done
	@echo "  ✓ Postgres pronto na porta 5433"

migrate:
	cd apps/api && npx prisma migrate deploy

seed:
	cd apps/api && npx tsx prisma/seed.ts

dev:
	@if command -v tmux > /dev/null 2>&1; then \
		tmux new-session -d -s north -x 220 -y 50 2>/dev/null || true; \
		tmux send-keys -t north "cd $(PWD)/apps/api && npm run dev" Enter; \
		tmux split-window -h -t north; \
		tmux send-keys -t north "cd $(PWD)/apps/web && npm run dev" Enter; \
		tmux attach -t north; \
	else \
		$(MAKE) dev-api & $(MAKE) dev-web; \
	fi

dev-api:
	cd apps/api && npm run dev

dev-web:
	cd apps/web && npm run dev

down:
	docker compose down
	@-kill $$(lsof -ti:3001) 2>/dev/null || true
	@-kill $$(lsof -ti:3000) 2>/dev/null || true
	@echo "  ✓ Serviços parados"

logs:
	docker compose logs -f postgres

reset:
	@echo "  Resetando tudo..."
	docker compose down -v
	@-kill $$(lsof -ti:3001) 2>/dev/null || true
	@-kill $$(lsof -ti:3000) 2>/dev/null || true
	@echo "  ✓ Pronto. Rode 'make up' para recomeçar."
