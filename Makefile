.PHONY: help prod-build prod-up prod-down prod-restart prod-stop prod-logs prod-logs-app prod-logs-db prod-logs-redis prod-logs-nginx prod-ps \
        test-build test-up test-down test-restart test-stop test-logs test-logs-app test-logs-db test-logs-redis test-logs-nginx test-ps \
        migrate migrate-downgrade migrate-create migrate-history migrate-current migrate-heads \
        shell shell-test db-shell redis-shell \
        volumes-create volumes-list backup-db restore-db stats health \
        install run-local clean env-example

# Цвета для вывода
YELLOW := \033[1;33m
GREEN := \033[1;32m
RED := \033[1;31m
NC := \033[0m

help: ## Показать это сообщение помощи
	@echo "$(GREEN)Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# === Docker команды для продакшена ===

prod-build: ## Собрать Docker образ
	@echo "$(GREEN)Сборка Docker образа...$(NC)"
	docker-compose -f docker/docker-compose.prod.yml build

prod-up: ## Запустить все сервисы в prod режиме
	@echo "$(GREEN)Запуск сервисов в продакшене...$(NC)"
	docker-compose -f docker/docker-compose.prod.yml up -d

prod-down: ## Остановить и удалить все контейнеры
	@echo "$(YELLOW)Остановка всех сервисов...$(NC)"
	docker-compose -f docker/docker-compose.prod.yml down

prod-restart: prod-down prod-up ## Перезапустить все сервисы

prod-stop: ## Остановить сервисы без удаления контейнеров
	@echo "$(YELLOW)Остановка сервисов...$(NC)"
	docker-compose -f docker/docker-compose.prod.yml stop

prod-logs: ## Показать логи всех сервисов
	docker-compose -f docker/docker-compose.prod.yml logs -f

prod-logs-app: ## Показать логи приложения
	docker-compose -f docker/docker-compose.prod.yml logs -f app

prod-logs-db: ## Показать логи базы данных
	docker-compose -f docker/docker-compose.prod.yml logs -f db

prod-logs-redis: ## Показать логи Redis
	docker-compose -f docker/docker-compose.prod.yml logs -f redis

prod-logs-nginx: ## Показать логи Nginx
	docker-compose -f docker/docker-compose.prod.yml logs -f nginx

prod-ps: ## Показать статус контейнеров
	docker-compose -f docker/docker-compose.prod.yml ps

# === Docker команды для тестирования ===

test-build: ## Собрать Docker образ
	@echo "$(GREEN)Сборка Docker образа...$(NC)"
	docker-compose -f docker/docker-compose.test.yml build

test-up: ## Запустить все сервисы в prod режиме
	@echo "$(GREEN)Запуск сервисов в продакшене...$(NC)"
	docker-compose -f docker/docker-compose.test.yml up -d

test-down: ## Остановить и удалить все контейнеры
	@echo "$(YELLOW)Остановка всех сервисов...$(NC)"
	docker-compose -f docker/docker-compose.test.yml down

test-restart: test-down test-up ## Перезапустить тестовое окружение

test-stop: ## Остановить сервисы без удаления контейнеров
	@echo "$(YELLOW)Остановка сервисов...$(NC)"
	docker-compose -f docker/docker-compose.test.yml stop

test-logs: ## Показать логи всех сервисов
	docker-compose -f docker/docker-compose.test.yml logs -f

test-logs-app: ## Показать логи приложения
	docker-compose -f docker/docker-compose.test.yml logs -f test-app

test-logs-db: ## Показать логи базы данных
	docker-compose -f docker/docker-compose.test.yml logs -f test-db

test-logs-redis: ## Показать логи Redis
	docker-compose -f docker/docker-compose.test.yml logs -f test-redis

test-logs-nginx: ## Показать логи Nginx
	docker-compose -f docker/docker-compose.test.yml logs -f test-nginx

test-ps: ## Показать статус контейнеров
	docker-compose -f docker/docker-compose.test.yml ps
# === Миграции базы данных ===

migrate: ## Применить миграции базы данных
	@echo "$(GREEN)Применение миграций...$(NC)"
	alembic upgrade head

migrate-downgrade: ## Откатить последнюю миграцию
	@echo "$(YELLOW)Откат последней миграции...$(NC)"
	alembic downgrade -1

migrate-create: ## Создать новую миграцию (использование: make migrate-create MSG="описание")
	@if [ -z "$(MSG)" ]; then \
		echo "$(RED)Ошибка: укажите MSG='описание миграции'$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Создание новой миграции: $(MSG)$(NC)"
	alembic revision --autogenerate -m "$(MSG)"

migrate-history: ## Показать историю миграций
	alembic history

migrate-current: ## Показать текущую миграцию
	alembic current

migrate-heads: ## Показать головные миграции
	alembic heads

# === Shell доступ ===

shell: ## Войти в shell контейнера приложения
	docker-compose -f docker/docker-compose.prod.yml exec app /bin/bash

shell-test: ## Войти в shell тестового контейнера
	docker-compose -f docker/docker-compose.test.yml exec app /bin/bash

db-shell: ## Войти в PostgreSQL shell
	docker-compose -f docker/docker-compose.prod.yml exec postgres psql -U ${DB_USER} -d ${DB_NAME}

redis-shell: ## Войти в Redis CLI
	docker-compose -f docker/docker-compose.prod.yml exec redis redis-cli

# === Volumes и очистка ===

volumes-create: ## Создать необходимые Docker volumes
	@echo "$(GREEN)Создание Docker volumes...$(NC)"
	docker volume create pgdata || echo "Volume pgdata уже существует"
	docker volume create redis_data || echo "Volume redis_data уже существует"
	docker volume create standart_s_pgdata_test || echo "Volume standart_s_pgdata_test уже существует"
	@echo "$(GREEN)Все volumes созданы!$(NC)"

volumes-list: ## Показать список volumes
	docker volume ls | grep -E 'pgdata|redis_data'

# === Бэкап и восстановление ===

backup-db: ## Создать бэкап базы данных
	@echo "$(GREEN)Создание бэкапа базы данных...$(NC)"
	mkdir -p dumps
	docker-compose -f docker/docker-compose.prod.yml exec -T postgres pg_dump -U ${DB_USER} ${DB_NAME} > dumps/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Бэкап создан в dumps/$(NC)"

restore-db: ## Восстановить базу данных из бэкапа (использование: make restore-db FILE=dumps/backup.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)Ошибка: укажите FILE=путь_к_файлу$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Восстановление базы данных из $(FILE)...$(NC)"
	docker-compose -f docker/docker-compose.prod.yml exec -T postgres psql -U ${DB_USER} ${DB_NAME} < $(FILE)
	@echo "$(GREEN)База данных восстановлена!$(NC)"

# === Мониторинг ===

stats: ## Показать статистику использования ресурсов контейнерами
	docker stats project-app project-postgres project-redis project-nginx

health: ## Проверить здоровье сервисов
	@echo "$(GREEN)Проверка состояния сервисов...$(NC)"
	@docker-compose -f docker/docker-compose.prod.yml ps
	@echo "\n$(GREEN)Проверка подключения к PostgreSQL...$(NC)"
	@docker-compose -f docker/docker-compose.prod.yml exec postgres pg_isready -U ${DB_USER} || echo "$(RED)PostgreSQL недоступен$(NC)"
	@echo "\n$(GREEN)Проверка Redis...$(NC)"
	@docker-compose -f docker/docker-compose.prod.yml exec redis redis-cli ping || echo "$(RED)Redis недоступен$(NC)"

